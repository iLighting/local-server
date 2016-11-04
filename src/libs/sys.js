const co = require('co');
const { EventEmitter } = require('events');
const _ = require('lodash');
const models = require('../db').getModels();
const { sys:log } = require('../utils/log');


const defaultSys = {
  status: {
    mode: 'manual',
    sceneId: ''
  }
};

/**
 * @fires change - 对象变化
 * @fires flush - 冲刷缓存
 */
class Sys extends EventEmitter {
  constructor() {
    super();
    this._isInit = false;
    this._dbCache = {};
  }

  /**
   * 初始化，应首先被调用
   * @public
   * @param {Object} [props]
   * @return {Promise}
   */
  initIns(props) {
    const self = this;
    if (self._isInit) throw new Error('重复initCache');
    return co.wrap(function * () {
      const { Sys } = models;
      const finalCache = _.cloneDeep(defaultSys);
      Object.keys(defaultSys).forEach(name => {
        if (props[name]) Object.assign(finalCache[name], props[name])
      });
      yield Sys.create(finalCache);
      self._dbCache = finalCache;
      self._isInit = true;
      return self;
    })();
  }

  /**
   * 返回系统对象（深复制）
   * @return {Object}
   */
  getSys() {
    if (!this._isInit) throw new Error('未initIns');
    return _.cloneDeep(this._dbCache);
  }

  /**
   * 合并系统对象，返回深复制系统对象
   * @param {Object} obj
   * @return {Object}
   */
  mergeSys(obj) {
    if (!this._isInit) throw new Error('未initIns');
    const oldSys = _.cloneDeep(this._dbCache);
    Object.assign(this._dbCache, obj);
    const sys = _.cloneDeep(this._dbCache);
    log.trace('系统状态已改变\n', sys);
    /**
     * @event change
     */
    this.emit('change', sys, oldSys);
    return sys;
  }

  /**
   * 指定名字合并系统对象，返回深复制系统对象
   * @param {String} name
   * @param {Object} obj
   * @return {Object}
   */
  mergeSysIn(name, obj) {
    const sys = this.getSys();
    Object.assign(sys[name], obj);
    return this.mergeSys(sys);
  }

  /**
   * 冲刷缓存
   * @return {Promise}
   */
  flush() {
    if (!this._isInit) throw new Error('未initIns');
    const self = this;
    return co.wrap(function * () {
      const { Sys } = models;
      const [sys] = yield Sys.find().exec();
      yield sys.update(self._dbCache).exec();
      log.trace('系统状态缓存已冲刷');
      /**
       * @event flush
       */
      self.emit('flush', self.getSys());
      return self;
    })();
  }
}

module.exports = new Sys();