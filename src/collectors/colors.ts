import { FUNCTION, HASH, IDENTIFIER } from '@projectwallace/css-parser'
import { create_context_counter, create_counter } from '../engine/counter.ts'
import { define_collector } from '../engine/define-collector.ts'
import type {
	CollectorDef,
	ContextCountOptions,
	ContextCountResult,
	CountResult,
	WithContexts,
} from '../engine/types.ts'
import { color_format, color_text } from '../extract/colors.ts'
import { get_context_property, type Normalize } from './shared.ts'

export type ColorsOptions = ContextCountOptions & {
	/** `none` keeps the case as written */
	normalize?: Normalize
}

export type ColorsResult = ContextCountResult & {
	/** `hex3`, `named`, `rgb`, ... */
	formats: CountResult
}

// Words that are names are not colors: values of `font-family`, `transition`, `animation`,
// `animation-name` and `z-index` are skipped (`animation-name: red` is not a color), and so are
// the words in a `font` shorthand (`font: 12px Black`). Colors in custom properties (`--brand: red`)
// and in properties the collector does not know (`unknown: blue`) are counted.
/** Hex, named, system and keyword colors and color functions */
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
					const format = color_format(node, ctx.property)
					if (format === undefined) {
						return
					}
					const text = color_text(node)
					// Color functions are counted as written
					const item = node.type === FUNCTION ? text : normalize(text)
					counter.add(item, get_context_property(ctx, options?.property), node)
					formats.add(format, node)
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
