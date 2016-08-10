const koa = require('koa');
const http = require('http');
const sockjs = require('sockjs');
const { clientPush } = require('./push');

const app = koa();

app.use(require('../routers'));

app.use(function *(){
  this.body = 'Hello World';
});

const server = http.createServer(app.callback());

clientPush.installHandlers(server, {prefix:'/watch/client'});

module.exports = server;
