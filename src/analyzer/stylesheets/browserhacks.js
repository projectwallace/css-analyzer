module.exports = (properties, values) => {
  const {total, totalUnique} = [properties, values]
    .map(metric => metric.browserhacks)
    .reduce(
      (totals, current) => {
        totals.total += current.total
        totals.totalUnique += current.totalUnique
        return totals
      },
      {
        total: 0,
        totalUnique: 0
      }
    )

  return {
    total,
    totalUnique
  }
}
