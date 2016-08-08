const router = require('koa-router')();

router.use('/api', require('./api-client'));
router.use('/api', require('./api-simulator'));

module.exports = router.routes();
