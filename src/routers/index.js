const router = require('koa-router')();

router.use(require('./client'));
router.use(require('./scene'));

module.exports = router.routes();
