// Context-aware color analyzer — like uniqueColors but also groups by property.
// Used by the compat layer to produce values.colors.itemsPerContext.

import {
	NODE_TYPES,
	walk,
	SKIP,
	is_hash,
	is_identifier,
	is_function,
	is_declaration,
	type AnyNode,
	type Declaration,
} from '@projectwallace/css-parser'
import { colorFunctions, colorKeywords, namedColors, systemColors } from '../../values/colors.js'
import { endsWith } from '../../string-utils.js'
import {
	ContextCountCollection,
	type ContextCountResult,
	type ContextCountResultWithLocations,
} from '../internals/context-count-collection.js'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../internals/count-collection.js'
import type { AnalyzerInstance } from '../core.js'

const SKIPS_COLOR_LOOKUP = new Set(['font', 'font-family'])

export type ColorsContextOptions = { locations?: boolean }

export type ColorsContextResult = (ContextCountResult | ContextCountResultWithLocations) & {
	formats: CountResult | CountResultWithLocations
}

export function colorsContext(
	options: ColorsContextOptions = {},
): AnalyzerInstance<ColorsContextResult> {
	const withLocations = options.locations === true
	const collection = new ContextCountCollection(withLocations)
	const formats = new CountCollection(withLocations)

	return {
		subscribes: [NODE_TYPES.DECLARATION],

		visit(node: AnyNode): void {
			const decl = node as Declaration
			if (!is_declaration(decl)) return
			const value = decl.value
			if (!value) return
			const property = decl.property.toLowerCase()
			if (SKIPS_COLOR_LOOKUP.has(property)) return

			walk(value, (vn) => {
				if (is_hash(vn)) {
					const text = vn.text
					if (!text || text.charCodeAt(0) !== 35) return SKIP
					const lc = text.toLowerCase()
					collection.add(lc, property, vn.line, vn.column, vn.start, vn.length)
					let hexLen = lc.length - 1
					if (endsWith('\\9', lc) || endsWith('\\7', lc)) hexLen -= 2
					formats.add(`hex${hexLen}`, vn.line, vn.column, vn.start, vn.length)
					return SKIP
				}

				if (is_identifier(vn)) {
					const ident = vn.text
					const len = ident.length
					if (len < 3 || len > 20) return SKIP
					if (colorKeywords.has(ident)) {
						const lc = ident.toLowerCase()
						collection.add(lc, property, vn.line, vn.column, vn.start, vn.length)
						formats.add(lc, vn.line, vn.column, vn.start, vn.length)
					} else if (namedColors.has(ident)) {
						collection.add(ident.toLowerCase(), property, vn.line, vn.column, vn.start, vn.length)
						formats.add('named', vn.line, vn.column, vn.start, vn.length)
					} else if (systemColors.has(ident)) {
						collection.add(ident.toLowerCase(), property, vn.line, vn.column, vn.start, vn.length)
						formats.add('system', vn.line, vn.column, vn.start, vn.length)
					}
					return SKIP
				}

				if (is_function(vn)) {
					if (colorFunctions.has(vn.name)) {
						collection.add(vn.text, property, vn.line, vn.column, vn.start, vn.length)
						formats.add(vn.name.toLowerCase(), vn.line, vn.column, vn.start, vn.length)
						return SKIP
					}
				}
			})
		},

		collect(): ColorsContextResult {
			return { ...collection.collect(), formats: formats.collect() }
		},
	}
}
