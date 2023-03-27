import {
	is_operator,
	is_identifier,
	is_dimension,
	is_number,
} from '../css-node.js'

const FONT_KEYWORDS = new Set([
	// Global CSS keywords
	'inherit',
	'initial',
	'unset',
	'revert',

	// System font keywords
	'caption',
	'icon',
	'menu',
	'message-box',
	'small-caption',
	'status-bar',
])

export function isFontKeyword(node) {
	const firstChild = node.children.first
	return firstChild.type === 'Identifier' && FONT_KEYWORDS.has(firstChild.name)
}

const SIZE_KEYWORDS = new Set([
	/* <absolute-size> values */
	'xx-small',
	'x-small',
	'small',
	'medium',
	'large',
	'x-large',
	'xx-large',
	'xxx-large',
	/* <relative-size> values */
	'smaller',
	'larger',
])

const STRETCH_KEYWORDS = new Set([
	'ultra-condensed',
	'extra-condensed',
	'condensed',
	'semi-condensed',
	'semi-expanded',
	'expanded',
	'extra-expanded',
	'ultra-expanded',
])
const STYLE_KEYWORDS = new Set(['italic', 'oblique'])
const WEIGHT_KEYWORDS = new Set(['light', 'bold', 'bolder'])
const VARIANT_KEYWORDS = new Set([
	'small-caps',
	'all-small-caps',
	'petite-caps',
	'all-petite-caps',
	'unicase',
	'titling-caps',
])

const COMMA = 44 // ','.charCodeAt(0) === 44
const SLASH = 47 // '/'.charCodeAt(0) === 47

/**
 * @param {import('css-tree').Value} value
 * @param {Function} stringifyNode
 */
export function destructure(value, stringifyNode) {
	let font_family = []
	let font_size
	let line_height

	value.children.forEach(function (node, item) {
		let type = node.type

		// any node that comes before the '/' is the font-size
		if (
			item.next &&
			is_operator(item.next.data.type) &&
			item.next.data.value.charCodeAt(0) === SLASH
		) {
			font_size = stringifyNode(node)
			return
		}

		// any node that comes after '/' is the line-height
		if (
			item.prev &&
			is_operator(item.prev.data.type) &&
			item.prev.data.value.charCodeAt(0) === SLASH
		) {
			line_height = stringifyNode(node)
			return
		}

		// any node that's followed by ',' is a font-family
		if (
			item.next &&
			is_operator(item.next.data.type) &&
			item.next.data.value.charCodeAt(0) === COMMA &&
			!font_family[0]
		) {
			font_family[0] = node

			if (!font_size && item.prev != null) {
				font_size = stringifyNode(item.prev.data)
			}

			return
		}

		// If, after taking care of font-size and line-height, we still have a remaining dimension, it must be the oblique angle
		if (
			is_dimension(type) &&
			item.prev &&
			is_identifier(item.prev.data.type) &&
			item.prev.data.name === 'oblique'
		) {
			// put in the correct amount of whitespace between `oblique` and `<angle>`
			font_style +=
				''.padStart(node.loc.start.offset - item.prev.data.loc.end.offset) +
				stringifyNode(node)
			return
		}

		// any node that's a number and not previously caught by line-height or font-size is the font-weight
		// (oblique <angle> will not be caught here, because that's a Dimension, not a Number)
		if (is_number(type)) {
			return
		}

		// last node always ends the font-family
		if (item.next === null) {
			font_family[1] = node

			// if, at the last node, we don;t have a size yet, it *must* be the previous node
			// unless `font: menu` (system font), because then there's simply no size
			if (!font_size && !font_family[0] && item.prev) {
				font_size = stringifyNode(item.prev.data)
			}

			return
		}

		// Any remaining identifiers can be font-size, font-style, font-stretch, font-variant or font-weight
		if (is_identifier(type)) {
			if (SIZE_KEYWORDS.has(node.name)) {
				font_size = node.name
				return
			}
			if (STRETCH_KEYWORDS.has(node.name)) {
				return
			}
			if (WEIGHT_KEYWORDS.has(node.name)) {
				return
			}
			if (STYLE_KEYWORDS.has(node.name)) {
				return
			}
			if (VARIANT_KEYWORDS.has(node.name)) {
				return
			}
		}
	})

	return {
		font_size,
		line_height,
		font_family: stringifyNode({
			loc: {
				start: {
					offset: (font_family[0] || font_family[1]).loc.start.offset
				},
				end: {
					offset: font_family[1].loc.end.offset
				}
			}
		}),
	}
}
