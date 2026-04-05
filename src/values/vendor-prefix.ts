import { type CSSNode, is_function, is_identifier, walk } from '@projectwallace/css-parser'

export function isValuePrefixed(value: CSSNode, on_value: (value: string) => void): void {
	walk(value, function (node) {
		if (node.is_vendor_prefixed) {
			// .name in case of Identifier or Function, .text as fallback
			if (is_identifier(node) || is_function(node)) {
				on_value(node.name)
			} else {
				on_value(node.text)
			}
		}
	})
}
