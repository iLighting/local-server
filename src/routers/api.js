const Router = require('koa-router');
const body = require('co-body');
const { app: log } = require('../utils/log');
const _ = require('lodash');
const mix = require('../utils/mix');
const Msg = require('../utils/msg');

const router = new Router({
  prefix: '/api'
});


// 设备相关
// ==============================================================================

/**
 * 获取所有device
 */
router
  .get('/device', function * () {
    const { Device } = this.mount.models;
    const dbQuery = _.pick(this.request.query, [
      'nwk', 'ieee', 'type', 'name'
    ]);
    try {
      const devices = yield mix.wrap2ReturnPromise(Device.join2Obj.bind(Device))(dbQuery);
      this.body = new Msg(devices);
    } catch (e) {
      log.error(e);
      this.body = new Msg(dbQuery, e);
    }
  });

/**
 * 操作app
 * - get: 获取
 * - put: 修改，非manual模式忽略payload
 */
router
  .get('/device/nwk/:nwk/ep/:ep', function * () {
    const nwk = parseInt(this.params.nwk, 10);
    const ep = parseInt(this.params.ep, 10);
    const { App } = this.mount.models;
    try {
      let epApp = yield App
        .findOne({
          device: nwk,
          endPoint: ep
        })
        .select('device endPoint type name payload')
        .exec();
      if (!epApp) throw new Error('端口应用未找到');
      this.body = new Msg(epApp.toObject());
    } catch (e) {
      log.error(e);
      this.body = new Msg({nwk, ep}, e);
    }
  })
  .put('/device/nwk/:nwk/ep/:ep', function * () {
    const { controller, sys } = this.mount;
    const { App } = this.mount.models;
    const mode = sys.status.mode;
    const nwk = parseInt(this.params.nwk, 10);
    const ep = parseInt(this.params.ep, 10);
    const updateReq = yield body.json(this);
    try {
      if (mode === 'manual') {
        // manual模式下才发送payload
        yield controller.setAppPayload(nwk, ep, updateReq.payload);
      }
      // 非manual模式，忽略payload
      updateReq.payload = undefined;
      const app = yield App.findOneAndUpdate(
        {device: nwk},
        updateReq,
        { 'new': true }).exec();
      this.body = new Msg(_.pick(app, [
        'device', 'endPoint', 'type', 'name', 'payload',
      ]));
    } catch (e) {
      log.error(e);
      this.body = new Msg({nwk, ep}, e);
    }
  });


// 场景相关
// ====================================================================

/**
 * 获取、修改场景id
 */
router
  .get('/scene', function * () { })
  .put('/scene', function * () { });


// 系统相关
// ====================================================================

/**
 * 获取系统状态
 */
router
  .get('/sys', function * () {
    const { sys } = this.mount;
    try {
      this.body = new Msg(sys.getSys());
    } catch (e) {
      log.error(e);
      this.body = new Msg(null, e);
    }
  });

/**
 * 查看、修改mode
 */
router
  .get('/mode', function * () {
    const { sys } = this.mount;
    try {
      const mode = sys.getSys().status.mode;
      this.body = new Msg(mode);
    } catch (e) {
      log.error(e);
      this.body = new Msg(null, e);
    }
  })
  .put('/mode', function * () {
    const { sys } = this.mount;
    const [mode] = yield body.json(this);
    try {
      const sysObj = sys.getSys();
      sysObj.status.mode = mode;
      sys.mergeSys(sysObj);
      yield sys.flush();
      this.body = new Msg(mode);
    } catch (e) {
      log.error(e);
      this.body = new Msg(null, e);
    }
  });


module.exports = router.routes();
