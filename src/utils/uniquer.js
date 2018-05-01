module.exports = (values, sortFn) => {
  if (!sortFn) {
    sortFn = (a, b) => {
      return a
        .toLowerCase()
        .localeCompare(
          b.toLowerCase()
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
  })

  const sorted = reduced
    .map(el => el.value)
    .sort(sortFn)

  const final = sorted
    .map(el => {
      return reduced.find(r => r.value === el)
    })

  return {
    unique: final.map(v => v.value),
    totalUnique: final.length,
    uniqueWithCount: final
  }
}
