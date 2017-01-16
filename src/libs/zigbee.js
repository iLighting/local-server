/**
 * zigbee中介者(Mediator)
 *
 * - 提供write API
 * - 处理areq
 * - 读写数据库
 *
 * @module
 */

const co = require('co');
const _ = require('lodash');
const { Writable } = require('stream');
const { getModels } = require('../db');
const { zigbeeMediator: log } = require('../utils/log');
const zigbee = require('../zigbee');

const models = getModels();
const config = global.__config;

// areqParserMap
// =============================================================
const areqParserMap = {
  // SYS
  // ----------------
  SYS_RESET_IND({name, result, log, models, write, callback}) {
    log.info(name, '\n', result);
    callback();
  },
  // ZDO
  // ----------------
  ZDO_END_DEVICE_ANNCE_IND({name, result, log, models, write, callback}) {
    co(function * () {
      const { nwkAddr, ieeeAddr, type } = result;
      const { Device } = models;
      yield Device
        .find()
        .or([{nwk: nwkAddr}, {ieee: ieeeAddr}])
        .remove()
        .exec();
      yield Device.create({
        nwk: nwkAddr,
        ieee: ieeeAddr,
        type: type,
        name: `新设备 @${nwkAddr}`,
      });
      log.info(`新设备已加入 @${nwkAddr}\n`, result);
      log.trace(`正在请求设备活动端点 @${nwkAddr}`);
      yield write('ZDO_ACTIVE_EP_REQ', nwkAddr);
      callback();
    }).catch(callback);
  },
  ZDO_ACTIVE_EP_RSP({name, result, log, models, write, callback}) {
    co(function * () {
      const { nwkAddr, status, activeEpList, statusString } = result;
      if (status == 0) {
        const { Device, App } = models;
        const dev = yield Device.findOne({nwk: nwkAddr}).exec();
        if (dev) {
          // 在数据库中创建app
          for(let i=0; i<activeEpList.length; i++) {
            const ep = activeEpList[i];
            yield App.create({
              device: nwkAddr,
              endPoint: ep,
              type: 'unknow',
              payload: {},
              name: `新应用 @${nwkAddr}.${ep}`
            })
          }
          log.info(`设备活动端点已获得 @${nwkAddr}, eps=${activeEpList}`);
          //
          log.trace(`start to fetch simple desc @${nwkAddr}. ep=${activeEpList}`);
          for (let i=0; i<activeEpList.length; i++) {
            const ep = activeEpList[i];
            yield write('ZDO_SIMPLE_DESC_REQ', {nwk: nwkAddr, ep});
          }
          callback();
        } else {
          callback(`设备不在数据库中 @${nwkAddr}`);
        }
      } else {
        callback(`ZDO_ACTIVE_EP_RSP error. status==${status}, ${statusString}`);            
      }
    }).catch(callback);
  },
  ZDO_SIMPLE_DESC_RSP({name, result, log, models, write, callback}) {
    co(function * () {
      const { nwkAddr, status, endPoint, deviceId, statusString } = result;
      if (status == 0) {
        const { App } = models;
        const app = yield App.findOne({device: nwkAddr, endPoint}).exec();
        if (app) {
          // 更新app属性
          let type;
          let payload;
          switch (deviceId) {
            case config['zigbee/appType/lamp']:
              type = 'lamp'; payload = {on: false}; break;
            case config['zigbee/appType/gray-lamp']:
              type = 'gray-lamp'; payload = {level: 0}; break;
            case config['zigbee/appType/switch']:
              type = 'switch'; payload = {on: false}; break;
            case config['zigbee/appType/gray-switch']:
              type = 'gray-switch'; payload = {level: 0}; break;
            case config['zigbee/appType/pulse']:
              type = 'pulse'; payload = {transId: 0}; break;
            case config['zigbee/appType/illuminance-sensor']:
              type = 'illuminance-sensor'; payload = {level: 0}; break;
            case config['zigbee/appType/temperature-sensor']:
              type = 'temperature-sensor'; payload = {temperature: 0}; break;
            case config['zigbee/appType/asr-sensor']:
              type = 'asr-sensor'; payload = {result0: 0}; break;
            default:
              type = 'unknow'; payload = {}; break;
          }
          yield app.update({
            type, payload,
            name: `${type}@${nwkAddr}.${endPoint}`
          }).exec();
          log.info(`应用已刷新 @${nwkAddr}.${endPoint}, type=${type}`);
          callback();
        } else {
          callback(`app不在数据库中 @${nwkAddr}.${endPoint}`);
        }
      } else {
        callback(`ZDO_SIMPLE_DESC_RSP error. status==${status}, ${statusString}`);
      }
    }).catch(callback);
  },
  ZDO_STATE_CHANGE_IND({name, result, callback}) {
    log.info(`桥接器状态变更, state=${result.state}`);
    callback();
  },
  // APP
  // ----------------
  APP_MSG_FEEDBACK({result, log, models, write, callback}) {
    // 不做处理
    log.info('APP_MSG_FEEDBACK\n', result);
    callback();
  },
  // Debug
  // -----------------
  DEBUG_STRING({result, log, callback}) {
    const { msg } = result;
    log.info(`Debug msg from the bridge: ${msg}`);
    callback();
  },
};

/**
 * @fires handle - 已处理指令帧: name, result
 */
class Mediator extends Writable {
  constructor({zigbee, models}) {
    super();
    this._zigbee = zigbee;
    this._models = models;
    this._writeCache = null;
    // bind
    this._zigbee.on('areqParsed', this._handleAreqParsed.bind(this));
    this._zigbee.on('error', err => log.error(`zigbee出错，${err}\n`, err));
  }

  /**
   * 处理areq帧
   * @private
   * @param {String} name
   * @param {Object} result
   */
  _handleAreqParsed(name, result) {
    // TODO: 拆分 areqParser
    const self = this;
    log.trace(`开始处理 ${name}`);
    if (areqParserMap.hasOwnProperty(name)) {
      const parser = areqParserMap[name];
      const logx = {
        trace: log.trace.bind(log),
        debug: log.debug.bind(log),
        info: log.info.bind(log),
        warn: log.warn.bind(log),
      };
      const callback = err => {
        if (err) {
          log.error(`${name} 处理器出错\n`, err);
        } else {
          log.trace(`${name} 处理器完成`);
          self.emit('handle', name, result);
        }
      };
      if (typeof(parser) === 'function') {
        try {
          parser.bind(null)({
            name, result, callback,
            log: logx,
            models: self._models,
            write: self.write.bind(self),
          });
        } catch(err) { log.error(`${name} 处理器未捕获的错误\n`, err) }
      } else { log.warn(`areqParser '${name}' is not a function`) }
    } else {
      log.warn(`${name} 处理器未定义`);
    }
  }

  /**
   * 写入串口，收到srsp后callback
   */
  _write(chunk, encoding, callback) {
    const [name, props] = this._writeCache;
    try {
      const onSrspParsed = (srspName, srspResult) => {
        log.trace('收到srsp', srspName, srspResult);
        if (srspResult.status === 'SUCCESS') {
          callback();
        } else {
          callback(new Error(`${name} srsp 不成功: ${srspResult.status}`));
        }
      };
      this._zigbee.once('srspParsed', onSrspParsed);
      this._zigbee.write(name, props)
        .then(() => {
          // TODO: dose not delete the listener even when timeout
          if (this._zigbee.listeners('srspParsed').indexOf(onSrspParsed) >= 0) {
            // 3s后删除监听器，防止srsp超时引发内存泄漏
            setTimeout(() => {
              this._zigbee.removeListener('srspParsed', onSrspParsed);
              log.warn(`${name} srsp 超时，删除监听器`);
              callback(new Error(`${name} srsp 超时`));
            }, 3000)
          }
        })
        .catch(callback);
    } catch (e) {
      callback(e)
    }
  }

  /**
   * 写MT命令到串口，等待srsp
   * @public
   * @param {String} name
   * @param {*} props
   * @param {Function} [callback]
   * @return {Promise|null}
   */
  write(name, props, callback) {
    this._writeCache = [name, props];
    if (typeof callback === 'undefined') {
      return new Promise((resolve, reject) => {
        super.write(new Buffer(0), null, err => {
          if (err) { reject(err) } else { resolve() }
        });
      })
    } else {
      super.write(new Buffer(0), null, callback);
    }
  }
}

module.exports = new Mediator({
  zigbee, models
});