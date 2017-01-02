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
 * @return {Object}
 * @throws fcs校验失败
 */
const _parseFrame = function (frame) {
  const dl = frame.readUInt8(1);
  const cmd0 = frame.readUInt8(2);
  const cmd1 = frame.readUInt8(3);
  const data = new Buffer(dl);
  frame.copy(data, 0, 4, 4+dl);
  const fcs = frame.readUInt8(4+dl);
  if (_genFcs(frame.slice(1, frame.length-1)) == fcs) {
    return { cmd0, cmd1, data };
  }
  throw new Error(`${frame} fcs 校验失败`);
};

const actions = new Map();

/**
 * 解析MT srsp指令
 * @param {Buffer} srsp
 * @return {{cmd0, cmd1, data, status}}
 */
function parseSrsp (srsp) {
  expect(srsp).to.be.an.instanceOf(Buffer);
  const result = _parseFrame(srsp);
  const { cmd0, cmd1, data } = result;
  const status = data.readUInt8(0);
  const re = { cmd0, cmd1, data, status: '' };
  switch (status) {
    case 0:
      re.status = 'SUCCESS'; break;
    case 1:
      re.status = 'FAILURE'; break;
  }
  return re;
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

// ----------------------------------------------------------

/**
 * 为cmdMap生成cmd标志
 * @param {Number} cmd0
 * @param {Number} cmd1
 * @return {String}
 */
function cmd2str(cmd0, cmd1) {
  return `${parseInt(cmd0, 10)}.${parseInt(cmd1, 10)}`
}

/**
 * @param name
 * @param {Array} cmd
 * @param {Map} cmdMap
 */
function injectDefaultSRSP(name, cmd, cmdMap, parser) {
  cmdMap.set(name, cmd2str(cmd[0], cmd[1]));
  parser[name] = function(buf) {
    return parseSrsp(buf);
  }
}

// cmdMap
// ==============================================================
const cmdMap = new Map([
  // sys
  ['SYS_PING', `${parseInt(0x21, 10)}.1`], // 0x21 0x01
  ['SYS_RESET_IND', cmd2str(0x41, 0x80)],  
  // zdo
  ['ZDO_SEC_DEVICE_REMOVE', '0.0'],
  ['ZDO_END_DEVICE_ANNCE_IND', '69.193'], // 0x45 0xc1
  ['ZDO_SIMPLE_DESC_REQ', cmd2str(0x25, 0x04)],
  ['ZDO_ACTIVE_EP_REQ', cmd2str(0x25, 0x05)],
  ['ZDO_SIMPLE_DESC_RSP', cmd2str(0x45, 0x84)],
  ['ZDO_ACTIVE_EP_RSP', cmd2str(0x45, 0x85)],
  ['ZDO_STATE_CHANGE_IND', cmd2str(0x45, 0xc0)],
  // app
  ['APP_MSG', `${parseInt(0x29, 10)}.0`], // 0x29 0x00
  ['APP_MSG_SRSP', `${parseInt(0x69, 10)}.0`], // 0x69 0x00
  ['APP_MSG_FEEDBACK', `${parseInt(0x49, 10)}.0`], // 0x49 0x00
  // Debug
  ['DEBUG_STRING', cmd2str(0x48, 0x80)],
]);

/**
 * @function
 * @param {String} name
 * @return {[Number, Number]}
 */
cmdMap.getCmdByName = function (name) {
  const result = cmdMap.get(name);
  if (!result) throw new Error(`${name} mt cmd 未注册`);
  const [ cmdStr0, cmdStr1 ] = result.split('.');
  const cmd0 = parseInt(cmdStr0, 10);
  const cmd1 = parseInt(cmdStr1, 10);
  return [cmd0, cmd1];
};

/**
 * @function
 * @param {Number} cmd0
 * @param {Number} cmd1
 * @return {String}
 */
cmdMap.getNameByCmd = function (cmd0, cmd1) {
  const cmdStr = cmd0 + '.' + cmd1;
  let name;
  for (let [key, value] of cmdMap) {
    if (value === cmdStr) {
      name = key;
      break;
    }
  }
  if (!name) throw new Error(`${cmdStr}(0x${cmd0.toString(16)},0x${cmd1.toString(16)}) 无对应mt名称`);
  return name;
};

/**
 * @function
 * @param {Number} x
 * @return {boolean}
 */
cmdMap.checkAreq = function (x) {
  switch (typeof x) {
    case 'number':
      return ((x & 0xf0) == 0x40);
    default:
      return false;
  }
};

// zdoStatusMap
// ==============================================================
const zdoStatusMap = new Map([
  [0x00, 'ZDP_SUCCESS'],
  [0x80, 'ZDP_INVALID_REQTYPE'],
  [0x81, 'ZDP_DEVICE_NOT_FOUND'],
  [0x82, 'ZDP_INVALID_EP'],
  [0x83, 'ZDP_NOT_ACTIVE'],
  [0x84, 'ZDP_NOT_SUPPORTED'],
  [0x85, 'ZDP_TIMEOUT'],
  [0x86, 'ZDP_NO_MATCH'],
  [0x88, 'ZDP_NO_ENTRY'],
  [0x89, 'ZDP_NO_DESCRIPTOR'],
  [0x8a, 'ZDP_INSUFFICIENT_SPACE'],
  [0x8b, 'ZDP_NOT_PERMITTED'],
  [0x8c, 'ZDP_TABLE_FULL'],
  [0x8d, 'ZDP_NOT_AUTHORIZED'],
  [0x8e, 'ZDP_BINDING_TABLE_FULL'],
]);

// builder
// ==============================================================
const builder = {
  // sys
  // =================================================
  SYS_PING() {
    const [ cmd0, cmd1 ] = cmdMap.getCmdByName('SYS_PING');
    return _genFrame(cmd0, cmd1);
  },

  // zdo
  // =================================================
  /**
   * @param {String} ieee
   * @return {Buffer}
   */
  ZDO_SEC_DEVICE_REMOVE({ieee}) {
    // TODO: ZDO_SEC_DEVICE_REMOVE
    throw new Error('TODO');
    // return _genFrame(0, 0, Buffer.from([ieee]))
  },

  /**
   * ZDO_ACTIVE_EP_REQ
   * 
   * @param {Number} nwk
   * @return {Buffer}
   */
  ZDO_ACTIVE_EP_REQ(nwk) {
    const data = new Buffer(4);
    data.writeUInt16LE(nwk, 0);    
    data.writeUInt16LE(nwk, 2);
    const [cmd0, cmd1] = cmdMap.getCmdByName('ZDO_ACTIVE_EP_REQ');
    return _genFrame(cmd0, cmd1, data);
  },
  /**
   * ZDO_SIMPLE_DESC_REQ
   * 
   * @param {Number} nwk
   * @param {Number} ep
   * @return {Buffer}
   */
  ZDO_SIMPLE_DESC_REQ({nwk, ep}) {
    const data = new Buffer(5);
    data.writeUInt16LE(nwk, 0);
    data.writeUInt16LE(nwk, 2);
    data.writeUInt8(ep, 4);
    const [cmd0, cmd1] = cmdMap.getCmdByName('ZDO_SIMPLE_DESC_REQ');
    return _genFrame(cmd0, cmd1, data);
  },
  /**
   * @param {Number} ep
   * @param {Number} destNwk
   * @param {Number} destEp
   * @param {Number} clusterId
   * @param {Buffer} msg
   */
  APP_MSG({ep, destNwk, destEp, clusterId, msg}) {
    const msgLen = msg.length;
    const data = new Buffer(7 + msgLen);
    data.writeUInt8(ep, 0);
    data.writeUInt16LE(destNwk, 1);
    data.writeUInt8(destEp, 3);
    data.writeUInt16LE(clusterId, 4);
    data.writeUInt8(msgLen, 6);
    msg.copy(data, 7);
    const [ cmd0, cmd1 ] = cmdMap.getCmdByName('APP_MSG');
    return _genFrame(cmd0, cmd1, data);
  }
};

// parser
// ==============================================================
const parser = {
  // sys
  // =================================================
  SYS_PING_SRSP(buf) {
    const { cmd0, cmd1, data } = _parseFrame(buf);
    const capabilities = data.readUInt16LE(0);
    return {
      cmd0, cmd1,
      capabilities
    }
  },
  SYS_RESET_IND(buf) {
    const { cmd0, cmd1, data } = _parseFrame(buf);
    const reason = data.readUInt8(0);
    const transportRev = data.readUInt8(1);
    const productId = data.readUInt8(2);
    const minorRel = data.readUInt8(3);
    const hwRev = data.readUInt8(4);
    let reasonString;
    switch (reason) {
      case 0: reasonString = 'Power up'; break;
      case 1: reasonString = 'Externa'; break;
      case 2: reasonString = 'Watch dog'; break;
      default: reasonString = 'unknow';
    }
    return {
      cmd0, cmd1,
      reason, transportRev, productId, minorRel, hwRev,
      reasonString
    }
  },

  // zdo
  // =================================================
  /**
   * @param {Buffer} buf
   * @return {{cmd0: Number, cmd1: Number, srcAddr: Number, nwkAddr: Number, ieeeAddr: String, capabilities: Number, type: String}}
   */
  ZDO_END_DEVICE_ANNCE_IND(buf) {
    const { cmd0, cmd1, data } = _parseFrame(buf);
    const srcAddr = data.readUInt16LE(0);
    const nwkAddr = data.readUInt16LE(2);
    const ieeeAddr = buf2Ieee(data.slice(4, 4+8));
    const capabilities = data.readUInt8(12);
    const type = !!(capabilities & 0x02) ? 'router' : 'endDevice';
    return {
      cmd0, cmd1,
      srcAddr, nwkAddr, ieeeAddr, capabilities, type
    }
  },
  /**
   * ZDO_ACTIVE_EP_RSP
   * 
   * @param {any} buf
   * @return {Object}
   */
  ZDO_ACTIVE_EP_RSP(buf) {
    const { cmd0, cmd1, data } = _parseFrame(buf);
    const srcAddr = data.readUInt16LE(0);
    const status = data.readUInt8(2);
    const nwkAddr = data.readUInt16LE(3);
    const activeEpCount = data.readUInt8(5);
    const activeEpList = data.slice(6).toJSON().data;
    return {
      cmd0, cmd1,
      srcAddr, status, nwkAddr, activeEpCount, activeEpList,
      statusString: zdoStatusMap.get(status)
    }
  },
  /**
   * ZDO_ACTIVE_EP_RSP
   * 
   * @param {any} buf
   * @return {Object}
   */
  ZDO_SIMPLE_DESC_RSP(buf) {
    const { cmd0, cmd1, data } = _parseFrame(buf);
    const srcAddr = data.readUInt16LE(0);
    const status = data.readUInt8(2);
    const nwkAddr = data.readUInt16LE(3);
    const len = data.readUInt8(5);
    const endPoint = data.readUInt8(6);
    const profileId = data.readUInt16LE(7);
    const deviceId = data.readUInt16LE(9);
    const deviceVer = data.readUInt8(11);
    return {
      cmd0, cmd1,
      srcAddr, status, nwkAddr, len, endPoint, profileId, deviceId, deviceVer,
      statusString: zdoStatusMap.get(status)      
    };
  },
  ZDO_STATE_CHANGE_IND(buf) {
    const { cmd0, cmd1, data } = _parseFrame(buf);
    const state = data.readUInt8(0);
    return {
      cmd0, cmd1, state
    }
  },

  // app
  // ================================================
  /**
   * @param {Buffer} buf
   * @return {{cmd0, cmd1, data, status}}
   */
  APP_MSG_SRSP(buf) {
    return parseSrsp(buf);
  },
  /**
   * @param {Buffer} buf
   * @return {{cmd0, cmd1, nwk: (Number|*), ep: (Number|*), clusterId: (Number|*), payload: Buffer}}
   */
  APP_MSG_FEEDBACK(buf) {
    const { cmd0, cmd1, data } = _parseFrame(buf);
    const nwk = data.readUInt16LE(0);
    const ep = data.readUInt8(2);
    const clusterId = data.readUInt16LE(3);
    const msgLen = data.readUInt16LE(5);
    const payload = new Buffer(msgLen);
    data.copy(payload, 0, 7);
    return {
      cmd0, cmd1,
      nwk, ep, clusterId, payload
    }
  },

  // Debug
  // ==============================================
  DEBUG_STRING(buf) {
    const { cmd0, cmd1, data } = _parseFrame(buf);
    const msg = data.toString('ascii');
    return {
      cmd0, cmd1,
      msg
    }
  }
};

injectDefaultSRSP('ZDO_ACTIVE_EP_SRSP', [0x65, 0x05], cmdMap, parser);
injectDefaultSRSP('ZDO_SIMPLE_DESC_SRSP', [0x65, 0x04], cmdMap, parser);

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
  // ----
  cmdMap,
  builder,
  parser
};