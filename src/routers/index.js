const router = require('koa-router')();

// router.use(require('./client'));
// router.use(require('./scene'));
// router.use(require('./mode'));
//
// router.use(require('./manualMode'));
// router.use(require('./sceneMode'));

router.use(require('./home'));
router.use(require('./auth'));
router.use(require('./board'));
router.use(require('./api'));

module.exports = router.routes();
