const app = require('./app');
const http = require('http');
const sockjs = require('sockjs');
// const { clientPush } = require('./push');


const server = http.createServer(app.callback());

// clientPush.installHandlers(server, {prefix:'/watch/client'});

module.exports = server;
