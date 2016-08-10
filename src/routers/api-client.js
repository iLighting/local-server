const router = require('koa-router')();
const store = require('../core/store');
const Msg = require('../utils/msg');

router.get('/device/:nwk', function * (next) {
  const { type, payload, err } = yield store.doThenWait(
    /client\/device\/get\/one\.(success|failure)/,
    'client/device/get/one',
    {nwk: parseInt(this.params.nwk, 10)}
  );
  switch (type) {
    case 'client/device/get/one.success':
      this.body = new Msg(payload);
      break;
    case 'client/device/get/one.failure':
      this.body = new Msg(payload, err);
      break;
    default:
      this.body = {};
  }
})

module.exports = router.routes();
