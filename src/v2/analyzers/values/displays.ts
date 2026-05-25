import { NODE_TYPES, is_declaration, type AnyNode, type Declaration } from '@projectwallace/css-parser'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../../internals/count-collection.js'
import type { AnalyzerInstance } from '../../core.js'

export type DisplaysOptions = { locations?: boolean }

export function displays(
	options: DisplaysOptions = {},
): AnalyzerInstance<CountResult | CountResultWithLocations> {
	const collection = new CountCollection(options.locations === true)

	return {
		subscribes: [NODE_TYPES.DECLARATION],
		visit(node: AnyNode): void {
			if (!is_declaration(node)) return
			const decl = node as Declaration
			if (decl.property.toLowerCase() !== 'display') return
			if (!decl.value) return
			const vl = decl.value
			const text = vl.text
			collection.add(/var\(/i.test(text) ? text : text.toLowerCase(), vl.line, vl.column, vl.start, vl.length)
		},
		collect() {
			return collection.collect()
		},
	}
}
