import {
	NODE_TYPES,
	is_declaration,
	is_function,
	walk,
	type AnyNode,
	type Declaration,
} from '@projectwallace/css-parser'
import { endsWith } from '../../../string-utils.js'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../../internals/count-collection.js'
import type { AnalyzerInstance } from '../../core.js'

export type GradientsOptions = { locations?: boolean }

export function gradients(
	options: GradientsOptions = {},
): AnalyzerInstance<CountResult | CountResultWithLocations> {
	const collection = new CountCollection(options.locations === true)

	return {
		subscribes: [NODE_TYPES.DECLARATION],
		visit(node: AnyNode): void {
			if (!is_declaration(node)) return
			const decl = node as Declaration
			if (!decl.value) return
			walk(decl.value, (vn) => {
				if (is_function(vn) && endsWith('gradient', vn.name)) {
					collection.add(vn.text, vn.line, vn.column, vn.start, vn.length)
				}
			})
		},
		collect() {
			return collection.collect()
		},
	}
}
