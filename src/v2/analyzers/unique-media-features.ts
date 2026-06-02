// Unique media features analyzer.
//
// Subscribes to MEDIA_FEATURE nodes. The feature name (node.property) is
// the identifier before the colon — e.g. "min-width", "hover", "color".

import { NODE_TYPES, type AnyNode, type MediaFeature } from '@projectwallace/css-parser'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../internals/count-collection.js'
import type { AnalyzerInstance } from '../core.js'

export type UniqueMediaFeaturesOptions = {
	locations?: boolean
}

export function uniqueMediaFeatures(
	options: UniqueMediaFeaturesOptions = {},
): AnalyzerInstance<CountResult | CountResultWithLocations> {
	const withLocations = options.locations === true
	const collection = new CountCollection(withLocations)

	return {
		subscribes: [NODE_TYPES.MEDIA_FEATURE],

		visit(node: AnyNode): void {
			const mf = node as MediaFeature
			const name = mf.property.toLowerCase()
			collection.add(name, mf.line, mf.column, mf.start, mf.length)
		},

		collect() {
			return collection.collect()
		},
	}
}
