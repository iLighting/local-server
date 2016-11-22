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
  }
};
