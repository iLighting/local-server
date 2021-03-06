/**
 * 由传感器结果集选择场景
 */

const moment = require('moment');

const {
  EventEmitter
} = require('events');
const _ = require('lodash');
const co = require('co');
const models = require('../db').getModels();
const {
  sceneChooser: log
} = require('../utils/log');
const appFeedback = require('./appFeedback');
const controller = require('./controller');

const config = global.__config;

/**
 * @return {Promise} - resolve: array of sensors' object
 */
const getAllSensorResults = co.wrap(function* () {
  const {
    App
  } = models;
  const sensors = yield App
    .find()
    .or([{
      type: 'illuminance-sensor'
    }, {
      type: 'temperature-sensor'
    }])
    .exec();
  return _.map(sensors, s => s.toObject());
})

/**
 * @return {Promise} - resolve: array of sensors' normalized object
 */
const getNormalizedSensorResults = co.wrap(function* () {
  const rResults = yield getAllSensorResults();
  const nResults = [];
  for (let i = 0; i < rResults.lenght; i++) {
    const {
      type,
      payload
    } = rResults[i];
    const range = config.get(`app_${type}/range`);
    if (range) {
      const [min, max] = range;
      const firstProperty = Object.keys(payload)[0];
      const value = new Number(payload[firstProperty]);
      const nValue = (value - min) / (max - min);
      nResults.push({
        type,
        payload: Object.assign({}, payload, {
          [firstProperty]: nValue
        })
      });
    } else {
      log.warn(`未找到配置项：app_${type}/range`)
    }
  }
  return nResults;
})

/**
 * 根据传感器数据集和时间，选择sid
 * @return {Promise} - sid or false
 */
const selectSceneId = co.wrap(function* () {
  const {
    JudgeRuleGroup,
    App,
    Device
  } = models;
  const allGroups = yield JudgeRuleGroup.find().exec();
  for (let i = 0; i < allGroups.length; i++) {
    const {
      scene,
      timeRange,
      rules
    } = allGroups[i];
    // 过滤时间约束
    timeRange_0 = moment(timeRange[0], 'HH:mm');
    timeRange_1 = moment(timeRange[1], 'HH:mm');
    timeNow = moment();
    if (timeRange_0.unix() >= timeNow || timeNow >= timeRange_1) continue;
    let j = 0;
    for (j = 0; j < rules.length; j++) {
      log.trace('取出rule\n', rules[i]);
      const {
        ieee,
        ep,
        type,
        payload
      } = rules[j];
      const device = yield Device.findOne({
        ieee
      }).exec();
      log.trace('找到device\n', device);
      if (device) {
        const app = yield App.findOne({
          device: device.nwk,
          endPoint: ep
        }).exec();
        if (app) {
          log.trace('检测APP\n', app);
          // skip asr-sensor
          if (app.type === 'asr-sensor') {
            continue
          }
          let ruleMatch = false;
          const appPayloadValue = app.payload[Object.keys(app.payload)[0]];
          switch (type) {
            case 'equal':
              ruleMatch = payload === appPayloadValue;
              break;
            case 'nequal':
              ruleMatch = payload !== appPayloadValue;
              break;
            case 'range':
              ruleMatch = (payload[0] <= appPayloadValue) && (appPayloadValue <= payload[1]);
              break;
            case 'nrange':
              ruleMatch = (payload[0] >= appPayloadValue) || (appPayloadValue >= payload[1]);
              break;
            case 'gt':
              ruleMatch = payload <= appPayloadValue;
              break;
            case 'lt':
              ruleMatch = payload >= appPayloadValue;
              break;
            case 'ignore':
            default:
              ruleMatch = true;
          }
          log.trace('匹配结果', ruleMatch);
          // 如果有未匹配的规则，则跳出rule for循环
          if (!ruleMatch) break;
        } else {
          throw new Error(`未找到硬件地址为 ${ieee} 的设备`)
        }
      } else {
        throw new Error(`未找到硬件地址为 ${ieee} 的设备`)
      }
    }
    // rules全部遍历完，则此scene有效
    if (j >= rules.length) return scene;
  }
  return false;
})

/**
 * @fires change - sid
 */
class Chooser extends EventEmitter {
  /**
   * 选择场景
   * 
   * @return {Promise} sid
   * @memberOf Chooser
   */
  choose(app) {
    const self = this;
    return co.wrap(function* () {
        log.trace('开始选择场景');
        // skip asr-sensor
        if (app.type === 'asr-sensor') {
          return
        }
        const sid = yield selectSceneId();
        if (sid) {
          yield controller.setScene(sid);
          log.info(`set sid=${sid}`);
          self.emit('change', sid);
        }
      })()
      .catch(err => log.error(err));
  }
}

const chooser = new Chooser();
// 传感器触发
appFeedback.on('handle', app => {
  if (app) {
    chooser.choose(app)
  } else log.fatal('app is undefined. I don\'t know why')
});
// 时间间隔触发 1min
setInterval(() => chooser.choose(), 1000 * 60);

module.exports = new Chooser();