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
  /**
   * logger for client
   */
  client: log4js.getLogger('client'),
  /**
   * logger for zigbee
   */
  zigbee: log4js.getLogger('zigbee'),
  /**
   * logger for db
   */
  db: log4js.getLogger('db'),
  /**
   * logger for system
   */
  sys: log4js.getLogger('sys'),
  transfer: log4js.getLogger('transfer'),
};