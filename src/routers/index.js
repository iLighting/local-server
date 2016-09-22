const router = require('koa-router')();

router.use(require('./client'));
router.use(require('./scene'));
router.use(require('./mode'));

router.use(require('./manualMode'));
router.use(require('./sceneMode'));

module.exports = router.routes();
