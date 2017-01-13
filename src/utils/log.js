/**
 * @module
 */

const log4js = require('log4js');

const config = global.__config;

log4js.configure({
  appenders: [{
    type: 'logLevelFilter',
    level: 'INFO',
    appender: { type: 'console' }
  }, {
    type: 'logLevelFilter',
    level: config['log/level'],
    appender: {
      type: 'file',
      filename: config['log/path'],
      maxLogSize: config['log/maxLogSize'],
      numBackups: config['log/numBackups']
    }
  }]
});

module.exports = {
  framework: log4js.getLogger('framework'),
  db: log4js.getLogger('db'),
  sys: log4js.getLogger('sys'),
  transfer: log4js.getLogger('frameTransfer'),
  app: log4js.getLogger('app'),
  localApp: log4js.getLogger('localApp'),
  serial: log4js.getLogger('serial'),
  frameSerial: log4js.getLogger('frameSerial'),
  client: log4js.getLogger('frameHandler'),
  msgTransfer: log4js.getLogger('msgTransfer'),
  proxy: log4js.getLogger('proxy'),
  socketIo: log4js.getLogger('socketIo'),
  staticScene: log4js.getLogger('staticScene'),
  zigbeeMediator: log4js.getLogger('zigbeeMediator'),
  zigbee: log4js.getLogger('zigbee'),  
  controller: log4js.getLogger('controller'),
  appFeedback: log4js.getLogger('appFeedback'),
};