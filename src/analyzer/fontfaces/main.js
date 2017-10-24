module.exports = atRules => {
  const all = atRules
    .filter(rule => rule.type === 'font-face')
    .map(rule => rule.params)

  return {
    total: all.length
  }
}
