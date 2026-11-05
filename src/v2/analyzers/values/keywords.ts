import {
	NODE_TYPES,
	is_declaration,
	is_raw,
	type AnyNode,
	type Declaration,
} from '@projectwallace/css-parser'
import { keywords as cssKeywords } from '../../../values/values.js'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../../internals/count-collection.js'
import type { AnalyzerInstance } from '../../core.js'

export type KeywordsOptions = { locations?: boolean }

export function keywords(
	options: KeywordsOptions = {},
): AnalyzerInstance<CountResult | CountResultWithLocations> {
	const collection = new CountCollection(options.locations === true)

	return {
		subscribes: [NODE_TYPES.DECLARATION],
		visit(node: AnyNode): void {
			if (!is_declaration(node)) return
			const decl = node as Declaration
			if (!decl.value || is_raw(decl.value)) return
			const vl = decl.value
			if (cssKeywords.has(vl.text)) {
				collection.add(vl.text.toLowerCase(), vl.line, vl.column, vl.start, vl.length)
			}
		},
		collect() {
			return collection.collect()
		},
	}
}
