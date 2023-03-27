import { endsWith } from "../string-utils.js"
import { is_identifier } from "../css-node.js"

export function isIe9Hack(node) {
	return node.children
		&& node.children.last
		&& is_identifier(node.children.last.type)
		&& endsWith('\\9', node.children.last.name)
}