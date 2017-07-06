module.exports = declarations => {
  const all = declarations
    .filter(value => value.important)

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
