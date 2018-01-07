module.exports = atRules => {
  return {
    charsets: require('./charsets')(atRules),
    documents: require('./documents')(atRules),
    fontfaces: require('./fontfaces')(atRules),
    imports: require('./imports')(atRules),
    keyframes: require('./keyframes')(atRules),
    mediaqueries: require('./mediaqueries')(atRules),
    namespaces: require('./namespaces')(atRules),
    pages: require('./pages')(atRules),
    supports: require('./supports')(atRules)
  }
}
