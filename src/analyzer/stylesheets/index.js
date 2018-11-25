module.exports = (raw, rules, selectors, declarations, properties, values) => {
  const size = Buffer.byteLength(raw, 'utf8')
  const simplicity = require('./simplicity.js')(rules, selectors)
  const cohesion = require('./cohesion.js')(rules, declarations)
  const browserhacks = require('./browserhacks.js')(properties, values)

  return {
    size,
    simplicity,
    cohesion,
    browserhacks
  }
}
