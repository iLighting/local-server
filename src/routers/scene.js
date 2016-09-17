const co = require('co');
const { expect } = require('chai');
const Router = require('koa-router');
const body = require('co-body');
const { app: log } = require('../utils/log');
const _ = require('lodash');
const Msg = require('../utils/msg');

const router = new Router({
  prefix: '/api'
});

router.get('/scene/static', function * (next) {
  const { StaticScene, StaticSceneItem } = this.mount.models;
  try {
    const staticSceneList = yield StaticScene.find().exec();
    const staticSceneObjList = yield staticSceneList.map(sid => (
      co.wrap(function * () {
        const staticScene = yield StaticScene.findById(sid).exec();
        const staticSceneItems = yield staticScene.items.map(itemId => (
          StaticSceneItem.findById(itemId).exec()
        ));
        const re = staticScene.toObject();
        re.items = staticSceneItems.map(item => item.toObject());
        return re;
      })()
    ));
    this.body = new Msg(staticSceneObjList);
  } catch (e) {
    log.error(e);
    this.body = new Msg(null, e);
  }
});

router.get('/scene/static/:id', function * (next) {
  const { StaticScene, StaticSceneItem } = this.mount.models;
  const { id: sid } = this.params;
  try {
    const staticScene = yield StaticScene.findById(sid).exec();
    const staticSceneItems = yield staticScene.items.map(itemId => (
      StaticSceneItem.findById(itemId).exec()
    ));
    const re = staticScene.toObject();
    re.items = staticSceneItems.map(item => item.toObject());
    this.body = new Msg(re);
  } catch (e) {
    log.error(e);
    this.body = new Msg(sid, e);
  }
});

router.post('/scene/static', function * (next) {
  const { StaticScene, StaticSceneItem } = this.mount.models;
  const query = yield body.json(this);
  try {
    expect(query).to.be.an('object').that.to.have.all.keys('name', 'items');
    expect(query.name).to.be.a('string');
    expect(query.items).to.be.an('array');
    const sItems = yield StaticSceneItem.create(query.items);
    let sScene;
    sScene = yield StaticScene.findOne({name: query.name}).exec();
    if (sScene) { throw new Error(`${query.name}重名错误`) }
    sScene = yield StaticScene.create({
      name: query.name,
      items: sItems.map(item => item.id)
    });
    this.body = new Msg(sScene.id);
  } catch (e) {
    log.error(e);
    this.body = new Msg(query, e);
  }
});

router.put('/scene/static/:id', function * (next) {
  const { StaticScene, StaticSceneItem } = this.mount.models;
  const query = yield body.json(this);
  const { id: sid } = this.params;
  try {
    const { name, items } = query;
    const sScene = yield StaticScene.findById(sid).exec();
    if (sScene) {
      yield sScene.items.map(itemId => StaticSceneItem.findByIdAndRemove(itemId).exec());
      yield sItems = yield items.map(item => StaticSceneItem.create(item));
      yield sScene.update({name, items: sItems.map(item => item.id)}).exec();
      this.body = new Msg(query);
    } else { throw new Error(`${sid} 场景不存在`) }
  } catch (e) {
    log.error(e);
    this.body = new Msg(query, e);
  }
});

module.exports = router.routes();