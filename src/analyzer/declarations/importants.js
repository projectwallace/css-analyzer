module.exports = declarations => {
  const all = declarations
    .map(declaration => declaration.value)
    .filter(value => value.endsWith('!important'))

  const share = (() => {
    // Catch divide by zero exception
    if (declarations.size() === 0) {
      return 0
    }

    return all.size() / declarations.size()
  })()

  return {
    total: all.size(),
    share
  }
}
