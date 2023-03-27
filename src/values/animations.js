import {
  is_dimension,
  is_function,
  is_identifier,
  is_operator
} from '../css-node.js'

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
    let type = child.type
    // Right after a ',' we start over again
    if (is_operator(type)) {
      return durationFound = false
    }
    if (is_dimension(type) && durationFound === false) {
      durationFound = true
      return durations.push(stringifyNode(child))
    }
    if (is_identifier(type) && timingKeywords.has(child.name)) {
      return timingFunctions.push(stringifyNode(child))
    }
    if (is_function(type) && (child.name === 'cubic-bezier' || child.name === 'steps')) {
      return timingFunctions.push(stringifyNode(child))
    }
  })

  return [durations, timingFunctions]
}
