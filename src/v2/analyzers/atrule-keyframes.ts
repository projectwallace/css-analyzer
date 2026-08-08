import { NODE_TYPES, is_atrule, type AnyNode, type Atrule } from '@projectwallace/css-parser'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../internals/count-collection.js'
import type { AnalyzerInstance } from '../core.js'

export type AtruleKeyframesResult = {
	total: number
	totalUnique: number
	uniquenessRatio: number
	unique: Record<string, number>
	prefixed: CountResult | CountResultWithLocations
	prefixedRatio: number
	uniqueWithLocations?: Record<string, import('../internals/location-store.js').Location[]>
}

export type AtruleKeyframesOptions = { locations?: boolean }

export function atruleKeyframes(
	options: AtruleKeyframesOptions = {},
): AnalyzerInstance<AtruleKeyframesResult> {
	const withLocations = options.locations === true
	const all = new CountCollection(withLocations)
	const prefixed = new CountCollection(withLocations)

	return {
		subscribes: [NODE_TYPES.AT_RULE],
		visit(node: AnyNode): void {
			if (!is_atrule(node)) return
			const name = node.name?.toLowerCase() ?? ''
			if (!name.endsWith('keyframes')) return
			const n = node as Atrule
			if (!n.has_prelude) return
			const prelude = n.prelude.text
			all.add(prelude, n.line, n.column, n.start, n.length)
			if (n.is_vendor_prefixed) {
				prefixed.add(`@${name} ${prelude}`, n.line, n.column, n.start, n.length)
			}
		},
		collect(): AtruleKeyframesResult {
			const allResult = all.collect()
			const prefixedResult = prefixed.collect()
			return {
				...allResult,
				prefixed: prefixedResult,
				prefixedRatio: allResult.total === 0 ? 0 : prefixedResult.total / allResult.total,
			}
		},
	}
}
