const stringSortFn = require('string-natural-compare')

module.exports = (values, sortFn) => {
  sortFn = sortFn || stringSortFn.caseInsensitive

  // Create a Map of unique values and their counts
  const reduced = [
    ...values.reduce((map, value) => {
      return map.set(value, map.get(value) + 1 || 1)
    }, new Map())
  ]
    // Create an array of [{value, count}]
    .map(value => ({
      value: value[0],
      count: value[1]
    }))

  const sorted = reduced.map(el => el.value).sort(sortFn)
  const unique = sorted.map(value => reduced.find(r => r.value === value))

  return {
    unique,
    totalUnique: unique.length
  }
}
