import { type AtrulePrelude, type Raw, is_layer_name } from '@projectwallace/css-parser'
import { type Match, type NamedMatch, to_match } from '../utils/location.ts'
import { unquote } from '../utils/string-utils.ts'

/** The name in a `@keyframes` prelude, without quotes. The parser leaves a quoted name as a `Raw` node. */
export function get_keyframes_name(prelude: AtrulePrelude | Raw): NamedMatch | null {
	const text = prelude.text
	return text === '' ? null : { ...to_match(prelude), name: unquote(text) }
}

/** The names in a `@layer` prelude */
export function get_layer_names(prelude: AtrulePrelude): Match[] {
	const names: Match[] = []
	prelude.for_each(function (child) {
		if (is_layer_name(child)) {
			names.push(to_match(child))
		}
	})
	return names
}
