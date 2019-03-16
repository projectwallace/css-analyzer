module.exports = declarations => {
  const all = declarations.filter(value => value.important)

  return {
    total: all.length,
    share: declarations.length === 0 ? 0 : all.length / declarations.length
  }
}
