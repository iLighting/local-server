/**
 * 构建app msg指令。用于上位机、协调器、终端设备之间传输自定义指令。
 *
 * ## MSG结构
 *
 * 在`DATA`区段：
 *
 * 1. 自定义clusterId: 2 bytes
 * 1. 自定义payload: n bytes
 *
 * ## ON_OF_LAMP
 *
 * clusterId (2B) | on off flag (1B)
 * ---------------|----------------
 * 0xff00         | 0 or 1
 *
 * @module
 */


const { AppMsg } = require('./mt');

const msgEp = 8;

const clusters = {
  // lamp
  // --------------------
  ON_OF_LAMP: 0xff00,
  GRAY_LAMP: 0xff01,

  // switch
  // --------------------
  ON_OF_SWITCH: 0xff02,
  GRAY_SWITCH: 0xff03,
};

/**
 * 为Class定义静态属性
 * @param {Function} cls
 * @param {object} desc
 */
function setClass(cls, desc) {
  let nd = {};
  Object.keys(desc).forEach(name => {
    nd[name] = {value: desc[name], writable: false, enumerable: true, configurable: false};
  });
  Object.defineProperties(cls, nd);
}

/**
 * ON_OFF_LAMP 工具类
 */
const onOfLamp = {
  clusterId: clusters.ON_OF_LAMP,
  /**
   * 开关灯
   * @param {Number} nwk
   * @param {Number} ep
   * @param {Boolean} x - on or off
   * @return {Frame}
   */
  turn(nwk, ep, x) {
    const turnCmdId = 0;
    const msg = Buffer.from([turnCmdId, +x]);
    return new AppMsg(msgEp, nwk, ep, this.clusterId, msg);
  }
};

/**
 * @typedef {MsgBase} MsgBase
 */
class MsgBase {}

/**
 * @typedef {MsgSend} MsgSend
 */
class MsgSend extends MsgBase {}
setClass(MsgSend, {
  msgEp: msgEp
});

/**
 * @typedef {MsgFeedback} MsgFeedback
 */
class MsgFeedback extends MsgBase {}


// on off lamp
// -----------------------------------------------------

/**
 * @typedef {OnOffLampSendBase} OnOffLampSendBase
 */
class OnOffLampSendBase extends MsgSend {}
setClass(OnOffLampSendBase, {
  clusterId: clusters.ON_OF_LAMP
});

/**
 * @typedef {OnOffLampTurn} OnOffLampTurn
 */
class OnOffLampTurn extends OnOffLampSendBase {
  /**
   * @param {Number} nwk
   * @param {Number} ep
   * @param {Boolean} x
   */
  constructor(nwk, ep, x) {
    super();
    this._nwk = nwk;
    this._ep = ep;
    this._x = x;
  }
  dump() {
    const msg = Buffer.from([
      OnOffLampTurn.appCmdId, +this._x
    ]);
    return new AppMsg(
      OnOffLampTurn.msgEp,
      this._nwk,
      this._ep,
      OnOffLampTurn.clusterId,
      msg
    );
  }
}
setClass(OnOffLampTurn, {
  appCmdId: 1
});


module.exports = {
  clusters,
  onOfLamp,
  // base
  MsgBase,
  MsgSend,
  MsgFeedback,
  // lamp
  OnOffLampSendBase,
  OnOffLampTurn,
};