const JS_RE = /[.|#|(?:="|')]js/i

module.exports = selectors => {
  const all = selectors.filter(selector => selector.match(JS_RE))
  const unique = all.unique()

  return {
    total: all.size(),
    unique: unique.toArray(),
    totalUnique: unique.size()
  }
}
