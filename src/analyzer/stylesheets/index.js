module.exports = (raw, rules, selectors, declarations, values) => {
  const size = Buffer.byteLength(raw, 'utf8')
  const simplicity = require('./simplicity.js')(rules, selectors)
  const cohesion = require('./cohesion.js')(rules, declarations)
  const browserhacks = require('./browserhacks.js')(values)

  return {
    size,
    simplicity,
    cohesion,
    browserhacks
  }
}
