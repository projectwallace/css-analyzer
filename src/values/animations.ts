import { KeywordSet } from '../keyword-set.js'
import { keywords } from './values.js'
import { Operator, Dimension, Identifier, Func } from '../css-tree-node-types.js'
import type { CssNode, List } from 'css-tree'

const TIMING_KEYWORDS = new KeywordSet(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'step-start', 'step-end'])

const TIMING_FUNCTION_VALUES = new KeywordSet(['cubic-bezier', 'steps'])

export function analyzeAnimation(children: List<CssNode>, cb: ({ type, value }: { type: string; value: CssNode }) => void) {
	let durationFound = false

	for (let child of children) {
		let type = child.type
		// @ts-expect-error TODO: fix this
		let name = child.name

		// Right after a ',' we start over again
		if (type === Operator) {
			durationFound = false
		} else if (type === Dimension && durationFound === false) {
			// The first Dimension is the duration, the second is the delay
			durationFound = true
			cb({
				type: 'duration',
				value: child,
			})
		} else if (type === Identifier) {
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
		} else if (type === Func && TIMING_FUNCTION_VALUES.has(name)) {
			cb({
				type: 'fn',
				value: child,
			})
		}
	}
}
