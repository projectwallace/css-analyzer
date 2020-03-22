const uniquer = require('../../utils/uniquer')

module.exports = atRules => {
  const all = atRules
    .filter(({type}) => type === 'font-face')
    .map(({declarations}) => declarations)

  // Tricky bit: uniqueness will be based on the `src` of the @font-face
  const allSrcValues = all.map(
    declarations =>
      declarations.find(descriptor => descriptor.property === 'src').value
  )

  // Once we have a list of unique @font-face sources,
  // we'll map it back to the original rules again
  const unique = uniquer(allSrcValues).unique.map(({count, value}) => {
    return {
      count,
      value: all.find(declarations =>
        declarations.find(descriptor => descriptor.value === value)
      )
    }
  })

  return {
    total: all.length,
    unique,
    totalUnique: unique.length
  }
}
