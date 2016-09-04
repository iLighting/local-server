/**
 * `/io`
 *
 * - `device/join.success`, FrameAreq.parsed
 *
 * @module
 */

const mt = require('../utils/mt');
const clientLib = require('../libs/client');
const { clientIo: log } = require('../utils/log');


function handleClientLibEvent(socket, areq) {
  switch (areq.name) {
    case mt.ZdoEndDeviceAnnceInd.name:
      socket.emit('data', {type: 'device/join.success', payload: areq.parsed});
      break;
  }
}

module.exports = function (io) {
  const client = io.of('/api/io');
  client.on('connection', socket => {
    log.info('client io 已连接', socket.id);
    const _innerHandleClientLibEvent = handleClientLibEvent.bind(null, socket);
    // 监听socket事件
    socket
      .on('disconnect', () => {
        log.info('client io 已断开', socket.id);
        // 移除监听器
        clientLib.removeListener('postAreq', _innerHandleClientLibEvent);
      });
    // 监听内部事件
    clientLib
      .on('postAreq', _innerHandleClientLibEvent);
  });
};

