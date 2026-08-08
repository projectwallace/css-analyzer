import {
	NODE_TYPES,
	is_declaration,
	type AnyNode,
	type Declaration,
} from '@projectwallace/css-parser'
import { isValuePrefixed } from '../../../values/vendor-prefix.js'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../../internals/count-collection.js'
import type { AnalyzerInstance } from '../../core.js'

export type VendorPrefixedValuesOptions = { locations?: boolean }

export function vendorPrefixedValues(
	options: VendorPrefixedValuesOptions = {},
): AnalyzerInstance<CountResult | CountResultWithLocations> {
	const collection = new CountCollection(options.locations === true)

	return {
		subscribes: [NODE_TYPES.DECLARATION],
		visit(node: AnyNode): void {
			if (!is_declaration(node)) return
			const decl = node as Declaration
			if (!decl.value) return
			const vl = decl.value
			isValuePrefixed(vl, (prefixed) => {
				collection.add(prefixed.toLowerCase(), vl.line, vl.column, vl.start, vl.length)
			})
		},
		collect() {
			return collection.collect()
		},
	}
}
