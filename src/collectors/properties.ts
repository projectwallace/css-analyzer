import { is_function, is_identifier, FUNCTION, property_basename } from '@projectwallace/css-parser'
import { DefinedUsed, type DefinedUsedResult } from '../defined-used.ts'
import { create_counter } from '../engine/counter.ts'
import { define_collector } from '../engine/define-collector.ts'
import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { shorthand_properties } from '../properties/property-utils.ts'
import { get_first_identifier, get_list_items } from './shared.ts'

export type PropertiesResult = CountResult & {
	/** Vendor prefixed properties, as written */
	prefixed: CountResult
	custom: CountResult &
		DefinedUsedResult & {
			/** Custom properties with `!important`, as written */
			importants: CountResult
		}
	/** Shorthand properties, as written */
	shorthands: CountResult
	/** The hack character (`*`, `_`, ...) of property hacks */
	browserhacks: CountResult
	/** 1, 2 for prefixed/hacked/custom, 3 for important custom properties. Items are numbers. */
	complexity: CountResult<number>
	/** `anchor-name` / `position-anchor` names, defined and used */
	anchor_names: DefinedUsedResult
}

function is_custom_name(name: string): boolean {
	return name.startsWith('--')
}

/**
 * Properties (normalized, so `-webkit-transition` counts as `transition`) and what they tell:
 * prefixes, custom properties (defined with a declaration or `@property`, used with `var()`),
 * shorthands, hacks and anchor names.
 */
export function properties(options: CountOptions = {}): CollectorDef<PropertiesResult> {
	return define_collector<PropertiesResult>(function init() {
		const names = create_counter(options)
		const prefixed = create_counter(options)
		const custom = create_counter(options)
		const custom_importants = create_counter(options)
		const shorthands = create_counter(options)
		const browserhacks = create_counter(options)
		const complexity = create_counter<number>(options)
		const custom_tracking = new DefinedUsed()
		const anchor_tracking = new DefinedUsed()

		return {
			parse: { values: true, atrule_preludes: true },
			atrule(node) {
				const prelude = node.has_prelude ? node.prelude : undefined
				if (prelude && property_basename(node.name) === 'property') {
					custom_tracking.define(prelude.text)
				}
			},
			declaration: {
				enter(node, ctx) {
					const raw = ctx.raw_property
					if (!raw) {
						return
					}
					// The location of the property name, not the whole declaration
					const length = raw.length
					names.add(ctx.property, node, length)

					if (ctx.is_vendor_prefixed) {
						complexity.add(2, node, length)
						prefixed.add(raw, node, length)
					} else if (ctx.is_custom) {
						custom.add(raw, node, length)
						custom_tracking.define(raw)
						complexity.add(ctx.is_important ? 3 : 2, node, length)
						if (ctx.is_important) {
							custom_importants.add(raw, node, length)
						}
					} else if (ctx.is_browserhack) {
						browserhacks.add(raw.charAt(0), node, length)
						complexity.add(2, node, length)
					} else {
						complexity.add(1, node, length)
					}

					if (shorthand_properties.has(ctx.property)) {
						shorthands.add(raw, node, length)
					}

					// Anchor names live in values
					if (ctx.clean_value_text === undefined) {
						return
					}
					if (ctx.property === 'anchor-name') {
						for (const item of get_list_items(ctx.value!)) {
							const text = is_identifier(item) ? item.text : undefined
							if (text !== undefined && is_custom_name(text)) {
								anchor_tracking.define(text)
							}
						}
					} else if (ctx.property === 'position-anchor') {
						const name = get_first_identifier(ctx.value!)
						if (name !== undefined && is_custom_name(name)) {
							anchor_tracking.use(name)
						}
					}
				},
			},
			value: {
				types: [FUNCTION],
				enter(node) {
					const name = is_function(node) ? node.name.toLowerCase() : ''
					if (name !== 'var' && name !== 'anchor' && name !== 'anchor-size') {
						return
					}
					const first = get_first_identifier(node)
					if (first === undefined || !is_custom_name(first)) {
						return
					}
					if (name === 'var') {
						custom_tracking.use(first)
					} else {
						anchor_tracking.use(first)
					}
				},
			},
			result: () => ({
				...names.result(),
				prefixed: prefixed.result(),
				custom: {
					...custom.result(),
					...custom_tracking.analyze(),
					importants: custom_importants.result(),
				},
				shorthands: shorthands.result(),
				browserhacks: browserhacks.result(),
				complexity: complexity.result(),
				anchor_names: anchor_tracking.analyze(),
			}),
		}
	})
}
