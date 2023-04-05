import { KeywordSet } from "../keyword-set.js"

const timingKeywords = new KeywordSet([
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
  let durations = []
  let timingFunctions = []

  children.forEach(child => {
    let type = child.type

    // Right after a ',' we start over again
    if (type === 'Operator') {
      return durationFound = false
    }
    if (type === 'Dimension' && durationFound === false) {
      durationFound = true
      return durations.push(stringifyNode(child))
    }
    if (type === 'Identifier' && timingKeywords.has(child.name)) {
      return timingFunctions.push(stringifyNode(child))
    }
    if (type === 'Function'
      && (
        child.name === 'cubic-bezier' || child.name === 'steps'
      )
    ) {
      return timingFunctions.push(stringifyNode(child))
    }
  })

  return [durations, timingFunctions]
}
