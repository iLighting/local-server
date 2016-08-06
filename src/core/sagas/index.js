const takeEvery = require('redux-saga').takeEvery;
const { call, put, fork, select } = require('redux-saga/effects');

let waitList = [];

const filterSplit = function (x, filter) {
  let a = [];
  let b = [];
  x.forEach(item => {
    if (filter(item)) {
      a.push(item);
    } else {
      b.push(item);
    }
  });
  return [a, b];
}

const watchAll = function * () {
  yield takeEvery('*', function * (action) {
    const { type } = action;
    const [a, b] = filterSplit(waitList, item => type.match(item[0]));
    waitList = b;
    a.forEach(item => {
      item[1](action)
    });
  });
}

const exp = function * () {
  yield [
    fork(watchAll),
    fork(require('./zigbee')),
    fork(require('./client')),
    fork(require('./log'))
  ]
}

exp.wait = function (typePartten) {
  const pro = new Promise((resolve, reject) => {
    waitList.push([typePartten, resolve, reject]);
  });
  return pro;
}

module.exports = exp;
