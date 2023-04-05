import { endsWith } from "../string-utils.js"

export function isIe9Hack(node) {
	let children = node.children
	return children
		&& children.last
		&& children.last.type === 'Identifier'
		&& endsWith('\\9', children.last.name)
}