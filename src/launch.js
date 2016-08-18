const mongoose = require('mongoose');
const schemaMap = require('.//model/schema')
const server = require('./server');
const store = require('./store');
const actions = require('./actions');

const launch = function (config) {
  mongoose.Promise = global.Promise;
  return new Promise((resolve, reject) => {
    try {
      // 启动saga
      store.run();
      // 连接数据库
      mongoose.connect(config.db.path);
      let db = mongoose.createConnection(config.db.path);
      store.dispatch(actions['db/connect.success'](db));
      // 创建model
      let modelMap = {};
      for (let name in schemaMap) {
        modelMap[name] = mongoose.model(name, schemaMap[name])
      }
      store.dispatch(actions['db/model/create.success'](modelMap));
      // 启动端口监听
      server.listen(config.server.port);
      resolve({
        store,
        server,
      })
    } catch (e) {
      reject(e);
    }
  })
}

module.exports = launch;
