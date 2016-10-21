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
  framework: log4js.getLogger('framework'),
  db: log4js.getLogger('db'),
  sys: log4js.getLogger('sys'),
  transfer: log4js.getLogger('frameTransfer'),
  app: log4js.getLogger('app'),
  serial: log4js.getLogger('serial'),
  frameSerial: log4js.getLogger('frameSerial'),
  client: log4js.getLogger('frameHandler'),
  msgTransfer: log4js.getLogger('msgTransfer'),
  proxy: log4js.getLogger('proxy'),
  clientIo: log4js.getLogger('clientIo'),
  staticScene: log4js.getLogger('staticScene'),
  zigbeeMediator: log4js.getLogger('zigbeeMediator'),
  controller: log4js.getLogger('controller'),
};