const uniquer = require('../../utils/uniquer')

const ID_REGEX = /(?![^[]*])#/

module.exports = selectors => {
  const all = selectors.filter(selector => ID_REGEX.test(selector))

  return {
    total: all.length,
    ...uniquer(all)
  }
}
