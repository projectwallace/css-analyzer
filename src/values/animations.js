import { KeywordSet } from "../keyword-set.js"
import {
  Operator,
  Dimension,
  Identifier,
  Func,
} from '../css-tree-node-types.js'

const TIMING_KEYWORDS = new KeywordSet([
  'linear',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'step-start',
  'step-end',
])

const TIMING_FUNCTION_VALUES = new KeywordSet([
  'cubic-bezier',
  'steps'
])

export function analyzeAnimation(children, stringifyNode) {
  let durationFound = false
  /** @type {string[]} */
  let durations = []
  /** @type {string[]} */
  let timingFunctions = []

  children.forEach(child => {
    let type = child.type
    let name = child.name

    // Right after a ',' we start over again
    if (type === Operator) {
      return durationFound = false
    }
    if (type === Dimension && durationFound === false) {
      durationFound = true
      return durations.push(stringifyNode(child))
    }
    if (type === Identifier && TIMING_KEYWORDS.has(name)) {
      return timingFunctions.push(stringifyNode(child))
    }
    if (type === Func && TIMING_FUNCTION_VALUES.has(name)) {
      return timingFunctions.push(stringifyNode(child))
    }
  })

  return [durations, timingFunctions]
}
