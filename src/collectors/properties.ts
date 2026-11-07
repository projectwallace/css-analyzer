import {
	get_atrule_name,
	get_name,
	get_first_identifier,
	get_list_items,
	get_atrule_parts,
	get_value_kind,
} from '../adapter/css-parser.js'
import { DefinedUsed, merge_defined_used, type DefinedUsedResult } from '../defined-used.js'
import { create_counter, merge_counts } from '../engine/counter.js'
import { define_collector } from '../engine/define-collector.js'
import type {
	CollectorDef,
	CountOptions,
	CountResult,
	DeclarationContext,
	LocationSource,
} from '../engine/types.js'
import { shorthand_properties } from '../properties/property-utils.js'

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
	complexity: CountResult
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
	return define_collector<PropertiesResult>(
		function init() {
			const names = create_counter(options)
			const prefixed = create_counter(options)
			const custom = create_counter(options)
			const custom_importants = create_counter(options)
			const shorthands = create_counter(options)
			const browserhacks = create_counter(options)
			const complexity = create_counter(options)
			const custom_tracking = new DefinedUsed()
			const anchor_tracking = new DefinedUsed()

			// The location of the property name, not the whole declaration
			let current: DeclarationContext | undefined
			const property_at: LocationSource = {
				get loc() {
					return current!.property_loc
				},
			}

			return {
				parse: { values: true, atrule_preludes: true },
				atrule(node) {
					const { prelude_text } = get_atrule_parts(node)
					if (get_atrule_name(node) === 'property' && prelude_text !== undefined) {
						custom_tracking.define(prelude_text)
					}
				},
				declaration(_node, ctx) {
					const raw = ctx.raw_property
					if (!raw) return
					current = ctx
					names.add(ctx.property, property_at)

					if (ctx.is_vendor_prefixed) {
						complexity.add('2', property_at)
						prefixed.add(raw, property_at)
					} else if (ctx.is_custom) {
						custom.add(raw, property_at)
						custom_tracking.define(raw)
						complexity.add(ctx.is_important ? '3' : '2', property_at)
						if (ctx.is_important) custom_importants.add(raw, property_at)
					} else if (ctx.is_browserhack) {
						browserhacks.add(raw.charAt(0), property_at)
						complexity.add('2', property_at)
					} else {
						complexity.add('1', property_at)
					}

					if (shorthand_properties.has(ctx.property)) shorthands.add(raw, property_at)

					// Anchor names live in values
					if (ctx.clean_value_text === undefined) return
					if (ctx.property === 'anchor-name') {
						for (const item of get_list_items(ctx.value!)) {
							if (get_value_kind(item) === 'identifier' && is_custom_name(item.text)) {
								anchor_tracking.define(item.text)
							}
						}
					} else if (ctx.property === 'position-anchor') {
						const name = get_first_identifier(ctx.value!)
						if (name !== undefined && is_custom_name(name)) anchor_tracking.use(name)
					}
				},
				value: {
					types: ['function'],
					enter(node) {
						const name = get_name(node).toLowerCase()
						if (name !== 'var' && name !== 'anchor' && name !== 'anchor-size') return
						const first = get_first_identifier(node)
						if (first === undefined || !is_custom_name(first)) return
						if (name === 'var') custom_tracking.use(first)
						else anchor_tracking.use(first)
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
		},
		(a, b) => ({
			...merge_counts(a, b),
			prefixed: merge_counts(a.prefixed, b.prefixed),
			custom: {
				...merge_counts(a.custom, b.custom),
				...merge_defined_used(a.custom, b.custom),
				importants: merge_counts(a.custom.importants, b.custom.importants),
			},
			shorthands: merge_counts(a.shorthands, b.shorthands),
			browserhacks: merge_counts(a.browserhacks, b.browserhacks),
			complexity: merge_counts(a.complexity, b.complexity),
			anchor_names: merge_defined_used(a.anchor_names, b.anchor_names),
		}),
	)
}
