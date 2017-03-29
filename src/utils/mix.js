function wrap2ReturnPromise(func) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      func(...args, (err, ...cbArgs) => {
        if (err) {
          reject(err)
        } else {
          resolve(cbArgs)
        }
      })
    })
  }
}

/**
 * 打开浏览器
 * 
 * @param {String} url 
 * @param {Boolean} appMode 
 */
function openBrowser(url, appMode) {

}

module.exports = {
  wrap2ReturnPromise
};