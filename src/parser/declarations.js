module.exports = tree => {
  const declarations = []

  tree.walkDecls(declaration => {
    declarations.push({
      property: declaration.prop,
      value: declaration.value,
      important: Boolean(declaration.important)
    })
  })

  return declarations
}
