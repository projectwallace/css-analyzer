import { KeywordSet } from "../keyword-set.js"

const timingKeywords = new KeywordSet([
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'linear',
  'step-start',
  'step-end',
])

const TIMING_FUNCTION_VALUES = new KeywordSet([
  'cubic-bezier',
  'steps'
])

/** @param {import('css-tree').List} children */
export function destructure_animation(children) {
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
      return durations.push(child)
    }
    if (type === 'Identifier' && timingKeywords.has(child.name)) {
      return timingFunctions.push(child)
    }
    if (type === 'Function' && TIMING_FUNCTION_VALUES.has(child.name)) {
      return timingFunctions.push(child)
    }
  })

  return [durations, timingFunctions]
}
