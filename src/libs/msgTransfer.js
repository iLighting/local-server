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
const { parseSrsp, isAreq, AppMsgFeedback } = require('../utils/mt');
const {
  MsgSend,
  OnOffLampTurn,
} = require('../utils/mtAppMsg');

const models = getModels();

/**
 * @fires feedback
 */
class MsgTransfer extends EventEmitter {
  constructor(client, transfer) {
    super();
    this._client = client;
    this._transfer = transfer;
    this._client.on('areq', this._handleAreq.bind(this));
  }

  /**
   * @param {FrameAreq} frame
   * @private
   */
  _handleAreq(frame) {
    if (frame instanceof AppMsgFeedback) {
      /**
       * @event feedback
       * @type {FrameAreq}
       */
      this.emit('feedback', frame);
    }
  }

  /**
   * 发送msg指令帧，写入串口后resolve
   * @param {MsgSend} msgFrame
   * @return {Promise}
   * @public
   * @see module:utils/mtAppMsg
   */
  send(msgFrame) {
    return new Promise((resolve, reject) => {
      this._transfer.write(msgFrame, null, err => {
        if (err) { reject(err) } else { resolve() }
      });
    });
  }

  /**
   * @private
   */
  * ['_setAppProps_lamp'] (nwk, ep, props) {
    log.info(`开始同步远端Lamp ${nwk}.${ep}\n`, props);
    const {payload} = props;
    if (payload) {
      const {on: lampOn } = payload;
      const frame = (new OnOffLampTurn(nwk, ep, lampOn)).dump();
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

module.exports = new MsgTransfer(client, transfer);