import type { Dimension } from '@projectwallace/css-parser'
import { create_context_counter, merge_context_counts } from '../engine/counter.js'
import { define_collector } from '../engine/define-collector.js'
import type {
	CollectorDef,
	ContextCountOptions,
	ContextCountResult,
	CountOptions,
	CountResult,
} from '../engine/types.js'
import { SPACING_RESET_PROPERTIES } from '../properties/property-utils.js'
import { analyze_animation } from '../values/animations.js'
import { get_value_browserhacks } from '../values/browserhacks.js'
import { is_value_reset, keywords as global_keywords } from '../values/values.js'
import { get_prefixed_values } from '../values/vendor-prefix.js'
import {
	NO_VALUE_WALK,
	define_counting_collector,
	get_animation_names,
	get_context_property,
	lowercase_unless_var,
} from './shared.js'

const TEXT_SHADOW = new Set(['text-shadow'])
const DISPLAY = new Set(['display'])

/** The whole `text-shadow` value, as written */
export function text_shadows(options: CountOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				properties: TEXT_SHADOW,
				enter(_node, ctx) {
					const text = ctx.clean_value_text
					if (text !== undefined) {
						counter.add(text, ctx.at(ctx.value!))
					}
				},
			},
		}
	})
}

/** Values of `display`, lowercased (values with `var()` are kept as written) */
export function displays(options: CountOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				properties: DISPLAY,
				enter(_node, ctx) {
					if (!ctx.value) {
						return
					}
					const raw = ctx.value_text
					const text = global_keywords.has(raw) ? raw.toLowerCase() : ctx.clean_value_text
					counter.add(lowercase_unless_var(text!), ctx.at(ctx.value))
				},
			},
		}
	})
}

/** Units of every dimension (`px`, `em`, ...), lowercased; with `contexts` also per property */
export function units(options: ContextCountOptions = {}): CollectorDef<ContextCountResult> {
	return define_collector<ContextCountResult>(function init() {
		const counter = create_context_counter(options)
		return {
			parse: { values: true },
			value: {
				types: ['dimension'],
				enter(node, ctx) {
					if (NO_VALUE_WALK.has(ctx.property)) {
						return
					}
					counter.add(
						(node as Dimension).unit.toLowerCase(),
						get_context_property(ctx, options.property),
						ctx.at(node),
					)
				},
			},
			result: () => counter.result(),
		}
	}, merge_context_counts)
}

/** Global keywords (`inherit`, `none`, `auto`, ...) used as values, lowercased */
export function keywords(options: CountOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration(_node, ctx) {
				if (!ctx.value) {
					return
				}
				const text = ctx.value_text
				const at = ctx.at(ctx.value)

				if (global_keywords.has(text)) {
					counter.add(text.toLowerCase(), at)
				} else if (ctx.property === 'font') {
					for (const keyword of ctx.font_shorthand?.keywords ?? []) {
						counter.add(keyword.toLowerCase(), at)
					}
				} else if (ctx.property === 'transition' || ctx.property === 'animation') {
					for (const keyword of analyze_animation(ctx.value).keywords) {
						counter.add(keyword.toLowerCase(), at)
					}
				}
			},
			value: {
				types: ['identifier'],
				enter(node, ctx) {
					// Whole-value keywords and shorthands were handled above
					if (NO_VALUE_WALK.has(ctx.property) || ctx.property === 'font') {
						return
					}
					if (global_keywords.has(ctx.value_text)) {
						return
					}
					const text = node.text
					if (global_keywords.has(text)) {
						counter.add(text.toLowerCase(), ctx.at(node))
					}
				},
			},
		}
	})
}

/** Spacing properties that are reset to 0 (`margin: 0`), counted by property */
export function resets(options: CountOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				properties: SPACING_RESET_PROPERTIES,
				enter(_node, ctx) {
					if (ctx.clean_value_text === undefined) {
						return
					}
					if (is_value_reset(ctx.value!)) {
						counter.add(ctx.property, ctx.at(ctx.value!))
					}
				},
			},
		}
	})
}

/** Vendor prefixed values (`-webkit-box`, `-webkit-linear-gradient()`), lowercased */
export function value_prefixes(options: CountOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration(_node, ctx) {
				if (ctx.clean_value_text === undefined) {
					return
				}
				for (const prefixed of get_prefixed_values(ctx.value!)) {
					counter.add(prefixed.toLowerCase(), ctx.at(ctx.value!))
				}
			},
		}
	})
}

/** Value browserhacks: `progid:`, `\9`, `\7`, `alpha()`, `expression()`, `.htc` and `!ie` */
export function value_browserhacks(options: CountOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration(node, ctx) {
				if (!ctx.value) {
					return
				}
				if (ctx.is_important && !node.text.toLowerCase().includes('!important')) {
					counter.add('!ie', ctx.at(ctx.value))
				}
				if (ctx.clean_value_text === undefined || ctx.is_custom) {
					return
				}
				for (const hack of get_value_browserhacks(ctx.value)) {
					counter.add(hack, ctx.at(ctx.value))
				}
			},
		}
	})
}

/**
 * Complexity of every value: 1, plus 1 for every vendor prefixed value and browserhack.
 * Items are numbers; use `summarize_numbers()` for min, max, mean, ...
 */
export function value_complexity(options: CountOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration(_node, ctx) {
				if (!ctx.value) {
					return
				}
				let complexity = 1
				if (ctx.clean_value_text !== undefined) {
					complexity += get_prefixed_values(ctx.value).length
					if (!ctx.is_custom) {
						complexity += get_value_browserhacks(ctx.value).length
					}
				}
				counter.add(String(complexity), ctx.at(ctx.value))
			},
		}
	})
}

/** Names used in `animation` and `animation-name`, quotes removed */
export function animation_names(options: CountOptions = {}): CollectorDef<CountResult> {
	return define_counting_collector(options, function setup(counter) {
		return {
			parse: { values: true },
			declaration: {
				properties: new Set(['animation', 'animation-name']),
				enter(_node, ctx) {
					for (const name of get_animation_names(ctx)) {
						counter.add(name, ctx.at(ctx.value!))
					}
				},
			},
		}
	})
}
