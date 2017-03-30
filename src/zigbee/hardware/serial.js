/**
 * 串口收发层
 * @module
 */

const co = require('co');
const {
  Writable
} = require('stream');
const SerialPort = require('serialport');
const {
  serial: log
} = require('../../utils/log');

const config = global.__config;

const serial = new SerialPort(config.get('serial_path'), {
  baudRate: config.get('serial_rate'),
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  rtscts: false,
  autoOpen: false
});

serial
  .on('data', data => log.trace('receive:', data))
  .on('error', err => log.error(err))
  .on('open', () => log.info('open successfully'))

module.exports = serial;