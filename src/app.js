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

module.exports = app;
