/**
 * `/io`
 *
 * - `device/join.success`, FrameAreq
 * - `device/change.success`
 *
 * @module
 */

const mt = require('../utils/mt');
const proxy = require('../libs/proxy').getIns();
const { clientIo: log } = require('../utils/log');


function handleClientLibEvent(socket, areq) {
  switch (areq.name) {
    case mt.ZdoEndDeviceAnnceInd.name:
      socket.emit('data', {type: 'device/join.success', payload: areq});
      break;
  }
}

function handleAppMsgLibEvent(socket, msg) {
  const { nwk, ep, appType, cmdType, payload } = msg;
  // 以device为粒度
  socket.emit('data', {
    type: 'device/change.success',
    payload: { nwk, ep }
  });
}

module.exports = function (io) {
  const client = io.of('/api/io');
  client.on('connection', socket => {
    log.info('client io 已连接', socket.id);
    const _innerHandleClientLibEvent = handleClientLibEvent.bind(null, socket);
    const _innerHandleAppMsgLibEvent = handleAppMsgLibEvent.bind(null, socket);
    // 监听socket事件
    socket
      .on('disconnect', () => {
        log.info('client io 已断开', socket.id);
        // 移除监听器
        proxy.removeListener('frame:areqProcessed', _innerHandleClientLibEvent);
        proxy.removeListener('app:feedback', _innerHandleAppMsgLibEvent);
      });
    // 监听内部事件
    proxy
      .on('frame:areqProcessed', _innerHandleClientLibEvent)
      .on('app:feedback', _innerHandleAppMsgLibEvent);
  });
};

