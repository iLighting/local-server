
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

module.exports = {
  wrap2ReturnPromise
};