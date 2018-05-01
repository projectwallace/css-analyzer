const uniquer = require('../../utils/uniquer')

const UNIVERSAL_REGEX = /(?![^[]*])\*/

module.exports = selectors => {
  const all = selectors
    .filter(selector => UNIVERSAL_REGEX.test(selector))

  return {
    total: all.length,
    ...uniquer(all)
  }
}
