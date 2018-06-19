module.exports = selectors => {
  const all = selectors
  const unique = [...new Set(all)]
  const js = require('./js')(all)
  const id = require('./id')(all)
  const universal = require('./universal')(all)
  const accessibility = require('./accessibility')(all)
  const specificity = require('./specificity')(all)
  const identifiers = require('./identifiers')(all)

  return {
    total: all.length,
    totalUnique: unique.length,
    js,
    id,
    universal,
    accessibility,
    specificity,
    identifiers
  }
}
