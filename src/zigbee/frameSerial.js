const { Writable } = require('stream');
const { frameSerial: log } = require('../utils/log');
const { shiftFrameFromBuf } = require('../utils/mt');

/**
 * @fires data
 */
class FrameSerial extends Writable {
  constructor({serial}) {
    super();
    this._tempChunk = null;
    this._serial = serial;
    this._cache = new Buffer(0);
    // 绑定
    this._serial.on('data', this._handleSerial.bind(this));
  }
  _handleSerial(chunk) {
    this._cache = Buffer.concat([this._cache, chunk]);
    let frameBuf = new Buffer(0);
    let restBuf = this._cache;
    let restEnough = true;
    while (restEnough) {
      [frameBuf, restBuf, restEnough] = shiftFrameFromBuf(restBuf);
      if (frameBuf.length > 0) {
        /**
         * @event data
         */
        this.emit('data', frameBuf);
      }
    }
    // 剩余长度不足
    this._cache = restBuf;
  }
  _write(chunk, encoding, callback) {
    this._serial.write(chunk, err => {
      if (err) { callback(err) } else {
        this._serial.drain(err => {
          if (err) { callback(err) } else {
            log.trace('已写入串口', chunk);
            callback();
          }
        })
      }
    })
  }
}

module.exports = new FrameSerial({
  serial: require('./hardware/serial')
});