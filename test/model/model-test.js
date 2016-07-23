//noinspection JSUnresolvedVariable
const expect = require('chai').expect;
const model = require('../../model/model');
const Device = model.Device;
const App = model.App;

describe('数据模型测试', () => {

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

  describe('Device模型测试', () => {
    it('新增后删除', (done) => {
      let d = new Device({
        _id: 1,
        type: 'router'
      });
      let err = d.validateSync();
      expect(err).to.be.an('undefined');
      d.save((err) => {
        expect(err).to.be.an('null');
        d.remove(err => {
          expect(err).to.be.an('null');
          done();
        })
      })
    })
  })

  describe('App模型测试', () => {
    let device;
    before(done => {
      device = new Device({_id: 1, type: 'router'});
      device.save(err => {
        expect(err).to.be.a('null');
        done();
      })
    })
    it('新增，通过device反查，然后删除', done => {
      let lamp = new App({endPoint: 8, type: 'lamp', device: device, payload: {level: 0}});
      let lampId = lamp.id;
      lamp.save(err => {
        expect(err).to.be.an('null');
        device.findApps((err, apps) => {
          expect(err).to.be.an('null');
          expect(apps[0]).to.have.property('id', lampId);
          expect(apps[0]).to.have.property('endPoint', 8);
          expect(apps[0]).to.have.property('type', 'lamp');
          expect(apps[0]).to.have.deep.property('payload.level', 0);
          lamp.remove(err => {
            expect(err).to.be.an('null');
            device.findApps((err, apps) => {
              expect(err).to.be.an('null');
              expect(apps.length).to.be.equal(0);
              done();
            })
          })
        })
      })
    })
  })

})
