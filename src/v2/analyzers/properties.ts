// Property-level analysis: total/unique, vendor-prefixed, custom properties,
// shorthands, browser hacks, and complexity.

import {
	NODE_TYPES,
	is_declaration,
	is_custom,
	is_supports_declaration,
	type AnyNode,
	type Declaration,
} from '@projectwallace/css-parser'
import {
	basename,
	shorthand_properties,
	isHack,
} from '../../properties/property-utils.js'
import { AggregateCollection, type AggregateResult } from '../internals/aggregate-collection.js'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../internals/count-collection.js'
import type { AnalyzerInstance } from '../core.js'

export type PropertiesOptions = { locations?: boolean }

export type PropertiesResult = {
	total: number
	totalUnique: number
	unique: Record<string, number>
	uniquenessRatio: number
	prefixed: (CountResult | CountResultWithLocations) & { ratio: number }
	custom: (CountResult | CountResultWithLocations) & {
		ratio: number
		importants: (CountResult | CountResultWithLocations) & { ratio: number }
	}
	shorthands: (CountResult | CountResultWithLocations) & { ratio: number }
	browserhacks: (CountResult | CountResultWithLocations) & { ratio: number }
	complexity: AggregateResult
}

export function properties(options: PropertiesOptions = {}): AnalyzerInstance<PropertiesResult> {
	const withLocations = options.locations === true
	const all = new CountCollection(withLocations)
	const prefixed = new CountCollection(withLocations)
	const custom = new CountCollection(withLocations)
	const customImportants = new CountCollection(withLocations)
	const shorthands = new CountCollection(withLocations)
	const hacks = new CountCollection(withLocations)
	const complexity = new AggregateCollection()

	return {
		subscribes: [NODE_TYPES.DECLARATION],
		visit(node: AnyNode): void {
			if (is_supports_declaration(node)) return
			if (!is_declaration(node)) return

			const decl = node as Declaration
			const { property, is_vendor_prefixed, is_browserhack, is_important } = decl
			if (!property) return

			const normalized = basename(property)
			const pLine = decl.line
			const pCol = decl.column
			const pOff = decl.start
			const pLen = property.length

			all.add(normalized, pLine, pCol, pOff, pLen)

			if (is_vendor_prefixed) {
				prefixed.add(property, pLine, pCol, pOff, pLen)
				complexity.push(2)
			} else if (is_custom(property)) {
				custom.add(property, pLine, pCol, pOff, pLen)
				complexity.push(is_important ? 3 : 2)
				if (is_important) {
					customImportants.add(property, pLine, pCol, pOff, pLen)
				}
			} else if (is_browserhack || isHack(property)) {
				hacks.add(property.charAt(0), pLine, pCol, pOff, pLen)
				complexity.push(2)
			} else {
				complexity.push(1)
			}

			if (shorthand_properties.has(normalized)) {
				shorthands.add(property, pLine, pCol, pOff, pLen)
			}
		},
		collect(): PropertiesResult {
			const allResult = all.collect()
			const prefixedResult = prefixed.collect()
			const customResult = custom.collect()
			const customImportantsResult = customImportants.collect()
			const shorthandsResult = shorthands.collect()
			const hacksResult = hacks.collect()
			const t = allResult.total

			return {
				total: t,
				totalUnique: allResult.totalUnique,
				unique: allResult.unique,
				uniquenessRatio: allResult.uniquenessRatio,
				prefixed: { ...prefixedResult, ratio: t === 0 ? 0 : prefixedResult.total / t },
				custom: {
					...customResult,
					ratio: t === 0 ? 0 : customResult.total / t,
					importants: {
						...customImportantsResult,
						ratio: customResult.total === 0 ? 0 : customImportantsResult.total / customResult.total,
					},
				},
				shorthands: { ...shorthandsResult, ratio: t === 0 ? 0 : shorthandsResult.total / t },
				browserhacks: { ...hacksResult, ratio: t === 0 ? 0 : hacksResult.total / t },
				complexity: complexity.collect(),
			}
		},
	}
}
