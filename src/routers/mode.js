const co = require('co');
const { expect } = require('chai');
const Router = require('koa-router');
const body = require('co-body');
const { app: log } = require('../utils/log');
const _ = require('lodash');
const Msg = require('../utils/msg');
const { currentMode, setMode } = require('../libs/proxy');

const router = new Router({
  prefix: '/api'
});

router.get('/mode', function * (next) {
  try {
    this.body = new Msg(currentMode());
  } catch (e) {
    log.error(e);
    this.body = new Msg(null, e);
  }
});

router.put('/mode', function * (next) {
  const mode = yield body.json(this);
  try {
    setMode(mode);
    this.body = new Msg(currentMode());
  } catch (e) {
    log.error(e);
    this.body = new Msg(mode, e);
  }
});

module.exports = router.routes();
