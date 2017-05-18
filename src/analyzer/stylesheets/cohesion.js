module.exports = (rules, declarations) => {
  const average = ((rules, declarations) => {
    if (declarations.total === 0) {
      return 0
    }

    return declarations.total / rules.total
  })(rules, declarations)

  return {
    average
  }
}
