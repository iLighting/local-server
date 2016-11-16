/**
 * 串口收发层
 * @module
 */

const co = require('co');
const { Writable } = require('stream');
const SerialPort = require('serialport');
const { serial: log } = require('../../utils/log');

const serialConfig = global.__config.serial;

const serial =  new SerialPort(serialConfig.path, {
  baudRate: serialConfig.rate,
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