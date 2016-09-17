const router = require('koa-router')();

router.use(require('./client'));
router.use(require('./scene'));
router.use(require('./mode'));

module.exports = router.routes();
