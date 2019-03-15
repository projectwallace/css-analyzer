const uniquer = require('../../utils/uniquer')

module.exports = atRules => {
  const all = atRules
    .filter(({type}) => type === 'font-face')
    .map(({descriptors}) => descriptors)

  // Tricky bit: uniqueness will be based on the `src` of the @font-face
  const unique = uniquer(all.map(({src}) => src)).unique.map(
    ({count, value}) => {
      // Once we have a list of unique @font-faces,
      // we'll map it back to the original values again
      return {
        count,
        value: all.find(({src}) => src === value)
      }
    }
  )

  return {
    total: all.length,
    unique,
    totalUnique: unique.length
  }
}
