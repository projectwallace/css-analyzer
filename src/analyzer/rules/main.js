const Collection = require('css-collection')

module.exports = stylesheet => {
  const all = new Collection([])

  function addRule(rule) {
    if (rule.rules) {
      rule.rules.forEach(r => addRule(r))
    }

    if (rule.type === 'rule') {
      all.add(rule)
    }
  }

  stylesheet.rules.forEach(rule => addRule(rule))

  return {
    all: all.toArray(),
    stats: {
      total: all.size()
    }
  }
}
