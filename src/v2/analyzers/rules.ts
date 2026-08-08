// Rule-level analysis: total count, empty rules, sizes, nesting, selectors-per-rule.
// Note: declarations-per-rule has its own dedicated analyzer for finer tree-shaking.

import {
	NODE_TYPES,
	is_rule,
	is_selector_list,
	is_selector,
	is_declaration,
	type AnyNode,
	type Rule,
} from '@projectwallace/css-parser'
import { AggregateCollection, type AggregateResult } from '../internals/aggregate-collection.js'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../internals/count-collection.js'
import type { AnalyzerInstance, WalkContext } from '../core.js'

export type RulesOptions = { locations?: boolean }

export type RulesResult = {
	total: number
	empty: { total: number; ratio: number }
	sizes: AggregateResult & { unique: CountResult | CountResultWithLocations }
	nesting: AggregateResult & { unique: CountResult | CountResultWithLocations }
	selectorsPerRule: AggregateResult & { unique: CountResult | CountResultWithLocations }
}

export function rules(options: RulesOptions = {}): AnalyzerInstance<RulesResult> {
	const withLocations = options.locations === true
	let total = 0
	let empty = 0
	const sizes = new AggregateCollection()
	const uniqueSizes = new CountCollection(withLocations)
	const nesting = new AggregateCollection()
	const uniqueNesting = new CountCollection(withLocations)
	const selectorsPerRule = new AggregateCollection()
	const uniqueSelectorsPerRule = new CountCollection(withLocations)

	return {
		subscribes: [NODE_TYPES.STYLE_RULE],
		visit(node: AnyNode, ctx: WalkContext): void {
			if (!is_rule(node) || ctx.inKeyframes) return
			const rule = node as Rule
			total++
			if (rule.block?.is_empty) empty++

			let numSelectors = 0
			let numDeclarations = 0
			if (rule.has_prelude && is_selector_list(rule.prelude)) {
				for (const s of rule.prelude) {
					if (is_selector(s)) numSelectors++
				}
			}
			if (rule.block) {
				for (const child of rule.block) {
					if (is_declaration(child)) numDeclarations++
				}
			}

			const size = numSelectors + numDeclarations
			sizes.push(size)
			uniqueSizes.add(String(size), rule.line, rule.column, rule.start, rule.length)

			nesting.push(ctx.depth)
			uniqueNesting.add(String(ctx.depth), rule.line, rule.column, rule.start, rule.length)

			selectorsPerRule.push(numSelectors)
			uniqueSelectorsPerRule.add(String(numSelectors), rule.line, rule.column, rule.start, rule.length)
		},
		collect(): RulesResult {
			const ratio = total === 0 ? 0 : empty / total
			return {
				total,
				empty: { total: empty, ratio },
				sizes: { ...sizes.collect(), unique: uniqueSizes.collect() },
				nesting: { ...nesting.collect(), unique: uniqueNesting.collect() },
				selectorsPerRule: { ...selectorsPerRule.collect(), unique: uniqueSelectorsPerRule.collect() },
			}
		},
	}
}
