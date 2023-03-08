import * as csstree from 'css-tree'

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

export function destructure(node, stringifyNode) {
	let matchResult = csstree.lexer.matchProperty('font', node)
	let font_family = [0, 0]
	let font_size
	let line_height

	node.children.forEach(function (child) {
		if (matchResult.isProperty(child, 'font-size')) {
			font_size = stringifyNode(child)
		} else if (matchResult.isProperty(child, 'line-height')) {
			line_height = stringifyNode(child)
		} else if (matchResult.isProperty(child, 'font-family')) {
			if (!font_family[0]) {
				font_family[0] = child.loc.start.offset
			}
			let end = child.loc.end.offset
			let offset_end = font_family[1]
			if (end > offset_end) {
				font_family[1] = end
			}
		}
	})

	return {
		font_size,
		line_height,
		font_family: stringifyNode({
			loc: {
				start: {
					offset: (font_family[0] || font_family[1])
				},
				end: {
					offset: font_family[1]
				}
			}
		}),
	}
}