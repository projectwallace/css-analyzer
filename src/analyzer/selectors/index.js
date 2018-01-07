const arrayUniq = require('array-uniq')

module.exports = selectors => {
  const all = selectors
  const unique = arrayUniq(all)
  const js = require('./js')(all)
  const id = require('./id')(all)
  const universal = require('./universal')(all)
  const specificity = require('./specificity')(all)
  const identifiers = require('./identifiers')(all)

  return {
    total: all.length,
    totalUnique: unique.length,
    js,
    id,
    universal,
    specificity,
    identifiers
  }
}
