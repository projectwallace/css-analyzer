const uniquer = require('../../utils/uniquer')

module.exports = atRules => {
  const all = atRules
    .filter(rule => rule.type === 'font-face')
    .map(rule => rule.descriptors)

  // Tricky bit: uniqueness will be based on the `src` of the @font-face
  const unique = uniquer(
    all.map(ff => ff.src)
  ).unique.map(item => {
    // Once we have a list of unique @font-faces,
    // we'll map it back to the original values again
    return {
      count: item.count,
      value: all.find(ff => ff.src === item.value)
    }
  })

  return {
    total: all.length,
    unique,
    totalUnique: unique.length
  }
}
