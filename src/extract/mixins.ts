import { type Atrule, type CSSNode, is_atrule, str_equals } from '@projectwallace/css-parser'
import { type NamedMatch, to_match_in } from '../utils/location.ts'

export type CustomMatch = NamedMatch & { kind: 'definition' | 'usage' }

// The name in a prelude like `--name(--a, --b)` or `--name`
export function get_prelude_name(node: Atrule): NamedMatch | null {
	const prelude = node.has_prelude ? node.prelude : undefined
	const text = prelude?.text
	if (!prelude || !text) {
		return null
	}
	const end = text.indexOf('(')
	const name = (end === -1 ? text : text.slice(0, end)).trim()
	if (!name.startsWith('--')) {
		return null
	}
	const index = text.indexOf(name)
	return { ...to_match_in(prelude, { index, length: name.length }), name }
}

/** `@mixin --name` is a definition, `@apply --name` a usage */
export function extract_mixins(node: CSSNode): CustomMatch[] {
	if (!is_atrule(node)) {
		return []
	}
	const kind = str_equals('mixin', node.name)
		? 'definition'
		: str_equals('apply', node.name)
			? 'usage'
			: undefined
	const match = kind && get_prelude_name(node)
	return match ? [{ ...match, kind }] : []
}
