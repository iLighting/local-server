const co = require('co');
const { sys:log } = require('./utils/log');

const mockDb = function * (db, models) {
  // 清空数据库
  const { Device, App, StaticScene, StaticSceneItem } = models;
  yield Device.remove().exec();
  yield App.remove().exec();
  yield StaticScene.remove().exec();
  yield StaticSceneItem.remove().exec();
  const mockDate = require('./mock/db')();
  const { deviceJoin } = require('./libs/zigbee');
  yield mockDate.map(devReq => deviceJoin(devReq));
};

function * createSysStatus() {
  const { create } = require('./libs/sys');
  const ins = create();
  yield ins.createStatus({
    mode: 'manual'
  })
}

const launch = co.wrap(function * (config) {
  // 注入 config
  // global.__config = config;
  // 初始化数据库
  const { init:initDb } = require('./db');
  const { db, models } = yield initDb(config.db.path);
  // mock数据库
  yield mockDb(db, models);
  log.debug('mock数据库');
  // 初始化系统状态
  yield createSysStatus();
  // 初始化lib proxy
  yield require('./libs/proxy').init({
    bridgeEp: config.zigbee.bridgeEp,
    appMsgCluster: config.zigbee.appMsgCluster
  });
  // 初始化Server
  const app = require('./app');
  app.context.mount = {};
  app.context.mount.db = db;
  app.context.mount.models = models;
  const server = require('http').createServer(app.callback());
  // 初始化 socket.io
  const io = require('socket.io')(server);
  require('./socket')(io);
  // 启动
  server.listen(config.server.port);
  log.mark('应用启动成功，端口号 %s', config.server.port);
  return { db, models, app };
});


module.exports = launch;
