const router = require('koa-router')();

router.use(require('./client'));
router.use(require('./scene'));
router.use(require('./zigbee'));

module.exports = router.routes();
