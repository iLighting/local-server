
lamp = {
  /**
   * 构建lamp app msg
   * @param {String} cmd - 'turn'
   * @param {*} payload
   * @return {Buffer}
   */
  build(cmd, payload) {
    switch (cmd) {
      case 'turn':
        return Buffer.from([0, payload ? 1 : 0]);
      default:
        return new Buffer(0);
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
        return [];
    }
  }
};
Object.freeze(lamp);

pulse = {
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

module.exports = {
  lamp,
  pulse,
};