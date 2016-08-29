/**
 * @module
 */

const co = require('co');
const { expect } = require('chai');
const pry = require('promisify-node');
const { client: log } = require('../utils/log');
const { getDb, getModels } = require('../db');
const transfer = require('./transfer');
const { onOfLamp } = require('../utils/mtAppMsg');


const db = getDb();
const models = getModels();

const syncRemoteProperty = {
  'lamp': function * (nwk, ep, props) {
    const { payload } = props;
    if (payload) {
      const { level } = payload;
      const frame = onOfLamp.turn(nwk, ep, !!level);
      // const srsp = yield pry(transfer.write.bind(transfer))(frame);
      const srsp = yield new Promise((resolve, reject) => {
        transfer.write(frame, (err, srsp) => {
          if (err) { reject(err) } else { resolve(srsp) }
        })
      });
      const parsed = frame.isSRSP(srsp);
      if (!parsed.success) {
        const err = new Error(`Sync ${nwk}/${ep} failed. SRSP status ${parsed.status}.`);
        log.error(err);
        throw err;
      }
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
    const err = new Error(`${appType}处理器未定义`);
    log.error(err);
    throw err;
  }
  yield syncRemoteProperty[appType](nwk, ep, props);
  yield app.update(props).exec();
  return app.toObject();
}
setAppProperty = co.wrap(setAppProperty);

module.exports = {
  setAppProperty,
};
