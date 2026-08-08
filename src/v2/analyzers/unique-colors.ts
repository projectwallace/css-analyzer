// Unique colors analyzer.
//
// Subscribes to DECLARATION nodes only. For each declaration we re-walk the
// value subtree (a small, bounded walk) looking for color tokens:
//   - HASH nodes starting with '#' (hex colors)
//   - IDENTIFIER nodes matching named / system / keyword colors
//   - FUNCTION nodes named rgb/rgba/hsl/hsla/hwb/lab/lch/oklab/oklch/color
//
// Property context guards false positives: identifiers inside font / font-family
// declarations are ignored (e.g. "Black" as a font family is not a color).

import {
	NODE_TYPES,
	walk,
	SKIP,
	is_hash,
	is_identifier,
	is_function,
	type AnyNode,
	type Declaration,
} from '@projectwallace/css-parser'
import { colorFunctions, colorKeywords, namedColors, systemColors } from '../../values/colors.js'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../internals/count-collection.js'
import type { AnalyzerInstance } from '../core.js'

const SKIPS_COLOR_LOOKUP = new Set(['font', 'font-family'])

export type UniqueColorsOptions = {
	locations?: boolean
}

export function uniqueColors(
	options: UniqueColorsOptions = {},
): AnalyzerInstance<CountResult | CountResultWithLocations> {
	const withLocations = options.locations === true
	const collection = new CountCollection(withLocations)

	return {
		subscribes: [NODE_TYPES.DECLARATION],

		visit(node: AnyNode): void {
			const decl = node as Declaration
			const value = decl.value
			if (!value) return

			const property = decl.property.toLowerCase()
			if (SKIPS_COLOR_LOOKUP.has(property)) return

			walk(value, (vn) => {
				if (is_hash(vn)) {
					const text = vn.text
					if (text && text.charCodeAt(0) === 35 /* # */) {
						collection.add(text.toLowerCase(), vn.line, vn.column, vn.start, vn.length)
					}
					return SKIP
				}

				if (is_identifier(vn)) {
					const ident = vn.text
					const len = ident.length
					// 3 === 'red'.length, 20 === 'lightgoldenrodyellow'.length
					if (len < 3 || len > 20) return SKIP

					if (
						colorKeywords.has(ident) ||
						namedColors.has(ident) ||
						systemColors.has(ident)
					) {
						collection.add(ident.toLowerCase(), vn.line, vn.column, vn.start, vn.length)
					}
					return SKIP
				}

				if (is_function(vn)) {
					if (colorFunctions.has(vn.name)) {
						collection.add(vn.text, vn.line, vn.column, vn.start, vn.length)
						return SKIP
					}
					// don't SKIP — colors can live inside gradients, var() fallbacks, etc.
				}
				return
			})
		},

		collect() {
			return collection.collect()
		},
	}
}
