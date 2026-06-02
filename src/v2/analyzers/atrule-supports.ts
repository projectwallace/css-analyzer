import { NODE_TYPES, is_atrule, type AnyNode, type Atrule } from '@projectwallace/css-parser'
import { isSupportsBrowserhack } from '../../atrules/atrules.js'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../internals/count-collection.js'
import type { AnalyzerInstance } from '../core.js'

export type AtruleSupportsOptions = { locations?: boolean }

export type AtruleSupportsResult = {
	queries: CountResult | CountResultWithLocations
	browserhacks: CountResult | CountResultWithLocations
}

export function atruleSupports(
	options: AtruleSupportsOptions = {},
): AnalyzerInstance<AtruleSupportsResult> {
	const withLocations = options.locations === true
	const queries = new CountCollection(withLocations)
	const hacks = new CountCollection(withLocations)

	return {
		subscribes: [NODE_TYPES.AT_RULE],
		visit(node: AnyNode): void {
			if (!is_atrule(node)) return
			if ((node.name?.toLowerCase() ?? '') !== 'supports') return
			const n = node as Atrule
			if (!n.has_prelude) return
			queries.add(n.prelude.text, n.line, n.column, n.start, n.length)
			isSupportsBrowserhack(n.prelude, (hack) => {
				hacks.add(hack, n.line, n.column, n.start, n.length)
			})
		},
		collect(): AtruleSupportsResult {
			return { queries: queries.collect(), browserhacks: hacks.collect() }
		},
	}
}
