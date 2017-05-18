const PREFIX_RE = /-(?:webkit|moz|ms|o)-/i

module.exports = values => {
  const all = values.filter(property => property.match(PREFIX_RE))
  const unique = all.unique()

  const share = (() => {
    if (values.size() === 0) {
      return 0
    }

    return all.size() / values.size()
  })()

  return {
    total: all.size(),
    unique: unique.toArray(),
    totalUnique: unique.size(),
    share
  }
}
