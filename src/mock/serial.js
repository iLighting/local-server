
const { genFrame } = require('../utils/mt');

module.exports = function * (put, take) {
  let t ;
  while (true) {
    t = yield take();
    put(genFrame(0x69, 0, Buffer.from([0])));
  }
};
