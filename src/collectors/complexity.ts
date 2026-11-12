import type { Atrule } from '@projectwallace/css-parser'
import { get_value_browserhacks } from '../values/browserhacks.ts'
import { get_prefixed_values } from '../values/vendor-prefix.ts'
import type { DeclarationContext } from '../engine/types.ts'

/*
 * How complex is one thing? Each weight starts at 1 and goes up for things that are harder to maintain
 * (!important, vendor prefixes, hacks). The collectors report the weights per item,
 * `stylesheet()` adds them all up. They share these functions so the numbers always agree.
 */

// At-rule weight: 1 for an at-rule with a prelude, plus 1 for every media/supports browserhack
// (`hacks`) and for a vendor prefixed `@keyframes`. `@font-face` is 1, `@layer` without a prelude is 2.
// Other at-rules without a prelude have no weight: 0.
export function get_atrule_weight(
	node: Atrule,
	name: string,
	has_prelude: boolean,
	hacks: number,
): number {
	if (!has_prelude) {
		return name === 'font-face' ? 1 : name === 'layer' ? 2 : 0
	}
	return 1 + hacks + (name.endsWith('keyframes') && node.is_vendor_prefixed ? 1 : 0)
}

/** Declaration weight: 1, plus 1 for `!important`, plus 1 more for `!important` inside `@keyframes` */
export function get_declaration_weight(ctx: DeclarationContext): number {
	if (!ctx.is_important) {
		return 1
	}
	return ctx.atrule_stack.includes('keyframes') ? 3 : 2
}

/** Property weight: 1, 2 for vendor prefixed, custom or hacked properties, 3 for `!important` custom properties */
export function get_property_weight(ctx: DeclarationContext): number {
	if (ctx.is_vendor_prefixed) {
		return 2
	}
	if (ctx.is_custom) {
		return ctx.is_important ? 3 : 2
	}
	return ctx.is_browserhack ? 2 : 1
}

/** Value weight: 1, plus 1 for every vendor prefixed value and (outside custom properties) browserhack */
export function get_value_weight(ctx: DeclarationContext): number {
	let weight = 1
	if (ctx.value && ctx.clean_value_text !== undefined) {
		weight += get_prefixed_values(ctx.value).length
		if (!ctx.is_custom) {
			weight += get_value_browserhacks(ctx.value).length
		}
	}
	return weight
}
