module.exports = {
  // db
  ['db/path']: 'mongodb://localhost/test',
  // server
  ['server/port']: 3000,
  // local server
  ['localServer/port']: 3001,
  // zigbee
  ['zigbee/bridgeEp']: 8,
  ['zigbee/appMsgCluster']: 0xff00,
  ['zigbee/appType/lamp']: 0x0000,
  ['zigbee/appType/gray-lamp']: 0x0001,
  ['zigbee/appType/switch']: 0x0100,
  ['zigbee/appType/gray-switch']: 0x0101,
  ['zigbee/appType/pulse']: 0x0102,
  ['zigbee/appType/illuminance-sensor']: 0x0300,
  ['zigbee/appType/temperature-sensor']: 0x0301,
  // serial
  ['serial/path']: 'COM5',
  ['serial/rate']: 38400,
  // log
  ['log/path']: 'logs/app.log',
  ['log/maxLogSize']: 10485760,
  ['log/numBackups']: 3,
  ['log/level']: 'TRACE',
};
