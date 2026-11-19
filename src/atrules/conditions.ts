import {
	type AtrulePrelude,
	type CSSNode,
	is_container_query,
	is_dimension,
	is_media_feature,
	is_media_query,
	is_number,
	is_prelude_operator,
	str_equals,
	str_starts_with,
	BREAK,
	walk,
} from '@projectwallace/css-parser'
import { type Match, to_match } from '../utils/location.ts'
import { type FeatureBound, get_query_feature_bounds } from './feature-bounds.ts'

export type Contradiction = {
	/** Lowercased */
	feature: string
	lower: FeatureBound
	upper: FeatureBound
}

// The queries of a prelude: one per comma separated media query or container query
function get_queries(prelude: AtrulePrelude): CSSNode[] {
	const queries: CSSNode[] = []
	prelude.for_each(function (node) {
		if (is_media_query(node) || is_container_query(node)) {
			queries.push(node)
		}
	})
	return queries
}

// Queries with `not` or `or` are too complex to analyse safely
function has_not_or(query: CSSNode): boolean {
	let found = false
	walk(query, function (node) {
		if (is_prelude_operator(node)) {
			const operator = node.text.trim()
			if (str_equals('not', operator) || str_equals('or', operator)) {
				found = true
				return BREAK
			}
		}
	})
	return found
}

/**
 * The features that are fixed to one exact value, like `(width: 300px)`: no `min-` or `max-`, no range.
 * That almost never matches. `value` is the feature name; the match covers the whole feature.
 */
export function get_static_features(prelude: AtrulePrelude): Match[] {
	const found: Match[] = []
	for (const query of get_queries(prelude)) {
		if (has_not_or(query)) {
			continue
		}
		walk(query, function (node) {
			if (!is_media_feature(node)) {
				return
			}
			const property = node.property
			if (!property || str_starts_with('min-', property) || str_starts_with('max-', property)) {
				return
			}
			// These features take an integer count, not a length
			if (
				str_equals('horizontal-viewport-segments', property) ||
				str_equals('vertical-viewport-segments', property)
			) {
				return
			}
			const child = node.value
			if (
				child !== null &&
				(is_dimension(child) || is_number(child)) &&
				!Number.isNaN(child.value)
			) {
				found.push(to_match(node, property))
			}
		})
	}
	return found
}

/**
 * The numeric bounds of each comma separated query of a `@media`, `@container` or `@import` prelude,
 * as `get_feature_bounds()` reads them. A query with `not` or `or` is `null`: it cannot be interpreted.
 */
export function get_query_bounds(prelude: AtrulePrelude): (FeatureBound[] | null)[] {
	return get_queries(prelude).map(function (query) {
		// A query is read like a prelude of one query
		return has_not_or(query) ? null : get_query_feature_bounds(query)
	})
}

// The most restrictive bound: highest `min`, lowest `max`; an exclusive bound beats an inclusive one at the same value
function pick_tightest(bounds: FeatureBound[], lower: boolean): FeatureBound {
	return bounds.reduce(function (a, b) {
		if (lower ? b.value > a.value : b.value < a.value) {
			return b
		}
		return b.value === a.value && !b.inclusive && a.inclusive ? b : a
	})
}

/**
 * The first feature whose bounds can never be met together, like `(min-width: 800px) and (max-width: 400px)`.
 * Bounds are only compared when their unit is the same. An equality counts as a `min` and a `max`.
 */
export function find_contradiction(bounds: FeatureBound[]): Contradiction | null {
	const by_feature = new Map<string, FeatureBound[]>()
	for (const bound of bounds) {
		const list = by_feature.get(bound.feature)
		if (list) {
			list.push(bound)
		} else {
			by_feature.set(bound.feature, [bound])
		}
	}

	for (const [feature, list] of by_feature) {
		const lowers = list.filter((bound) => bound.direction !== 'max')
		const uppers = list.filter((bound) => bound.direction !== 'min')
		if (lowers.length === 0 || uppers.length === 0) {
			continue
		}
		for (const unit of new Set(lowers.map((bound) => bound.unit.toLowerCase()))) {
			const lowers_in_unit = lowers.filter((bound) => str_equals(unit, bound.unit))
			const uppers_in_unit = uppers.filter((bound) => str_equals(unit, bound.unit))
			if (uppers_in_unit.length === 0) {
				continue
			}
			const lower = pick_tightest(lowers_in_unit, true)
			const upper = pick_tightest(uppers_in_unit, false)
			if (
				lower.value > upper.value ||
				(lower.value === upper.value && (!lower.inclusive || !upper.inclusive))
			) {
				return { feature, lower, upper }
			}
		}
	}
	return null
}
