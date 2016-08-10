const sockjs = require('sockjs');
const co = require('co');
const store = require('../core/store');
const Msg = require('../utils/msg');

const clientPush = sockjs.createServer();

clientPush.on('connection', req => {
  co(function * () {
    while (true) {
      const result = yield store.wait(/zigbee\/device\/join\.success$/);
      req.write(Msg(result));
    }
  })
    .catch(e => {
      req.write(Msg('', e))
    })
})

module.exports = {
  clientPush,
}
