const router = require('koa-router')();

router.use(require('./client'));
router.use(require('./zigbee'));

module.exports = router.routes();
