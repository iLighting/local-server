const { handleActions } = require('redux-actions');

module.exports = handleActions({
  ['db/connect.success'](state, action) {
    return Object.assign({}, state, {db: action.payload});
  },
  ['db/model/create.success'](state, action) {
    return Object.assign({}, state, {models: action.payload});
  },
}, {
  db: null,
  models: {}
})
