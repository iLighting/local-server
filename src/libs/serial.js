/**
 * @module
 */

const { Writable } = require('stream');
const { serial: log } = require('../utils/log');

class Serial extends Writable {
  _write(chunk, encoding, callback) {
    log.trace(chunk);
    callback();
  }
  drain(callback) {
    callback(null);
  }
}

module.exports = new Serial();
