import { KeywordSet } from '../keyword-set.js'
import { keywords } from './values.js'
import type { CSSNode } from '@projectwallace/css-parser'
import { OPERATOR, DIMENSION, IDENTIFIER, FUNCTION } from '@projectwallace/css-parser'

const TIMING_KEYWORDS = new KeywordSet(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end'])

const TIMING_FUNCTION_VALUES = new KeywordSet(['cubic-bezier', 'steps'])

export function analyzeAnimation(children: CSSNode[], cb: ({ type, value }: { type: string; value: CSSNode }) => void) {
	let durationFound = false

	for (let child of children) {
		let type = child.type
		let name = child.name

		// Right after a ',' we start over again
		if (type === OPERATOR) {
			durationFound = false
		} else if (type === DIMENSION && durationFound === false) {
			// The first Dimension is the duration, the second is the delay
			durationFound = true
			cb({
				type: 'duration',
				value: child,
			})
		} else if (type === IDENTIFIER) {
			if (TIMING_KEYWORDS.has(name)) {
				cb({
					type: 'fn',
					value: child,
				})
			} else if (keywords.has(name)) {
				cb({
					type: 'keyword',
					value: child,
				})
			}
		} else if (type === FUNCTION && TIMING_FUNCTION_VALUES.has(name)) {
			cb({
				type: 'fn',
				value: child,
			})
		}
	}
}
