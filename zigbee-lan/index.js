const co = require('co');

const entry = function * (next) {
  this.response.body = 'zigbee-lan';
}

module.exports = function * (next) {
  const self = this;
  if (!self.request.path.match(/^\/zigbee-lan/)) {
    yield next;
    return ;
  }
  // start from here
  // -------------------------------
  yield entry.bind(self, next);
}
