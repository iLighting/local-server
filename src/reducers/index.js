const {combineReducers} = require('redux');

module.exports = combineReducers({
  zigbee: require('./zigbee'),
  db: require('./db')
})
