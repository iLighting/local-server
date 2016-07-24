const { createStore, applyMiddleware, compose, combineReducers } = require('redux');
const createSagaMiddleware = require('redux-saga').default;

const saga = createSagaMiddleware();

const xCreateStore = applyMiddleware(
  saga
)(createStore);

const store = xCreateStore(
  require('./reducers'),
  {}
);

saga.run(require('./sagas'));

module.exports = store;
