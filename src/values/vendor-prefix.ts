import { type CSSNode, walk, BREAK } from '@projectwallace/css-parser'

export function isValuePrefixed(node: CSSNode): boolean {
	let isPrefixed = false

	walk(node, function (child) {
		if (child.is_vendor_prefixed) {
			isPrefixed = true
			return BREAK
		}
	})

	return isPrefixed
}
