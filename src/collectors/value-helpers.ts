import { type CSSNode, is_identifier } from '@projectwallace/css-parser'
import type { DeclarationContext } from '../engine/types.ts'
import { unquote } from '../utils/string-utils.ts'
import { analyze_animation, get_animation_names } from '../values/animations.ts'

/** Animation names of an `animation` or `animation-name` declaration (quotes removed) */
export function get_used_animation_names(ctx: DeclarationContext): string[] {
	if (ctx.clean_value_text === undefined) {
		return []
	}
	if (ctx.property === 'animation') {
		return analyze_animation(ctx.value!).names.map((match) => unquote(match.value))
	}
	return ctx.property === 'animation-name'
		? get_animation_names(ctx.value!).map((match) => match.name)
		: []
}

/** Text of the first child when that child is an identifier (e.g. `--x` in `var(--x)`) */
export function get_first_identifier(node: CSSNode): string | undefined {
	const first = node.first_child
	return first && is_identifier(first) ? first.text : undefined
}
