module.exports = {
  'zigbee/device/join': (payload) => ({
    type: 'zigbee/device/join',
    payload: payload
  }),
  'zigbee/device/join.success': (payload) => ({
    type: 'zigbee/device/join.success',
    payload: payload
  }),
  'zigbee/device/join.failure': (payload) => ({
    type: 'zigbee/device/join.failure',
    payload: payload
  }),
  'zigbee/device/leave': (payload) => ({
    type: 'zigbee/device/leave',
    payload: payload
  }),
}
