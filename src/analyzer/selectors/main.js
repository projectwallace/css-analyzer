const arrayUniq = require('array-uniq')

module.exports = selectors => {
  const all = selectors
  const unique = arrayUniq(all).sort()
  const js = require('./js')(all)
  const id = require('./id')(all)
  const universal = require('./universal')(all)
  const specificity = require('./specificity')(all)

  return {
    total: all.length,
    totalUnique: unique.length,
    js,
    id,
    universal,
    specificity
  }
}
