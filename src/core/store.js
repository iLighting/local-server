const { createStore, applyMiddleware, compose, combineReducers } = require('redux');
const createSagaMiddleware = require('redux-saga').default;
const actions = require('./actions');
const saga = require('./sagas');

const sagaMdw = createSagaMiddleware();

const xCreateStore = applyMiddleware(
  sagaMdw
)(createStore);

const store = xCreateStore(
  require('./reducers'),
  {}
);

// 已弃用
store.doAction = function (name, ...args) {
  return store.dispatch(actions[name](...args))
}

store.doThenWait = function (type, name, ...args) {
  let p = saga.wait(type);
  store.dispatch(actions[name](...args));
  return p;
}

store.run = function () {
  sagaMdw.run(saga);
}

store.wait = function(type) {
  return saga.wait(type)
}

module.exports = store;
