const koa = require('koa');
const path = require('path');
const Pug = require('koa-pug')
const send = require('koa-send');
const { localApp: log } = require('../utils/log');

const app = koa();

app.use(function * (next) {
  log.debug(this.request.method, this.request.url);
  yield next;
});

// use static
// ====================================

app.use(
  function * (next) {
    const urlPath = this.request.path;
    if (urlPath.indexOf('/assets') === 0) {
      yield send(this, urlPath, {
        root: path.join(__dirname),
        gzip: true
      })
    } else {
      yield next
    }
  }
)

// use pug
// ====================================

// TODO: 加入生产模式控制
const pug = new Pug({
  viewPath: path.join(__dirname, 'views'),
  debug: !(process.env.NODE_ENV === 'prod'),
  pretty: false,
  compileDebug: !(process.env.NODE_ENV === 'prod'),
  locals: {},
  noCache: process.env.NODE_ENV === 'prod'
});

pug.use(app);

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
