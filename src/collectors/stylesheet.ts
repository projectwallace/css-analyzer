import { is_url, str_starts_with } from '@projectwallace/css-parser'
import { define_collector } from '../engine/define-collector.js'
import type { CollectorDef, Location } from '../engine/types.js'
import { unquote } from '../string-utils.js'
import { concat_locations } from './shared.js'
import { get_embed_type } from '../stylesheet/stylesheet.js'

export type EmbeddedType = { count: number; size: number; locations?: Location[] }

export type StylesheetResult = {
	/** Characters of CSS */
	size: number
	/** Lines of CSS (a stylesheet without line breaks has 1) */
	lines: number
	comments: { total: number; size: number }
	/** `data:` URIs in `url()` values */
	embedded: {
		total: number
		/** Characters of all embedded content together */
		size: number
		/** Counted by mime type, e.g. `image/png` */
		types: Map<string, EmbeddedType>
	}
}

export type StylesheetOptions = { locations?: boolean }

/**
 * Size, lines, comments and embedded content.
 * Comments are only found when the analyzer parses the CSS itself (not for an AST you pass in).
 */
export function stylesheet(options: StylesheetOptions = {}): CollectorDef<StylesheetResult> {
	const locations = options.locations === true

	return define_collector<StylesheetResult>(
		function init() {
			let size = 0
			let lines = 0
			let comments = 0
			let comments_size = 0
			let embedded_size = 0
			let embedded_total = 0
			const types = new Map<string, EmbeddedType>()

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
					types: ['url'],
					enter(node, ctx) {
						if (!is_url(node)) {
							return
						}
						const embed = unquote(node.value ?? '')
						if (!str_starts_with('data:', embed)) {
							return
						}
						embedded_total++
						embedded_size += embed.length
						const type = get_embed_type(embed)
						const entry = types.get(type) ?? { count: 0, size: 0 }
						entry.count++
						entry.size += embed.length
						if (locations) {
							entry.locations ??= []
							entry.locations.push(ctx.at(node).loc)
						}
						types.set(type, entry)
					},
				},
				result: () => ({
					size,
					lines,
					comments: { total: comments, size: comments_size },
					embedded: {
						total: embedded_total,
						size: embedded_size,
						types: new Map(
							[...types].map(([type, entry]) => [
								type,
								{ count: entry.count, size: entry.size, locations: entry.locations?.slice() },
							]),
						),
					},
				}),
			}
		},
		(a, b) => {
			const types = new Map<string, EmbeddedType>()
			for (const source of [a.embedded.types, b.embedded.types]) {
				for (const [type, entry] of source) {
					const existing = types.get(type)
					if (existing) {
						existing.count += entry.count
						existing.size += entry.size
						existing.locations = concat_locations(existing.locations, entry.locations)
					} else {
						types.set(type, {
							count: entry.count,
							size: entry.size,
							locations: entry.locations?.slice(),
						})
					}
				}
			}
			return {
				size: a.size + b.size,
				lines: a.lines + b.lines,
				comments: {
					total: a.comments.total + b.comments.total,
					size: a.comments.size + b.comments.size,
				},
				embedded: {
					total: a.embedded.total + b.embedded.total,
					size: a.embedded.size + b.embedded.size,
					types,
				},
			}
		},
	)
}
