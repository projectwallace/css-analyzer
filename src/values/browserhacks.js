import { endsWith } from "../string-utils.js"
import { Identifier } from "../css-tree-node-types.js"

/**
 * @param {import('css-tree').Value} node
 */
export function isIe9Hack(node) {
	let children = node.children
	if (children) {
		let last = children.last
		return last
			&& last.type === Identifier
			&& endsWith('\\9', last.name)
	}
	return false
}
