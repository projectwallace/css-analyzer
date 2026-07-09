// Embedded content analyzer.
//
// Subscribes to URL nodes, detects data URIs (data:…), and accumulates:
//   - totalCount — total number of embedded data URIs
//   - totalSize  — total byte length of all data URIs combined
//   - sizeRatio  — totalSize / css.length (requires prepare to be called)
//   - unique     — per MIME-type count + size breakdown
//
// Locations (when enabled) point at the url() token for each occurrence.

import { NODE_TYPES, str_starts_with, type AnyNode, type Url } from '@projectwallace/css-parser'
import { unquote } from '../../string-utils.js'
import { getEmbedType } from '../../stylesheet/stylesheet.js'
import { LocationStore, type Location } from '../internals/location-store.js'
import type { AnalyzerInstance } from '../core.js'

type EmbedEntry = {
	count: number
	size: number
	locs: LocationStore | null
}

export type EmbedTypeResult = {
	count: number
	size: number
}

export type EmbedTypeResultWithLocations = EmbedTypeResult & {
	locations: Location[]
}

export type EmbeddedContentResult = {
	totalCount: number
	totalSize: number
	sizeRatio: number
	unique: Record<string, EmbedTypeResult>
}

export type EmbeddedContentResultWithLocations = Omit<EmbeddedContentResult, 'unique'> & {
	unique: Record<string, EmbedTypeResultWithLocations>
}

export type EmbeddedContentOptions = {
	locations?: boolean
}

export function embeddedContent(
	options: EmbeddedContentOptions = {},
): AnalyzerInstance<EmbeddedContentResult | EmbeddedContentResultWithLocations> {
	const withLocations = options.locations === true
	let cssSize = 0
	let totalCount = 0
	let totalSize = 0
	const byType = new Map<string, EmbedEntry>()

	return {
		subscribes: [NODE_TYPES.URL],

		prepare(css: string): void {
			cssSize = css.length
		},

		visit(node: AnyNode): void {
			const url = node as Url
			const raw = unquote(url.value ?? '')
			if (!str_starts_with(raw, 'data:')) return

			const size = raw.length
			const type = getEmbedType(raw)
			totalCount++
			totalSize += size

			let entry = byType.get(type)
			if (!entry) {
				entry = { count: 0, size: 0, locs: withLocations ? new LocationStore() : null }
				byType.set(type, entry)
			}
			entry.count++
			entry.size += size
			if (withLocations && entry.locs !== null) {
				entry.locs.push(url.line, url.column, url.start, url.length)
			}
		},

		collect(): EmbeddedContentResult | EmbeddedContentResultWithLocations {
			const unique: Record<string, EmbedTypeResult> = {}
			const uniqueWithLocations: Record<string, EmbedTypeResultWithLocations> = {}

			for (const [type, entry] of byType) {
				unique[type] = { count: entry.count, size: entry.size }
				if (withLocations && entry.locs !== null) {
					uniqueWithLocations[type] = {
						count: entry.count,
						size: entry.size,
						locations: entry.locs.toArray(),
					}
				}
			}

			const sizeRatio = cssSize === 0 ? 0 : totalSize / cssSize

			if (withLocations) {
				return { totalCount, totalSize, sizeRatio, unique: uniqueWithLocations }
			}
			return { totalCount, totalSize, sizeRatio, unique }
		},
	}
}
