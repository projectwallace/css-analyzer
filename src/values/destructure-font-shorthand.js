import { KeywordSet } from '../keyword-set.js'
import { keywords } from './values.js'
import { Identifier, Nr, Operator } from '../css-tree-node-types.js'

const SYSTEM_FONTS = new KeywordSet([
	'caption',
	'icon',
	'menu',
	'message-box',
	'small-caption',
	'status-bar',
])

const SIZE_KEYWORDS = new KeywordSet([
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

const COMMA = 44 // ','.charCodeAt(0) === 44
const SLASH = 47 // '/'.charCodeAt(0) === 47

export function isSystemFont(node) {
	let firstChild = node.children.first
	if (firstChild === null) return false
	return firstChild.type === Identifier && SYSTEM_FONTS.has(firstChild.name)
}

/**
 * @param {import('css-tree').Value} value
 * @param {*} stringifyNode
 */
export function destructure(value, stringifyNode, cb) {
	let font_family = Array.from({ length: 2 })
	let font_size
	let line_height

	value.children.forEach(function (node, item) {
		let prev = item.prev ? item.prev.data : undefined
		let next = item.next ? item.next.data : undefined

		if (node.type === Identifier && keywords.has(node.name)) {
			cb({
				type: 'keyword',
				value: node.name,
			})
		}

		// any node that comes before the '/' is the font-size
		if (next && next.type === Operator && next.value.charCodeAt(0) === SLASH) {
			font_size = stringifyNode(node)
			return
		}

		// any node that comes after '/' is the line-height
		if (prev && prev.type === Operator && prev.value.charCodeAt(0) === SLASH) {
			line_height = stringifyNode(node)
			return
		}

		// any node that's followed by ',' is a font-family
		if (
			next &&
			next.type === Operator &&
			next.value.charCodeAt(0) === COMMA &&
			!font_family[0]
		) {
			font_family[0] = node

			if (!font_size && prev !== null) {
				font_size = stringifyNode(prev)
			}

			return
		}

		// any node that's a number and not previously caught by line-height or font-size is the font-weight
		// (oblique <angle> will not be caught here, because that's a Dimension, not a Number)
		if (node.type === Nr) {
			return
		}

		// last node always ends the font-family
		if (item.next === null) {
			font_family[1] = node

			// if, at the last node, we dont have a size yet, it *must* be the previous node
			// unless `font: menu` (system font), because then there's simply no size
			if (!font_size && !font_family[0] && prev) {
				font_size = stringifyNode(prev)
			}

			return
		}

		// Any remaining identifiers can be font-size, font-style, font-stretch, font-variant or font-weight
		if (node.type === Identifier) {
			let name = node.name
			if (SIZE_KEYWORDS.has(name)) {
				font_size = name
				return
			}
		}
	})

	return {
		font_size,
		line_height,
		font_family:
			font_family[0] || font_family[1]
				? stringifyNode({
					loc: {
						start: {
							offset: (font_family[0] || font_family[1]).loc.start.offset,
						},
						end: {
							offset: font_family[1].loc.end.offset,
						},
					},
				})
				: null,
	}
}
