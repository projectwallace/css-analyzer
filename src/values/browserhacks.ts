import { endsWith } from '../string-utils.js'
import { type Value, is_identifier } from '@projectwallace/css-parser'

export function isIe9Hack(node: Value): boolean {
	if (node.has_children) {
		let last = node.children.at(-1)
		return last && is_identifier(last) && endsWith('\\9', last.text) ? true : false
	}
	return false
}
