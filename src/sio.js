/**
 * `/io`
 *
 * @module
 */

const { socketIo: log } = require('./utils/log');

const eventNames = [
  'mediator/handle'
];

function gen(type, payload) {
  return {type, payload};
}

function handler(eventName, ...args) {
  log.trace('下发事件', eventName, '\n', args);
  switch (eventName) {
    case 'mediator/handle': {
      const [name, result] = args;
      switch (name) {
        case 'ZDO_END_DEVICE_ANNCE_IND':
          this.emit('data', gen('device/join.success', result));
          break;
        case 'APP_MSG_FEEDBACK':
          // 以device为粒度
          this.emit('data', gen('device/change.success', result));
          break;
      }
      break;
    }
    default:
      this.emit('data', gen(eventName, args));
  }
}

module.exports = function (io) {
  const client = io.of('/api/io');
  const es = require('./libs/event');

  log.info('io 已就绪');
  client.on('connection', socket => {
    log.info('client io 已连接', socket.id);

    let _handlerMap = {};
    // 监听socket事件
    socket
      .on('disconnect', () => {
        log.info('client io 已断开', socket.id);
        // 移除监听器
        Object.keys(_handlerMap).forEach(name => {
          const h = _handlerMap[name];
          if (h) { es.removeListener(name, h) }
        });
        _handlerMap = {};
      });
    // 监听内部事件
    eventNames.forEach(name => {
      const h = handler.bind(socket, name);
      _handlerMap[name] = h;
      es.on(name, h);
    });

  });
};
