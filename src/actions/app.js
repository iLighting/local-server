const expect = require('chai').expect;

module.exports = {
  'app/create': ({routers}) => {
    return {
      type: 'app/create',
      payload: {routers}
    }
  },
  'app/create.success': (app) => {
    return {
      type: 'app/create.success',
      payload: app
    }
  },
  'app/create.failure': (err) => {
    expect(err).to.be.an.instanceof(Error);
    return {
      type: 'app/create.failure',
      payload: null,
      err,
    }
  },
}
