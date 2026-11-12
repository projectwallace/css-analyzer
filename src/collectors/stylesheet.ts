import {
	is_selector_list,
	is_url,
	property_basename,
	str_starts_with,
	URL,
} from '@projectwallace/css-parser'
import { create_counter } from '../engine/counter.ts'
import { define_collector } from '../engine/define-collector.ts'
import type { CollectorDef, CountResult } from '../engine/types.ts'
import { unquote } from '../utils/string-utils.ts'
import { get_embed_type } from '../stylesheet/stylesheet.ts'
import { get_media_browserhacks, get_supports_browserhacks } from '../atrules/atrules.ts'
import { get_complexity } from '../selectors/utils.ts'
import {
	get_atrule_weight,
	get_declaration_weight,
	get_property_weight,
	get_value_weight,
} from './complexity.ts'

export type StylesheetResult = {
	/** Characters of CSS */
	size: number
	/** Lines of CSS (a stylesheet without line breaks has 1) */
	lines: number
	/**
	 * Statements: at-rules + selectors + declarations (keyframe selectors included).
	 * Unlike `lines`, it ignores blank lines, comments and formatting.
	 */
	source_lines_of_code: number
	/**
	 * The sum of the complexity of every at-rule, selector, declaration, property and value.
	 * These are the same weights as `atrules().complexity`, `selectors().complexity`,
	 * `declarations().complexity`, `properties().complexity` and `value_complexity()`, added up.
	 */
	complexity: number
	comments: { total: number; size: number }
	/** `data:` URIs in `url()` values, counted by mime type (`unique` has e.g. `image/png`) */
	embedded: CountResult & {
		/** Characters of all embedded content together */
		size: number
	}
}

export type StylesheetOptions = {
	/** Also keep where every embedded `data:` URI was found (`embedded.unique.get(type).locations`) */
	locations?: boolean
}

/**
 * Size, lines, source lines of code, complexity, comments and embedded content.
 * Source lines of code and complexity need selectors, values and at-rule preludes to be parsed,
 * so this collector parses all three. Selectors in at-rule preludes (`@scope (.a)`,
 * `@supports selector(...)`) are not counted, as in `selectors()`.
 */
export function stylesheet(options: StylesheetOptions = {}): CollectorDef<StylesheetResult> {
	return define_collector<StylesheetResult>(function init() {
		let size = 0
		let lines = 0
		let comments = 0
		let comments_size = 0
		let embedded_size = 0
		let statements = 0
		let complexity = 0
		const embedded = create_counter({ locations: options.locations })

		return {
			parse: { values: true, atrule_preludes: true },
			stylesheet(_node, ctx) {
				size += ctx.css.length
				lines += (ctx.css.match(/\n/g) ?? []).length + 1
			},
			atrule(node) {
				statements++
				const name = property_basename(node.name)
				const prelude = node.has_prelude ? node.prelude : undefined
				let hacks = 0
				if (prelude) {
					if (name === 'media') {
						hacks = get_media_browserhacks(prelude).length
					} else if (name === 'supports') {
						hacks = get_supports_browserhacks(prelude).length
					}
				}
				complexity += get_atrule_weight(node, name, prelude !== undefined, hacks)
			},
			rule(node, ctx) {
				// Keyframe selectors (`from`, `50%`) are statements, but not selectors for the selector metrics
				if (!ctx.atrule_stack.includes('keyframes')) {
					return
				}
				const prelude = node.prelude
				if (prelude && is_selector_list(prelude)) {
					statements += prelude.child_count
				}
			},
			selector(node) {
				statements++
				complexity += get_complexity(node)[0]!
			},
			declaration: {
				enter(_node, ctx) {
					statements++
					complexity += get_declaration_weight(ctx)
					if (ctx.raw_property) {
						complexity += get_property_weight(ctx)
					}
					if (ctx.value) {
						complexity += get_value_weight(ctx)
					}
				},
			},
			comment(loc) {
				comments++
				// includes /* and */ in the size calculation
				comments_size += loc.length
			},
			value: {
				types: [URL],
				enter(node) {
					if (!is_url(node)) {
						return
					}
					const embed = unquote(node.value ?? '')
					if (!str_starts_with('data:', embed)) {
						return
					}
					embedded_size += embed.length
					embedded.add(get_embed_type(embed), node)
				},
			},
			result: () => ({
				size,
				lines,
				source_lines_of_code: statements,
				complexity,
				comments: { total: comments, size: comments_size },
				embedded: { ...embedded.result(), size: embedded_size },
			}),
		}
	})
}
