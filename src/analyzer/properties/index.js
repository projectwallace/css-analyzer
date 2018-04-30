const uniquer = require('../../utils/uniquer')

module.exports = declarations => {
  const all = declarations
    .map(declaration => declaration.property)

  const prefixed = require('./prefixed')(all)

  return {
    total: all.length,
    ...uniquer(all),
    prefixed
  }
}
