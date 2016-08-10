const co = require('co');
const { EventEmitter } = require('events');
const server = require('../src/server');
const store = require('../src/core/store');
const config = require('./config');

const event = new EventEmitter();

co(function * () {

  store.run();

  // connect db
  {
    let {type, payload:db, err} = yield store.doThenWait(
      /db\/connect\.(success|failure)/,
      'db/connect',
      config.db
    );
    if (type=='db/connect.failure') {
      throw Error('数据库连接失败')
    }
  }

  // create db model
  {
    let {type, payload:db, err} = yield store.doThenWait(
      /db\/model\/create\.(success|failure)/,
      'db/model/create',
      require('../src/model/schema')
    );
    if (type=='db/model/create.failure') {
      throw Error('数据库模型创建失败')
    }
  }

  // listen
  {
    server.listen(config.server.port);
  }

})
  .then(() => {
    console.info('应用启动');
    console.dir(config);
    event.emit('done', config);
  }, err => {
    console.error(err.stack);
    event.emit('error', err);
  })

module.exports = {
  server,
  app: require('../src/server/app'),
  config,
  event,
};
