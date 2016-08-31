/**
 * @module
 */

const log4js = require('log4js');

log4js.configure({
  level: 'DEBUG',
  appenders: [
    { type: 'console' },
  ]
});

module.exports = {
  db: log4js.getLogger('db'),
  sys: log4js.getLogger('sys'),
  transfer: log4js.getLogger('transfer'),
  app: log4js.getLogger('app'),
  serial: log4js.getLogger('serial'),
  client: log4js.getLogger('client'),
  msgTransfer: log4js.getLogger('msgTransfer'),
};