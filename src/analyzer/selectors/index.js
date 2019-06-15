module.exports = selectors => {
  const all = selectors
  const unique = [...new Set(all)]
  const js = require('./js.js')(all)
  const id = require('./id.js')(all)
  const universal = require('./universal.js')(all)
  const accessibility = require('./accessibility.js')(all)
  const specificity = require('./specificity.js')(all)
  const identifiers = require('./identifiers.js')(all)
  const complexity = require('./complexity.js')(all)
  const browserhacks = require('./browserhacks.js')(all)

  return {
    total: all.length,
    totalUnique: unique.length,
    js,
    id,
    universal,
    accessibility,
    specificity,
    identifiers,
    complexity,
    browserhacks
  }
}
