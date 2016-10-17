/**
 * 串口收发层
 * @module
 */

const co = require('co');
const { Writable } = require('stream');
const { serial: log } = require('../../utils/log');


class SerialMock extends Writable {
  constructor(props) {
    super(props);
    this._cache = [];
  }

  /**
   * @param chunk
   * @param encoding
   * @param callback
   * @private
   */
  _write(chunk, encoding, callback) {
    this._cache.push(chunk);
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
    callback(null);
    this._cache.forEach(chunk => this.emit('chunk', chunk));
    this._cache = [];
  }
  put(buf) {
    this._feedback(buf);
  }
}

const serial = new SerialMock();

// mock
const mock = require('../../mock/serial');
mock(serial);

module.exports = serial;
