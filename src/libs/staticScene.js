const co = require('co');
const { staticScene: log } = require('../utils/log');
const proxy = require('../libs/proxy').getIns('staticScene');
const { getModels } = require('../db');

const { Device, StaticSceneItem } = getModels();

/**
 * 设置场景
 * @param {String} sid - 场景ID
 * @return {Promise}
 * @type {Function}
 */
const setScene = co.wrap(function * (sid) {
  const sItems = yield StaticSceneItem.find({scene: sid}).exec();
  if (sItems.length <= 0) {
    throw new Error(`场景${sid}无效`);
  }
  for (let i=0; i<sItems.length; i++) {
    const item = sItems[i];
    const dev = yield Device.findOne({ieee: item.ieee}).exec();
    yield proxy.setAppProps(dev.nwk, item.ep, {
      payload: item.scenePayload
    });
    log.trace(`设置 ${item.ieee}.${item.ep}\n`, item.scenePayload);
  }
});


module.exports = {
  setScene,
};
