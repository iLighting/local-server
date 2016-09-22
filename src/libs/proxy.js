const { EventEmitter } = require('events');
const co = require('co');
const _ = require('lodash');
const { proxy: log } = require('../utils/log');
const sysStatus = require('./sys').getIns();
const serial = require('./zigbee/serial');
const FrameTransfer = require('./zigbee/frameTransfer');
const FrameHandler = require('./zigbee/frameHandler');
const MsgTransfer = require('./zigbee/msgTransfer');

const { getModels } = require('../db');
const { frameMap } = require('../utils/mt');

const models = getModels();

/**
 * @fires frame:areqParsed
 * @fires frame:areqProcessed
 * @fires app:feedback
 */
class Proxy extends EventEmitter {
  constructor({serial, frameTransfer, frameHandler, msgTransfer, mode}) {
    super();
    this._serial = serial;
    this._frameTransfer = frameTransfer;
    this._frameHandler = frameHandler;
    this._msgTransfer = msgTransfer;

    this._bindFrameHandlerEvent();
    this._bindMsgTransferEvent();

    this._mode = mode;
  }

  _isModeAllow() {
    return !this._mode || (this._mode === Proxy.mode);
  }

  _bindMsgTransferEvent() {
    this._msgTransfer
      .on('appFeedback', (...args) => {
        this._isModeAllow() && this.emit('app:feedback', ...args)
      })
  }

  _bindFrameHandlerEvent() {
    this._frameHandler
      .on('areq', (...args) => {
        this._isModeAllow() && this.emit('frame:areqParsed', ...args)
      })
      .on('postAreq', (...args) => {
        this._isModeAllow() && this.emit('frame:areqProcessed', ...args)
      })
  }

  /**
   * @public
   * @param {Number} nwk
   * @param {Number} ep
   * @param {Object} props
   * @return {Promise}
   */
  setAppProps(nwk, ep, props) {
    if (this._isModeAllow()) {
      return this._msgTransfer.setAppProps(nwk, ep, props);
    } else {
      return Promise.reject(new Error(`${this._mode}已被禁用`))
    }
  }
}
// 系统模式
// manual staticScene autoScene
Proxy.mode = 'manual';
Proxy.insMap = {};

/**
 * @fires init
 */
const event = new EventEmitter;

const proxyInterface = {

  event,

  /**
   * 初始化
   * @return {Promise}
   */
  init({bridgeEp, appMsgCluster}) {
    Proxy.bridgeEp = bridgeEp;
    Proxy.appMsgCluster = appMsgCluster;
    // 准备实例
    Proxy._serial = serial;
    Proxy._frameTransfer = new FrameTransfer({serial: Proxy._serial});
    Proxy._frameHandler = new FrameHandler({
      transfer: Proxy._frameTransfer,
      frameMap, models
    });
    Proxy._msgTransfer = new MsgTransfer({
      models,
      client: Proxy._frameHandler,
      transfer: Proxy._frameTransfer,
      bridgeEp: Proxy.bridgeEp,
      appMsgCluster: Proxy.appMsgCluster,
    });
    Proxy.mode = sysStatus.getStatus().mode;
    // 监听sys变化
    sysStatus.on('change', status => {
      Proxy.mode = status.mode;
    });
    /**
     * @event init
     */
    event.emit('init');
    return Promise.resolve();
  },

  /**
   * 按模式返回单实例
   * @param {String} [mode]
   * @return {Object}
   */
  getIns(mode) {
    if (_.isUndefined(Proxy.bridgeEp) || _.isUndefined(Proxy.appMsgCluster)) {
      throw new Error('Proxy 未初始化')
    }
    if (!Proxy.insMap.hasOwnProperty(mode)) {
      Proxy.insMap[mode] = new Proxy({
        serial: Proxy._serial,
        frameTransfer: Proxy._frameTransfer,
        frameHandler: Proxy._frameHandler,
        msgTransfer: Proxy._msgTransfer,
        mode
      });
    }
    log.trace(`已生成 ${mode} 实例`);
    return Proxy.insMap[mode];
  },
};

module.exports = proxyInterface;
