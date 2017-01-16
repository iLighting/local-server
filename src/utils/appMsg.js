/**
 * `src/libs/controller:sendAppMsg()`中调用应用模型的`build`方法
 */


/**
 * 检查对象是否匹配keyList
 * 
 * @param {Object} m
 * @param {Array} keyList
 * @return {Boolean}
 */
function objContain(m, keyList) {
  let i;
  let len = keyList.length;
  for(i=0; i<len; i++) {
    if (!m.hasOwnProperty(keyList[i])) return false
  }
  return true;
}

const lamp = {
  /**
   * 构建lamp app msg
   * @param {*} payload
   * @return {Buffer|None}
   */
  build(payload) {
    if (objContain(payload, ['on'])) {
      return Buffer.from([0, payload.on ? 1:0]);      
    }
  },
  /**
   * 解析lamp app msg
   * @param {Buffer} buf
   * @return {Array}
   */
  parse(buf) {
    const cmdId = buf.readUInt8(0);
    switch (cmdId) {
      // turn
      case 0:
        return ['turn', {on: !!buf.readUInt8(1)}];
      // turn feedback
      case 1:
        return ['turnFeedback', {on: !!buf.readUInt8(1)}];
      default:
        return ['unknow', cmdId]
    }
  }
};
Object.freeze(lamp);

const grayLamp = {
  /**
   * 构建gray lamp app msg
   * @param {*} payload
   * @return {Buffer|None}
   */
  build(payload) {
    if (objContain(payload, ['level'])) {
      return Buffer.from([0, payload.level]);      
    }
  },
  /**
   * 解析gray lamp app msg
   * @param {Buffer} buf
   * @return {Array}
   */
  parse(buf) {
    const cmdId = buf.readUInt8(0);
    switch (cmdId) {
      // change
      case 0:
        return ['change', {level: buf.readUInt8(1)}];
      // change feedback
      case 1:
        return ['changeFeedback', {level: buf.readUInt8(1)}];
      default:
        return ['unknow', cmdId];
    }
  }
};
Object.freeze(grayLamp);

const pulse = {
  parse(buf) {
    const cmdId = buf.readUInt8(0);
    switch (cmdId) {
      // pulse feedback
      case 0:
        return ['pulseFeedback', {transId: buf.readUInt8(1)}];
      default:
        return [];
    }
  }
};
Object.freeze(pulse);

const temperatureSensor = {
  build(payload) {
    return Buffer.from([0]);
  },
  parse(buf) {
    const cmdId = buf.readUInt8(0);
    switch (cmdId) {
      // temperature feedback
      case 1:
        return ['temperatureFeedback', { temperature: buf.readInt16LE(1) / 100 }];
      default:
        return ['unknow', cmdId];
    }
  }
};
Object.freeze(temperatureSensor);

const illuminanceSensor = {
  build(payload) {
    return Buffer.from([0]);
  },
  parse(buf) {
    const cmdId = buf.readUInt8(0);
    switch (cmdId) {
      // light feedback
      case 1:
        return ['illuminanceFeedback', { level: buf.readUInt16LE(1) }];
      default:
        return ['unknow', cmdId];
    }
  }
};
Object.freeze(illuminanceSensor);

const asrSensor = {
  build(payload) {
    // 0: fetch
    return Buffer.from([0]);
  },
  parse(buf) {
    const cmdId = buf.readUInt8(0);
    switch (cmdId) {
      // asr feedback
      case 1:
        return ['asrFeedback', { result0: buf.readUInt8(1) }];
      default:
        return ['unknow', cmdId];
    }
  }
};
Object.freeze(asrSensor);

module.exports = {
  lamp,
  'gray-lamp': grayLamp,
  pulse,
  'temperature-sensor': temperatureSensor,
  'illuminance-sensor': illuminanceSensor,
  'asr-sensor': asrSensor,
};