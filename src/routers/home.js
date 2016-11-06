const Router = require('koa-router');
const body = require('co-body');
const { app: log } = require('../utils/log');
const _ = require('lodash');

const router = new Router();

router
  .get('/', function * () {
    this.render('index', {
      userName: this.state.userName
    });
  })

module.exports = router.routes();
