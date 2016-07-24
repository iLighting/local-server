const koa = require('koa');
const model = require('../model/model');

const app = koa();

// 设置app上下文
app.context.model = model;

app.use(function *(){
  this.body = 'Hello World';
});

app.listen(3000);
