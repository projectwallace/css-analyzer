// Counts every at-rule by its normalized name (vendor prefix stripped).
// Produces the combined count that v9 tracks as `atrules.c()`.

import { NODE_TYPES, is_atrule, type AnyNode } from '@projectwallace/css-parser'
import { basename } from '../../properties/property-utils.js'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../internals/count-collection.js'
import type { AnalyzerInstance } from '../core.js'

export type AtruleAllOptions = { locations?: boolean }

export function atruleAll(
	options: AtruleAllOptions = {},
): AnalyzerInstance<CountResult | CountResultWithLocations> {
	const collection = new CountCollection(options.locations === true)

	return {
		subscribes: [NODE_TYPES.AT_RULE],
		visit(node: AnyNode): void {
			if (!is_atrule(node)) return
			const name = basename(node.name ?? '')
			collection.add(name, node.line, node.column, node.start, node.length)
		},
		collect() {
			return collection.collect()
		},
	}
}
