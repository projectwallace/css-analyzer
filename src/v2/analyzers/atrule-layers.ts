import { NODE_TYPES, is_atrule, type AnyNode, type Atrule } from '@projectwallace/css-parser'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../internals/count-collection.js'
import type { AnalyzerInstance } from '../core.js'

export type AtruleLayersOptions = { locations?: boolean }

export function atruleLayers(
	options: AtruleLayersOptions = {},
): AnalyzerInstance<CountResult | CountResultWithLocations> {
	const collection = new CountCollection(options.locations === true)

	return {
		subscribes: [NODE_TYPES.AT_RULE],
		visit(node: AnyNode): void {
			if (!is_atrule(node)) return
			if ((node.name?.toLowerCase() ?? '') !== 'layer') return
			const n = node as Atrule
			if (!n.has_prelude) {
				collection.add('<anonymous>', n.line, n.column, n.start, n.length)
			} else {
				for (const layer of n.prelude.text.split(',').map((s: string) => s.trim())) {
					collection.add(layer, n.line, n.column, n.start, n.length)
				}
			}
		},
		collect() {
			return collection.collect()
		},
	}
}
