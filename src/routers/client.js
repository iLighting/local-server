const router = require('koa-router')();
const Msg = require('../utils/msg');

// api 接口
// -------------------------

router.get('/api/device/get/:nwk', function * (next) {
  const nwk = parseInt(this.params.nwk, 10);
  const dbQuery = {nwk};
  const { Device, App } = this.mount.models;
  try {
    let dev = yield Device.findOne(dbQuery).exec();
    if (dev) {
      let apps = yield App
        .find()
        .where('device')
        .equals(dev.nwk)
        .exec();
      dev.apps = apps;
    } else {
      throw new Error('设备未找到');
    }
    this.body = new Msg(dev);
  } catch (e) {
    this.body = new Msg(dbQuery, e);
  }
})

module.exports = router.routes();
