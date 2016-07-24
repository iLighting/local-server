const { expect } = require('chai');
const takeEvery = require('redux-saga').takeEvery;
const { call, put, fork, select } = require('redux-saga/effects');
const model = require('../../model/model');
const actions = require('../actions');

const watchDeviceJoin = function * () {
  yield takeEvery('zigbee/device/join', function * (action) {
    const {type, payload} = action;
    try {
      let device = yield model.Device.find().byId(payload.id).exec();
      if (!device) {
        device = yield model.Device.create({
          _id: payload.id,
          ieee: payload.ieee,
          type: payload.type
        });
      }
      yield put(actions['zigbee/device/join.success'](device.id));
    } catch(e) {
      yield put(actions['zigbee/device/join.failure'](e));
    }
  });
}

module.exports = function * () {
  yield [
    fork(watchDeviceJoin),
  ]
}
