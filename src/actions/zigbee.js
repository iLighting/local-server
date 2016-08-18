const expect = require('chai').expect;

module.exports = {
  'zigbee/device/join': (payload) => ({
    type: 'zigbee/device/join',
    payload: payload
  }),
  'zigbee/device/join.success': (nwk) => {
    expect(nwk).to.be.a('number');
    return {
      type: 'zigbee/device/join.success',
      payload: nwk,
    }
  },
  'zigbee/device/join.failure': (nwk, err) => {
    expect(nwk).to.be.a('number');
    expect(err).to.be.an.instanceof(Error);
    return {
      type: 'zigbee/device/join.failure',
      payload: nwk,
      err,
    }
  },
  'zigbee/device/leave': (nwk) => {
    expect(nwk).to.be.a('number');
    return {
      type: 'zigbee/device/leave',
      payload: nwk
    }
  },
  'zigbee/device/leave.success': (nwk) => {
    expect(nwk).to.be.a('number');
    return {
      type: 'zigbee/device/leave.success',
      payload: nwk,
    }
  },
  'zigbee/device/leave.failure': (nwk, err) => {
    expect(nwk).to.be.a('number');
    expect(err).to.be.an.instanceof(Error);
    return {
      type: 'zigbee/device/leave.failure',
      payload: nwk,
      err,
    }
  },
}
