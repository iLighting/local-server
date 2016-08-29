/**
 * @module
 */

const co = require('co');
const { expect } = require('chai');
const { getDb, getModels } = require('../db');

const db = getDb();
const models = getModels();

/**
 * 加入一个设备到数据库, 包括apps在内的所有内容将被更新
 * @type {Function}
 * @param  {Object} devReq 设备描述：
 * {
 *   nwk: <Number>
 *   ieee: <String>
 *   type: <String>
 *   name: <String>
 *   apps: [{
 *     endPoint: <Number>
 *     type: <String>
 *     payload: <Any>
 *   }]
 * }
 * @return {Object}        model实例:
 * {
 *   device: <Model>
 *   apps: <Array of Models>
 * }
 */
const deviceJoin = co.wrap(function * (devReq) {
  // 检查入参
  expect(devReq).to.have.property('nwk').that.is.a('number');
  expect(devReq).to.have.property('ieee').that.is.a('string');
  expect(devReq).to.have.property('type').that.is.a('string');
  expect(devReq).to.have.property('apps').that.is.a('array');
  const { Device, App } = models;
  const { nwk, ieee, type, name, apps } = devReq;
  // 清空与当前dev有关的数据
  yield Device.remove({nwk}).exec();
  yield App.remove({device: nwk}).exec();
  // 建立新记录
  const dev = yield Device.create({nwk, ieee, type, name});
  if (apps.length > 0) {
    let appsReq = apps.map(item => Object.assign({}, item, {device: dev.nwk}));
    let appInsList = yield App.create(appsReq);
    return {device: dev, apps: appInsList};
  }
  return {device: dev, apps: []}
});

/**
 * 从数据库删除一个设备
 * @param {Number} nwk
 * @type {Function}
 * @return {Promise}
 */
const deviceLeave = co.wrap(
  function * (nwk) {
  expect(nwk).to.be.a('number');
  const { Device, App } = models;
  yield Device.remove({nwk}).exec();
  yield App.remove({device: nwk}).exec();
});

module.exports = {
  deviceJoin,
  deviceLeave,
};
