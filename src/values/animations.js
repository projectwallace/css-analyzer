const timingKeywords = new Set([
  'linear',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'step-start',
  'step-end',
])

export function analyzeAnimation(children, stringifyNode) {
  let durationFound = false
  const durations = []
  const timingFunctions = []

  children.forEach(child => {
    // Right after a ',' we start over again
    if (child.type === 'Operator') {
      return durationFound = false
    }
    if (child.type === 'Dimension' && durationFound === false) {
      durationFound = true
      return durations.push(stringifyNode(child))
    }
    if (child.type === 'Identifier' && timingKeywords.has(child.name)) {
      return timingFunctions.push(stringifyNode(child))
    }
    if (child.type === 'Function'
      && (
        child.name === 'cubic-bezier' || child.name === 'steps'
      )
    ) {
      return timingFunctions.push(stringifyNode(child))
    }
  })

  return [durations, timingFunctions]
}
