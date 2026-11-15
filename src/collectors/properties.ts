import { is_function, FUNCTION, property_basename, is_custom } from '@projectwallace/css-parser'
import { DefinedUsed, type DefinedUsedResult } from '../utils/collections/defined-used.ts'
import { create_counter } from '../engine/counter.ts'
import { define_collector } from '../engine/define-collector.ts'
import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { shorthand_properties } from '../properties/property-utils.ts'
import { get_anchor_names } from '../values/anchors.ts'
import { get_property_weight } from './complexity.ts'
import { get_first_identifier } from './value-helpers.ts'

export type PropertiesResult = CountResult & {
	prefixed: CountResult
	custom: CountResult &
		DefinedUsedResult & {
			importants: CountResult
		}
	shorthands: CountResult
	/** The hack character (`*`, `_`, ...) */
	browserhacks: CountResult
	complexity: CountResult<number>
	anchor_names: DefinedUsedResult
}

/** Properties, prefixes, custom properties, shorthands, hacks and anchor names */
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

					complexity.add(get_property_weight(ctx), node, length)
					if (ctx.is_vendor_prefixed) {
						prefixed.add(raw, node, length)
					} else if (ctx.is_custom) {
						custom.add(raw, node, length)
						custom_tracking.define(raw)
						if (ctx.is_important) {
							custom_importants.add(raw, node, length)
						}
					} else if (ctx.is_browserhack) {
						browserhacks.add(raw.charAt(0), node, length)
					}

					if (shorthand_properties.has(ctx.property)) {
						shorthands.add(raw, node, length)
					}

					// Anchor names live in values
					if (ctx.clean_value_text === undefined) {
						return
					}
					if (ctx.property === 'anchor-name') {
						for (const anchor of get_anchor_names(ctx.value!)) {
							anchor_tracking.define(anchor.value)
						}
					} else if (ctx.property === 'position-anchor') {
						for (const anchor of get_anchor_names(ctx.value!)) {
							anchor_tracking.use(anchor.value)
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
					if (first === undefined || !is_custom(first)) {
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
