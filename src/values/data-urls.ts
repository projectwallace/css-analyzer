import { type CSSNode, is_url, str_starts_with, walk_values } from '@projectwallace/css-parser'
import { type ValueInput, as_value } from '../utils/input.ts'
import { type Match, to_match } from '../utils/location.ts'
import { unquote } from '../utils/string-utils.ts'

/** The `data:` content of a `url()` node, without quotes; `undefined` for other nodes and other urls */
export function get_data_url(node: CSSNode): string | undefined {
	if (!is_url(node)) {
		return undefined
	}
	const embed = unquote(node.value ?? '')
	return str_starts_with('data:', embed) ? embed : undefined
}

/** The `url(data:...)` values in a value; `value` is the data without quotes, the match covers the whole `url()` */
export function get_data_urls(input: ValueInput): Match[] {
	const found: Match[] = []
	walk_values(as_value(input), function (node) {
		const embed = get_data_url(node)
		if (embed !== undefined) {
			found.push(to_match(node, embed))
		}
	})
	return found
}
