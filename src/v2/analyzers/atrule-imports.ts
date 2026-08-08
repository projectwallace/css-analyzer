import { NODE_TYPES, is_atrule, type AnyNode, type Atrule } from '@projectwallace/css-parser'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../internals/count-collection.js'
import type { AnalyzerInstance } from '../core.js'

export type AtruleImportsOptions = { locations?: boolean }

export function atruleImports(
	options: AtruleImportsOptions = {},
): AnalyzerInstance<CountResult | CountResultWithLocations> {
	const collection = new CountCollection(options.locations === true)

	return {
		subscribes: [NODE_TYPES.AT_RULE],
		visit(node: AnyNode): void {
			if (!is_atrule(node)) return
			if ((node.name?.toLowerCase() ?? '') !== 'import') return
			const n = node as Atrule
			if (n.has_prelude) {
				collection.add(n.prelude.text, n.line, n.column, n.start, n.length)
			}
		},
		collect() {
			return collection.collect()
		},
	}
}
