/**
 * zigbee中介者
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
          /**
           * @event handle
           */
          self.emit('handle', name, result);
        });
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
    const onSrspParsed = (srspName, srspResult) => {
      srspResult.status === 'SUCCESS' ?
        callback() :
        callback(new Error(`${name} srsp 不成功: ${srspResult.status}`))
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
  }

  /**
   * 写MT命令到串口，等待srsp
   * @public
   * @param {String} name
   * @param {Object} props
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