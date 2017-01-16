const { EventEmitter } = require('events');
const _ = require('lodash');
const co = require('co');
const models = require('../db').getModels();
const { appAsr: log } = require('../utils/log');
const appFeedback = require('./appFeedback');
const controller = require('./controller');

/**
 * @param {Number} on
 * @return {Promise}
 */
const turnAll = co.wrap(function * (on) {
  const { App } = models;
  const lampList = yield App.find().or([{type: 'lamp'}, {type: 'gray-lamp'}]).exec();
  if (lampList.length > 0) {
    const len = lampList.length;
    for(let i=0; i<len; i++) {
      const lamp = lampList[i];
      switch (lamp.type) {
        case 'lamp':
          yield controller.setAppPayload(lamp.device, lamp.endPoint, {on});
          break;
        case 'gray-lamp':
          yield controller.setAppPayload(lamp.device, lamp.endPoint, {level: on ? 100 : 0});
          break;
      }
    }
  }
});

const turnOnAll = turnAll.bind(null, 1);
const turnOffAll = turnAll.bind(null, 0);

const commander = {
  TurnOnAll: turnOnAll,
  TurnOffAll: turnOffAll
}

class AppAsr extends EventEmitter {
  constructor() {
    super();
    appFeedback.on('handle', this._handleAsr.bind(this));
  }
  
  _handleAsr({nwk, ep, payload}) {
    co(function * () {
      const { result0 } = payload;
      switch (result0) {
        case 1:
          yield commander.TurnOnAll();
          break;
        case 2:
          yield commander.TurnOffAll();
          break;
      }
    }).catch(err => {
      log.error(err);
    })
  }
}

module.exports = new AppAsr();