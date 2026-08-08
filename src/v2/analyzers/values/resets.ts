import { NODE_TYPES, is_declaration, type AnyNode, type Declaration } from '@projectwallace/css-parser'
import { SPACING_RESET_PROPERTIES } from '../../../properties/property-utils.js'
import { isValueReset } from '../../../values/values.js'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../../internals/count-collection.js'
import type { AnalyzerInstance } from '../../core.js'

export type ResetsOptions = { locations?: boolean }

export function resets(
	options: ResetsOptions = {},
): AnalyzerInstance<CountResult | CountResultWithLocations> {
	const collection = new CountCollection(options.locations === true)

	return {
		subscribes: [NODE_TYPES.DECLARATION],
		visit(node: AnyNode): void {
			if (!is_declaration(node)) return
			const decl = node as Declaration
			if (!decl.value) return
			const prop = decl.property.toLowerCase()
			if (!SPACING_RESET_PROPERTIES.has(prop)) return
			if (isValueReset(decl.value)) {
				collection.add(prop, decl.value.line, decl.value.column, decl.value.start, decl.value.length)
			}
		},
		collect() {
			return collection.collect()
		},
	}
}
