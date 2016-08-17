const router = require('koa-router')();
const bodyPase = require('co-body');
const store = require('../store');
const Msg = require('../utils/msg');

router.post('/zigbee/device', function * (next) {
  const dev = yield bodyPase.json(this);
  const { type, payload, err } = yield store.doThenWait(
    /zigbee\/device\/join\.(success|failure)/,
    'zigbee/device/join',
    dev
  );
  switch (type) {
    case 'zigbee/device/join.success':
      this.body = new Msg(payload);
      break;
    case 'zigbee/device/join.failure':
      this.body = new Msg(payload, err);
      break;
    default:
      this.body = {};
  }
});

router.delete('/zigbee/device', function * (next) {
  const dev = yield bodyPase.json(this);
  const { type, payload, err } = yield store.doThenWait(
    /zigbee\/device\/leave\.(success|failure)/,
    'zigbee/device/leave',
    dev.nwk
  );
  switch (type) {
    case 'zigbee/device/leave.success':
      this.body = new Msg(payload);
      break;
    case 'zigbee/device/leave.failure':
      this.body = new Msg(payload, err);
      break;
    default:
      this.body = {};
  }
});

module.exports = router.routes();
