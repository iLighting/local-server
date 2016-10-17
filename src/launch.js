const co = require('co');
const { framework:log } = require('./utils/log');


const launch = co.wrap(function * (config) {
  // 注入 config
  // global.__config = config;

  // 初始化数据库
  // ------------------------
  const { db, models } = yield require('./db').init(config.db.path);
  // mock数据库
  yield require('./mock/db2')(models);
  log.debug('mock数据库');

  // 初始化系统状态
  // ------------------------
  const sys = yield require('./libs/sys').initIns({
    status: {
      mode: 'manual'
    }
  });

  // 监听系统状态变化
  // -----------------------
  const controller = require('./libs/controller');
  sys.on('change', sysObj => {
    const mode = sysObj.status.mode;
    controller.switchMode(mode);
  });

  // 初始化Server
  // ------------------------
  const app = require('./app');
  app.context.mount = {
    db, models, sys, controller
  };
  const server = require('http').createServer(app.callback());

  // 启动
  server.listen(config.server.port);
  log.info('应用启动成功，端口号 %s', config.server.port);
  return { db, models, sys, app };
});


module.exports = launch;
