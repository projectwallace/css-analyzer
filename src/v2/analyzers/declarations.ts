// Declaration-level analysis: total/unique counts, !important tracking, nesting, complexity.

import {
	NODE_TYPES,
	is_declaration,
	is_supports_declaration,
	type AnyNode,
	type Declaration,
} from '@projectwallace/css-parser'
import { AggregateCollection, type AggregateResult } from '../internals/aggregate-collection.js'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../internals/count-collection.js'
import type { AnalyzerInstance, WalkContext } from '../core.js'

export type DeclarationsOptions = { locations?: boolean }

export type DeclarationsResult = {
	total: number
	totalUnique: number
	uniquenessRatio: number
	importants: {
		total: number
		ratio: number
		inKeyframes: { total: number; ratio: number }
	}
	complexity: AggregateResult
	nesting: AggregateResult & { unique: CountResult | CountResultWithLocations }
}

export function declarations(options: DeclarationsOptions = {}): AnalyzerInstance<DeclarationsResult> {
	const withLocations = options.locations === true
	let total = 0
	const uniqueSet = new Set<string>()
	let importantTotal = 0
	let importantInKeyframes = 0
	const complexity = new AggregateCollection()
	const nesting = new AggregateCollection()
	const uniqueNesting = new CountCollection(withLocations)

	return {
		subscribes: [NODE_TYPES.DECLARATION, NODE_TYPES.SUPPORTS_DECLARATION],
		visit(node: AnyNode, ctx: WalkContext): void {
			// Skip supports declarations (just guards, not real declarations)
			if (is_supports_declaration(node)) return
			if (!is_declaration(node)) return

			const decl = node as Declaration
			total++
			uniqueSet.add(decl.text)

			const depth = ctx.depth > 0 ? ctx.depth - 1 : 0
			nesting.push(depth)
			uniqueNesting.add(String(depth), decl.line, decl.column, decl.start, decl.length)

			let c = 1
			if (decl.is_important) {
				c++
				importantTotal++
				if (ctx.inKeyframes) {
					importantInKeyframes++
					c++
				}
			}
			complexity.push(c)
		},
		collect(): DeclarationsResult {
			return {
				total,
				totalUnique: uniqueSet.size,
				uniquenessRatio: total === 0 ? 0 : uniqueSet.size / total,
				importants: {
					total: importantTotal,
					ratio: total === 0 ? 0 : importantTotal / total,
					inKeyframes: {
						total: importantInKeyframes,
						ratio: importantTotal === 0 ? 0 : importantInKeyframes / importantTotal,
					},
				},
				complexity: complexity.collect(),
				nesting: { ...nesting.collect(), unique: uniqueNesting.collect() },
			}
		},
	}
}
