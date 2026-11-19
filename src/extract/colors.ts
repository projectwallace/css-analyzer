import type { Value } from '@projectwallace/css-parser'
import {
	type CSSNode,
	is_function,
	is_hash,
	is_identifier,
	property_basename,
	strip_value_hack,
	walk_values,
} from '@projectwallace/css-parser'
import { type TextMatch, to_match } from '../utils/location.ts'
import { color_functions, color_keywords, named_colors, system_colors } from '../values/colors.ts'
import { no_value_walk } from './shared.ts'

export type ColorMatch = TextMatch & {
	format: string
}

// The format of a color node (a hash, an identifier or a function), or `undefined` when it is not a color.
// `property` is the normalized property name. Words that are names are not colors: values of
// `font-family`, `transition`, `animation`, `animation-name` and `z-index` are skipped
// (`animation-name: red` is not a color), and so are the words in a `font` shorthand (`font: 12px Black`).
// Colors in custom properties (`--brand: red`) and in properties we do not know (`unknown: blue`) are colors.
export function color_format(node: CSSNode, property: string): string | undefined {
	if (no_value_walk.has(property) || property === 'animation-name') {
		return undefined
	}
	if (is_hash(node)) {
		const text = node.text
		// Only the color is counted: without any IE hack (\9, \7)
		return 'hex' + (strip_value_hack(text).length - 1)
	}
	if (is_identifier(node)) {
		// Font names like "Black" are not colors
		if (property === 'font') {
			return undefined
		}
		const text = node.text
		// 3 === 'red'.length, 20 === 'lightgoldenrodyellow'.length
		if (text.length > 20 || text.length < 3) {
			return undefined
		}
		if (color_keywords.has(text)) {
			return text.toLowerCase()
		}
		if (named_colors.has(text)) {
			return 'named'
		}
		return system_colors.has(text) ? 'system' : undefined
	}
	if (is_function(node) && color_functions.has(node.name)) {
		return node.name.toLowerCase()
	}
	return undefined
}

// The color as written, for a node that `color_format()` accepted: a hex color without its browserhack
export function color_text(node: CSSNode): string {
	const text = node.text
	return is_hash(node) ? strip_value_hack(text) : text
}

/** The colors in a value, each with its `format` */
export function extract_colors(property: string, input: Value): ColorMatch[] {
	const name = property_basename(property)
	const found: ColorMatch[] = []
	walk_values(input, function (node) {
		const format = color_format(node, name)
		if (format !== undefined) {
			found.push({ ...to_match(node), text: color_text(node), format })
		}
	})
	return found
}
