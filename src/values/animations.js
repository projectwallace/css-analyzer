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

export function analyzeAnimation(children, cb) {
  let durationFound = false

  children.forEach(child => {
    let type = child.type
    let name = child.name

    // Right after a ',' we start over again
    if (type === Operator) {
      return durationFound = false
    }
    if (type === Dimension && durationFound === false) {
      durationFound = true
      return cb({
        type: 'duration',
        value: child,
      })
    }
    if (type === Identifier && TIMING_KEYWORDS.has(name)) {
      return cb({
        type: 'fn',
        value: child,
      })
    }
    if (type === Func && TIMING_FUNCTION_VALUES.has(name)) {
      return cb({
        type: 'fn',
        value: child,
      })
    }
  })
}
