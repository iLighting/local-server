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
        this.emit('postAreq', areq)
      })
      .catch(err => {
        log.error(`${handlerName} 处理器出错\n`, err);
        this.emit('error', err);
      })
  }
}

const client = new Client(
  transfer,
  frameMap,
  models
);

module.exports = client;
