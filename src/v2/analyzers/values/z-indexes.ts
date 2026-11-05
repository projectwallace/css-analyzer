import { NODE_TYPES, is_declaration, type AnyNode, type Declaration } from '@projectwallace/css-parser'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../../internals/count-collection.js'
import type { AnalyzerInstance } from '../../core.js'

export type ZIndexesOptions = { locations?: boolean }

export function zIndexes(
	options: ZIndexesOptions = {},
): AnalyzerInstance<CountResult | CountResultWithLocations> {
	const collection = new CountCollection(options.locations === true)

	return {
		subscribes: [NODE_TYPES.DECLARATION],
		visit(node: AnyNode): void {
			if (!is_declaration(node)) return
			const decl = node as Declaration
			if (decl.property.toLowerCase() !== 'z-index') return
			if (!decl.value) return
			collection.add(decl.value.text, decl.value.line, decl.value.column, decl.value.start, decl.value.length)
		},
		collect() {
			return collection.collect()
		},
	}
}
