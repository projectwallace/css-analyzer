import { endsWith } from '../string-utils.js'
import type { CSSNode } from '@projectwallace/css-parser'
import { IDENTIFIER } from '@projectwallace/css-parser'

export function isIe9Hack(node: CSSNode): boolean {
	let children = node.children
	if (children) {
		let last = children.at(-1)
		return last && last.type === IDENTIFIER && endsWith('\\9', last.text) ? true : false
	}
	return false
}
