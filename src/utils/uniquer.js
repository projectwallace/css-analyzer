module.exports = (values, sortFn) => {
  if (!sortFn) {
    sortFn = (a, b) => {
      return a.value
        .toLowerCase()
        .localeCompare(
          b.value.toLowerCase()
        )
    }
  }

  const reduced = Array.from(
    values.reduce((map, value) => {
      // Create a Map of unique values and their counts
      map.set(value, map.get(value) + 1 || 1)
      return map
    }, new Map())
  ).map(value => {
    // Create an array of [{value, count}]
    return {
      value: value[0],
      count: value[1]
    }
  }).sort(sortFn)

  return {
    unique: reduced.map(v => v.value),
    totalUnique: reduced.length,
    uniqueWithCount: reduced
  }
}
