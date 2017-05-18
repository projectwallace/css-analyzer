module.exports = (rules, selectors) => {
  if (selectors.total === 0) {
    return 0
  }

  return rules.total / selectors.total
}
