import {
	type CSSNode,
	type Value,
	is_identifier,
	is_function,
	is_url,
	str_equals,
	walk,
} from '@projectwallace/css-parser'
import { endsWith, unquote } from '../string-utils.js'

/**
 * @deprecated Will be removed in next major version. Use `isValueBrowserhack()` instead.
 */
export function isIe9Hack(node: Value): boolean {
	if (node.has_children) {
		let last = node.first_child as CSSNode
		while (last.has_next) {
			last = last.next_sibling
		}
		return is_identifier(last) && endsWith('\\9', last.text)
	}
	return false
}

/**
 * Is a CSS value a browserhack?
 *
 * Browserhacks sourced from:
 * - https://browserhacks.com/
 * - https://www.alwaystwisted.com/relicss/old-css
 */
export function isValueBrowserhack(node: Value, on_hack: (hack: string) => void): void {
	let text = node.text

	// filter: progid:DXImageTransform.Microsoft.gradient(...) — plain or within quotes
	if (/progid:/i.test(node.text)) {
		on_hack('progid:')
	}

	if (text.endsWith('\\9')) {
		on_hack('\\9')
	}

	if (text.endsWith('\\7')) {
		on_hack('\\7')
	}

	// alpha(), expression(), and behavior .htc hacks
	walk(node, function (child) {
		if (is_function(child)) {
			if (str_equals('alpha', child.name)) {
				on_hack('alpha()')
			} else if (str_equals('expression', child.name)) {
				on_hack('expression()')
			}
		}
		if (is_url(child) && endsWith('.htc', unquote(child.value ?? ''))) {
			on_hack('.htc')
		}
	})
}
