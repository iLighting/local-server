const { expect } = require('chai');
const takeEvery = require('redux-saga').takeEvery;
const { call, put, fork, select } = require('redux-saga/effects');

const watchAll = function * () {
  yield takeEvery('*', function * (action) {
    console.log(`ACT -> `, action);
  });
}

module.exports = function * () {
  yield [
    fork(watchAll),
  ]
}
