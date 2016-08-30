/**
 * @module
 */

const { Writable, Duplex } = require('stream');
const { serial: log } = require('../utils/log');
const { genFrame } = require('../utils/mt');

class Serial extends Writable {
  _write(chunk, encoding, callback) {
    log.trace('write', chunk);
    callback();
  }

  /**
   * @param {Buffer} buf
   * @private
   */
  _feedback(buf) {
    log.trace('receive', buf);
    this.emit('data', buf);
  }
  drain(callback) {
    const data = genFrame(0x69, 0, Buffer.from([0]));
    callback(null);
    this._feedback(data);
  }
}

module.exports = new Serial();
