const koa = require('koa');
// const compress = require('koa-compress');
const path = require('path');
const Pug = require('koa-pug')
const send = require('koa-send');
const {
  app: log
} = require('./utils/log');

const app = koa();

// compress
// ==============================

// const compressFunc = compress({
//   filter: function (type) {
//     if (['application/javascript', 'text/css', 'text/html'].indexOf(type) >= 0) {
//       return true
//     }
//     return false
//   },
//   threshold: 2048,
// })

// app.use(function* (next) {
//   compressFunc(this, next);
// })


// log
// ==============================

app.use(function* (next) {
  log.info(this.request.method, this.request.url);
  yield next;
});

// use static
// ====================================

app.use(
  function* (next) {
    const urlPath = this.request.path;
    if (urlPath.indexOf('/statics') === 0) {
      yield send(this, urlPath, {
        root: path.join(__dirname),
        gzip: true
      })
    } else {
      yield next
    }
  }
)

// favicon.ico
// ====================================

app.use(
  function* (next) {
    const urlPath = this.request.path;
    if (urlPath === '/favicon.ico') {
      yield send(this, path.join('statics', 'favicon.ico'), {
        root: path.join(__dirname),
        gzip: true
      })
    } else yield next
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
  noCache: process.env.NODE_ENV === 'prod',
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

app.use(function* (next) {
  this.state.userName = this.cookies.get('userName');
  yield next
})

// use routers
// ===================================

app.use(require('./routers'));

app.use(function* (next) {
  this.throw(404, '路由未定义')
});

// error catch
// ===================================

app.on('error', function (err, ctx) {
  log.error('未捕获的错误', err, ctx)
});

module.exports = app;