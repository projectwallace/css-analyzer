import {
	is_attribute_selector,
	is_custom,
	is_pseudo_class_selector,
	is_pseudo_element_selector,
	is_selector_list,
	is_type_selector,
	is_combinator,
	walk,
} from '@projectwallace/css-parser'
import { create_counter } from '../engine/counter.ts'
import { without_sequence } from './shared.ts'
import { define_collector } from '../engine/define-collector.ts'
import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import {
	get_accessibility_selectors,
	combinator_name,
	get_complexity,
	get_vendor_prefixes,
} from '../selectors/utils.ts'
import { get_specificity } from '../selectors/specificity.ts'

export type SelectorsResult = CountResult & {
	complexity: CountResult<number>
	nesting: CountResult<number>
	ids: CountResult
	pseudo_classes: CountResult
	pseudo_elements: CountResult
	accessibility: CountResult
	attributes: CountResult
	custom_elements: CountResult
	keyframes: CountResult
	prefixed: CountResult
	combinators: CountResult
}

/** Selectors by text, with complexity, nesting and a breakdown per kind */
export function selectors(options: CountOptions = {}): CollectorDef<SelectorsResult> {
	return define_collector<SelectorsResult>(function init() {
		const texts = create_counter(without_sequence(options))
		const complexity = create_counter<number>(options)
		const nesting = create_counter<number>(options)
		const ids = create_counter(without_sequence(options))
		const pseudo_classes = create_counter(without_sequence(options))
		const pseudo_elements = create_counter(without_sequence(options))
		const accessibility = create_counter(without_sequence(options))
		const attributes = create_counter(without_sequence(options))
		const custom_elements = create_counter(without_sequence(options))
		const keyframes = create_counter(without_sequence(options))
		const prefixed = create_counter(without_sequence(options))
		const combinators = create_counter(without_sequence(options))

		return {
			// The selectors of a rule, with the nesting of the rule. Keyframe selectors are counted on their own.
			rule(node, ctx) {
				const prelude = node.prelude
				if (!prelude || !is_selector_list(prelude)) {
					return
				}
				if (ctx.atrule_stack.includes('keyframes')) {
					prelude.for_each(function (item) {
						keyframes.add(item.text, item)
					})
					return
				}
				const depth = ctx.depth
				prelude.for_each(function (item) {
					nesting.add(depth, item)
				})
			},
			selector(node) {
				const text = node.text

				texts.add(text, node)
				complexity.add(get_complexity(node).value, node)

				for (const prefix of get_vendor_prefixes(node)) {
					prefixed.add(prefix.value.toLowerCase(), node)
				}
				for (const item of get_accessibility_selectors(node)) {
					accessibility.add(item.value, node)
				}
				walk(node, function (part) {
					if (is_attribute_selector(part)) {
						attributes.add(part.name.toLowerCase(), node)
					} else if (is_type_selector(part)) {
						const name = part.name
						if (!is_custom(name) && name.includes('-')) {
							custom_elements.add(name.toLowerCase(), node)
						}
					} else if (is_pseudo_class_selector(part)) {
						pseudo_classes.add(part.name.toLowerCase(), node)
					} else if (is_pseudo_element_selector(part)) {
						pseudo_elements.add(part.name.toLowerCase(), node)
					} else if (is_combinator(part)) {
						combinators.add(combinator_name(part), part, 1)
					}
				})
				if (get_specificity(node)[0] > 0) {
					ids.add(text, node)
				}
			},
			result: () => ({
				...texts.result(),
				complexity: complexity.result(),
				nesting: nesting.result(),
				ids: ids.result(),
				pseudo_classes: pseudo_classes.result(),
				pseudo_elements: pseudo_elements.result(),
				accessibility: accessibility.result(),
				attributes: attributes.result(),
				custom_elements: custom_elements.result(),
				keyframes: keyframes.result(),
				prefixed: prefixed.result(),
				combinators: combinators.result(),
			}),
		}
	})
}
