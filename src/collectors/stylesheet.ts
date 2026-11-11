import { is_url, str_starts_with, URL } from '@projectwallace/css-parser'
import { create_counter } from '../engine/counter.ts'
import { define_collector } from '../engine/define-collector.ts'
import type { CollectorDef, CountResult } from '../engine/types.ts'
import { unquote } from '../utils/string-utils.ts'
import { get_embed_type } from '../stylesheet/stylesheet.ts'

export type StylesheetResult = {
	/** Characters of CSS */
	size: number
	/** Lines of CSS (a stylesheet without line breaks has 1) */
	lines: number
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
 * Size, lines, comments and embedded content.
 * Comments are only found when the analyzer parses the CSS itself (not for an AST you pass in).
 */
export function stylesheet(options: StylesheetOptions = {}): CollectorDef<StylesheetResult> {
	return define_collector<StylesheetResult>(function init() {
		let size = 0
		let lines = 0
		let comments = 0
		let comments_size = 0
		let embedded_size = 0
		const embedded = create_counter({ locations: options.locations })

		return {
			parse: { values: true },
			stylesheet(_node, ctx) {
				size += ctx.css.length
				lines += (ctx.css.match(/\n/g) ?? []).length + 1
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
				comments: { total: comments, size: comments_size },
				embedded: { ...embedded.result(), size: embedded_size },
			}),
		}
	})
}
