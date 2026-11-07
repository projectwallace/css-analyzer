import {
	is_attribute_selector,
	is_pseudo_class_selector,
	is_pseudo_element_selector,
	is_selector_list,
	is_type_selector,
	walk,
} from '@projectwallace/css-parser'
import { create_counter, merge_counts } from '../engine/counter.js'
import { without_sequence } from './shared.js'
import { define_collector } from '../engine/define-collector.js'
import type { CollectorDef, CountOptions, CountResult, LocationSource } from '../engine/types.js'
import {
	get_accessibility_selectors,
	get_combinators,
	get_complexity,
	get_vendor_prefixes,
} from '../selectors/utils.js'
import { get_specificity } from '../selectors/specificity.js'

export type SelectorsResult = CountResult & {
	/** Items are numbers */
	complexity: CountResult
	/** Items are numbers */
	nesting: CountResult
	/** Selectors that contain an ID, counted by selector text */
	ids: CountResult
	pseudo_classes: CountResult
	pseudo_elements: CountResult
	/** `[role]` and `[aria-*]` attribute selectors */
	accessibility: CountResult
	attributes: CountResult
	/** Type selectors with a dash: `my-element` */
	custom_elements: CountResult
	/** Keyframe selectors: `from`, `50%`, `to` */
	keyframes: CountResult
	/** Vendor prefixed pseudo-classes, pseudo-elements and type selectors */
	prefixed: CountResult
	combinators: CountResult
}

/**
 * Selectors, counted by text, with complexity, nesting and a breakdown per kind.
 * Specificity has its own collector: `specificity()`.
 * Pass `{ sequence: true }` to also get complexity and nesting in source order (for charts).
 */
export function selectors(options: CountOptions = {}): CollectorDef<SelectorsResult> {
	return define_collector<SelectorsResult>(
		function init() {
			const texts = create_counter(without_sequence(options))
			const complexity = create_counter(options)
			const nesting = create_counter(options)
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
				rule(node, ctx) {
					if (!ctx.in_keyframes) {
						return
					}
					const prelude = node.prelude
					if (!prelude || !is_selector_list(prelude)) {
						return
					}
					for (const item of prelude) {
						keyframes.add(item.text, ctx.at(item))
					}
				},
				selector(node, ctx) {
					if (ctx.in_keyframes) {
						return
					}
					const text = node.text

					texts.add(text, ctx)
					complexity.add(String(get_complexity(node)[0]), ctx)
					nesting.add(String(Math.max(ctx.depth - 1, 0)), ctx)

					for (const prefix of get_vendor_prefixes(node)) {
						prefixed.add(prefix.toLowerCase(), ctx)
					}
					for (const item of get_accessibility_selectors(node)) {
						accessibility.add(item, ctx)
					}
					walk(node, function (part) {
						if (is_attribute_selector(part)) {
							attributes.add(part.name.toLowerCase(), ctx)
						} else if (is_type_selector(part)) {
							const name = part.name
							if (!name.startsWith('--') && name.includes('-')) {
								custom_elements.add(name.toLowerCase(), ctx)
							}
						} else if (is_pseudo_class_selector(part)) {
							pseudo_classes.add(part.name.toLowerCase(), ctx)
						} else if (is_pseudo_element_selector(part)) {
							pseudo_elements.add(part.name.toLowerCase(), ctx)
						}
					})
					for (const combinator of get_combinators(node)) {
						const at: LocationSource = {
							loc:
								ctx.source === undefined
									? combinator.loc
									: { ...combinator.loc, source: ctx.source },
						}
						combinators.add(combinator.name, at)
					}
					if (get_specificity(node)[0]![0] > 0) {
						ids.add(text, ctx)
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
		},
		(a, b) => ({
			...merge_counts(a, b),
			complexity: merge_counts(a.complexity, b.complexity),
			nesting: merge_counts(a.nesting, b.nesting),
			ids: merge_counts(a.ids, b.ids),
			pseudo_classes: merge_counts(a.pseudo_classes, b.pseudo_classes),
			pseudo_elements: merge_counts(a.pseudo_elements, b.pseudo_elements),
			accessibility: merge_counts(a.accessibility, b.accessibility),
			attributes: merge_counts(a.attributes, b.attributes),
			custom_elements: merge_counts(a.custom_elements, b.custom_elements),
			keyframes: merge_counts(a.keyframes, b.keyframes),
			prefixed: merge_counts(a.prefixed, b.prefixed),
			combinators: merge_counts(a.combinators, b.combinators),
		}),
	)
}
