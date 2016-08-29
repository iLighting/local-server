const { mock } = require('mockjs');

const genApps = function () {
  return [8,9].map(ep => mock({
    'endPoint': ep,
    'type|1': ['lamp', 'light-sensor'],
    'name': '@email',
    'payload': function () {
      if (this.type == 'lamp') {
        return mock({ 'level|1-100': 2 })
      } else if (this.type == 'light-sensor') {
        return {}
      } else {
        return {}
      }
    }
  }))
};

const genDevices = function () {
  return [1,2,3,4,5,6,7,8].map(nwk => {
    return mock({
      'nwk': nwk,
      'ieee': '@guid',
      'type|1': ['router', 'endDevice'],
      'name': '@email',
      'apps': genApps
    });
  })
};

const gen = function () {
  return genDevices();
};

module.exports = gen;