/**
 * 场景API
 *
 * - /api/scene/current
 *  - GET：获取当前场景（manual模式下返回null）
 *  - PUT：修改当前场景（manual模式下无效）
 *
 * - /api/scene/store/static
 *  - GET：获取静态场景列表
 *  - POST：新增静态场景
 *
 * - /api/scene/store/static/id/:id
 *  - GET：获取指定静态场景
 *  - PUT：修改指定静态场景
 *
 * @module
 */

const co = require('co');
const { expect } = require('chai');
const sysStatus = require('../libs/sys').getIns();
const Router = require('koa-router');
const body = require('co-body');
const { app: log } = require('../utils/log');
const _ = require('lodash');
const Msg = require('../utils/msg');

const router = new Router({
  prefix: '/api'
});


router
  .get('/scene/current', function * (next) {
    const { mode, scene } = sysStatus.getStatus();
    if (mode == 'manual') {
      this.body = new Msg(null)
    } else {
      this.body = new Msg(scene)
    }
  })
  .put('/scene/current', function * (next) {
    const scene = yield body.json(this);
    const { mode: currentMode } = sysStatus.getStatus();
    if (currentMode === 'manual') {
      this.body = new Msg(scene, new Error('系统处于手动模式，不可更换场景id'))
    } else {
      try {
        yield sysStatus.setStatus({scene});
        this.body = new Msg(scene);
      } catch (e) { this.body = new Msg(scene, e) }
    }
  });

router.get('/scene/store/static', function * (next) {
  const { Device, App, StaticScene, StaticSceneItem } = this.mount.models;
  try {
    const staticSceneList = yield StaticScene.find().exec();
    const staticSceneObjList = yield staticSceneList.map(sid => (
      co.wrap(function * () {
        const staticScene = yield StaticScene.findById(sid).exec();
        const staticSceneItems = yield StaticSceneItem.find({scene: sid}).exec();
        const re = staticScene.toObject();
        re.items = yield staticSceneItems.map(item => {
          return co.wrap(function * () {
            const targetDevice = yield Device.findOne({ieee: item.ieee}).exec();
            if (!targetDevice) {
              log.error(`${item.ieee} 设备缺失`);
              return {}
            }
            const targetApp = yield App
              .findOne({device: targetDevice.nwk, endPoint: item.ep}).exec();
            if (!targetApp) {
              log.error(`${item.ieee}.${item.ep} 应用缺失`);
              return {}
            }
            return Object.assign({}, item.toObject(), {
              appType: targetApp.type
            })
          })();
        });
        return re;
      })()
    ));
    this.body = new Msg(staticSceneObjList);
  } catch (e) {
    log.error(e);
    this.body = new Msg(null, e);
  }
});

router.get('/scene/store/static/id/:id', function * (next) {
  const { Device, App, StaticScene, StaticSceneItem } = this.mount.models;
  const { id: sid } = this.params;
  try {
    const staticScene = yield StaticScene.findById(sid).exec();
    if (staticScene) {
      const staticSceneItems = yield StaticSceneItem.find({scene: staticScene.id}).exec();
      const re = staticScene.toObject();
      re.items = yield staticSceneItems.map(item => {
        return co.wrap(function * () {
          const targetDevice = yield Device.findOne({ieee: item.ieee}).exec();
          if (!targetDevice) {
            log.error(`${item.ieee} 设备缺失`);
            return {}
          }
          const targetApp = yield App
            .findOne({device: targetDevice.nwk, endPoint: item.ep}).exec();
          if (!targetApp) {
            log.error(`${item.ieee}.${item.ep} 应用缺失`);
            return {}
          }
          return Object.assign({}, item.toObject(), {
            appType: targetApp.type
          })
        })();
      });
      this.body = new Msg(re);
    } else {
      this.body = new Msg(null);
    }
  } catch (e) {
    log.error(e);
    this.body = new Msg(sid, e);
  }
});

router.post('/scene/store/static', function * (next) {
  const { StaticScene, StaticSceneItem } = this.mount.models;
  const query = yield body.json(this);
  try {
    expect(query).to.be.an('object').that.to.have.all.keys('name', 'items');
    expect(query.name).to.be.a('string');
    expect(query.items).to.be.an('array');
    let sScene = yield StaticScene.findOne({name: query.name}).exec();
    if (sScene) { throw new Error(`${query.name}重名错误`) }
    sScene = yield StaticScene.create({
      name: query.name,
    });
    for(let i=0; i<query.items.length; i++) {
      yield StaticSceneItem.create(Object.assign({}, query.items[i], {
        scene: sScene.id
      }))
    }
    this.body = new Msg(sScene.id);
  } catch (e) {
    log.error(e);
    this.body = new Msg(query, e);
  }
});

router.put('/scene/store/static/id/:id', function * (next) {
  const { StaticScene, StaticSceneItem } = this.mount.models;
  const query = yield body.json(this);
  const { id: sid } = this.params;
  try {
    const { name, items } = query;
    const sScene = yield StaticScene.findById(sid).exec();
    if (sScene) {
      // yield sScene.items.map(itemId => StaticSceneItem.findByIdAndRemove(itemId).exec());
      yield StaticSceneItem.remove({scene: sScene.id}).exec();
      // yield sItems = yield items.map(item => StaticSceneItem.create(item));
      // yield sScene.update({name, items: sItems.map(item => item.id)}).exec();
      // TODO: scene修改逻辑
      this.body = new Msg(query);
    } else { throw new Error(`${sid} 场景不存在`) }
  } catch (e) {
    log.error(e);
    this.body = new Msg(query, e);
  }
});

module.exports = router.routes();