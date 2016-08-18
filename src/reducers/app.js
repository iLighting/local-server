const { handleActions } = require('redux-actions');

module.exports = handleActions({
  ['app/create'](state, action) {
    return Object.assign({}, state, {routers: action.routers});
  },
  ['app/create.success'](state, action) {
    return Object.assign({}, state, {app: action.payload});
  },
  ['app/create.failure'](state, action) {
    return Object.assign({}, state);
  },
}, {
  routers: null,
  app: null,
})
