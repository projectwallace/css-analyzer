module.exports = ({
  rawCss,
  css,
  atrules,
  rules,
  selectors,
  properties,
  values
}) => {
  const filesize = require('./size.js')(rawCss)
  const simplicity = require('./simplicity.js')(rules, selectors)
  const cohesion = require('./cohesion.js')(rules)
  const browserhacks = require('./browserhacks.js')(
    atrules,
    selectors,
    properties,
    values
  )
  const linesOfCode = require('./lines-of-code')({
    rawCss,
    atRules: css.atRules,
    selectors: css.selectors,
    declarations: css.declarations
  })

  return {
    size: filesize.uncompressed.totalBytes,
    filesize,
    simplicity,
    cohesion,
    browserhacks,
    linesOfCode
  }
}
