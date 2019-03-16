const uniquer = require('../../utils/uniquer.js')

module.exports = declarations => {
  const all = declarations.map(({property}) => property)

  const prefixed = require('./prefixed.js')(all)
  const browserhacks = require('./browserhacks.js')(all)

  return {
    total: all.length,
    ...uniquer(all),
    prefixed,
    browserhacks
  }
}
