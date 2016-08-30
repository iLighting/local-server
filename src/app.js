const koa = require('koa');
const { app: log } = require('./utils/log');

const app = koa();

app.use(function * (next) {
  log.debug(this.request.href);
  yield next;
});

app.use(require('./routers'));

app.use(function * (next) {
  this.body = 'hello'
});

app.on('error', function (err, ctx) {
  log.error('未捕获的错误', err, ctx)
});

module.exports = app;
