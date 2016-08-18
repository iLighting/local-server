const router = require('koa-router')();

router.use(require('./client'));

module.exports = router.routes();
