import {
	is_function,
	strip_value_hack,
	FUNCTION,
	HASH,
	IDENTIFIER,
} from '@projectwallace/css-parser'
import { create_context_counter, create_counter } from '../engine/counter.ts'
import { define_collector } from '../engine/define-collector.ts'
import type {
	CollectorDef,
	ContextCountOptions,
	ContextCountResult,
	CountResult,
	WithContexts,
} from '../engine/types.ts'
import { color_functions, color_keywords, named_colors, system_colors } from '../values/colors.ts'
import { get_context_property, type Normalize } from './shared.ts'
import { no_value_walk } from './value-helpers.ts'

export type ColorsOptions = ContextCountOptions & {
	/** `lowercase` (default) lowercases hex colors and color names. Color functions are always kept as written. */
	normalize?: Normalize
}

/** The result with `{ contexts: true }`. Without `contexts` there is no `by_context`. */
export type ColorsResult = ContextCountResult & {
	/** `hex3`, `hex6`, `named`, `system`, `transparent`, `rgb`, `oklch`, ... */
	formats: CountResult
}

// Words that are names are not colors: values of `font-family`, `transition`, `animation`,
// `animation-name` and `z-index` are skipped (`animation-name: red` is not a color), and so are
// the words in a `font` shorthand (`font: 12px Black`). Colors in custom properties (`--brand: red`)
// and in properties the collector does not know (`unknown: blue`) are counted.
/** Colors in values: hex, named, system and keyword colors and color functions, with their `formats` */
export function colors<O extends ColorsOptions = {}>(
	options?: O,
): CollectorDef<WithContexts<CountResult & { formats: CountResult }, O>> {
	return define_collector<WithContexts<CountResult & { formats: CountResult }, O>>(function init() {
		const counter = create_context_counter(options)
		const formats = create_counter(options)
		const lowercase = options?.normalize !== 'none'

		function normalize(text: string): string {
			return lowercase ? text.toLowerCase() : text
		}

		return {
			parse: { values: true },
			value: {
				types: [HASH, IDENTIFIER, FUNCTION],
				enter(node, ctx) {
					const property = ctx.property
					// `animation-name: red` is a name, not a color
					if (no_value_walk.has(property) || property === 'animation-name') {
						return
					}
					const context = get_context_property(ctx, options?.property)
					const text = node.text

					if (node.type === HASH) {
						if (!text.startsWith('#')) {
							return
						}
						// Only the color is counted: without the # and without any IE hack (\9, \7)
						const hex = strip_value_hack(text)
						const hex_length = hex.length - 1
						counter.add(normalize(hex), context, node)
						formats.add('hex' + hex_length, node)
					} else if (node.type === IDENTIFIER) {
						// Font names like "Black" are not colors
						if (property === 'font') {
							return
						}
						// 3 === 'red'.length, 20 === 'lightgoldenrodyellow'.length
						if (text.length > 20 || text.length < 3) {
							return
						}

						if (color_keywords.has(text)) {
							counter.add(normalize(text), context, node)
							formats.add(text.toLowerCase(), node)
						} else if (named_colors.has(text)) {
							counter.add(normalize(text), context, node)
							formats.add('named', node)
						} else if (system_colors.has(text)) {
							counter.add(normalize(text), context, node)
							formats.add('system', node)
						}
					} else {
						const name = is_function(node) ? node.name : ''
						if (color_functions.has(name)) {
							counter.add(text, context, node)
							formats.add(name.toLowerCase(), node)
						}
					}
				},
			},
			result: () =>
				({ ...counter.result(), formats: formats.result() }) as WithContexts<
					CountResult & { formats: CountResult },
					O
				>,
		}
	})
}
