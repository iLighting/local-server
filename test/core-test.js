const expect = require('chai').expect;
const model = require('../model/model');
const store = require('../core/store');
const actions = require('../core/actions');
const Device = model.Device;
const App = model.App;

describe('核心测试', () => {

  before(done => {
    // 清空AppLamp
    App.find().remove().exec(err => {
      expect(err).to.be.a('null');
      done();
    })
  })
  before(done => {
    // 清空Device
    Device.find().remove().exec(err => {
      expect(err).to.be.a('null');
      done();
    })
  })

  describe('saga', () => {
    describe('zigbee', () => {
      it('device join', done => {
        store.dispatch(actions['zigbee/device/join']({
          id: 123,
          ieee: 'aaa',
          type: 'router',
          apps: []
        }));
        store.subscribe(() => {
          Device.find().byId(123).exec((err, dev) => {
            expect(err).to.be.a('null');
            done();
          })
        });
      })
    })
  })

})
