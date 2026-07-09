import {
	NODE_TYPES,
	is_declaration,
	is_dimension,
	walk,
	SKIP,
	type AnyNode,
	type Declaration,
} from '@projectwallace/css-parser'
import {
	ContextCountCollection,
	type ContextCountResult,
	type ContextCountResultWithLocations,
} from '../../internals/context-count-collection.js'
import { basename } from '../../../properties/property-utils.js'
import type { AnalyzerInstance } from '../../core.js'

export type UnitsOptions = { locations?: boolean }

export function units(
	options: UnitsOptions = {},
): AnalyzerInstance<ContextCountResult | ContextCountResultWithLocations> {
	const collection = new ContextCountCollection(options.locations === true)

	return {
		subscribes: [NODE_TYPES.DECLARATION],
		visit(node: AnyNode): void {
			if (!is_declaration(node)) return
			const decl = node as Declaration
			if (!decl.value) return
			const prop = basename(decl.property)
			walk(decl.value, (vn) => {
				if (is_dimension(vn)) {
					collection.add(vn.unit.toLowerCase(), prop, vn.line, vn.column, vn.start, vn.length)
					return SKIP
				}
			})
		},
		collect() {
			return collection.collect()
		},
	}
}
