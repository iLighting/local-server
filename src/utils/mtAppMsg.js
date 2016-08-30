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


module.exports = {
  clusters,
  onOfLamp,
};