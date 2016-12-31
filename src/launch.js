const co = require('co');


const launch = co.wrap(function * (config) {
  // 注入 config
  global.__config = config;

  const { framework:log } = require('./utils/log');

  // 初始化数据库
  // ------------------------
  const { db, models } = yield require('./db').init(config['db/path']);
  // mock数据库
  yield require('./mock/db')(models);
  log.debug('mock数据库');

  // 初始化系统状态
  // ------------------------
  const sys = yield require('./libs/sys').initIns({
    status: {
      mode: 'manual'
    }
  });

  // -----------------------
  const controller = require('./libs/controller');

  // 初始化Server
  // ------------------------
  const app = require('./app');
  app.context.mount = {
    db, models, sys, controller
  };
  const server = require('http').createServer(app.callback());

  // 初始化 socket.io
  const io = require('socket.io')(server);
  require('./sio')(io);

  // 启动
  server.listen(config['server/port']);
  log.info('应用启动成功，端口号 %s', config['server/port']);
  return { db, models, sys, app };
});


module.exports = launch;
