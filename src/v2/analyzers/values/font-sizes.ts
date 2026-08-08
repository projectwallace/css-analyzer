import {
	NODE_TYPES,
	is_declaration,
	is_raw,
	type AnyNode,
	type Declaration,
} from '@projectwallace/css-parser'
import { destructure, SYSTEM_FONTS } from '../../../values/destructure-font-shorthand.js'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../../internals/count-collection.js'
import type { AnalyzerInstance } from '../../core.js'

export type FontSizesOptions = { locations?: boolean }

export function fontSizes(
	options: FontSizesOptions = {},
): AnalyzerInstance<CountResult | CountResultWithLocations> {
	const collection = new CountCollection(options.locations === true)

	return {
		subscribes: [NODE_TYPES.DECLARATION],
		visit(node: AnyNode): void {
			if (!is_declaration(node)) return
			const decl = node as Declaration
			if (!decl.value || is_raw(decl.value)) return
			const prop = decl.property.toLowerCase()
			const vl = decl.value
			const text = vl.text

			if (prop === 'font-size') {
				if (!SYSTEM_FONTS.has(text)) {
					const norm = text.toLowerCase()
					collection.add(norm.includes('var(') ? text : norm, vl.line, vl.column, vl.start, vl.length)
				}
			} else if (prop === 'font') {
				if (!SYSTEM_FONTS.has(text)) {
					const result = destructure(vl, () => {})
					if (result?.font_size) {
						collection.add(result.font_size.toLowerCase(), vl.line, vl.column, vl.start, vl.length)
					}
				}
			}
		},
		collect() {
			return collection.collect()
		},
	}
}
