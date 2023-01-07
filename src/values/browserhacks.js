import { endsWith } from "../string-utils.js"

export function isIe9Hack(node) {
	return node.children
		&& node.children.last
		&& node.children.last.type === 'Identifier'
		&& endsWith('\\9', node.children.last.name)
}