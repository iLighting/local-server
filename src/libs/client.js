/**
 * @module
 */

const co = require('co');
const { expect } = require('chai');
const pry = require('promisify-node');
const { client: log } = require('../utils/log');
const { getDb, getModels } = require('../db');
const transfer = require('./transfer');
const { parseSrsp } = require('../utils/mt');
const { onOfLamp } = require('../utils/mtAppMsg');


const db = getDb();
const models = getModels();

const syncRemoteProperty = {
  'lamp': function * (nwk, ep, props) {
    log.trace(`开始同步远端Lamp ${nwk}/${ep}\n`, props);
    const { payload } = props;
    if (payload) {
      const { level } = payload;
      const frame = onOfLamp.turn(nwk, ep, !!level);
      const srsp = yield new Promise((resolve, reject) => {
        transfer.once('srsp', (buf, frameObj) => {
          log.trace('收到SRSP', buf, '\n', frameObj);
          resolve(buf);
        });
        transfer.write(frame, err => {
          if (err) { reject(err) } else {
            log.trace('指令帧已发送至串口\n', frame)
          }
        });
      });
      const srspObj = parseSrsp(srsp);
      if (!srspObj.success) {
        const err = new Error(`Sync ${nwk}/${ep} failed. SRSP status ${srspObj.status}.`);
        log.error(err);
        throw err;
      }
      log.trace('指令帧下达成功', srsp, '\n', srspObj);
    }
  }
};

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
  const { App } = models;
  const app = yield App.findOne({device: nwk, endPoint: ep}).exec();
  const { type: appType } = app;
  // app sync handler
  if (!syncRemoteProperty.hasOwnProperty(appType)) {
    const err = new Error(`${appType}远端同步处理器未定义`);
    log.error(err);
    throw err;
  }
  // TODO: 调试阶段，不经历 sync Remote
  yield syncRemoteProperty[appType](nwk, ep, props);
  const finalApp = yield App.findOneAndUpdate(
      {device: nwk, endPoint: ep},
      props,
      { 'new': true }
    ).exec();
  return finalApp.toObject();
}
setAppProperty = co.wrap(setAppProperty);

module.exports = {
  setAppProperty,
};
