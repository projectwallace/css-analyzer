module.exports = tree => {
  const declarations = []

  tree.walkDecls(declaration => {
    declarations.push({
      // Need to prefix with the 'before', otherwise PostCSS will
      // trim off any browser hacks prefixes like * or _
      property: declaration.raws.before.trim() + declaration.prop,
      value: declaration.value,
      important: Boolean(declaration.important)
    })
  })

  return declarations
}
