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
const { Writable } = require('stream');
const { getModels } = require('../db');
const { zigbeeMediator: log } = require('../utils/log');
const zigbee = require('../zigbee');

const models = getModels();
const config = global.__config;

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
    switch (name) {
      case 'ZDO_END_DEVICE_ANNCE_IND':
        co(function * () {
          const { nwkAddr, ieeeAddr, type } = result;
          const { Device } = self._models;
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
          yield self.write('ZDO_ACTIVE_EP_REQ', nwkAddr);
          /**
           * @event handle
           */
          self.emit('handle', name, result);
        }).catch(err => log.error('handle ZDO_END_DEVICE_ANNCE_IND error\n', err));
        break;
      case 'ZDO_ACTIVE_EP_RSP':
        co(function * () {
          const { nwkAddr, status, activeEpList } = result;
          if (status == 0) {
            const { Device, App } = self._models;
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
              log.info(`设备活动端点已获得 @${nwkAddr}, ${activeEpList}`);
              /**
               * @event handle
               */
              self.emit('handle', name, result);
              //
              log.trace(`start to fetch simple desc @${nwkAddr}. ep=${activeEpList}`);
              for (let i=0; i<activeEpList.length; i++) {
                const ep = activeEpList[i];
                yield self.write('ZDO_SIMPLE_DESC_REQ', {nwk: nwkAddr, ep});
              }
            } else {
              log.warn(`设备不在数据库中 @${nwkAddr}`);
            }
          } else {
            log.warn(`ZDO_ACTIVE_EP_RSP error. status==${status}`);            
          }
        }).catch(err => log.error('handle ZDO_ACTIVE_EP_RSP error\n', err));
        break;
      case 'ZDO_SIMPLE_DESC_RSP':
        co(function * () {
          const { nwkAddr, status, endPoint, deviceId } = result;
          if (status == 0) {
            const { App } = self._models;
            const app = yield App.findOne({device: nwkAddr, endPoint}).exec();
            if (app) {
              // 更新app属性
              // TODO: 补全switch类型payload
              let type;
              let payload;
              switch (deviceId) {
                case config['hd/appType/lamp']:
                  type = 'lamp'; payload = {on: false}; break;
                case config['hd/appType/gray-lamp']:
                  type = 'gray-lamp'; payload = {level: 0}; break;
                case config['hd/appType/switch']:
                  type = 'switch'; payload = {on: false}; break;
                case config['hd/appType/gray-switch']:
                  type = 'gray-switch'; payload = {level: 0}; break;
                case config['hd/appType/pulse']:
                  type = 'pulse'; payload = {transId: 0}; break;
                case config['hd/appType/light-sensor']:
                  type = 'light-sensor'; payload = {level: 0}; break;
              }
              yield app.update({
                type, payload,
                name: `${type}@${nwkAddr}.${endPoint}`
              }).exec();
              log.info(`应用已刷新 @${nwkAddr}.${endPoint}, type=${type}`)
              /**
               * @event handle
               */
              self.emit('handle', name, result);
            } else {
              log.warn(`app不在数据库中 @${nwkAddr}.${endPoint}`);
            }
          } else {
            log.warn(`ZDO_SIMPLE_DESC_RSP error. status==${status}`);
          }
        }).catch(err => log.error('handle ZDO_SIMPLE_DESC_RSP error\n', err));
        break;
      case 'APP_MSG_FEEDBACK':
        /**
         * 不做处理
         * @event handle
         */
        this.emit('handle', name, result);
        break;
      default:
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
        if (srspResult.status === 'SUCCESS') {
          callback();
        } else {
          callback(new Error(`${name} srsp 不成功: ${srspResult.status}`));
        }
      };
      this._zigbee.once('srspParsed', onSrspParsed);
      this._zigbee.write(name, props)
        .then(() => {
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