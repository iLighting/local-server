
const { genFrame } = require('../utils/mt');

module.exports = function * (put, take) {
  let t ;
  setTimeout(() => {
    const buf = genFrame(
      0x45, 0xc1,
      Buffer.from([0xaa, 0xbb, 0xcc, 0xdd, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0xaa, 0xbb, 0xff]));
    put(buf);
  }, 5000);
  while (true) {
    t = yield take();
    put(genFrame(0x69, 0, Buffer.from([0])));
  }
};
