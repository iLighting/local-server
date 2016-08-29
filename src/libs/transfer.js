/**
 * @module
 */

const { Writable } = require('stream');
const { SOF, genFCS, isAreq } = require('../utils/mt');
const Serial = require('./serial');
const { transfer: log } = require('../utils/log');

/**
 * @fires sreq
 * @fires srsp
 * @fires areq
 * @fires frame
 * @see Writable
 */
class Transfer extends Writable {
  constructor(props) {
    super(props);
    // serial data cache
    this._cache = new Buffer(0);
    this._frame = {};
    this._serial = new Serial();
    this._serial.on('data', this.handleSerialData.bind(this));
    this.on('frame', this.handleAreq.bind(this));
  }
  handleAreq(frame) {
    const { origin } = frame;
    if (!isAreq(origin)) { return }
    /**
     * @event areq
     * @see event:frame
     */
    this.emit('areq', frame);
  }
  handleSerialData(chunk) {
    this._cache = Buffer.concat([this._cache, chunk]);
    // first SOF
    const sofIndex = this._cache.indexOf(SOF);
    if (sofIndex < 0) {
      // clear buf
      this._cache = new Buffer(0);
      return
    }
    this._cache = this._cache.slice(sofIndex);
    this._frame.sof = SOF;
    // cache at least 4 bytes (SOF + LEN + CMD0 + CMD1)
    if (this._cache.length < 4) { return }
    // get LEN
    this._frame.dataLen = this._cache.readUInt8(1);
    // get cmd
    this._frame.cmd0 = this._cache.readUInt8(2);
    this._frame.cmd1 = this._cache.readUInt8(3);
    // cache last dataLen + FCS
    if (this._cache.length < (4 + this._frame.dataLen + 1)) { return }
    // check FCS (LEN -> DATA)
    this._frame.fcs = this._cache.readUInt8(this._cache.length-1);
    if (
      genFCS(this._cache.slice(1, this._cache.length-1)) != this._frame.fcs
    ) { return }
    // copy data
    this._frame.data = new Buffer(this._frame.dataLen);
    this._cache.copy(this._frame.data, 0, 4, 4+this._frame.dataLen);
    /**
     * @event frame
     * @type {Object}
     * @property {Number} sof - SOF
     * @property {Number} dataLen
     * @property {Number} cmd0
     * @property {Number} cmd1
     * @property {Buffer} data
     * @property {Number} fcs - FCS
     * @property {Buffer} origin - origin serial frame
     */
    this.emit('frame', Object.assign({
      origin: Buffer.from(this._cache),
    }, this._frame));
    // reset
    this._cache = new Buffer(0);
    this._frame = {};
  }

  /**
   * 不可信地发送指令帧。当收到srsp时，认为发送成功。注意**srsp本身可能为失败状态**。
   * @param {Frame} mtFrame
   * @param encoding
   * @param callback
   * @private
   * @see parseSrsp
   */
  _write(mtFrame, encoding, callback) {
    this._serial.write(mtFrame.dump(), err => {
      if (err) { callback(err) } else {
        this._serial.drain(err => {
          if (err) { callback(err) } else {
            /**
             * @event sreq
             * @type {Frame}
             */
            this.emit('sreq', mtFrame);
            this.once('frame', srsp => {
              // check: is the srsp correct?
              const checkResult = mtFrame.isSRSP(srsp.origin);
              if (checkResult) {
                /**
                 * @event srsp
                 * @see event:frame
                 */
                this.emit('srsp', srsp);
                callback();
              } else {
                const err = new Error(`${mtFrame.name}收到不对应的SRSP`);
                callback(err)
              }
            });
          }
        })
      }
    })
  }
}


module.exports = new Transfer();
