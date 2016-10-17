const { EventEmitter } = require('events');
const co = require('co');
const models = require('../db').getModels();
const zm = require('./zigbee');

class StateControllerBase {
  setAppPayload(nwk, ep, payload) { throw new Error('未定义') }
  setScene(sid) { throw new Error('未定义') }
}

/**
 * 手动模式控制器
 */
class ManualController extends StateControllerBase {
  /**
   * 设置远端app负载，收到srsp后resolve
   * @param nwk
   * @param ep
   * @param payload
   * @return {Promise} - app.toObject()
   */
  setAppPayload(nwk, ep, payload) {
    zm.write('APP_MSG', {
      ep: 8,
      destNwk: nwk,
      destEp: ep,
      clusterId: 0xff00,
      msg: payload
    })
      .then(co.wrap(function * () {
        // 同步数据库
        const { App } = models;
        const finalApp = yield App.findOneAndUpdate(
          {device: nwk, endPoint: ep},
          { payload },
          { 'new': true }
        ).exec();
        return finalApp.toObject();
      }))
  }
}

/**
 * 静态场景模式控制器
 */
class StaticController extends StateControllerBase {
  setScene(sid) {

  }
}

/**
 * 控制器（状态对象）
 */
class Controller extends EventEmitter {
  constructor() {
    super();
    this._targetIns = null;
    this._targetInsMap = {
      'manual': new ManualController(),
      'static': new StaticController(),
    };
  }

  /**
   * 切换模式 manual static
   * @public
   * @param {String} mode
   */
  switchMode(mode) {
    if (!this._targetInsMap[mode]) { throw new Error(`${mode}模式不存在`)}
    this._targetIns = this._targetInsMap[mode];
  }

  /**
   * @public
   * @param {Number} nwk
   * @param {Number} ep
   * @param {Object} payload
   * @return {Promise}
   */
  setAppPayload(nwk, ep, payload) {
    this._targetIns.setAppPayload(nwk, ep, payload);
  }

  setScene(sid) {
    this._targetIns.setScene(sid);
  }
}

module.exports = new Controller();