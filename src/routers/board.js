const Router = require('koa-router');
const body = require('co-body');
const { app: log } = require('../utils/log');
const _ = require('lodash');
const authCheck = require('./mix/authCheck');


const router = new Router({
  prefix: '/board'
});

router
  .get('/', authCheck, function * () {
    this.render('board', {
      userName: this.state.userName
    });
  })

module.exports = router.routes();
