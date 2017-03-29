const Router = require('koa-router');
const body = require('co-body');
const useragent = require('useragent');
const {
  app: log
} = require('../utils/log');
const _ = require('lodash');
const authCheck = require('./mix/authCheck');


const router = new Router({
  prefix: '/board'
});

router
  .get('/', authCheck, function* () {
    const reqUa = this.get('user-agent');
    const browserDetectiveObj = useragent.is(reqUa);
    const agent = useragent.parse(reqUa);
    let tempelateName = 'board';
    if (
      browserDetectiveObj.mobile_safari ||
      browserDetectiveObj.android ||
      agent.os.toJSON().family == 'iOS'
    ) {
      tempelateName = 'board-mobile';
    }
    this.render(tempelateName, {
      userName: this.state.userName
    });
  })

module.exports = router.routes();