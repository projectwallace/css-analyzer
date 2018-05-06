module.exports = tree => {
  const declarations = []
  const IGNORE_FROM_PARENT = 'font-face'

  tree.walkDecls(declaration => {
    if (declaration.parent.name === IGNORE_FROM_PARENT) {
      return
    }

    declarations.push({
      property: declaration.prop,
      value: declaration.value,
      important: Boolean(declaration.important)
    })
  })

  return declarations
}
