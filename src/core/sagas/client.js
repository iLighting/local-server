const { expect } = require('chai');
const takeEvery = require('redux-saga').takeEvery;
const { call, put, fork, select } = require('redux-saga/effects');
const model = require('../../model/model');
const actions = require('../actions');

const Device = model.Device;
const App = model.App;

// const watchDeviceGetAll = function * () {
//   yield takeEvery('client/device/get/all', function * (action) {
//     const { type, payload } = action;
//     try {
//       let devices = yield Device.find().select('id ieee type').exec();
//       let joindDevices = yield devices.map(dev => (function * () {
//         let apps = yield App.find().where('device').equals(dev.id).select('endPoint type').exec();
//         return {
//           id: dev.id,
//           ieee: dev.ieee,
//           type: dev.type,
//           apps,
//         }
//       }));
//       yield put(actions['client/device/get/all.success'](joindDevices));
//     } catch(e) {
//       yield put(actions['client/device/get/all.failure'](payload, e));
//     }
//   });
// }

const watchDeviceGetOne = function * () {
  yield takeEvery('client/device/get/one', function * (action) {
    const { type, payload } = action;
    try {
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
