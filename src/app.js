const koa = require('koa');
const path = require('path');
const Pug = require('koa-pug')
const { app: log } = require('./utils/log');

const app = koa();

app.use(function * (next) {
  log.debug(this.request.method, this.request.url);
  yield next;
});

// use pug
// ====================================

// TODO: 加入生产模式控制
const pug = new Pug({
  viewPath: path.join(__dirname, 'views'),
  debug: true,
  pretty: false,
  compileDebug: true,
  locals: {},
  noCache: true,
  // basedir: 'path/for/pug/extends',
  // helperPath: [
  //   'path/to/pug/helpers',
  //   { random: 'path/to/lib/random.js' },
  //   { _: require('lodash') }
  // ],
});

pug.use(app);

// use auth
// ====================================

app.use(function * (next) {
  this.state.userName = this.cookies.get('userName');
  yield next
})

// use routers
// ===================================

app.use(require('./routers'));

app.use(function * (next) {
  this.throw(404, '路由未定义')
});

// error catch
// ===================================

app.on('error', function (err, ctx) {
  log.error('未捕获的错误', err, ctx)
});

module.exports = app;
