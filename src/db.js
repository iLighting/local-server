const mongoose = require('mongoose');
const schemaMap = require('./model/schema');

let db;
let models;

mongoose.Promise = global.Promise;

const init = function (path) {
  if (!db) {
    mongoose.connect(path);
    db = mongoose.createConnection(path);
    // 创建model
    models = {};
    for (let name in schemaMap) {
      models[name] = mongoose.model(name, schemaMap[name])
    }
  }
  return {db, models};
}

const getDb = function () {
  if (!db) {
    throw new Error('数据库未初始化，请先调用init()')
  }
  return db;
}

const getModels = function () {
  if (!models) {
    throw new Error('模型未初始化，请先调用init()')
  }
  return models;
}

module.exports = {
  init,
  getDb,
  getModels,
}
