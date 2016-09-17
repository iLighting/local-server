/**
 * 指令帧收发层
 * @module
 */

const { expect } = require('chai');
const { Writable } = require('stream');
const { parseFrame, isAreq, shiftFrameFromBuf, FrameSreq } = require('../../utils/mt');
const { transfer: log } = require('../../utils/log');


/**
 * @fires sreq
 * @fires srsp
 * @fires areq
 * @fires frame
 * @see Writable
 */
class Transfer extends Writable {
  constructor({serial}) {
    super();
    this._tempChunk = null;
    // serial data cache
    this._cache = new Buffer(0);
    this._serial = serial;
    this._serial.on('data', this._handleSerialData.bind(this));
  }
  /**
   * 分发frame到srsp和areq
   * @param {Buffer} buf
   * @param {Object} frameObj
   * @private
   */
  _dispatchFrame(buf, frameObj) {
    if (isAreq(buf)) {
      log.trace('dispatch AREQ', buf, '\n', frameObj);
      /**
       * @event areq
       *
       * @type {Buffer}
       * @type {Object}
       * @property {Number} sof - SOF
       * @property {Number} dataLen
       * @property {Number} cmd0
       * @property {Number} cmd1
       * @property {Buffer} data
       * @property {Number} fcs - FCS
       */
      this.emit('areq', buf, frameObj);
    } else {
      log.trace('dispatch SRSP', buf, '\n', frameObj);
      /**
       * @event srsp
       *
       * @type {Buffer}
       * @type {Object}
       * @property {Number} sof - SOF
       * @property {Number} dataLen
       * @property {Number} cmd0
       * @property {Number} cmd1
       * @property {Buffer} data
       * @property {Number} fcs - FCS
       */
      this.emit('srsp', buf, frameObj)
    }
  }
  _handleSerialData(chunk) {
    this._cache = Buffer.concat([this._cache, chunk]);
    let frameBuf = new Buffer(0);
    let restBuf = this._cache;
    let restEnough = true;
    while (restEnough) {
      [frameBuf, restBuf, restEnough] = shiftFrameFromBuf(restBuf);
      if (frameBuf.length > 0) {
        const frameObj = parseFrame(frameBuf);
        log.trace('got frame', frameBuf, '\n', frameObj);
        /**
         * @event frame
         *
         * @type {Buffer}
         * @type {Object}
         */
        this.emit('frame', Buffer.from(frameBuf), frameObj);
        this._dispatchFrame(frameBuf, frameObj);
      }
    }
    // 剩余长度不足
    this._cache = restBuf;
  }
  _write(chunk, encoding, callback) {
    const mtFrame = this._tempChunk;
    this._serial.write(chunk, err => {
      if (err) { callback(err) } else {
        this._serial.drain(err => {
          if (err) { callback(err) } else {
            log.trace('指令帧已写入串口', chunk, '\n', mtFrame);
            callback();
            /**
             * @event sreq
             *
             * @type {Buffer}
             * @type {Frame}
             */
            this.emit('sreq', chunk, mtFrame);
          }
        })
      }
    })
  }
  /**
   * 此处改写`write`方法，以便能接受Frame类型的chunk。
   *
   * 不可信地发送指令帧。当写入串口时，认为发送成功。
   * @param {FrameSreq} chunk
   * @param encoding
   * @param callback
   * @private
   * @callback {Object} callback
   * @see parseSrsp
   * @memberOf Transfer
   */
  write(chunk, encoding, callback) {
    expect(chunk).to.be.an.instanceOf(FrameSreq);
    log.trace('收到指令帧，准备写入串口\n', chunk);
    this._tempChunk = chunk;
    super.write(chunk.dump(), encoding, callback);
  }
}


module.exports = Transfer;
