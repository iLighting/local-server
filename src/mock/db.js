const { mock } = require('mockjs');

function genIeee () {
  let re = [];
  for(let i=0; i<8; i++) {
    re[i] = Number(Math.floor(Math.random()*255)).toString(16).toUpperCase();
  }
  return re.join('-');
}

const genApps = function () {
  return [8,9].map(ep => mock({
    'endPoint': ep,
    'type|1': ['pulse'],
    'name': '@email',
    'payload': function () {
      if (this.type == 'lamp') {
        return {on: false}
      } else if (this.type == 'pulse') {
        return {transId: Math.floor(Math.random()*10000)}
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
      'ieee': genIeee,
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