const router = require('koa-router')();

router.use('/api', require('./api-client'));

module.exports = router.routes();
