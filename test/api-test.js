const co = require('co');
const chai = require('chai');
const request = require('supertest');
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
const expect = chai.expect;

const cw = co.wrap.bind(co);

const clearModels = co.wrap(function* (models) {
  const keys = Object.keys(models);
  for (let i = 0; i < keys.length; i++) {
    yield models[keys[i]].remove().exec();
  }
})

const launch = co.wrap(function* (config) {
  // config
  global.__config = config;

  // 初始化数据库
  // ------------------------
  const {
    db,
    models
  } = yield require('../src/db').init(config.get('db_path'));
  // mock数据库
  // yield require('../src/mock/db')(models);

  // 初始化系统状态
  // ------------------------
  const sys = yield require('../src/libs/sys').initIns({
    status: {
      mode: 'manual'
    }
  });

  // -----------------------
  const controller = require('../src/libs/controller');

  // 初始化Server
  // ------------------------
  const app = require('../src/app');
  app.context.mount = {
    db,
    models,
    sys,
    controller
  };
  // app.listen(config.get('server_port'));

  // extra
  // require('../src/libs/appAsr');

  return {
    db,
    models,
    sys,
    app
  };
});

describe('TEST api', () => {

  process.env.NODE_ENV = 'dev';
  process.env.MOCK = 'true';

  let config = require('config');
  config['log_console'] = false;

  let app = null;
  let models = null;
  let agent = null;

  before(co.wrap(function* () {
    const res = yield launch(config);
    app = res.app;
    models = res.models;
    agent = request.agent(app.callback());
    yield clearModels(models);
  }))

  it('echo', () => {
    return agent.get('/api/echo?msg=a').expect('a');
  })

  context('场景', () => {
    const scene = {
      name: '开灯',
      items: [{
        ieee: '00-00-00-00-00-00-00-00',
        ep: 8,
        scenePayload: {
          on: true
        }
      }, {
        ieee: '00-00-00-00-00-00-00-01',
        ep: 8,
        scenePayload: {
          on: false
        }
      }]
    };
    let sceneRes = null;
    before(() => {
      return agent
        .post('/api/staticScene/store')
        .type('json')
        .send(JSON.stringify(scene))
        .expect(200)
    })
    it('exist', () => {
      return agent
        .get('/api/staticScene/store')
        .set('Accept', 'application/json')
        .expect(res => {
          sceneRes = res.body;
          return Promise.all([
            expect(res.body.type).to.be.equal('ok'),
            expect(res.body.payload).to.be.an('array'),
            expect(res.body.payload).to.have.lengthOf(1),
            expect(res.body.payload).to.have.deep.property('[0].id'),
            expect(res.body.payload).to.have.deep.property('[0].name', '开灯'),
            expect(res.body.payload).to.have.deep.property('[0].items[0].ieee', '00-00-00-00-00-00-00-00'),
            expect(res.body.payload).to.have.deep.property('[0].items[1].ieee', '00-00-00-00-00-00-00-01'),
          ])
        })
    })
    it('modify', () => {
      return agent
        .put('/api/staticScene/store/id/' + sceneRes.payload[0].id)
        .type('json')
        .send(JSON.stringify({
          name: 'new name'
        }))
        .set('Accept', 'application/json')
        .expect(res => {
          return Promise.all([
            expect(res.body.type).to.be.equal('ok'),
            expect(res.body.payload).to.be.an('object'),
            expect(res.body.payload).to.have.deep.property('name', 'new name'),
            expect(res.body.payload.items).to.have.lengthOf(0),
          ])
        })
    })
  })

  context('场景切换器测试', () => {
    context('新建场景切换器', () => {
      // remove all Choosers
      before(cw(function* () {
        const {
          JudgeRuleGroup
        } = models;
        yield JudgeRuleGroup.remove().exec();
      }))
      it('normal', cw(function* () {
        let res = yield agent
          .post('/api/sceneChooser')
          .type('json')
          .send(JSON.stringify({
            name: 'AAA',
            timeRange: ['18:00', '23:59'],
            rules: [{
              ieee: '00-00-00-00-00-00-01-00',
              ep: 8,
              type: 'lt',
              payload: 100
            }]
          }))
          .expect(200)
        expect(res.body).to.have.property('type', 'ok')
        expect(res.body).to.have.deep.property('payload.id');
        expect(res.body).to.have.deep.property('payload.name', 'AAA');
        expect(res.body).to.have.deep.property('payload.timeRange[0]', '18:00');
        expect(res.body).to.have.deep.property('payload.timeRange[1]', '23:59');
        res = yield agent
          .get('/api/sceneChooser/' + res.body.payload.id)
          .set('Accept', 'application/json')
          .expect(200)
        expect(res.body).to.have.property('type', 'ok')
        expect(res.body).to.have.deep.property('payload.id');
        expect(res.body).to.have.deep.property('payload.name', 'AAA');
        expect(res.body).to.have.deep.property('payload.timeRange[0]', '18:00');
        expect(res.body).to.have.deep.property('payload.timeRange[1]', '23:59');
      }))
    })
    context('修改场景切换器', () => {
      // remove all Choosers
      before(cw(function* () {
        const {
          JudgeRuleGroup
        } = models;
        yield JudgeRuleGroup.remove().exec();
      }))
      it('normal', cw(function* () {
        let res = yield agent
          .post('/api/sceneChooser')
          .type('json')
          .send(JSON.stringify({
            name: 'AAA',
            timeRange: ['18:00', '23:59'],
            rules: [{
              ieee: '00-00-00-00-00-00-01-00',
              ep: 8,
              type: 'lt',
              payload: 100
            }]
          }))
          .expect(200)
        expect(res.body).to.have.property('type', 'ok')
        expect(res.body).to.have.deep.property('payload.id');
        expect(res.body).to.have.deep.property('payload.name', 'AAA');
        expect(res.body).to.have.deep.property('payload.timeRange[0]', '18:00');
        expect(res.body).to.have.deep.property('payload.timeRange[1]', '23:59');
        res = yield agent
          .put('/api/sceneChooser/' + res.body.payload.id)
          .type('json')
          .send(JSON.stringify({
            name: 'BBB',
            timeRange: ['19:00', '23:00'],
            rules: []
          }))
          .expect(200)
        expect(res.body).to.have.property('type', 'ok')
        expect(res.body).to.have.deep.property('payload.id');
        expect(res.body).to.have.deep.property('payload.name', 'BBB');
        expect(res.body).to.have.deep.property('payload.timeRange[0]', '19:00');
        expect(res.body).to.have.deep.property('payload.timeRange[1]', '23:00');
        expect(res.body).to.have.deep.property('payload.rules').that.have.lengthOf(0);
      }))
    })
  })

})