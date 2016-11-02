/**
 * 事件中心
 */

const { EventEmitter } = require('events');
const zigbee = require('../zigbee');
const mediator = require('./zigbee');

class EventCenter extends EventEmitter {
  constructor() {
    super();
    // 绑定zigbee底层事件
    ['sreq', 'srsp', 'areq', 'srspParsed', 'areqParsed'].forEach(name => {
      zigbee.on(name, this.handleEvent.bind(this, 'zigbee', name));
    });
    // 绑定zigbee中介者事件
    mediator.on('handle', this.handleEvent.bind(this, 'mediator', 'handle'));
  }
  handleEvent(domain, name, ...args) {
    this.emit(`${domain}/${name}`, ...args);
  }
}

module.exports = new EventCenter;
