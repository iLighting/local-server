/**
 * 串口收发层
 * @module
 */

const co = require('co');
const { Writable, Duplex } = require('stream');
const { serial: log } = require('../utils/log');
const { genFrame } = require('../utils/mt');


class SerialMock extends Writable {
  constructor(props) {
    super(props);
    this._cache = new Buffer(0);
  }
  _write(chunk, encoding, callback) {
    log.trace('write', chunk);
    this.emit('chunk', chunk);
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
  }
  put(buf) {
    this._cache = Buffer.concat([this._cache, buf]);
    this._feedback(this._cache);
  }
  take() {
    return new Promise((resolve, reject) => {
      this.once('chunk', resolve);
    });
  }
}

const serial = new SerialMock();

// mock
const mock = require('../mock/serial');
co.wrap(mock)(
  serial.put.bind(serial),
  serial.take.bind(serial)
);

module.exports = serial;
