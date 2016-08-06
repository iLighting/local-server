const router = require('koa-router')();
const store = require('../core/store');
const Msg = require('../utils/msg');

router.get('/device/:id', function * (next) {
  store.doAction('client/device/get/one', {id: this.params.id});
  const { type, payload, err } = yield store.wait('client/device/get/one.(success|failure)');
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
