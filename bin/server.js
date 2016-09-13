const config = require('./config');
const launch = require('../src/launch');

launch(config)
  .then(data => {
    const { db, models, app } = data;
    console.log('启动完成');
    console.log(config);
  })
  .catch(e => {
    console.log(e.stack)
  });
