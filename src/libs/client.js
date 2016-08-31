/**
 * 指令帧处理层
 *
 * - 封装常用SREQ指令
 * - 处理除`AppMsgFeedback`之外的AREQ指令。其交付`appmsg`层处理。
 *
 * @module
 */

const co = require('co');
const { expect } = require('chai');
const pry = require('promisify-node');
const { EventEmitter } = require('events');
const { client: log } = require('../utils/log');
const { getDb, getModels } = require('../db');
const transfer = require('./frameTransfer');
const mt = require('../utils/mt');
const { onOfLamp } = require('../utils/mtAppMsg');


const { parseSrsp, frameMap } = mt;

const db = getDb();
const models = getModels();

const syncRemoteProperty = {
  /**
   * @inner
   * @param {Number} nwk
   * @param {Number} ep
   * @param {Object} props
   */
  'lamp': function * (nwk, ep, props) {
    log.trace(`开始同步远端Lamp ${nwk}/${ep}\n`, props);
    const { payload } = props;
    if (payload) {
      const { level } = payload;
      const frame = onOfLamp.turn(nwk, ep, !!level);
      const srsp = yield new Promise((resolve, reject) => {
        transfer.once('srsp', (buf, frameObj) => {
          log.trace('收到SRSP', buf, '\n', frameObj);
          resolve(buf);
        });
        transfer.write(frame, err => {
          if (err) { reject(err) } else {
            log.trace('指令帧已发送至串口\n', frame)
          }
        });
      });
      const srspObj = parseSrsp(srsp);
      if (!srspObj.success) {
        const err = new Error(`Sync ${nwk}/${ep} failed. SRSP status ${srspObj.status}.`);
        log.error(err);
        throw err;
      }
      log.trace('指令帧下达成功', srsp, '\n', srspObj);
    }
  }
};

/**
 * 不可信地设置app属性
 * @param {Number} nwk
 * @param {Number} ep
 * @param {Object} props - 属性对象
 * @return {Promise} - resolve 更新后的app字面量对象
 */
function * setAppProperty (nwk, ep, props) {
  expect(nwk).to.be.a('number');
  expect(ep).to.be.a('number');
  expect(props).to.be.an('object');
  const { App } = models;
  const app = yield App.findOne({device: nwk, endPoint: ep}).exec();
  const { type: appType } = app;
  // app sync handler
  if (!syncRemoteProperty.hasOwnProperty(appType)) {
    const err = new Error(`${appType}远端同步处理器未定义`);
    log.error(err);
    throw err;
  }
  yield syncRemoteProperty[appType](nwk, ep, props);
  const finalApp = yield App.findOneAndUpdate(
      {device: nwk, endPoint: ep},
      props,
      { 'new': true }
    ).exec();
  return finalApp.toObject();
}
setAppProperty = co.wrap(setAppProperty);


/**
 * @fires areq - 解析好的AREQ指令帧实例
 * @fires postAreq - AREQ指令帧处理完毕
 */
class Client extends EventEmitter {
  constructor(transfer, frameMap, models) {
    super();
    this._models = models;
    this._frameMap = frameMap;
    this._transfer = transfer;
    this._transfer.on('areq', this._handleTransferAreq.bind(this));
  }
  _handleTransferAreq(buf) {
    const areq = this._frameMap.genAreqInsByBuf(buf);
    /**
     * @event areq
     * @type {Frame}
     */
    this.emit('areq', areq);
    this._handleAreqFeedback(areq);
  }

  * _handle_ZdoEndDeviceAnnceInd (areq) {
    const { SrcAddr, NwkAddr, IEEEAddr, DeviceType } = areq.parsed;
    const { Device } = this._models;
    yield Device
      .find()
      .or([{nwk: NwkAddr}, {ieee: IEEEAddr}])
      .remove()
      .exec();
    const device = yield Device.create({
      nwk: NwkAddr,
      ieee: IEEEAddr,
      type: DeviceType,
      name: `新设备 @${NwkAddr}`,
    });
    log.info(`新设备已加入 @${NwkAddr}\n`, areq.parsed);
  }

  /**
   * 根据AREQ，修改数据库，并发出一些事件
   * @param {Frame} areq
   */
  _handleAreqFeedback(areq) {
    const handlerName = `_handle_${areq.name}`;
    if (!(handlerName in this)) {
      const err = `${handlerName} 处理器未定义`;
      log.error(err);
      throw new Error(err);
    }
    co.wrap(this[handlerName].bind(this))(areq)
      .then(() => {
        /**
         * @event postAreq
         * @type {Frame}
         */
        this.emit('post-areq', areq)
      })
      .catch(err => {
        log.error(`${handlerName} 处理器出错\n`, err);
        this.emit('error', err);
      })
  }
}
Object.defineProperties(Client, {
  setAppProperty: {
    value: setAppProperty, writable: false, enumerable: true, configurable: false
  }
});

const client = new Client(
  transfer,
  frameMap,
  models
);

module.exports = {
  client,
  setAppProperty: setAppProperty,
};
