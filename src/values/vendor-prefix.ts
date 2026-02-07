import { type CSSNode, walk, BREAK } from '@projectwallace/css-parser'

export function isValuePrefixed(node: CSSNode): false | string[] {
	let prefixes: string[] = []

	walk(node, function (child) {
		if (child.is_vendor_prefixed) {
			// .name in case of Identifier or Function, .text as fallback
			prefixes.push(child.name || child.text)
		}
	})

	return prefixes.length > 0 ? prefixes : false
}
