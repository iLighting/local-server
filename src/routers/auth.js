const Router = require('koa-router');
const body = require('co-body');
const { app: log } = require('../utils/log');
const _ = require('lodash');

const router = new Router({
  prefix: '/auth'
});

router
  .get('/login', function * () {
    if (this.state.userName) {
      this.redirect('/');
    } else {
      this.render('login', {authorised: false});
    }
  })
  .post('/login', function * () {
    if (this.state.userName) {
      this.redirect('/')
    } else {
      // TODO: 向云服务器鉴权
      const { name, password } = yield body.form(this);
      if (name==='ilight' && password==='2016') {
        this.cookies.set('userName', name);
        this.redirect('/')
      } else {
        this.render('login', {authorised: false, authoriseFailure: true});
      }
    }
  })

router
  .get('/logout', function * () {
    this.state.userName = undefined;
    this.cookies.set('userName', '');
    this.redirect('/');    
  })

module.exports = router.routes();