/**
 * @module
 */

const { expect } = require('chai');

const SOF = 0xfe;

/**
 * 计算fcs
 * @private
 * @param {Buffer} buf
 * @return {Number}
 */
const _genFcs = function (buf) {
  expect(buf).to.be.an.instanceOf(Buffer);
  let r;
  for (let b of buf) {
    if (typeof r == 'undefined') {
      r = b;
    } else {
      r ^= b;
    }
  }
  return r;
};

/**
 * 构建MT指令帧
 * @private
 * @param {Number} cmd0 - cmd0
 * @param {Number} cmd1 - cmd1
 * @param {Buffer} [data] - data
 * @return {Buffer} - frame
 */
const _genFrame = function (cmd0, cmd1, data) {
  expect(cmd0).to.be.a('number');
  expect(cmd1).to.be.a('number');
  const dl = data ? data.length : 0;
  // SOF + LEN + CMD + DATA + FCS
  const frame = new Buffer(1 + 1 + 2 + dl + 1);
  frame.writeUInt8(SOF, 0);
  frame.writeUInt8(dl, 1);
  frame.writeUInt8(cmd0, 2);
  frame.writeUInt8(cmd1, 3);
  data && data.copy(frame, 4);
  frame.writeUInt8(_genFcs(frame.slice(1,4+dl)), 4+dl);
  return frame;
};

/**
 * 解析MT指令帧
 * @private
 * @param {Buffer} frame
 * @return {Object|Boolean}
 */
const _parseFrame = function (frame) {
  expect(frame).to.be.an.instanceOf(Buffer);
  const dl = frame.readUInt8(1);
  const cmd0 = frame.readUInt8(2);
  const cmd1 = frame.readUInt8(3);
  const data = new Buffer(dl);
  frame.copy(data, 0, 4, 4+dl);
  const fcs = frame.readUInt8(4+dl);
  if (_genFcs(frame.slice(1, frame.length-1)) == fcs) {
    return { cmd0, cmd1, data };
  } else {
    return false;
  }
};

const actions = new Map();

// SYS
// -------------------------------------------
actions.set('SYS_PING',
  /**
   * gen SYS_PING frame
   * @return {Buffer}
   */
  function () { return _genFrame(0x21, 0x01); }
);

// ZDO
// -------------------------------------------
actions.set('ZDO_SEC_DEVICE_REMOVE',
  /**
   * gen ZDO_SEC_DEVICE_REMOVE frame
   * @param {String} ieee
   * @return {Buffer}
   */
  function (ieee) {
    expect(ieee).to.be.a('string');
    return _genFrame(0x25, 0x44, new Buffer(ieee))
});

// APP
// -------------------------------------------
actions.set('APP_MSG',
  /**
   * @param {Number} ep
   * @param {Number} destNwk
   * @param {Number} destEp
   * @param {Number} clusterId
   * @param {Buffer} msg
   * @return {Buffer}
   */
  function (ep, destNwk, destEp, clusterId, msg) {
    const msgLen = msg.length;
    const data = new Buffer(7 + msgLen);
    data.writeUInt8(ep, 0);
    data.writeUInt16BE(destNwk, 1);
    data.writeUInt8(destEp, 3);
    data.writeUInt16BE(clusterId, 4);
    data.writeUInt8(msgLen, 6);
    msg.copy(data, 7);
    return _genFrame(0x29, 0x00, data);
  }
);

/**
 * 指定名字，构建MT指令帧
 * @param {String} name
 * @param {*} args
 * @return {Buffer}
 */
function genFrameByName(name, ...args) {
  expect(name).to.be.a('string');
  return actions.get(name)(...args);
}

/**
 * 解析MT srsp指令
 * @param {Buffer} srsp
 * @return {{cmd0, cmd1, data, success, status}|Boolean}
 */
function parseSrsp (srsp) {
  expect(srsp).to.be.an.instanceOf(Buffer);
  const result = _parseFrame(srsp);
  if (!result) { return false; }
  const { cmd0, cmd1, data } = result;
  const status = data.readUInt8(0);
  const re = { cmd0, cmd1, data };
  switch (status) {
    case 0:
      return Object.assign({}, re, {success: true, status: 'SUCCESS'});
    case 1:
      return Object.assign({}, re, {success: false, status: 'FAILURE'});
    default:
      return Object.assign({}, re, {success: false, status: '未定义'});
  }
}

/**
 * 从队首弹出一个指令帧。首字节必须是SOF。
 * @param {Buffer} targetBuf
 * @return {[Buffer, Buffer, boolean]} 指令帧buffer、剩余部分buffer、剩余长度足够？
 * @throws {Error} - 首字节必须是SOF
 * @private
 */
function _shiftFrameFromBuf(targetBuf) {
  if (targetBuf.readUInt8(0) != SOF) {
    throw new Error('首字节必须是SOF');
  }
  if (targetBuf.length < 5) {
    // 长度不足，则返回
    return [new Buffer(0), targetBuf, false];
  }
  let dataLen = targetBuf.readUInt8(1);
  const frameBuf = targetBuf.slice(0, 4+dataLen+1);
  const restBuf = targetBuf.slice(4+dataLen+1);
  // FCS校验
  const frameFcs = frameBuf.readUInt8(frameBuf.length - 1);
  const frameFcsCalc = _genFcs(frameBuf.slice(1, frameBuf.length-1));
  if (frameFcs != frameFcsCalc) {
    // 校验失败，则舍弃校验失败的区段
    return [new Buffer(0), restBuf, restBuf.length >= 5];
  }
  return [frameBuf, restBuf, restBuf.length >=5 ];
}

/**
 * 从队首弹出一个指令帧。SOF之前的字节会被忽略。
 * @param {Buffer} buf
 * @return {[Buffer, Buffer, boolean]} 指令帧buffer、剩余部分buffer、剩余长度足够？
 */
function shiftFrameFromBuf(buf) {
  const sofIndex = buf.indexOf(SOF);
  if (sofIndex < 0) {
    return [new Buffer(0), buf];
  }
  // 舍弃SOF之前的字节
  const targetBuf = buf.slice(sofIndex);
  let frameBuf = new Buffer(0), restBuf = targetBuf, restEnough = true;
  while (restEnough) {
    [frameBuf, restBuf, restEnough] = _shiftFrameFromBuf(restBuf);
    if (frameBuf.length > 0) { break }
  }
  return [frameBuf, restBuf, restEnough];
}

/**
 * @typedef {FrameBase} Frame
 */
class FrameBase {
  /**
   * 获取指令帧buffer
   * @param {Buffer} [data]
   * @return {Buffer}
   */
  dump(data) {
    const { cmd0, cmd1 } = this.constructor;
    return _genFrame(cmd0, cmd1, data);
  }
  /**
   * 检查是否为对应srsp
   * @param {Buffer} frame
   * @return {Object|false}
   * @see parseSrsp
   */
  isSRSP(frame) {
    const result = parseSrsp(frame);
    if (!result) return false;
    const { cmd0, cmd1 } = result;
    const { srspCmd0, srspCmd1 } = this;
    if (cmd0 == srspCmd0 && cmd1 == srspCmd1) {
      return result;
    }
  }
  static parseSRSP(frame) { throw new Error('未实现') }
  get cmd0() { return this.constructor.cmd0; }
  get cmd1() { return this.constructor.cmd1; }
  get srspCmd0() { return this.constructor.srspCmd0; }
  get srspCmd1() { return this.constructor.srspCmd1; }
  get name() { return this.constructor.name; }
}


class SysPing extends FrameBase {
  dump() { return super.dump(); }
}
SysPing.cmd0 = 0x21;
SysPing.cmd1 = 0x01;
SysPing.srspCmd0 = 0x61;
SysPing.srspCmd1 = 0x01;


class ZdoSecDeviceRemove extends FrameBase {
  /**
   * @param {Number} ieee
   */
  constructor(ieee) {
    super(ieee);
    this.ieee = ieee;
  }
  dump() { return super.dump(Buffer.from([this.ieee])); }
}

class AppMsg extends FrameBase {
  /**
   * @param {Number} ep
   * @param {Number} destNwk
   * @param {Number} destEp
   * @param {Number} clusterId
   * @param {Buffer} msg
   */
  constructor(ep, destNwk, destEp, clusterId, msg) {
    super();
    Object.assign(this, {
      ep, destNwk, destEp, clusterId, msg
    });
  }
  dump() {
    const { ep, destNwk, destEp, clusterId, msg } = this;
    const msgLen = msg.length;
    const data = new Buffer(7 + msgLen);
    data.writeUInt8(ep, 0);
    data.writeUInt16BE(destNwk, 1);
    data.writeUInt8(destEp, 3);
    data.writeUInt16BE(clusterId, 4);
    data.writeUInt8(msgLen, 6);
    msg.copy(data, 7);
    return _genFrame(0x29, 0x00, data);
  }
}
Object.assign(AppMsg, {
  cmd0: 0x29,
  cmd1: 0x00,
  srspCmd0: 0x69,
  srspCmd1: 0x00
});

/**
 * @param {*} x
 * @return {boolean}
 */
function isFrameIns (x) {
  return x instanceof FrameBase;
}

/**
 * @param {Buffer|Frame} frame
 * @return {Boolean}
 */
function isAreq(frame) {
  if (frame instanceof Buffer) {
    const { cmd0 } = _parseFrame(frame);
    return !!(cmd0 & 0xf0 == 0x40);
  } else if (isFrameIns(frame)) {
    return !!(frame.cmd0 & 0xf0 == 0x40);
  } else {
    return false;
  }
}

module.exports = {
  SOF,
  genFCS: _genFcs,
  genFrame: _genFrame,
  parseFrame: _parseFrame,
  parseSrsp,
  isFrameIns,
  isAreq,
  shiftFrameFromBuf,
  SysPing,
  ZdoSecDeviceRemove,
  AppMsg,
};