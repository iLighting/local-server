const mongoose = require('mongoose');
const schemaMap = require('./schema');
const { db: dbLog } = require('./utils/log');

let db;
let models;

mongoose.Promise = global.Promise;

const init = function (path) {
  dbLog.debug('初始化数据库', path);
  return new Promise((resolve, reject) => {
    if (!db) {
      mongoose.connect(path, err => {
        dbLog.trace('数据库首次连接', path);
        if (err) {
          dbLog.error(err.toString());
          reject(err);
        }
        db = mongoose.createConnection(path);
        // 创建model
        models = {};
        Object.keys(schemaMap).forEach(name => {
          models[name] = mongoose.model(name, schemaMap[name]);
        });
        resolve({db, models});
      });
    } else {
      resolve({db, models});
    }
  });
};

const getDb = function () {
  if (!db) {
    throw new Error('数据库未初始化，请先调用init()')
  }
  return db;
};

const getModels = function () {
  if (!models) {
    throw new Error('模型未初始化，请先调用init()')
  }
  return models;
};

module.exports = {
  init,
  getDb,
  getModels,
};
