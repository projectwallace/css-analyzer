module.exports = ({
  rawCss,
  atrules,
  rules,
  selectors,
  declarations,
  properties,
  values
}) => {
  const filesize = require('./size.js')(rawCss)
  const simplicity = require('./simplicity.js')(rules, selectors)
  const cohesion = require('./cohesion.js')(rules, declarations)
  const browserhacks = require('./browserhacks.js')(
    atrules,
    selectors,
    properties,
    values
  )

  return {
    size: filesize.uncompressed.totalBytes,
    filesize,
    simplicity,
    cohesion,
    browserhacks
  }
}
