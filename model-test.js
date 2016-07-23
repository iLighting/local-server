//noinspection JSUnresolvedVariable
const expect = require('chai').expect;
const model = require('../../model/model');
const Device = model.Device;
const AppLamp = model.AppLamp;


describe('model 测试', function () {

  describe('device model', function () {
    describe('新增测试', function () {
      it('完整初始化', function () {
        let d = new Device({
          devId: '1',
          type: 'router'
        });
        let err = d.validateSync();
        expect(err).to.be.an('undefined');
      });
      it('初始化时，type参数枚举错误，应报错', function () {
        let d = new Device({
          devId: '1',
          type: 'a'
        });
        let err = d.validateSync();
        expect(err.errors).to.have.key('type');
      });
      it('初始化时，参数不完整，应报错', function () {
        let d = new Device();
        let err = d.validateSync();
        expect(err.errors).to.have.key('type', 'devId');
      });
    });
    describe('查询测试', function () {
      it('新建并查询', function(done) {
        let randomId = Math.random();
        let d = new Device({
          devId: randomId+'',
          type: 'router',
        });
        d.save(function(err) {
          expect(err).to.be.a('null');
          Device.findOne({devId: randomId+''}, function(err, result) {
            expect(err).to.be.a('null');
            expect(result).not.to.be.a('null');
            done();
          })
        });
      })
    })
  });

  describe('Device AppLamp 联合测试', function () {
    let device;
    before(function(done) {
      device = new Device({devId: 'a', type: 'router'});
      device.save(done);
    });
    it('插入lamp至设备，然后删除', function (done) {
      let lamp = new AppLamp({type:'lamp', level: 0});
      lamp.save(err => {
        expect(err).to.be.a('null');
        device.apps[8] = lamp;
        device.save(err => {
          expect(err).to.be.a('null');
          expect(device.apps[8]).to.have.property('type', 'lamp');
          expect(device.apps[8]).to.have.property('level', 0);
          lamp.remove(err => {
            expect(err).to.be.a('null');
            done();
          })
        })
      })
    })
  });

});
