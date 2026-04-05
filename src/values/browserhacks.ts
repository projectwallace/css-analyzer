import { type CSSNode, type Value, is_identifier } from '@projectwallace/css-parser'
import { endsWith } from '../string-utils.js'

export function isIe9Hack(node: Value): boolean {
	if (node.has_children) {
		let last = node.first_child as CSSNode
		while (last.has_next) {
			last = last.next_sibling
		}
		return last && is_identifier(last) && endsWith('\\9', last.text) ? true : false
	}
	return false
}
