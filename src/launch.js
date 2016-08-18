const app = require('./app');
const { init:initDb } = require('./db');

const launch = function (config) {
  return new Promise((resolve, reject) => {
    try {
      // 初始化数据库
      const { db, models } = initDb(config.db.path);
      // 初始化app
      app.context.mount = {};
      app.context.mount.db = db;
      app.context.mount.models = models;
      app.listen(config.server.port);
      console.log('应用启动');
      console.log(config);
    } catch (e) {
      reject(e);
    }
  })
}

module.exports = launch;
