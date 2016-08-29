/**
 * @module
 */

const expect = require('chai').expect;

/**
 * 构造client消息体
 * @constructor
 * @param  {*} payload 负载
 * @param  {Error} [err] - 异常
 * @return {Object} 构造好的消息体
 */
function Msg(payload, err) {
  this.type = 'ok';
  this.payload = payload;
  if (err) {
    this.type = 'error';
    this.err = err.toString();
  }
}

module.exports = Msg;
