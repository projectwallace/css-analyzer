import {
	is_dimension,
	is_function,
	is_identifier,
	is_operator,
	is_string,
} from '@projectwallace/css-parser'
import { KeywordSet } from '../utils/collections/keyword-set.ts'
import { type ValueInput, as_value } from '../utils/input.ts'
import { keywords } from './values.ts'

export const system_fonts: KeywordSet = new KeywordSet([
	'caption',
	'icon',
	'menu',
	'message-box',
	'small-caption',
	'status-bar',
])

//  Keyword values for <absolute-size> and <relative-size>
const size_keywords = new KeywordSet([
	'xx-small',
	'x-small',
	'small',
	'medium',
	'large',
	'x-large',
	'xx-large',
	'xxx-large',
	'smaller',
	'larger',
])

// Identifier keywords that appear before font-size in the font shorthand:
// font-style, font-variant, font-weight (keyword form), font-stretch, and "normal"
const pre_size_keywords = new KeywordSet([
	// font-style
	'italic',
	'oblique',
	// font-variant
	'small-caps',
	// font-weight (keyword)
	'bold',
	'bolder',
	'lighter',
	// font-stretch
	'ultra-condensed',
	'extra-condensed',
	'condensed',
	'semi-condensed',
	'semi-expanded',
	'expanded',
	'extra-expanded',
	'ultra-expanded',
	// catches normal for any of font-style/variant/weight/stretch
	'normal',
])

const slash = 47 // '/'.charCodeAt(0)

export type FontShorthand = {
	font_size?: string
	line_height?: string
	font_family?: string | null
	/** Global keywords (inherit, initial, ...) found anywhere in the value */
	keywords: string[]
}

// Grammar:
//   font: [<font-style> || <font-variant> || <font-weight> || <font-stretch>]?
//         <font-size>[/<line-height>]? <font-family>
//
// System fonts (caption, icon, menu, ...) are not handled: check system_fonts first.
/** Split a `font` shorthand value into font size, line height, family and global keywords; `null` for a lone `var()` */
export function destructure_font_shorthand(input: ValueInput): FontShorthand | null {
	const value = as_value(input)
	const found_keywords: string[] = []
	if (!value.has_children) {
		return null
	}

	// A lone var() could stand for the entire property — can't decompose it.
	if (value.child_count === 1 && is_function(value.first_child)) {
		return null
	}

	// Report global keywords (inherit, initial, …) that appear anywhere in the value.
	value.for_each((child) => {
		if (is_identifier(child) && keywords.has(child.name)) {
			found_keywords.push(child.name!)
		}
	})

	const children = value.children
	let font_size: string | undefined
	let line_height: string | undefined
	// Index of the first child node that belongs to font-family (-1 = none found)
	let font_family_start = -1

	// -----------------------------------------------------------------
	// Step 1: look for the "/" that separates font-size from line-height
	// -----------------------------------------------------------------
	let slash_index = -1
	for (let i = 0; i < value.child_count; i++) {
		const child = children[i]
		if (child && is_operator(child) && child.text.charCodeAt(0) === slash) {
			slash_index = i
			break
		}
	}

	if (slash_index === -1) {
		// -----------------------------------------------------------------
		// Step 2: no slash — scan left-to-right to locate font-size.
		//
		// Pre-font-size tokens to skip:
		//   • IDENTIFIER matching pre_size_keywords (bold, italic, condensed, …)
		//   • IDENTIFIER matching global keywords (inherit, initial, …)
		//   • NUMBER (font-weight like 400, 700)
		//
		// Font-size tokens that end the pre-font-size section:
		//   • DIMENSION  (e.g. 16px, 1.2em)
		//   • IDENTIFIER in size_keywords (small, large, medium, …)
		//   • FUNCTION   (calc(), var(), …)
		//
		// Anything else signals we've reached font-family without a
		// recognised font-size (invalid CSS, handled gracefully).
		// -----------------------------------------------------------------
		for (let i = 0; i < children.length; i++) {
			const child = children[i]
			if (!child) {
				continue
			}

			if (is_dimension(child)) {
				font_size = child.text
				font_family_start = i + 1
				break
			}

			if (is_function(child)) {
				font_size = child.text
				font_family_start = i + 1
				break
			}

			if (is_identifier(child)) {
				const name = child.name
				if (size_keywords.has(name)) {
					font_size = child.text
					font_family_start = i + 1
					break
				}
				if (pre_size_keywords.has(name) || keywords.has(name)) {
					continue
				}
				// Unrecognised identifier: treat as start of font-family.
				font_family_start = i
				break
			}

			if (is_string(child)) {
				// Quoted name: must be font-family, no font-size found.
				font_family_start = i
				break
			}

			// NUMBER or anything else: skip (e.g. numeric font-weight).
		}
	} else {
		// The node immediately before "/" is font-size.
		// The node immediately after "/" is line-height.
		// Everything after line-height is font-family.
		if (slash_index > 0) {
			font_size = children[slash_index - 1]!.text
		}
		const after_slash = slash_index + 1
		if (after_slash < children.length) {
			line_height = children[after_slash]!.text
			font_family_start = after_slash + 1
		}
	}

	// -----------------------------------------------------------------
	// Step 3: extract font-family as a raw substring of the value text.
	// -----------------------------------------------------------------
	let font_family: string | null = null
	if (font_family_start >= 0 && font_family_start < children.length) {
		const first = children[font_family_start]
		const last = children.at(-1)
		if (first && last) {
			font_family = value.text.substring(first.start - value.start, last.end - value.start)
		}
	}

	return { font_size, line_height, font_family, keywords: found_keywords }
}
