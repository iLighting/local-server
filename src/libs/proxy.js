const { EventEmitter } = require('events');
const { proxy: log } = require('../utils/log');
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
  constructor({bridgeEp, appMsgCluster, serial, FrameTransfer, FrameHandler, MsgTransfer}) {
    super();
    this._serial = serial;
    this._frameTransfer = new FrameTransfer({
      serial: this._serial
    });
    this._frameHandler = new FrameHandler({
      transfer: this._frameTransfer,
      frameMap,
      models,
    });
    this._msgTransfer = new MsgTransfer({
      models,
      client: this._frameHandler,
      transfer: this._frameTransfer,
      bridgeEp,
      appMsgCluster,
    });

    this._bindFrameHandlerEvent();
    this._bindMsgTransferEvent();

    // 系统状态
    // manual staticScene autoScene
    // this._state = 'manual';
  }

  _bindMsgTransferEvent() {
    this._msgTransfer
      .on('appFeedback', (...args) => {
        this.emit('app:feedback', ...args)
      })
  }

  _bindFrameHandlerEvent() {
    this._frameHandler
      .on('areq', (...args) => {
        this.emit('frame:areqParsed', ...args)
      })
      .on('postAreq', (...args) => {
        this.emit('frame:areqProcessed', ...args)
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
    return this._msgTransfer(nwk, ep, props);
  }
}

let proxyIns;

module.exports = {
  create({bridgeEp, appMsgCluster}) {
    if (proxyIns) { return proxyIns }
    else {
      proxyIns = new Proxy({
        bridgeEp, appMsgCluster,
        serial, FrameTransfer, FrameHandler, MsgTransfer
      });
      return proxyIns;
    }
  },
  getIns() {
    if (!proxyIns) { throw new Error('Proxy 未初始化') }
    return proxyIns;
  }
};


