const {
  EventEmitter
} = require('events');
const _ = require('lodash');
const co = require('co');
const models = require('../db').getModels();
const {
  appAsr: log
} = require('../utils/log');
const appFeedback = require('./appFeedback');
const controller = require('./controller');

/**
 * @param {Number} on
 * @return {Promise}
 */
const turnAll = co.wrap(function* (on) {
  const {
    App
  } = models;
  const lampList = yield App.find().or([{
    type: 'lamp'
  }, {
    type: 'gray-lamp'
  }]).exec();
  if (lampList.length > 0) {
    const len = lampList.length;
    for (let i = 0; i < len; i++) {
      const lamp = lampList[i];
      switch (lamp.type) {
        case 'lamp':
          yield controller.setAppPayload(lamp.device, lamp.endPoint, {
            on
          });
          break;
        case 'gray-lamp':
          yield controller.setAppPayload(lamp.device, lamp.endPoint, {
            level: on ? 100 : 0
          });
          break;
      }
    }
  }
});

/**
 * 切换到指定场景
 * @param {String} name
 * @returns {Function}
 */
const switch2Scene = co.wrap(function* (name) {
  const {
    StaticScene
  } = models;
  const target = yield StaticScene.findOne({
    name
  }).exec();
  if (target) {
    log.trace('setting sid to', target.id)
    yield controller.forceSetScene(target.id)
  }
})

const switch2TurnOn = () => switch2Scene('开灯')
const switch2TurnOff = () => switch2Scene('关灯')
const switch2Movie = () => switch2Scene('影院')
const switch2Reading = () => switch2Scene('阅读')
const switch2Relaxing = () => switch2Scene('温馨')
const switch2Night = () => switch2Scene('夜灯')
const switch2TurnOnAll = () => switch2Scene('全亮')

const commander = {
  switch2TurnOn,
  switch2TurnOff,
  switch2Movie,
  switch2Reading,
  switch2Relaxing,
  switch2Night,
  switch2TurnOnAll
}

class AppAsr extends EventEmitter {
  constructor() {
    super();
    appFeedback.on('handle', this._handleAsr.bind(this));
  }

  _handleAsr({
    nwk,
    ep,
    payload
  }) {
    co(function* () {
      const {
        result0
      } = payload;
      switch (result0) {
        case 1:
          // 开灯
          yield commander.switch2TurnOn();
          break;
        case 2:
          // 阅读
          yield commander.switch2Reading()
          break;
        case 3:
          // 影院
          yield commander.switch2Movie()
          break;
        case 4:
          // 温馨
          yield commander.switch2Relaxing()
          break;
        case 5:
          // 全亮
          yield commander.switch2TurnOnAll()
          break;
        case 6:
          // 关灯
          yield commander.switch2TurnOff()
          break;
        case 7:
          // 夜灯
          yield commander.switch2Night()
          break;
      }
    }).catch(err => {
      log.error(err);
    })
  }
}

module.exports = new AppAsr();