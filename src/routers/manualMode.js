/**
 * 手动模式相关API
 *
 * - /api/manual/device/nwk/:nwk/ep/:ep
 *  - PUT: 修改app payload
 *
 * @module
 */

const Router = require('koa-router');
const body = require('co-body');
const { app: log } = require('../utils/log');
const _ = require('lodash');
const Msg = require('../utils/msg');
const proxy = require('../libs/proxy').getIns('manual');
const sysStatus = require('../libs/sys').getIns();

const router = new Router({
  prefix: '/api/manual'
});

function * modeChecker (next) {
  const { mode } = sysStatus.getStatus();
  if (mode=='manual') {
    yield next;
  } else {
    this.body = new Msg(mode, new Error('模式不允许'))
  }
}

router
  .put('/device/nwk/:nwk/ep/:ep', modeChecker, function * (next) {
    const nwk = parseInt(this.params.nwk, 10);
    const ep = parseInt(this.params.ep, 10);
    const appPayload = yield body.json(this);
    try {
      const app = yield proxy.setAppProps(nwk, ep, {payload: appPayload});
      this.body = new Msg(_.pick(app, [
        'device', 'endPoint', 'type', 'name', 'payload',
      ]));
    } catch (e) {
      log.error(e);
      this.body = new Msg({nwk, ep, payload: appPayload}, e);
    }
  });

module.exports = router.routes();
