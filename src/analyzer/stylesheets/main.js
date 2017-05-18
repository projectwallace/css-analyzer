module.exports = (raw, rules, selectors, declarations) => {
  const size = Buffer.byteLength(raw, 'utf8')
  const simplicity = require('./simplicity')(rules, selectors)
  const cohesion = require('./cohesion')(rules, declarations)

  return {
    size,
    simplicity,
    cohesion
  }
}
