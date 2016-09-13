/**
 * app通信层
 *
 * - 处理`AppMsgFeedback`
 * - 封装常用`AppMsg`
 *
 * @module
 */

const { expect } = require('chai');
const co = require('co');
const { EventEmitter } = require('events');
const { getDb, getModels } = require('../db');
const client = require('./client');
const transfer = require('./frameTransfer');
const { msgTransfer: log } = require('../utils/log');
const { parseSrsp, isAreq, AppMsg, AppMsgFeedback } = require('../utils/mt');
const {
  lamp: lampMsg
} = require('../utils/appMsg');

const config = global.__config;

const models = getModels();

/**
 * @fires appFeedback
 */
class MsgTransfer extends EventEmitter {
  constructor({client, transfer, bridgeEp, appMsgCluster}) {
    super();
    this._client = client;
    this._transfer = transfer;
    this._bridgeEp = bridgeEp;
    this._appMsgCluster = appMsgCluster;
    this._client.on('areq', this._handleAreq.bind(this));
  }

  * ['_handleFeedback_lamp'] (frame) {
    const { App } = models;
    const { remoteNwk, remoteEp, remotePayload } = frame;
    const [cmdType, feedback] = lampMsg.parse(remotePayload);
    if (!cmdType) return;
    switch (cmdType) {
      case 'turn': {
        const {on} = feedback;
        const app = yield App.findOne({device: remoteNwk, endPoint: remoteEp}).exec();
        yield app.update({
          payload: Object.assign({}, app.payload, {on})
        }).exec();
        log.info(`远端lamp ${remoteNwk}.${remoteEp} 亮度改变，on:${on}`);
        break;
      }
    }
    /**
     * @event appFeedback
     */
    this.emit('appFeedback', {
      nwk: remoteNwk,
      ep: remoteEp,
      appType: 'lamp',
      cmdType,
      payload: feedback,
    })
  }

  /**
   * @param {FrameAreq} frame
   * @private
   */
  _handleAreq(frame) {
    const self = this;
    if (frame instanceof AppMsgFeedback) {
      co.wrap(function * () {
        const app = yield App.findOne({
          device: frame.remoteNwk,
          endPoint: frame.remoteEp
        }).exec();
        const handleName = `_handleFeedback_${app.type}`;
        if (!(handleName in self)) { throw new Error(`${app.type} handler 未定义`); }
        yield self[handleName](frame);
      })()
        .catch(e => {
          log.error(e);
          throw e
        });
    }
  }

  /**
   * @private
   */
  * ['_setAppProps_lamp'] (nwk, ep, props) {
    log.info(`开始同步远端Lamp ${nwk}.${ep}\n`, props);
    const {payload} = props;
    if (payload) {
      const {on: lampOn } = payload;
      const frame = new AppMsg(
        this._bridgeEp,
        nwk, ep,
        this._appMsgCluster,
        lampMsg.build('turn', lampOn));
      const srsp = yield new Promise((resolve, reject) => {
        this._transfer.once('srsp', (buf, frameObj) => {
          log.trace('收到SRSP', buf, '\n', frameObj);
          resolve(buf);
        });
        this._transfer.write(frame, err => {
          if (err) { reject(err) } else {
            log.trace('指令帧已发送至串口\n', frame)
          }
        });
      });
      const srspObj = parseSrsp(srsp);
      if (!srspObj.success) {
        const err = new Error(`Sync ${nwk}/${ep} failed. SRSP status ${srspObj.status}.`);
        log.error(err);
        throw err;
      }
      log.trace('指令帧下达成功', srsp, '\n', srspObj);
    }
  }

  /**
   * 设置设备app属性
   * @param {Number} nwk
   * @param {Number} ep
   * @param {Object} props
   * @return {Promise}
   * @public
   */
  setAppProps(nwk, ep, props) {
    return co.wrap(function * (self) {
      const { App } = models;
      const app = yield App.findOne({device: nwk, endPoint: ep}).exec();
      const { type: appType } = app;
      // app sync handler
      const handlerName = `_setAppProps_${appType}`;
      if (!(handlerName in self)) {
        const err = new Error(`${appType}远端同步处理器未定义`);
        log.error(err);
        throw err;
      }
      yield self[handlerName](nwk, ep, props);
      const finalApp = yield App.findOneAndUpdate(
        {device: nwk, endPoint: ep},
        props,
        { 'new': true }
      ).exec();
      return finalApp.toObject();
    })(this);
  }
}

module.exports = new MsgTransfer({
  client,
  transfer,
  bridgeEp: config.zigbee.bridgeEp,
  appMsgCluster: config.zigbee.appMsgCluster,
});