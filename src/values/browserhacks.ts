import {
	BREAK,
	is_function,
	is_identifier,
	is_url,
	str_equals,
	str_index_of,
	walk_values,
} from '@projectwallace/css-parser'
import { ends_with, unquote } from '../utils/string-utils.ts'
import { type ValueInput, as_value } from '../utils/input.ts'

// Browserhacks sourced from:
// - https://browserhacks.com/
// - https://www.alwaystwisted.com/relicss/old-css
/** Find the browserhacks in a CSS value: `progid:`, `\\9`, `\\7`, `alpha()`, `expression()`, `.htc` */
export function get_value_browserhacks(input: ValueInput): string[] {
	const node = as_value(input)
	const hacks: string[] = []
	const text = node.text

	// filter: progid:DXImageTransform.Microsoft.gradient(...) — plain or within quotes
	if (str_index_of('progid:', text) !== -1) {
		hacks.push('progid:')
	}

	if (text.endsWith('\\9')) {
		hacks.push('\\9')
	}

	if (text.endsWith('\\7')) {
		hacks.push('\\7')
	}

	// alpha(), expression(), and behavior .htc hacks: the first one found ends the search
	walk_values(node, function (child) {
		if (is_function(child)) {
			const name = child.name
			if (str_equals('alpha', name)) {
				const first_child = child.first_child
				// Modern `alpha(from red / 50%)` (relative color syntax) is not the IE filter
				if (is_identifier(first_child) && str_equals('from', first_child.name)) {
					return BREAK
				}
				hacks.push('alpha()')
			} else if (str_equals('expression', name)) {
				hacks.push('expression()')
				return BREAK
			}
		} else if (is_url(child) && ends_with('.htc', unquote(child.value ?? ''))) {
			hacks.push('.htc')
			return BREAK
		}
	})

	return hacks
}
