// Per-declaration value complexity: 1 + vendor-prefixed-values count + browser-hacks count.
// Powers values.complexity and contributes to stylesheet.complexity in the compat layer.

import {
	NODE_TYPES,
	is_declaration,
	is_custom,
	is_supports_declaration,
	type AnyNode,
	type Declaration,
} from '@projectwallace/css-parser'
import { isValuePrefixed } from '../../values/vendor-prefix.js'
import { isValueBrowserhack } from '../../values/browserhacks.js'
import { AggregateCollection, type AggregateResult } from '../internals/aggregate-collection.js'
import type { AnalyzerInstance } from '../core.js'

export function valueComplexity(): AnalyzerInstance<AggregateResult> {
	const agg = new AggregateCollection()

	return {
		subscribes: [NODE_TYPES.DECLARATION],
		visit(node: AnyNode): void {
			if (is_supports_declaration(node)) return
			if (!is_declaration(node)) return
			const decl = node as Declaration
			if (!decl.value) return
			let c = 1
			isValuePrefixed(decl.value, () => { c++ })
			if (!is_custom(decl.property)) {
				isValueBrowserhack(decl.value, () => { c++ })
			}
			agg.push(c)
		},
		collect() {
			return agg.collect()
		},
	}
}
