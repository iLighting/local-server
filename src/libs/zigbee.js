const co = require('co');
const { expect } = require('chai');
const { getDb, getModels } = require('../db');

const db = getDb();
const models = getModels();

/**
 * 加入一个设备到数据库
 * @param  {Object} devReq 设备描述：
 * {
 *   nwk: <Number>
 *   ieee: <String>
 *   type: <String>
 *   apps: [{
 *     endPoint: <Number>
 *     type: <String>
 *     payload: <Any>
 *   }]
 * }
 * @return {Object}        model实例:
 * {
 *   device: <Model>
 *   apps: <Array of Models>
 * }
 */
const deviceJoin = function (devReq) {
  return new Promise((resolve, reject) => {
    expect(devReq).to.have.property('nwk').that.is.a('number');
    expect(devReq).to.have.property('ieee').that.is.a('string');
    expect(devReq).to.have.property('type').that.is.a('string');
    expect(devReq).to.have.property('apps').that.is.a('array');
    const { Device, App } = models;
    const { nwk, ieee, type, apps } = devReq;
    Device.create({nwk, ieee, type}, (err, dev) => {
      if (err) { reject(err); }
      if (apps.length > 0) {
        let appsReq = apps.map(item => Object.assign({}, item, {device: dev.nwk}));
        App.create(appsReq, (err, appInsList) => {
          if (err) { reject(err) }
          resolve({device: dev, apps: appInsList});
        })
      } else {
        resolve({device: dev, apps: []});
      }
    });
  });
}

module.exports = {
  deviceJoin,
};
