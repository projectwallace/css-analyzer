import type { CSSNode } from '@projectwallace/css-parser'

export function isValuePrefixed(node: CSSNode): boolean {
	if (!node.has_children) return false

	for (let child of node.children) {
		if (child.is_vendor_prefixed) {
			return true
		}
		if (child.type_name === 'Function' && isValuePrefixed(child)) {
			return true
		}
	}

	return false
}
