module.exports = declarations => {
  const all = declarations.filter(value => value.important)

  const share = (() => {
    // Catch divide by zero exception
    if (declarations.length === 0) {
      return 0
    }

    return all.length / declarations.length
  })()

  return {
    total: all.length,
    share
  }
}
