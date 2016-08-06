const expect = require('chai').expect;

module.exports = {
  'zigbee/device/join': (payload) => ({
    type: 'zigbee/device/join',
    payload: payload
  }),
  'zigbee/device/join.success': (id) => {
    expect(id).to.be.a('number');
    return {
      type: 'zigbee/device/join.success',
      payload: id,
    }
  },
  'zigbee/device/join.failure': (id, err) => {
    expect(id).to.be.a('number');
    expect(err).to.be.an.instanceof(Error);
    return {
      type: 'zigbee/device/join.failure',
      payload: id,
      err,
    }
  },
  'zigbee/device/leave': (id) => {
    expect(id).to.be.a('number');
    return {
      type: 'zigbee/device/leave',
      payload: id
    }
  },
  'zigbee/device/leave.success': (id) => {
    expect(id).to.be.a('number');
    return {
      type: 'zigbee/device/leave.success',
      payload: id,
    }
  },
  'zigbee/device/leave.failure': (id, err) => {
    expect(id).to.be.a('number');
    expect(err).to.be.an.instanceof(Error);
    return {
      type: 'zigbee/device/leave.failure',
      payload: id,
      err,
    }
  },
}
