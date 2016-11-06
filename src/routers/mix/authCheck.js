
module.exports = function * (next) {
  if (this.state.userName) {
    yield next
  } else {
    this.throw(403, '未登录')
  }
  // yield next
}