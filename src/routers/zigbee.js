const router = require('koa-router')();
const body = require('co-body');
const Msg = require('../utils/msg');
const zigbeeLib = require('../libs/zigbee');

/**
 * 加入一个设备，数据格式参见 libs/zigbee.js
 */
router.post('/api/_zigbee/device/join', function * (next) {
  const devReq = body(this);
  try {
    const { device, apps } = yield zigbeeLib.deviceJoin(devReq);
    this.body = new Msg({device, apps});
  } catch (e) {
    this.body = new Msg(devReq, e);
  }
});

module.exports = router.routes();
