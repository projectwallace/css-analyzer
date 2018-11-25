module.exports = (atrules, selectors, properties, values) => {
  return [atrules.mediaqueries, atrules.supports, selectors, properties, values]
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
}
