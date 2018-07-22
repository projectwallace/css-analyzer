const isEmpty = rule => {
  return rule.declarationsCount === 0
}

module.exports = rules => {
  const all = rules
  const empty = rules.filter(isEmpty)

  return {
    total: all.length,
    empty: {
      total: empty.length
    }
  }
}
