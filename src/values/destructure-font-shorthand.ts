import { KeywordSet } from '../keyword-set.js'
import { keywords } from './values.js'
import type { CSSNode } from '@projectwallace/css-parser'
import { FUNCTION, IDENTIFIER, OPERATOR, NUMBER } from '@projectwallace/css-parser'

export const SYSTEM_FONTS = new KeywordSet(['caption', 'icon', 'menu', 'message-box', 'small-caption', 'status-bar'])

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

export function destructure(value: CSSNode, cb: ({ type, value }: { type: string; value: string }) => void) {
	let font_family: (CSSNode | undefined)[] = [undefined, undefined]
	let font_size: string | undefined
	let line_height: string | undefined

	// Bail out if the value is a single var()
	if (value.first_child!.type === FUNCTION && value.first_child!.name.toLowerCase() === 'var') {
		return null
	}

	let prev: CSSNode | undefined
	for (let node of value.children) {
		let next = node.next_sibling

		if (node.type === IDENTIFIER && keywords.has(node.name)) {
			cb({
				type: 'keyword',
				value: node.name,
			})
		}

		// any node that comes before the '/' is the font-size
		if (next && next.type === OPERATOR && next.text.charCodeAt(0) === SLASH) {
			font_size = node.text
			prev = node
			continue
		}

		// any node that comes after '/' is the line-height
		if (prev?.type === OPERATOR && prev.text.charCodeAt(0) === SLASH) {
			line_height = node.text
			prev = node
			continue
		}

		// any node that's followed by ',' is a font-family
		if (next?.type === OPERATOR && next.text.charCodeAt(0) === COMMA && !font_family[0]) {
			font_family[0] = node

			if (!font_size && prev) {
				font_size = prev.text
			}

			prev = node
			continue
		}

		// last node always ends the font-family
		if (node.next_sibling === null) {
			font_family[1] = node

			// if, at the last node, we dont have a size yet, it *must* be the previous node
			// unless `font: menu` (system font), because then there's simply no size
			if (!font_size && !font_family[0] && prev) {
				font_size = prev.text
			}

			prev = node
			continue
		}

		// any node that's a number and not previously caught by line-height or font-size is the font-weight
		// (oblique <angle> will not be caught here, because that's a Dimension, not a Number)
		if (node.type === NUMBER) {
			prev = node
			continue
		}

		// Any remaining identifiers can be font-size, font-style, font-stretch, font-variant or font-weight
		if (node.type === IDENTIFIER) {
			let name = node.name
			if (SIZE_KEYWORDS.has(name)) {
				font_size = name
				prev = node
				continue
			}
		}
		prev = node
	}

	let family =
		font_family[0] || font_family[1]
			? value.text.substring(
					(font_family?.[0] || font_family?.[1] || { start: value.start }).start - value.start,
					// Either the node we detected as the last node, or the end of the whole value
					// It's never 0 because the first node is always a font-size or font-style
					font_family[1] ? font_family[1].end - value.start : value.text.length,
				)
			: null

	return {
		font_size,
		line_height,
		font_family: family,
	}
}
