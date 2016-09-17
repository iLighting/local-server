
const { genFrame } = require('../utils/mt');

function frame(cmd0, cmd1, bl) {
  return genFrame(cmd0, cmd1, Buffer.from(bl));
}

module.exports = function (serial) {
  serial.on('chunk', chunk => {
    serial.put(frame(0x69, 0, [0]));
  });

  setTimeout(() => {
    // device join
    serial.put(frame(0x45, 0xc1, [0xaa,0xbb,0xcc,0xdd,0xaa,0xbb,0xcc,0xdd,0xee,0xff,0xaa,0xbb,0xff]));
  }, 3000);

  // 模拟不停开关灯
  // setInterval(() => {
  //   serial.put(frame(0x49, 0, [0,1, 8, 0xff,0, 2, 1,Math.random() > 0.5 ? 1 : 0]))
  // }, 5000);

  // 模拟持续触发轻触开关
  // let transId = 0;
  // setInterval(() => {
  //   serial.put(frame(0x49, 0, [0,1, 8, 0xff,0, 2, 0,transId++]))
  // }, 5000);
};
