const {
  EventEmitter
} = require('events');
const _ = require('lodash');
const co = require('co');
const models = require('../db').getModels();
const zm = require('./zigbee');
const sys = require('./sys');
const mix = require('../utils/mix');
const appMsg = require('../utils/appMsg');
const {
  controller: log
} = require('../utils/log');

const config = global.__config;

/**
 * 设置远端app负载，同步数据库，收到srsp后resolve
 * @param {Number} nwk
 * @param {Number} ep
 * @param {*} payload
 * @return {Promise} - app.toObject()
 */
function sendAppMsg(nwk, ep, payload) {
  return co.wrap(function* () {
    const {
      App
    } = models;
    // 查找app类型
    const tapp = yield App.findOne({
      device: nwk,
      endPoint: ep
    }).exec();
    if (!tapp) throw new Error(`设备${nwk}.${ep}不存在`);
    // build msg
    if (appMsg[tapp.type]) {
      const msg = appMsg[tapp.type].build(payload);
      if (msg) {
        log.trace(`准备写入appMsg @${nwk}.${ep}`, msg);
        yield zm.write('APP_MSG', {
          ep: config.get('zigbee_bridgeEp'),
          destNwk: nwk,
          destEp: ep,
          clusterId: config.get('zigbee_appMsgCluster'),
          msg: msg
        });
        // 同步数据库
        log.trace(`准备同步数据库 @${nwk}.${ep}\n`, payload);
        const finalApp = yield App.findOneAndUpdate({
          device: nwk,
          endPoint: ep
        }, {
          payload
        }, {
          'new': true
        }).exec();
        log.trace('数据库已同步\n', finalApp.toObject());
        return finalApp.toObject();
      }
    } else {
      log.warn(`未定义appMsg['${tapp.type}']，消息未发送`)
    }
  })();
}

class StateControllerBase {
  setAppPayload(nwk, ep, payload) {
    throw new Error('未定义')
  }
  setScene(sid) {
    throw new Error('未定义')
  }
}

/**
 * 手动模式控制器
 */
class ManualController extends StateControllerBase {
  /**
   * 设置远端app负载，同步数据库，收到srsp后resolve
   * @param nwk
   * @param ep
   * @param payload
   * @return {Promise} - app.toObject()
   */
  setAppPayload(nwk, ep, payload) {
    return sendAppMsg(nwk, ep, payload);
  }

  setScene(sid) {
    log.warn('当前模式下setScene()无效, 默认resolve');
    return Promise.resolve();
  }
}

/**
 * 静态场景模式控制器
 */
class StaticController extends StateControllerBase {
  /**
   * 设置灯具场景
   * @param {String} sid
   * @return {Promise}
   */
  setScene(sid) {
    return co.wrap(function* (self) {
      const {
        Device,
        StaticScene
      } = models;
      const [
        [scene]
      ] = yield mix.wrap2ReturnPromise(StaticScene.joinItems.bind(StaticScene))({
        _id: sid
      });
      for (let i = 0; i < scene.items.length; i++) {
        const {
          ieee,
          ep,
          scenePayload
        } = scene.items[i];
        const dev = yield Device.findOne({
          ieee
        }).exec();
        yield sendAppMsg(dev.nwk, ep, scenePayload);
      }
    })(this);
  }

  setAppPayload() {
    log.warn('当前模式下setAppPayload()无效, 默认resolve');
    return Promise.resolve();
  }
}

/**
 * 控制器（状态对象）
 */
class Controller extends EventEmitter {
  constructor() {
    super();
    this._mode = 'manual';
    this._targetInsMap = {
      'manual': new ManualController(),
      'static': new StaticController(),
    };
    this._targetIns = this._targetInsMap[this._mode];
  }

  /**
   * 切换模式 manual static
   * 不要直接使用
   * @public
   * @param {String} mode
   * @return {Promise}
   */
  switchMode(mode) {
    if (!this._targetInsMap[mode]) {
      throw new Error(`${mode}模式不存在`)
    }
    this._mode = mode;
    this._targetIns = this._targetInsMap[mode];
    // 同步系统状态
    sys.mergeSysIn('status', {
      mode
    });
    return co.wrap(function* () {
      yield sys.flush();
    })();
  }

  getMode() {
    return this._mode;
  }

  /**
   * @public
   * @param {Number} nwk
   * @param {Number} ep
   * @param {Object} payload
   * @return {Promise}
   */
  setAppPayload(nwk, ep, payload) {
    log.info(`setAppPayload ${nwk}.${ep}\n`, payload);
    return this._targetIns.setAppPayload(nwk, ep, payload);
  }

  /**
   * @param {Number} sid
   * @return {Promise}
   */
  setScene(sid) {
    log.info(`setScene ${sid}`);
    return this._targetIns.setScene(sid).then(() => sys.mergeSysIn('status', {
      sceneId: sid
    }))
  }
}

module.exports = new Controller();