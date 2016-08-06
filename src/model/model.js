//noinspection JSUnresolvedVariable
const mongoose = require('mongoose');
const schema = require('./schema');
const config = require('../config');

// connect the db
// ------------------
mongoose.Promise = global.Promise;
mongoose.connect(config.db.path);
const db = mongoose.createConnection(config.db.path);

const Device = mongoose.model(schema.deviceSchema.name, schema.deviceSchema);
const App = mongoose.model(schema.appSchema.name, schema.appSchema);

module.exports = {
  db,
  Device,
  App
}
