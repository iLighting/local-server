const expect = require('chai').expect;

module.exports = {
  'db/connect': ({path}) => ({
    type: 'db/connect',
    payload: {path}
  }),
  'db/connect.success': (db) => ({
    type: 'db/connect.success',
    payload: db
  }),
  'db/connect.failure': ({path}, err) => {
    expect(err).to.be.an.instanceof(Error);
    return {
      type: 'db/connect.failure',
      payload: {path},
      err,
    }
  },
  'db/model/create': (schemaMap) => ({
    type: 'db/model/create',
    payload: schemaMap
  }),
  'db/model/create.success': (modelMap) => ({
    type: 'db/model/create.success',
    payload: modelMap
  }),
  'db/model/create.failure': (schemaMap, err) => {
    expect(err).to.be.an.instanceof(Error);
    return {
      type: 'db/model/create.failure',
      payload: schemaMap,
      err,
    }
  },
}
