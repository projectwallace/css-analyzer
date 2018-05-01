const uniquer = require('../../utils/uniquer')

const JS_REGEX = /[.|#|(?:="|')]js/i

module.exports = selectors => {
  const all = selectors.filter(selector => JS_REGEX.test(selector))

  return {
    total: all.length,
    ...uniquer(all)
  }
}
