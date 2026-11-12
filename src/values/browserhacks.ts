import {
	type CSSNode,
	type Value,
	is_identifier,
	is_function,
	is_url,
	str_equals,
	walk,
	str_index_of,
	BREAK,
} from '@projectwallace/css-parser'
import { endsWith, unquote } from '../string-utils.ts'

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
	const text = node.text

	// filter: progid:DXImageTransform.Microsoft.gradient(...) — plain or within quotes
	if (str_index_of('progid:', node.text) !== -1) {
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
			const { name } = child
			if (str_equals('alpha', name)) {
				const { first_child } = child
				// Modern `alpha(from red / 50%)` has `from` as first child and then at least 3 more children
				if (is_identifier(first_child) && str_equals('from', first_child.name)) {
					return BREAK
				}
				on_hack('alpha()')
			} else if (str_equals('expression', name)) {
				on_hack('expression()')
				return BREAK
			}
		} else if (is_url(child) && endsWith('.htc', unquote(child.value ?? ''))) {
			on_hack('.htc')
			return BREAK
		}
	})
}
