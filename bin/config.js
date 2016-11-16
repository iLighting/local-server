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
    path: 'COM3',
    rate: 115200,
  }
};
