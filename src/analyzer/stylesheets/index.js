module.exports = (
  raw,
  atrules,
  rules,
  selectors,
  declarations,
  properties,
  values
) => {
  const size = Buffer.byteLength(raw, 'utf8')
  const simplicity = require('./simplicity.js')(rules, selectors)
  const cohesion = require('./cohesion.js')(rules, declarations)
  const browserhacks = require('./browserhacks.js')(
    atrules,
    selectors,
    properties,
    values
  )

  return {
    size,
    simplicity,
    cohesion,
    browserhacks
  }
}
