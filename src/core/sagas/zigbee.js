const { expect } = require('chai');
const takeEvery = require('redux-saga').takeEvery;
const { call, put, fork, select } = require('redux-saga/effects');
const store = require('../store');
const actions = require('../actions');

const watchDeviceJoin = function * () {
  yield takeEvery('zigbee/device/join', function * (action) {
    const {type, payload} = action;
    try {
      const { Device, App } = store.getState().db.models;
      let device = yield Device.find().byId(payload.id).exec();
      if (!device) {
        device = yield Device.create({
          _id: payload.id,
          ieee: payload.ieee,
          type: payload.type
        });
      }
      yield put(actions['zigbee/device/join.success'](device.id));
    } catch(e) {
      yield put(actions['zigbee/device/join.failure'](payload.id, e));
    }
  });
}

const watchDeviceLeave = function * () {
  yield takeEvery('zigbee/device/leave', function * (action) {
    const {type, payload} = action;
    try {
      const { Device, App } = store.getState().db.models;
      yield Device.find().byId(payload.id).remove().exec();
      yield put(actions['zigbee/device/leave.success'](device.id));
    } catch(e) {
      yield put(actions['zigbee/device/leave.failure'](payload.id, e));
    }
  });
}

module.exports = function * () {
  yield [
    fork(watchDeviceJoin),
    fork(watchDeviceLeave),
  ]
}
