const specificity = require('specificity')

module.exports = selectors => {
  const all = [...selectors]
    .sort()
    .reverse()
    .sort(specificity.compare)
    .reverse()

  const top = count => {
    return [...all].slice(0, count).map(selector => {
      const [a, b, c, d] = specificity
        .calculate(selector)
        .shift().specificityArray

      return {
        value: selector,
        specificity: {a, b, c, d}
      }
    })
  }

  return {
    top: top(5)
  }
}
