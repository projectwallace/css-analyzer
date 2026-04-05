import { KeywordSet } from '../keyword-set.js'
import { keywords } from './values.js'
import type { CSSNode, Value } from '@projectwallace/css-parser'
import { is_identifier, is_operator, is_dimension, is_function } from '@projectwallace/css-parser'

const TIMING_KEYWORDS = new KeywordSet(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end'])

const TIMING_FUNCTION_VALUES = new KeywordSet(['cubic-bezier', 'steps'])

export function analyzeAnimation(value: Value, cb: ({ type, value }: { type: string; value: CSSNode }) => void) {
	let durationFound = false

	for (let node of value) {
		// Right after a ',' we start over again
		if (is_operator(node)) {
			durationFound = false
		} else if (is_dimension(node) && durationFound === false) {
			// The first Dimension is the duration, the second is the delay
			durationFound = true
			cb({
				type: 'duration',
				value: node,
			})
		} else if (is_identifier(node)) {
			if (TIMING_KEYWORDS.has(node.name)) {
				cb({
					type: 'fn',
					value: node,
				})
			} else if (keywords.has(node.name)) {
				cb({
					type: 'keyword',
					value: node,
				})
			}
		} else if (is_function(node) && TIMING_FUNCTION_VALUES.has(node.name)) {
			cb({
				type: 'fn',
				value: node,
			})
		}
	}
}
