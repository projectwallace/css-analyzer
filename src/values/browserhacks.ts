// Hack references:
// https://www.alwaystwisted.com/relicss/old-css
// https://browserhacks.com/

import {
	type CSSNode,
	type Value,
	is_identifier,
	is_function,
	is_url,
	walk,
} from '@projectwallace/css-parser'
import { endsWith, unquote } from '../string-utils.js'

export function isIe9Hack(node: Value): boolean {
	if (node.has_children) {
		let last = node.first_child as CSSNode
		while (last.has_next) {
			last = last.next_sibling
		}
		return last && is_identifier(last) && endsWith('\\9', last.text) ? true : false
	}
	return false
}

export function isValueBrowserhack(node: Value, on_hack: (hack: string) => void): void {
	// filter: progid:DXImageTransform.Microsoft.gradient(...) — plain or within quotes
	if (/progid:/i.test(node.text)) {
		on_hack('progid:')
	}

	// Trailing \9 (IE9) and \7 (IE7) hacks — identifier appended at end of value
	if (node.has_children) {
		let last = node.first_child as CSSNode
		while (last.has_next) {
			last = last.next_sibling
		}
		if (last && is_identifier(last)) {
			if (endsWith('\\9', last.text)) {
				on_hack('\\9')
			} else if (endsWith('\\7', last.text)) {
				on_hack('\\7')
			}
		}
	}

	// alpha(), expression(), and behavior .htc hacks
	walk(node, function (child) {
		if (is_function(child)) {
			const name = child.name.toLowerCase()
			if (name === 'alpha') {
				on_hack('alpha()')
			} else if (name === 'expression') {
				on_hack('expression()')
			}
		}
		if (is_url(child) && endsWith('.htc', unquote(child.value ?? ''))) {
			on_hack('.htc')
		}
	})
}
