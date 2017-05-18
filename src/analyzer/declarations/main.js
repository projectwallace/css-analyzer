const Collection = require('css-collection')
const stripImportant = require('../../utils/css').stripImportant

module.exports = (rules, fontfaces, keyframes, pages) => {
  const _all = (() => {
    const collection = []
    const allRules = [...rules, ...pages, ...fontfaces]

    keyframes.forEach(rule => {
      if (rule.keyframes.length > 0) {
        rule.keyframes.forEach(keyframe => allRules.push(keyframe))
      }
    })

    if (allRules.length === 0) {
      return []
    }

    allRules.forEach(rule => {
      while (rule.declarations && rule.declarations.length) {
        const declaration = rule.declarations.shift()
        // Prevent pushing 'comment' nodes
        if (declaration.type === 'declaration') {
          collection.push(declaration)
        }
      }
    })

    return collection
  })()

  const all = new Collection(_all)
  const importants = require('./importants')(all)
  const unique = all.map(declaration => {
    return `${declaration.property} : ${stripImportant(declaration.value)}`
  }).unique()

  return {
    all: all.toArray(),
    stats: {
      total: all.size(),
      totalUnique: unique.size(),
      importants
    }
  }
}
