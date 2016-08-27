const co = require('co');
const { sys:sysLog } = require('./utils/log');

const launch = co.wrap(function * (config) {
  // 初始化数据库
  const { init:initDb } = require('./db');
  const { db, models } = yield initDb(config.db.path);
  // 初始化APP
  const app = require('./app');
  app.context.mount = {};
  app.context.mount.db = db;
  app.context.mount.models = models;
  app.listen(config.server.port);
  sysLog.mark('应用启动成功，端口号 %s', config.server.port);
  return { db, models, app };
});


module.exports = launch;
