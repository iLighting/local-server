const { expect } = require('chai');
const request = require('supertest');
const { event:serverEvt, app } = require('../bin/server');

const req = function () {
  return request(app.listen())
}

describe('API测试', () => {

  before(done => {
    setTimeout(done, 1900)
  })

  it('添加一个设备', done => {
    const did = Math.floor(Math.random()*10000);
    req()
      .post('/api/zigbee/device/join')
      .send(JSON.stringify({
        nwk: did,
        ieee: 'xxx',
        type: 'router'
      }))
      .end((err, res) => {
        expect(err).to.be.a('null');
        console.log('@@@', res.body);
        expect(res.body.type).to.be.equal('ok');
        expect(res.body.payload).to.be.equal(did);
        req()
          .get('/api/device/'+did)
          .end((err, res) => {
            expect(err).to.be.a('null');
            expect(res.body.type).to.be.equal('ok');
            expect(res.body.payload.nwk).to.be.equal(did);
            done()
          })
      })
  })

})
