import {
	NODE_TYPES,
	is_declaration,
	is_operator,
	type AnyNode,
	type Declaration,
} from '@projectwallace/css-parser'
import { analyzeAnimation } from '../../../values/animations.js'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../../internals/count-collection.js'
import type { AnalyzerInstance } from '../../core.js'

export type AnimationsOptions = { locations?: boolean }

export type AnimationsResult = {
	durations: CountResult | CountResultWithLocations
	timingFunctions: CountResult | CountResultWithLocations
}

export function animations(options: AnimationsOptions = {}): AnalyzerInstance<AnimationsResult> {
	const withLocations = options.locations === true
	const durations = new CountCollection(withLocations)
	const timingFunctions = new CountCollection(withLocations)

	return {
		subscribes: [NODE_TYPES.DECLARATION],
		visit(node: AnyNode): void {
			if (!is_declaration(node)) return
			const decl = node as Declaration
			if (!decl.value) return
			const prop = decl.property.toLowerCase()
			const vl = decl.value

			if (prop === 'transition' || prop === 'animation') {
				analyzeAnimation(vl, (item) => {
					if (item.type === 'duration') {
						durations.add(item.value.text.toLowerCase(), vl.line, vl.column, vl.start, vl.length)
					} else if (item.type === 'fn') {
						timingFunctions.add(item.value.text.toLowerCase(), vl.line, vl.column, vl.start, vl.length)
					}
				})
			} else if (prop === 'animation-duration' || prop === 'transition-duration') {
				for (const child of vl.children) {
					if (!is_operator(child)) {
						const text = child.text
						durations.add(
							text.toLowerCase().includes('var(') ? text : text.toLowerCase(),
							child.line,
							child.column,
							child.start,
							child.length,
						)
					}
				}
			} else if (prop === 'transition-timing-function' || prop === 'animation-timing-function') {
				for (const child of vl.children) {
					if (!is_operator(child)) {
						timingFunctions.add(child.text, child.line, child.column, child.start, child.length)
					}
				}
			}
		},
		collect(): AnimationsResult {
			return { durations: durations.collect(), timingFunctions: timingFunctions.collect() }
		},
	}
}
