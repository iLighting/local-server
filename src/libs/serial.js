/**
 * @module
 */

const { Duplex } = require('stream');


class Serail extends Duplex {
  _write(chunk, encoding, callback) {
    console.log(chunk);
    callback();
  }
  _read(size) {
    this.push('hello')
  }
}

module.exports = Serail;

