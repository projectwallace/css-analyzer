// Tracks color format distribution: hex3/4/6/8, named, rgb, hsl, etc.
// Complements the uniqueColors analyzer which tracks unique color values.

import {
	NODE_TYPES,
	is_declaration,
	is_hash,
	is_identifier,
	is_function,
	walk,
	SKIP,
	type AnyNode,
	type Declaration,
} from '@projectwallace/css-parser'
import { colorFunctions, colorKeywords, namedColors, systemColors } from '../../../values/colors.js'
import { endsWith } from '../../../string-utils.js'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../../internals/count-collection.js'
import type { AnalyzerInstance } from '../../core.js'

const SKIPS_COLOR_LOOKUP = new Set(['font', 'font-family'])

export type ColorFormatsOptions = { locations?: boolean }

export function colorFormats(
	options: ColorFormatsOptions = {},
): AnalyzerInstance<CountResult | CountResultWithLocations> {
	const collection = new CountCollection(options.locations === true)

	return {
		subscribes: [NODE_TYPES.DECLARATION],
		visit(node: AnyNode): void {
			if (!is_declaration(node)) return
			const decl = node as Declaration
			if (!decl.value || SKIPS_COLOR_LOOKUP.has(decl.property.toLowerCase())) return

			walk(decl.value, (vn) => {
				if (is_hash(vn)) {
					const text = vn.text
					if (!text || text.charCodeAt(0) !== 35) return SKIP
					let len = text.length - 1
					if (endsWith('\\9', text) || endsWith('\\7', text)) len -= 2
					collection.add(`hex${len}`, vn.line, vn.column, vn.start, vn.length)
					return SKIP
				}
				if (is_identifier(vn)) {
					const ident = vn.text
					const l = ident.length
					if (l < 3 || l > 20) return SKIP
					if (colorKeywords.has(ident)) {
						collection.add(ident.toLowerCase(), vn.line, vn.column, vn.start, vn.length)
					} else if (namedColors.has(ident)) {
						collection.add('named', vn.line, vn.column, vn.start, vn.length)
					} else if (systemColors.has(ident)) {
						collection.add('system', vn.line, vn.column, vn.start, vn.length)
					}
					return SKIP
				}
				if (is_function(vn) && colorFunctions.has(vn.name)) {
					collection.add(vn.name.toLowerCase(), vn.line, vn.column, vn.start, vn.length)
					return SKIP
				}
			})
		},
		collect() {
			return collection.collect()
		},
	}
}
