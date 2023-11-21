import { endsWith } from "../string-utils.js"
import { Identifier } from "../css-tree-node-types.js"

/**
 * @param {import('css-tree').Value} node
 */
export function isIe9Hack(node) {
	let children = node.children
	return children
		&& children.last
		&& children.last.type === Identifier
		&& endsWith('\\9', children.last.name)
}