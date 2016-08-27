const log4js = require('log4js');

log4js.configure({
  level: 'DEBUG',
  appenders: [
    { type: 'console' },
  ]
});

module.exports = {
  client: log4js.getLogger('client'),
  zigbee: log4js.getLogger('zigbee'),
  db: log4js.getLogger('db'),
  sys: log4js.getLogger('sys'),
}