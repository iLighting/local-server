const { expect } = require('chai');
const { shiftFrameFromBuf } = require('../src/utils/mt');

describe('MT工具类库测试', () => {

  describe('shiftFrameFromBuf', () => {
    const standardBody = Buffer.from([0xfe, 0x00, 0x21, 0x01, 0x20]);
    it ('standard', () => {
      let buf = standardBody;
      let [frame, rest] = shiftFrameFromBuf(buf);
      expect(buf.compare(frame)).to.be.equal(0);
      expect(rest.length).to.be.equal(0);
    });
    it ('队首不是SOF', () => {
      let head = Buffer.from([0xaa, 0xbb]);
      let [frame, rest] = shiftFrameFromBuf(Buffer.concat([head, standardBody]));
      expect(frame.compare(standardBody)).to.be.equal(0);
      expect(rest.length).to.be.equal(0);
    });
    it ('队尾有多余', () => {
      let tail = Buffer.from([0xaa, 0xbb]);
      let [frame, rest] = shiftFrameFromBuf(Buffer.concat([standardBody, tail]));
      expect(frame.compare(standardBody)).to.be.equal(0);
      expect(rest.compare(tail)).to.be.equal(0);
    });
    it ('校验失败', () => {
      let tail = Buffer.from([0xaa, 0xbb]);
      let buf = Buffer.concat([
        Buffer.from( [0xfe, 0x00, 0x21, 0x01, 0x21] ),
        tail
      ]);
      let [frame, rest] = shiftFrameFromBuf(buf);
      expect(rest.compare(tail)).to.be.equal(0);
      expect(frame.length).to.be.equal(0);
    });
  })

});