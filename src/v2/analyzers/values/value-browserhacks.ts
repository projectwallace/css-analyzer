import {
	NODE_TYPES,
	is_declaration,
	is_custom,
	type AnyNode,
	type Declaration,
} from '@projectwallace/css-parser'
import { isValueBrowserhack } from '../../../values/browserhacks.js'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../../internals/count-collection.js'
import type { AnalyzerInstance } from '../../core.js'

export type ValueBrowserhacksOptions = { locations?: boolean }

export function valueBrowserhacks(
	options: ValueBrowserhacksOptions = {},
): AnalyzerInstance<CountResult | CountResultWithLocations> {
	const collection = new CountCollection(options.locations === true)

	return {
		subscribes: [NODE_TYPES.DECLARATION],
		visit(node: AnyNode): void {
			if (!is_declaration(node)) return
			const decl = node as Declaration
			if (!decl.value || is_custom(decl.property)) return
			const vl = decl.value
			isValueBrowserhack(vl, (hack) => {
				collection.add(hack, vl.line, vl.column, vl.start, vl.length)
			})
		},
		collect() {
			return collection.collect()
		},
	}
}
