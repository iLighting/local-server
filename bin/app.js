const koa = require('koa');
const model = require('../model/model');
const store = require('../core/store');

const app = koa();

// 设置app上下文
app.context.model = model;
app.context.store = store;

app.use(function *(){
  this.body = 'Hello World';
});

app.listen(3000);
