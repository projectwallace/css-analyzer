import {
	NODE_TYPES,
	is_atrule,
	is_atrule_prelude,
	is_container_query,
	is_identifier,
	type AnyNode,
	type Atrule,
} from '@projectwallace/css-parser'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../internals/count-collection.js'
import type { AnalyzerInstance } from '../core.js'

export type AtruleContainersOptions = { locations?: boolean }

export type AtruleContainersResult = {
	queries: CountResult | CountResultWithLocations
	names: CountResult | CountResultWithLocations
}

export function atruleContainers(
	options: AtruleContainersOptions = {},
): AnalyzerInstance<AtruleContainersResult> {
	const withLocations = options.locations === true
	const queries = new CountCollection(withLocations)
	const names = new CountCollection(withLocations)

	return {
		subscribes: [NODE_TYPES.AT_RULE],
		visit(node: AnyNode): void {
			if (!is_atrule(node)) return
			if ((node.name?.toLowerCase() ?? '') !== 'container') return
			const n = node as Atrule
			if (!n.has_prelude) return
			queries.add(n.prelude.text, n.line, n.column, n.start, n.length)

			if (is_atrule_prelude(n.prelude) && is_container_query(n.prelude.first_child)) {
				const cq = n.prelude.first_child
				if (cq.first_child && is_identifier(cq.first_child)) {
					names.add(cq.first_child.text, n.line, n.column, n.start, n.length)
				}
			}
		},
		collect(): AtruleContainersResult {
			return { queries: queries.collect(), names: names.collect() }
		},
	}
}
