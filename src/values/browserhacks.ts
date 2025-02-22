import { endsWith } from "../string-utils.js"
import { Identifier } from "../css-tree-node-types.js"
import type { Value } from "css-tree"

export function isIe9Hack(node: Value): boolean {
	let children = node.children
	if (children) {
		let last = children.last
		if (last && last.type === Identifier) {
			return endsWith('\\9', last.name)
		}
	}
	return false
}
