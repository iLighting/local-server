const _ = require('lodash');
const {
  genFrame,
  parseFrame
} = require('../utils/mt');

const config = global.__config;

function frame(cmd0, cmd1, bl) {
  return genFrame(cmd0, cmd1, Buffer.from(bl));
}

/**
 * @param {number} cmd0
 * @param {number} cmd1
 * @param {number} nwk
 * @param {number} ep
 * @param {Array} pl
 * @return {Buffer}
 */
function appMsg({
  cmd0,
  cmd1,
  nwk,
  ep,
  pl
}) {
  const bl = Buffer.from(pl);
  const len = pl.length;
  const data = new Buffer(7 + len);
  data.writeUInt16LE(nwk, 0);
  data.writeUInt8(ep, 2);
  data.writeUInt16LE(config.get('zigbee_appMsgCluster'), 3);
  data.writeUInt16LE(len, 5);
  bl.copy(data, 7, 0, len);
  return genFrame(cmd0, cmd1, data);
}

module.exports = function (serial) {
  serial.on('chunk', chunk => {
    const {
      cmd0,
      cmd1,
      data
    } = parseFrame(chunk);
    const cmd = `0x${cmd0.toString(16)}:0x${cmd1.toString(16)}`;
    switch (cmd) {
      // zdo active ep req
      case '0x25:0x5':
        setTimeout(() => serial.put(frame(0x45, 0x85, [0, 0, 0, 0xaa, 0xbb, 2, 8, 9])), 2000);
        break;
        // ZDO_SIMPLE_DESC_REQ
      case '0x25:0x4':
        {
          const ep = data.readUInt8(4);
          setTimeout(() => serial.put(frame(0x45, 0x84, [0, 0, 0, 0xaa, 0xbb, 0, ep, 0, 0, 0, 0, 0])), 2000);
          break;
        }
    }
    serial.put(frame(0x69, 0, [0]));
  });

  setTimeout(() => {
    // device join
    serial.put(frame(0x45, 0xc1, [0, 0, 0xaa, 0xbb, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0xaa, 0xbb, 0xff]));
  }, 8000);

  // 模拟不停开关灯
  // setInterval(() => {
  //   frameSerial.put(frame(0x49, 0, [0,1, 8, 0xff,0, 2, 1,Math.random() > 0.5 ? 1 : 0]))
  // }, 5000);

  // 模拟持续触发轻触开关
  // let transId = 0;
  // setInterval(() => {
  //   frameSerial.put(frame(0x49, 0, [0,1, 8, 0xff,0, 2, 0,transId++]))
  // }, 5000);

  // 随机照度
  // setInterval(() => {
  //   serial.put(appMsg({
  //     cmd0: 0x49,
  //     cmd1: 0,
  //     nwk: 3,
  //     ep: 8,
  //     pl: [1, _.random(0, 200), 0]
  //   }))
  // }, 5000)

  // 随机人体感应
  // setInterval(() => {
  //   serial.put(appMsg({
  //     cmd0: 0x49,
  //     cmd1: 0,
  //     nwk: 5,
  //     ep: 8,
  //     pl: [1, _.random(0, 1)]
  //   }))
  // }, 5000)

  // 随机ASR
  setInterval(() => {
    serial.put(appMsg({
      cmd0: 0x49,
      cmd1: 0,
      nwk: 6,
      ep: 8,
      pl: [1, _.random(0, 7)]
    }))
  }, 5000)
};