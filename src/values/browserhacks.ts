import { is_identifier, is_function, is_url, str_equals, walk } from '@projectwallace/css-parser'
import { ends_with, unquote } from '../string-utils.js'
import { type Input, as_value } from '../adapter/css-parser.js'

/**
 * Find the browserhacks in a CSS value: `progid:`, `\9`, `\7`, `alpha()`, `expression()`, `.htc`
 *
 * Browserhacks sourced from:
 * - https://browserhacks.com/
 * - https://www.alwaystwisted.com/relicss/old-css
 */
export function get_value_browserhacks(input: Input): string[] {
	const node = as_value(input)
	const hacks: string[] = []
	const text = node.text

	// filter: progid:DXImageTransform.Microsoft.gradient(...) — plain or within quotes
	if (/progid:/i.test(node.text)) {
		hacks.push('progid:')
	}

	if (text.endsWith('\\9')) {
		hacks.push('\\9')
	}

	if (text.endsWith('\\7')) {
		hacks.push('\\7')
	}

	// alpha(), expression(), and behavior .htc hacks
	walk(node, function (child) {
		if (is_function(child)) {
			if (str_equals('alpha', child.name)) {
				hacks.push('alpha()')
			} else if (str_equals('expression', child.name)) {
				hacks.push('expression()')
			}
		}
		if (is_url(child) && ends_with('.htc', unquote(child.value ?? ''))) {
			hacks.push('.htc')
		}
	})

	return hacks
}
