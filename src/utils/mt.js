/**
 * @module
 */

const { expect } = require('chai');
const _ = require('lodash');

const SOF = 0xfe;
const frameMap = new (class extends Map {
  getByCmd(cmd0, cmd1) {
    return this.get([cmd0, cmd1].toString());
  }
  genAreqInsByBuf(buf) {
    const parsed = _parseFrame(buf);
    if (!parsed) { throw new Error('原始指令帧解析失败')}
    const { cmd0, cmd1 } = parsed;
    const Frame = this.getByCmd(cmd0, cmd1);
    if (Frame.type != 'AREQ') { throw new Error(`${cmd0}-${cmd1}对应非AREQ类型`)}
    return new Frame(buf);
  }
});


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
 *
 * @description  返回：[指令帧buffer、剩余部分buffer、剩余长度足够]
 *
 * @param {Buffer} targetBuf
 * @return {Array}
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
 *
 * @description  返回：[指令帧buffer、剩余部分buffer、剩余长度足够]
 *
 * @param {Buffer} buf
 * @return {Array}
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
 * 注册AREQ类
 * @param {Frame} cls
 */
function registerFrame(cls) {
  const { cmd0, cmd1 } = cls;
  if (_.isUndefined(cmd0) || _.isUndefined(cmd1)) {
    throw new Error(`${cls.name}命令字未定义`)
  }
  const key = [cmd0, cmd1].toString();
  frameMap.set(key, cls);
  return cls;
}

/**
 * @typedef {FrameBase} Frame
 */
class FrameBase {
  get cmd0() { return this.constructor.cmd0; }
  get cmd1() { return this.constructor.cmd1; }
  get name() { return this.constructor.name; }
}

/**
 * @typedef {FrameSreq} FrameSreq
 */
class FrameSreq extends FrameBase {
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
  get srspCmd0() { return this.constructor.srspCmd0; }
  get srspCmd1() { return this.constructor.srspCmd1; }
}
Object.defineProperties(FrameSreq, {
  type: { value: 'SREQ', writable: false, configurable: false, enumerable: true }
});

/**
 * @typedef {FrameAreq} FrameAreq
 */
class FrameAreq extends FrameBase {
  constructor(origin) {
    super();
    /**
     * @member origin
     */
    this.origin = origin;
  }
  /**
   * 预处理原始指令帧
   * @private
   * @param {Buffer} buf
   * @return {Object}
   * @throws {Error} - 解析失败
   * @throws {Error} - 命令字不匹配
   * @see _parseFrame
   */
  preParse(buf) {
    const parsed = _parseFrame(buf);
    if (!parsed) {
      throw new Error(`${this.name}解析失败`);
    }
    const { cmd0, cmd1 } = this;
    if (parsed.cmd0 != cmd0 || parsed.cmd1 != cmd1) {
      throw new Error(`${this.name}命令字不匹配`);
    }
    return parsed;
  }
  /**
   * @private
   * @param {Object} desc
   */
  genParsedValue(desc) {
    let re = {};
    let nd = {};
    Object.keys(desc).forEach(name => {
      nd[name] = {value: desc[name], writable: false, enumerable: true, configurable: false};
    });
    Object.defineProperties(re, nd);
    return re;
  }
}
Object.defineProperties(FrameAreq, {
  type: { value: 'AREQ', writable: false, configurable: false, enumerable: true }
});

/**
 * @typedef {SysPing} SysPing
 */
class SysPing extends FrameSreq {
  dump() { return super.dump(); }
}
SysPing.cmd0 = 0x21;
SysPing.cmd1 = 0x01;
SysPing.srspCmd0 = 0x61;
SysPing.srspCmd1 = 0x01;
registerFrame(SysPing);

// ZDO
// -------------------------------------------------------------

/**
 * @typedef {ZdoSecDeviceRemove} ZdoSecDeviceRemove
 */
class ZdoSecDeviceRemove extends FrameSreq {
  /**
   * @param {Number} ieee
   */
  constructor(ieee) {
    super(ieee);
    this.ieee = ieee;
  }
  dump() { return super.dump(Buffer.from([this.ieee])); }
}

/**
 * @typedef {ZdoEndDeviceAnnceInd} ZdoEndDeviceAnnceInd
 */
class ZdoEndDeviceAnnceInd extends FrameAreq {
  constructor(origin) {
    super(origin);
    const { data } = this.preParse(origin);
    const srcAddr = data.readUInt16BE(0);
    const nwkAddr = data.readUInt16BE(2);
    const ieeeAddr = buf2Ieee(data.slice(4, 4+8));
    const capabilities = data.readUInt8(12);
    const type = !!(capabilities & 0x02) ? 'router' : 'endDevice';
    /**
     * @member parsed
     */
    this.parsed = this.genParsedValue({
      'SrcAddr': srcAddr,
      'NwkAddr': nwkAddr,
      'IEEEAddr': ieeeAddr,
      'Capabilities': capabilities,
      'DeviceType': type,
    });
  }
}
Object.defineProperties(ZdoEndDeviceAnnceInd, {
  cmd0: { value: 0x45, writable: false, configurable: false, enumerable: true },
  cmd1: { value: 0xc1, writable: false, configurable: false, enumerable: true },
});
registerFrame(ZdoEndDeviceAnnceInd);

// APP
// -------------------------------------------------------------

/**
 * @typedef {MsgTransfer} MsgTransfer
 */
class AppMsg extends FrameSreq {
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
Object.defineProperties(AppMsg, {
  cmd0: { value: 0x29, writable: false, configurable: false, enumerable: true },
  cmd1: { value: 0x00, writable: false, configurable: false, enumerable: true },
  srspCmd0: { value: 0x69, writable: false, configurable: false, enumerable: true },
  srspCmd1: { value: 0x00, writable: false, configurable: false, enumerable: true },
});
registerFrame(AppMsg);

/**
 * @typedef {AppMsgFeedback} AppMsgFeedback
 */
class AppMsgFeedback extends FrameAreq {
  constructor(buf) {
    super(buf);
    const { data } = this.preParse(buf);
    const remoteNwk = data.readUInt16BE(0);
    const remoteEp = data.readUInt8(2);
    const clusterId = data.readUInt16BE(3);
    const msgLen = data.readUInt8(5);
    const payload = new Buffer(msgLen);
    data.copy(payload, 0, 6);
    // inject
    this.parsed = this.genParsedValue({
      'RemoteNwk': remoteNwk,
      'RemoteEp': remoteEp,
      'ClusterId': clusterId,
      'RemotePayload': payload
    });
  }
}
Object.defineProperties(AppMsgFeedback, {
  cmd0: { value: 0x49, writable: false, configurable: false, enumerable: true },
  cmd1: { value: 0x00, writable: false, configurable: false, enumerable: true },
});
registerFrame(AppMsgFeedback);

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
    return ((cmd0 & 0xf0) == 0x40);
  } else if (isFrameIns(frame)) {
    return ((frame.cmd0 & 0xf0) == 0x40);
  } else {
    return false;
  }
}

/**
 * 转换buf为ieee标准字符串
 * @param {Buffer} buf
 * @return {string}
 */
function buf2Ieee(buf) {
  expect(buf).to.be.an.instanceOf(Buffer);
  const re = [];
  for (let v of buf) {
    re.push(Number(v).toString(16).toUpperCase());
  }
  return re.join('-');
}

module.exports = {
  SOF,
  frameMap,
  genFCS: _genFcs,
  genFrame: _genFrame,
  parseFrame: _parseFrame,
  parseSrsp,
  isFrameIns,
  isAreq,
  shiftFrameFromBuf,
  buf2Ieee,
  // frame base
  FrameBase,
  FrameSreq,
  FrameAreq,
  // sys
  SysPing,
  // zdo
  ZdoSecDeviceRemove,
  ZdoEndDeviceAnnceInd,
  // app
  AppMsg,
  AppMsgFeedback,
};