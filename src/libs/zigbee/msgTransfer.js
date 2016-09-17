/**
 * app通信层
 *
 * - 处理`AppMsgFeedback`
 * - 封装常用`AppMsg`
 *
 * @module
 */

const co = require('co');
const { EventEmitter } = require('events');
const { msgTransfer: log } = require('../../utils/log');
const { parseSrsp, AppMsg, AppMsgFeedback } = require('../../utils/mt');
const {
  lamp: lampMsg,
  pulse: pulseMsg,
} = require('../../utils/appMsg');


/**
 * @fires appFeedback
 */
class MsgTransfer extends EventEmitter {
  constructor({models, client, transfer, bridgeEp, appMsgCluster}) {
    super();
    this._models = models;
    this._client = client;
    this._transfer = transfer;
    this._bridgeEp = bridgeEp;
    this._appMsgCluster = appMsgCluster;
    this._client.on('areq', this._handleAreq.bind(this));
  }

  * _handleFeedback_lamp (frame) {
    const { App } = this._models;
    const { RemoteNwk, RemoteEp, RemotePayload } = frame.parsed;
    const [cmdType, feedback] = lampMsg.parse(RemotePayload);
    if (!cmdType) return;
    switch (cmdType) {
      case 'turnFeedback': {
        const {on} = feedback;
        const app = yield App.findOne({device: RemoteNwk, endPoint: RemoteEp}).exec();
        yield app.update({
          payload: Object.assign({}, app.payload, {on})
        }).exec();
        log.info(`远端lamp ${RemoteNwk}.${RemoteEp} 亮度改变，on:${on}`);
        break;
      }
    }
    /**
     * @event appFeedback
     */
    this.emit('appFeedback', {
      nwk: RemoteNwk,
      ep: RemoteEp,
      appType: 'lamp',
      cmdType,
      payload: feedback,
    })
  }

  * _handleFeedback_pulse (frame) {
    const { App } = this._models;
    const { RemoteNwk, RemoteEp, RemotePayload } = frame.parsed;
    const [cmdType, feedback] = pulseMsg.parse(RemotePayload);
    if (!cmdType) return;
    switch (cmdType) {
      case 'pulseFeedback': {
        const { transId } = feedback;
        const app = yield App.findOne({device: RemoteNwk, endPoint: RemoteEp}).exec();
        yield app.update({
          payload: Object.assign({}, app.payload, {transId})
        }).exec();
        log.info(`远端pulse ${RemoteNwk}.${RemoteEp} 被触发，transId:${transId}`);
        break;
      }
    }
    /**
     * @event appFeedback
     */
    this.emit('appFeedback', {
      nwk: RemoteNwk,
      ep: RemoteEp,
      appType: 'pulse',
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
      const { App } = this._models;
      const { RemoteNwk, RemoteEp } = frame.parsed;

      co.wrap(function * () {

        const app = yield App.findOne({
          device: RemoteNwk,
          endPoint: RemoteEp
        }).exec();

        const handleName = `_handleFeedback_${app.type}`;
        if (!(handleName in self)) { throw new Error(`${app.type} handler 未定义`); }
        log.trace(`开始处理 ${app.type}@${RemoteNwk}.${RemoteEp}`);

        try {
          yield self[handleName](frame);
        } catch (e) { log.error(e); }

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
  * _setAppProps_lamp (nwk, ep, props) {
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

  * _setAppProps_pulse (nwk, ep, props) {
    // 暂无同步项
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


module.exports = MsgTransfer;