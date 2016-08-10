const router = require('koa-router')();
const bodyPase = require('co-body');
const store = require('../core/store');
const Msg = require('../utils/msg');

router.post('/zigbee/device/join', function * (next) {
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

module.exports = router.routes();
