const co = require('co');
const { expect } = require('chai');
const Router = require('koa-router');
const body = require('co-body');
const { app: log } = require('../utils/log');
const _ = require('lodash');
const Msg = require('../utils/msg');
const sysStatus = require('../libs/sys').getIns();

const router = new Router({
  prefix: '/api'
});

router
  .get('/mode', function * (next) {
    try {
      const { mode } = sysStatus.getStatus();
      this.body = new Msg(mode);
    } catch (e) {
      log.error(e);
      this.body = new Msg(null, e);
    }
  })
  .put('/mode', function * (next) {
    const { mode } = yield body.json(this);
    try {
      yield sysStatus.setStatus({mode});
      this.body = new Msg(mode);
    } catch (e) {
      log.error(e);
      this.body = new Msg(mode, e);
    }
  });

module.exports = router.routes();
