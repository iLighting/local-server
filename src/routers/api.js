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
      const [devices] = yield mix.wrap2ReturnPromise(Device.joinApps.bind(Device))(dbQuery);
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
    const { controller } = this.mount;
    const { App } = this.mount.models;
    const mode = controller.getMode();
    const nwk = parseInt(this.params.nwk, 10);
    const ep = parseInt(this.params.ep, 10);
    const updateReq = _.pick(yield body.json(this), ['name', 'payload']);
    try {
      if (mode === 'manual') {
        // manual模式下才发送payload
        yield controller.setAppPayload(nwk, ep, updateReq.payload);
      }
      // 非manual模式，忽略payload
      delete updateReq.payload;
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


// 静态场景相关
// ====================================================================

/**
 * 获取、修改场景id
 */
router
  .get('/staticScene/current', function * () {
    const { sys } = this.mount;
    try {
      const { sceneId } = sys.getSys().status;
      this.body = new Msg(sceneId);
    } catch (e) {
      log.error(e);
      this.body = new Msg(null, e);
    }
  })
  .put('/staticScene/current', function * () {
    const { controller } = this.mount;
    const sceneId = yield body.json(this);
    try {
      yield  controller.setScene(sceneId);
    } catch (e) {
      log.error(e);
      this.body = new Msg(sceneId, e);
    }
  });

/**
 * 获取所有场景、新增场景
 */
router
  .get('/staticScene/store', function * () {
    const { StaticScene } = this.mount.models;
    try {
      const [scenes] = yield mix.wrap2ReturnPromise(StaticScene.joinItems.bind(StaticScene))({});
      this.body = new Msg(scenes);
    } catch (e) {
      log.error(e);
      this.body = new Msg(null, e);
    }
  })
  .post('/staticScene/store', function * () {});

/**
 * 获取、修改指定id场景
 */
router
  .get('/staticScene/store/id/:id', function * () {
    const { StaticScene } = this.mount.models;
    const { id: sceneId } = this.params;
    try {
      const [scenes] = yield mix.wrap2ReturnPromise(StaticScene.joinItems.bind(StaticScene))({});
      const scene = _.chain(scenes)
        .find(scene =>  scene.id === sceneId )
        .value();
      this.body = new Msg(scene);
    } catch (e) {
      log.error(e);
      this.body = new Msg(sceneId, e);
    }
  })
  .put('/staticScene/store/id/:id', function * () {
    const { StaticScene } = this.mount.models;
    const { id: sceneId } = this.params;
    try {
      const contentReq = yield body.json(this);
      const [scene] = yield mix.wrap2ReturnPromise(StaticScene.setContent.bind(StaticScene))(
        sceneId,
        contentReq,
        true
      );
      this.body = new Msg(scene);
    } catch (e) {
      log.error(e);
      this.body = new Msg(sceneId, e);
    }
  });


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
    const { controller } = this.mount;
    try {
      const mode = controller.getMode();
      this.body = new Msg(mode);
    } catch (e) {
      log.error(e);
      this.body = new Msg(null, e);
    }
  })
  .put('/mode', function * () {
    const { controller } = this.mount;
    const [mode] = yield body.json(this);
    try {
      yield controller.switchMode(mode);
      this.body = new Msg(mode);
    } catch (e) {
      log.error(e);
      this.body = new Msg(null, e);
    }
  });


module.exports = router.routes();
