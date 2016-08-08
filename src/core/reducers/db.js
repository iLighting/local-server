const { handleActions } = require('redux-actions');

module.exports = handleActions({
  ['db/connect'](state, action) {
    return Object.assign({}, state);
  },
  ['db/connect.success'](state, action) {
    return Object.assign({}, state, {db: action.payload});
  },
  ['db/connect.failure'](state, action) {
    return Object.assign({}, state);
  },
  ['db/model/create'](state, action) {
    return Object.assign({}, state, {schemas: action.payload});
  },
  ['db/model/create.success'](state, action) {
    return Object.assign({}, state, {models: action.payload});
  },
  ['db/model/create.failure'](state, action) {
    return Object.assign({}, state);
  },
}, {
  db: null,
  schemas: {},
  models: {}
})
