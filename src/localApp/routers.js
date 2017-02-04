const Router = require('koa-router');
const body = require('co-body');
const { localApp: log } = require('../utils/log');
const _ = require('lodash');
const os = require('os');

const router = new Router();

function getNormalizedSysInfo() {
  const addrList = [];
  _.each(os.networkInterfaces(), (interface, name) => {
    if (name.toLowerCase().indexOf('wlan') < 0) return;
    interface.forEach(item => {
      if (item.family === 'IPv4' && item.internal === false) {
        addrList.push(item.address);
      }
    })
  });
  return {
    uptime: os.uptime(),
    addrList,
  }
}

router
  // index.pug
  .get('/', function * () {
    this.render('index', Object.assign({}, getNormalizedSysInfo()));
  })
  // api: sys info
  .get('/sysInfo', function * () {
    this.body = getNormalizedSysInfo();
  })

module.exports = router.routes();
