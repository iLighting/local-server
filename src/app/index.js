const koa = require('koa');

const app = koa();

app.use(require('../routers'));

app.use(function *(){
  this.body = 'Hello World';
});

module.exports = app;
