const co = require('co');


const launch = co.wrap(function* (config) {
  // 注入 config
  global.__config = config;

  const {
    framework: log
  } = require('./utils/log');

  // 初始化数据库
  // ------------------------
  const {
    db,
    models
  } = yield(require('./db').init(config.get('db_path')));

  const modelsName = Object.keys(models);
  for (let i = 0; i < modelsName.length; i++) {
    yield models[modelsName[i]].remove().exec()
  }
  log.info('db has been cleared:', modelsName.join(','))

  // mock数据库
  if (config.get('debug')) {
    yield require('./mock/db')(models);
    log.debug('mock数据库');
  }

  // 初始化系统状态
  // ------------------------
  const sys = yield require('./libs/sys').initIns({
    status: {
      mode: 'manual'
    }
  });

  // 初始化场景配置
  // ------------------------
  const SceneProvider = require('./utils/sceneProvider');
  const provider = new SceneProvider(models);
  yield provider.default();

  // -----------------------
  const controller = require('./libs/controller');

  // 初始化 local app server
  const localApp = require('./localApp');
  localApp.listen(config.get('localServer_port'),
    config.get('debug') ? '0.0.0.0' : 'localhost');

  // 初始化Server
  // ------------------------
  const app = require('./app');
  app.context.mount = {
    db,
    models,
    sys,
    controller
  };
  const server = require('http').createServer(app.callback());

  // 初始化 socket.io
  const io = require('socket.io')(server);
  require('./sio')(io);

  // 启动
  server.listen(config.get('server_port'));
  log.info('应用启动成功，端口号 %s', config.get('server_port'));

  // extra
  require('./libs/appAsr');

  return {
    db,
    models,
    sys,
    app
  };
});


module.exports = launch;