const { call, put, fork, select } = require('redux-saga/effects');

module.exports = function * () {
  yield [
    fork(require('./zigbee'))
  ]
}
