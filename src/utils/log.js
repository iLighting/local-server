/**
 * @module
 */

const log4js = require('log4js');

const config = global.__config;

const logConfig = {
  appenders: [{
    type: 'logLevelFilter',
    level: config.get('log_level'),
    appender: {
      type: 'file',
      filename: config.get('log_path'),
      maxLogSize: config.get('log_maxLogSize'),
      numBackups: config.get('log_numBackups')
    }
  }]
};

if (!!config.get('log_console')) {
  logConfig.appenders.push({
    type: 'logLevelFilter',
    level: 'INFO',
    appender: {
      type: 'console'
    }
  })
}

log4js.configure(logConfig);

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
  appAsr: log4js.getLogger('appAsr'),
  sceneChooser: log4js.getLogger('sceneChooser'),
};