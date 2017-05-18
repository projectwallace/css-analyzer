const PREFIX_RE = /^-(?:webkit|moz|ms|o)-/

module.exports = properties => {
  const all = properties.filter(property => property.match(PREFIX_RE))
  const unique = all.unique()

  const share = (() => {
    if (properties.size() === 0) {
      return 0
    }

    return all.size() / properties.size()
  })()

  return {
    total: all.size(),
    unique: unique.toArray(),
    totalUnique: unique.size(),
    share
  }
}
