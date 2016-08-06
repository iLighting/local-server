const expect = require('chai').expect;

module.exports = {
  'client/device/get/all': (query) => {
    return {
      type: 'client/device/get/all',
      payload: query
    }
  },
  'client/device/get/all.success': (devices) => {
    return {
      type: 'client/device/get/all.success',
      payload: devices
    }
  },
  'client/device/get/all.failure': (query, err) => {
    expect(err).to.be.an.instanceof(Error);
    return {
      type: 'client/device/get/all.failure',
      payload: query,
      err,
    }
  },
  'client/device/get/one': (query) => {
    return {
      type: 'client/device/get/one',
      payload: query
    }
  },
  'client/device/get/one.success': (device) => {
    return {
      type: 'client/device/get/one.success',
      payload: device
    }
  },
  'client/device/get/one.failure': (query, err) => {
    expect(err).to.be.an.instanceof(Error);
    return {
      type: 'client/device/get/one.failure',
      payload: query,
      err,
    }
  },
}
