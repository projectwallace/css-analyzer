// Declarations-per-rule analyzer.
//
// Subscribes to STYLE_RULE nodes. For each rule, counts direct-child
// declarations in its block (nested rules' declarations are counted under
// their own rule, not the parent).

import { NODE_TYPES, is_declaration, type AnyNode, type Rule } from '@projectwallace/css-parser'
import {
	NumericCollection,
	type NumericResult,
	type NumericResultWithLocations,
} from '../internals/numeric-collection.js'
import type { AnalyzerInstance } from '../core.js'

export type DeclarationsPerRuleOptions = {
	locations?: boolean
}

export function declarationsPerRule(
	options: DeclarationsPerRuleOptions = {},
): AnalyzerInstance<NumericResult | NumericResultWithLocations> {
	const withLocations = options.locations === true
	const collection = new NumericCollection(withLocations)

	return {
		subscribes: [NODE_TYPES.STYLE_RULE],

		visit(node: AnyNode): void {
			const rule = node as Rule
			const block = rule.block
			if (!block) return

			let count = 0
			const children = block.children
			for (let i = 0; i < children.length; i++) {
				if (is_declaration(children[i]!)) count++
			}

			collection.push(count, rule.line, rule.column, rule.start, rule.length)
		},

		collect() {
			return collection.collect()
		},
	}
}
