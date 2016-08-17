const config = require('./config');
const launch = require('../src/launch');

global.__config = config;

launch(config)
  .then(data => {
    const { store, server } = data;
    console.log('启动完成');
    console.log(config);
  })
  .catch(e => {
    console.log(e.stack)
  })
