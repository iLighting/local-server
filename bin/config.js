module.exports = {
  db: {
    path: 'mongodb://localhost/test'
  },
  server: {
    port: 3000
  },
  zigbee: {
    bridgeEp: 8,
    appMsgCluster: 0xff00,
  },
  serial: {
    path: 'COM4',
    rate: 38400,
  },
  ['hd/appType/lamp']: 0x0000,
  ['hd/appType/gray-lamp']: 0x0001,
  ['hd/appType/switch']: 0x0100,
  ['hd/appType/gray-switch']: 0x0101,
  ['hd/appType/pulse']: 0x0102,
  ['hd/appType/light-sensor']: 0x0300,
};
