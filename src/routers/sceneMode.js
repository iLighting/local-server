/**
 * 静态场景模式相关API
 *
 * - /api/staticScene/current
 *  - PUT: 修改sceneId
 *
 * @module
 */
const Router = require('koa-router');
const body = require('co-body');
const { app: log } = require('../utils/log');
const Msg = require('../utils/msg');
const proxy = require('../libs/proxy').getIns('staticScene');
const sysStatus = require('../libs/sys').getIns();
const { setScene } = require('../libs/staticScene');

const router = new Router({
  prefix: '/api/staticScene'
});

function * modeChecker (next) {
  const { mode } = sysStatus.getStatus();
  if (mode=='staticScene') {
    yield next;
  } else {
    this.body = new Msg(mode, new Error('模式不允许'))
  }
}

router
  .put('/current', modeChecker, function * (next) {
    const { scene } = yield body.json(this);
    try {
      yield sysStatus.setStatus({scene});
      yield setScene(scene);
      this.body = new Msg(scene);
    } catch (e) {
      log.error(e);
      this.body = new Msg(scene, e)
    }
  });

module.exports = router.routes();
