// Miscellaneous at-rules: @property (registered custom properties), @function, @scope.
// Also tracks overall atrule complexity and nesting depth.

import { NODE_TYPES, is_atrule, type AnyNode, type Atrule } from '@projectwallace/css-parser'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../internals/count-collection.js'
import { AggregateCollection, type AggregateResult } from '../internals/aggregate-collection.js'
import type { AnalyzerInstance, WalkContext } from '../core.js'

export type AtruleMiscOptions = { locations?: boolean }

export type AtruleMiscResult = {
	registeredProperties: CountResult | CountResultWithLocations
	functions: CountResult | CountResultWithLocations
	scopes: CountResult | CountResultWithLocations
	complexity: AggregateResult
	nesting: AggregateResult
}

export function atruleMisc(options: AtruleMiscOptions = {}): AnalyzerInstance<AtruleMiscResult> {
	const withLocations = options.locations === true
	const registeredProperties = new CountCollection(withLocations)
	const functions = new CountCollection(withLocations)
	const scopes = new CountCollection(withLocations)
	const complexity = new AggregateCollection()
	const nesting = new AggregateCollection()

	return {
		subscribes: [NODE_TYPES.AT_RULE],
		visit(node: AnyNode, ctx: WalkContext): void {
			if (!is_atrule(node)) return
			const n = node as Atrule
			const name = n.name?.toLowerCase() ?? ''
			nesting.push(ctx.depth)

			if (!n.has_prelude) {
				complexity.push(name === 'layer' ? 2 : 1)
				return
			}

			let c = 1
			if (name === 'property') {
				registeredProperties.add(n.prelude.text, n.line, n.column, n.start, n.length)
			} else if (name === 'function') {
				const prelude = n.prelude.text
				const fname = prelude.includes('(') ? prelude.slice(0, prelude.indexOf('(')).trim() : prelude.trim()
				functions.add(fname, n.line, n.column, n.start, n.length)
			} else if (name === 'scope') {
				scopes.add(n.prelude.text, n.line, n.column, n.start, n.length)
			}
			complexity.push(c)
		},
		collect(): AtruleMiscResult {
			return {
				registeredProperties: registeredProperties.collect(),
				functions: functions.collect(),
				scopes: scopes.collect(),
				complexity: complexity.collect(),
				nesting: nesting.collect(),
			}
		},
	}
}
