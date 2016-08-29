/**
 * @module
 *
 * @description
 *
 * ### `/api/device/nwk/:nwk`
 * - `GET`
 *
 * ### `/api/device/nwk/:nwk/ep/:ep`
 * #### `GET`
 * #### `PUT`
 * 修改指定app。返回修改后的app。
 *
 * 按字段修改，未put的字段保持不变。当前只允许修改`name`和`payload`。
 *
 * ### `/api/app/:type`
 */

const { expect } = require('chai');
const router = require('koa-router')();
const body = require('co-body');
const _ = require('lodash');
const Msg = require('../utils/msg');
const clientApi = require('../libs/client');

// api 接口
// -------------------------

const apiPrefix = '/api';

router.get(`${apiPrefix}/device/nwk/:nwk`, function * (next) {
  const nwk = parseInt(this.params.nwk, 10);
  const dbQuery = {nwk};
  const { Device, App } = this.mount.models;
  try {
    let devObj = {};
    const dev = yield Device
      .findOne(dbQuery)
      .select('nwk ieee type name')
      .exec();
    Object.assign(devObj, dev.toObject());
    if (dev) {
      let apps = yield App
        .find()
        .where('device').equals(dev.nwk)
        .select('device endPoint type name')
        .exec();
      devObj.apps = apps.map(app => app.toObject());
    } else {
      throw new Error('设备未找到');
    }
    this.body = new Msg(devObj);
  } catch (e) {
    this.body = new Msg(dbQuery, e);
  }
});

router.get(`${apiPrefix}/device/nwk/:nwk/ep/:ep`, function * (next) {
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
    this.body = new Msg({nwk, ep}, e);
  }
});

router.put(`${apiPrefix}/device/nwk/:nwk/ep/:ep`, function * (next) {
  const nwk = parseInt(this.params.nwk, 10);
  const ep = parseInt(this.params.ep, 10);
  const { App } = this.mount.models;
  const { name, payload } = yield body.json(this);
  const updateReq = {};
  name && (updateReq.name = name);
  payload && (updateReq.payload = payload);
  try {
    const app = yield clientApi.setAppProperty(nwk, ep, updateReq);
    this.body = new Msg(_.pick(app, [
      'device', 'endPoint', 'type', 'name', 'payload',
    ]));
  } catch (e) {
    this.body = new Msg({nwk, ep}, e);
  }
});

router.get(`${apiPrefix}/app/type/:type`, function * (next) {
  const type = this.params.type;
  const { App } = this.mount.models;
  try {
    let apps = yield App
      .find({
        type,
      })
      .select('device endPoint type name')
      .exec();
    if (apps.length <= 0) {
      throw new Error(`${type}类型应用未找到`);
    }
    this.body = new Msg(apps);
  } catch (e) {
    this.body = new Msg({type}, e);
  }
});


module.exports = router.routes();
