/**
 * 构建app msg指令。用于此项目zigbee设备之间传输自定义指令。
 * @module
 */


const { AppMsg } = require('./mt');

const msgEp = 8;

const clusters = {
  // lamp
  // --------------------
  ON_OF_LAMP: 10000,
  GRAY_LAMP: 10001,

  // switch
  // --------------------
  ON_OF_SWITCH: 10002,
  GRAY_SWITCH: 10003,
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
    return AppMsg(msgEp, nwk, ep, this.clusterId, msg);
  }
};


module.exports = {
  clusters,
  onOfLamp,
};