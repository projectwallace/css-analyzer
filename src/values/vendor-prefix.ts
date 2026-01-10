import type { CSSNode } from '@projectwallace/css-parser'

export function isValuePrefixed(node: CSSNode): boolean {
	if (!node.has_children) return false

	for (let child of node.children) {
		let type = child.type_name
		if (child.is_vendor_prefixed) {
			return true
		}
		if (type === 'Function') {
			if (isValuePrefixed(child)) {
				return true
			}
		}
	}

	return false
}
