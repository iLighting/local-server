const { EventEmitter } = require('events');
const co = require('co');
const { getModels } = require('../db');

const models = getModels();

/**
 * @fires change
 */
class Sys extends EventEmitter {
  constructor({models}) {
    super();
    this._models = models;
    this._cache = {};
  }

  * _currentStatus() {
    const { SysStatus } = this._models;
    const re = yield SysStatus.find().exec();
    if (re.length == 0) {
      throw new Error('SysStatus 未初始化')
    }
    return re[0]
  }

  /**
   * 初始化系统状态
   * @param {Object} obj
   * @return {Promise}
   */
  createStatus(obj) {
    const self = this;
    const { SysStatus } = this._models;
    return co.wrap(function * () {
      yield SysStatus.create(obj);
      self._cache = obj;
    })();
  }

  /**
   * 设置系统状态
   * @param {Object} obj
   * @return {Promise}
   * @public
   */
  setStatus(obj) {
    const self = this;
    return co.wrap(function * () {
      const status = yield self._currentStatus();
      yield status.update(obj).exec();
      Object.assign(self._cache, obj);
      /**
       * @event change
       */
      self.emit('change', Object.assign({}, self._cache));
    })();
  }

  /**
   * 获取系统状态
   * @return {Object}
   */
  getStatus() {
    return Object.assign({}, this._cache);
  }
}

let sysIns;

module.exports = {
  create() {
    if (!sysIns) { sysIns = new Sys({models}) }
    return sysIns;
  },
  getIns() {
    if (!sysIns) {
      throw new Error('sys 未初始化')
    }
    return sysIns;
  }
};