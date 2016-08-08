const { expect } = require('chai');
const takeEvery = require('redux-saga').takeEvery;
const { call, put, fork, select } = require('redux-saga/effects');
const store = require('../store');
const actions = require('../actions');


const watchDeviceGetOne = function * () {
  yield takeEvery('client/device/get/one', function * (action) {
    const { type, payload } = action;
    try {
      const { Device, App } = store.getState().db.models;
      let dev = yield Device.findOne(payload).exec();
      if (dev) {
        let apps = yield App
          .find()
          .where('device')
          .equals(dev.id)
          .exec();
        dev.apps = apps;
        yield put(actions['client/device/get/one.success'](dev));
      } else {
        throw Error(`未找到对应设备`)
      }
    } catch(e) {
      yield put(actions['client/device/get/one.failure'](payload, e));
    }
  });
}

module.exports = function * () {
  yield [
    fork(watchDeviceGetOne),
  ]
}
