const splitLines = require('split-lines')

module.exports = ({rawCss, atRules, selectors, declarations}) => {
  const totalLinesOfCode = splitLines(rawCss).length
  const totalSourceLinesOfCode =
    atRules.length + selectors.length + declarations.length

  return {
    total: totalLinesOfCode,
    sourceLinesOfCode: {
      total: totalSourceLinesOfCode
    }
  }
}
