const { expect } = require('chai');
const { frame } = require('../src/utils/mt');

describe('MT工具类库测试', () => {

  describe('合成和解析', () => {
    describe('SYS_PING', () => {
      it('合成', () => {
        let f = frame.gen('SYS_PING');
        expect(f.compare(Buffer.from([0xfe, 0x00, 0x21, 0x01, 0x20]))).to.eql(0);
      });
      it('解析', () => {
        const f = frame.parse(Buffer.from([0xFE, 0x02, 0x61, 0x01, 0x11, 0x00, 0x73]));
        expect(f).to.have.property('cmd0').that.is.equal(0x61);
        expect(f).to.have.property('cmd1').that.is.equal(0x01);
        expect(f).to.have.property('data');
        expect(f.data.compare(Buffer.from([0x11, 0]))).to.eql(0);
      });
    })
  })

});