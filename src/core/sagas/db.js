const mongoose = require('mongoose');
const { expect } = require('chai');
const takeEvery = require('redux-saga').takeEvery;
const { call, put, fork, select } = require('redux-saga/effects');
const actions = require('../actions');


const connect = function * (action) {
  const { type, payload } = action;
  try {
    mongoose.Promise = global.Promise;
    mongoose.connect(payload.path);
    let db = mongoose.createConnection(payload.path);
    yield put(actions['db/connect.success'](db));
  } catch(e) {
    yield put(actions['db/connect.failure'](payload, e));
  }
}

const createModel = function * (action) {
  const { type, payload:schemaMap } = action;
  try {
    let modelMap = {};
    for (let name in schemaMap) {
      modelMap[name] = mongoose.model(name, schemaMap[name])
    }
    yield put(actions['db/model/create.success'](modelMap));
  } catch(e) {
    yield put(actions['db/model/create.failure'](schemaMap, e));
  }
}

const watchConnect = function * () {
  yield takeEvery('db/connect', connect);
}

const watchCreateModel = function * () {
  yield takeEvery('db/model/create', createModel);
}

module.exports = function * () {
  yield [
    fork(watchConnect),
    fork(watchCreateModel),
  ]
}
