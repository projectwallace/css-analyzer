import { is_function, FUNCTION, HASH, IDENTIFIER } from '@projectwallace/css-parser'
import { create_context_counter, create_counter } from '../engine/counter.ts'
import { define_collector } from '../engine/define-collector.ts'
import type {
	CollectorDef,
	ContextCountOptions,
	ContextCountResult,
	CountResult,
} from '../engine/types.ts'
import { color_functions, color_keywords, named_colors, system_colors } from '../values/colors.ts'
import { NO_VALUE_WALK, get_context_property, type Normalize } from './shared.ts'

export type ColorsOptions = ContextCountOptions & {
	/** `lowercase` (default) lowercases hex colors and color names. Color functions are always kept as written. */
	normalize?: Normalize
}

export type ColorsResult = ContextCountResult & {
	/** `hex3`, `hex6`, `named`, `system`, `transparent`, `rgb`, `oklch`, ... */
	formats: CountResult
}

export function colors(options: ColorsOptions = {}): CollectorDef<ColorsResult> {
	return define_collector<ColorsResult>(function init() {
		const counter = create_context_counter(options)
		const formats = create_counter(options)
		const lowercase = options.normalize !== 'none'

		function normalize(text: string): string {
			return lowercase ? text.toLowerCase() : text
		}

		return {
			parse: { values: true },
			value: {
				types: [HASH, IDENTIFIER, FUNCTION],
				enter(node, ctx) {
					const property = ctx.property
					if (NO_VALUE_WALK.has(property)) {
						return
					}
					const context = get_context_property(ctx, options.property)
					const text = node.text

					if (node.type === HASH) {
						if (!text.startsWith('#')) {
							return
						}
						// Exclude the # and any IE hack (\9, \7) from the hex length
						const hex_length = text.length - (text.endsWith('\\9') || text.endsWith('\\7') ? 3 : 1)
						counter.add(normalize(text), context, node)
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
			result: () => ({ ...counter.result(), formats: formats.result() }),
		}
	})
}
