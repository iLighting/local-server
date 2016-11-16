
const { EventEmitter } = require('events');
const { zigbee: log } = require('../utils/log');
const { parseFrame, cmdMap, parser, builder } = require('../utils/mt');
const frameSerial = require('./frameSerial');


/**
 * @fires sreq - sreq发送完成
 * @fires srsp - 收到srsp
 * @fires areq - 收到areq
 * @fires srspParsed - srsp解析完成
 * @fires areqParsed - areq解析完成
 * @fires error
 */
class Zigbee extends EventEmitter {
  constructor({serial}) {
    super();
    this._serial = serial;
    // bind
    this._serial.on('error', this._handleFrameError.bind(this));
    this._serial.on('data', this._handleFrameData.bind(this));
  }

  _handleFrameError(err) {
    log.error(`frameSerial出错 ${err}\n`, err);
    this.emit(err);
  }

  /**
   * @param {Buffer} buf
   * @private
   */
  _handleFrameData(buf) {
    const { cmd0, cmd1 } = parseFrame(buf);
    let isAreqFlag = cmdMap.checkAreq(cmd0);
    /**
     * @event areq
     * @event srsp
     */
    this.emit(isAreqFlag ? 'areq' : 'srsp', buf);
    const name = cmdMap.getNameByCmd(cmd0, cmd1);
    const result = parser[name](buf);
    /**
     * @event areqParsed
     * @event srspParsed
     */
    this.emit(isAreqFlag ? 'areqParsed' : 'srspParsed', name, result);
  }

  /**
   * 写入串口，写入后resolve
   * 已被zigbeeMediator代理，不要直接使用此函数发数据
   * @public
   * @param {String} name
   * @param {Object} props
   * @return {Promise}
   */
  write(name, props) {
    const buf = builder[name](props);
    return new Promise((resolve, reject) => {
      this._serial.write(buf, null, err => {
        if (err) { reject(err) }
        else {
          /**
           * @event sreq
           */
          this.emit('sreq', buf);
          resolve();
        }
      });
    });
  }
}

module.exports = new Zigbee({
  serial: frameSerial
});



