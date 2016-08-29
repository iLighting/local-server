/**
 * @module
 */

const co = require('co');
const { expect } = require('chai');
const { getDb, getModels } = require('../db');
const transfer = require('./transfer');
const mt = require('../utils/mt');


const db = getDb();
const models = getModels();


function * syncRemoteOnOfLampProperty(nwk, ep, props) {

}

/**
 * 不可信地设置app属性
 * @param {Number} nwk
 * @param {Number} ep
 * @param {Object} props - 属性对象
 * @return {Promise} - resolve 更新后的app字面量对象
 */
function * setAppProperty (nwk, ep, props) {
  expect(nwk).to.be.a('number');
  expect(ep).to.be.a('number');
  expect(props).to.be.an('object');
  // 传输指令帧
  const mtBuf = Buffer.from([1,2,3]);
  // TODO
  // 修改数据库
  const { App } = models;
  const app = yield App
    .findOneAndUpdate({
      device: nwk,
      endPoint: ep,
    }, props, { 'new': true})
    .exec();
  return app.toObject();
}
setAppProperty = co.wrap(setAppProperty);

module.exports = {
  setAppProperty,
};
