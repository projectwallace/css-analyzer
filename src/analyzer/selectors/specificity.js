const specificity = require('specificity')
const arrayUniq = require('array-uniq')

module.exports = selectors => {
  const all = arrayUniq(selectors)
    .sort()
    .sort(specificity.compare)
    .reverse()

  const top = count => {
    return [...all]
      .slice(0, count)
      .map(selector => {
        const spec = specificity
          .calculate(selector)
          .shift()
          .specificityArray

        return {
          selector,
          specificity: {
            a: spec[0],
            b: spec[1],
            c: spec[2],
            d: spec[3]
          }
        }
      })
  }

  return {
    top: top(5)
  }
}
