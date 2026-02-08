import { type CSSNode, walk, BREAK } from '@projectwallace/css-parser'

export function isValuePrefixed(node: CSSNode, on_value: (value: string) => void): void {
	walk(node, function (child) {
		if (child.is_vendor_prefixed) {
			// .name in case of Identifier or Function, .text as fallback
			on_value(child.name || child.text)
		}
	})
}
