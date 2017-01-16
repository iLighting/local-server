const { EventEmitter } = require('events');
const _ = require('lodash');
const co = require('co');
const models = require('../db').getModels();
const appMsg = require('../utils/appMsg');
const { appFeedback: log } = require('../utils/log');
const zm = require('./zigbee');

/**
 * 处理AppFeedback
 * 解析APP_MSG_FEEDBACK，并更新数据库
 * 
 * @class AppFeedback
 * @extends {EventEmitter}
 * @fires handle - {nwk, ep, type, payload}
 */
class AppFeedback extends EventEmitter {
  constructor() {
    super();
    zm.on('handle', (name, msg) => {
      if (name == 'APP_MSG_FEEDBACK') this.handleFeedback(msg);
    });
  }

  /**
   * 解析APP_MSG_FEEDBACK，并更新数据库
   * 由应用类型自动查找appMsg parser
   * 
   * @param {Object} msg
   * 
   * @memberOf AppFeedback
   */
  handleFeedback(msg) {
    const self = this;
    const {cmd0, cmd1, nwk, ep, payload: pBuf} = msg;
    const { App } = models;
    co(function * () {
      log.trace(`开始解析反馈 @${nwk}.${ep}\n`, msg);
      const app = yield App.findOne({device: nwk, endPoint: ep}).exec();
      if (app) {
        if (appMsg[app.type]) {
          const [cmdName, parsedPayload] = appMsg[app.type].parse(pBuf);
          if (cmdName != 'unknow') {
            yield app.update({payload: parsedPayload});
            log.info(`应用反馈 ${app.type} @${nwk}.${ep}\n`, parsedPayload);;
            self.emit('handle', {
              nwk, ep,
              type: app.type,
              payload: parsedPayload
            });
          } else { log.warn(`无法解析 ${nwk}.${ep} 的反馈:`, pBuf) }
        } else { log.warn(`应用 ${app.type} @${nwk}.${ep} 无解析器`) }
      } else { log.warn(`${nwk}.${ep} 不在数据库中`); }
    }).catch(err => {
      log.error(err);
    })
  }
}

module.exports = new AppFeedback();