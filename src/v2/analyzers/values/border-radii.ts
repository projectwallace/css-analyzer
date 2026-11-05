import { NODE_TYPES, is_declaration, type AnyNode, type Declaration } from '@projectwallace/css-parser'
import { border_radius_properties } from '../../../properties/property-utils.js'
import {
	ContextCountCollection,
	type ContextCountResult,
	type ContextCountResultWithLocations,
} from '../../internals/context-count-collection.js'
import type { AnalyzerInstance } from '../../core.js'

export type BorderRadiiOptions = { locations?: boolean }

export function borderRadii(
	options: BorderRadiiOptions = {},
): AnalyzerInstance<ContextCountResult | ContextCountResultWithLocations> {
	const collection = new ContextCountCollection(options.locations === true)

	return {
		subscribes: [NODE_TYPES.DECLARATION],
		visit(node: AnyNode): void {
			if (!is_declaration(node)) return
			const decl = node as Declaration
			if (!decl.value) return
			const prop = decl.property.toLowerCase()
			if (!border_radius_properties.has(prop)) return
			const vl = decl.value
			collection.add(vl.text, prop, vl.line, vl.column, vl.start, vl.length)
		},
		collect() {
			return collection.collect()
		},
	}
}
