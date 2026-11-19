import {
	type CSSNode,
	type AtrulePrelude,
	type FeatureRange,
	type MediaFeature,
	is_dimension,
	is_feature_range,
	is_media_feature,
	is_identifier,
	is_number,
	strip_vendor_prefix,
	walk,
} from '@projectwallace/css-parser'
import { type Location, to_location } from '../utils/location.ts'

export type FeatureBound = Location & {
	/** The number of the bound */
	value: number
	/** Without `min-` or `max-`, lowercased; a vendor prefix stays */
	feature: string
	direction: 'min' | 'max' | 'equal'
	unit: string
	/** `false` for `width > 1px` */
	inclusive: boolean
	/** Index of the comma separated query */
	query: number
}

type Direction = FeatureBound['direction']

// A number or a dimension, as a number and a unit; `undefined` for anything else (a ratio, a keyword, calc())
function read_number(
	node: CSSNode | null | undefined,
): { value: number; unit: string } | undefined {
	if (node && is_dimension(node)) {
		return { value: node.value, unit: node.unit }
	}
	if (node && is_number(node)) {
		return { value: node.value, unit: '' }
	}
	return undefined
}

// `min-width` is the `min` bound of `width`; `-webkit-min-device-pixel-ratio` that of `-webkit-device-pixel-ratio`
function split_feature_name(property: string): { feature: string; direction: Direction } {
	const name = property.toLowerCase()
	const rest = strip_vendor_prefix(name)
	const prefix = name.slice(0, name.length - rest.length)
	if (rest.startsWith('min-')) {
		return { feature: prefix + rest.slice(4), direction: 'min' }
	}
	if (rest.startsWith('max-')) {
		return { feature: prefix + rest.slice(4), direction: 'max' }
	}
	return { feature: name, direction: 'equal' }
}

// `(width >= 1px)` has the feature on the left of the operator, `(1px <= width)` on the right:
// there the comparison reads the other way round. `feature_first` says which one this is.
function range_direction(
	operator: string,
	feature_first: boolean,
): { direction: Direction; inclusive: boolean } | undefined {
	const inclusive = operator.endsWith('=')
	if (operator === '=') {
		return { direction: 'equal', inclusive: true }
	}
	const greater = operator.startsWith('>')
	if (!greater && !operator.startsWith('<')) {
		return undefined
	}
	return { direction: greater === feature_first ? 'min' : 'max', inclusive }
}

function bounds_of_feature(node: MediaFeature, query: number): FeatureBound[] {
	const number = read_number(node.value)
	if (!number) {
		return []
	}
	const { feature, direction } = split_feature_name(node.property)
	return [{ ...to_location(node), ...number, feature, direction, inclusive: true, query }]
}

// `(width >= 1px)`, `(1px < width)` and `(1px <= width <= 2px)`: the children are the feature name, the
// numbers and the operators, in source order
function bounds_of_range(node: FeatureRange, query: number): FeatureBound[] {
	const location = to_location(node)
	const feature = node.name.toLowerCase()
	const bounds: FeatureBound[] = []
	const children = node.children
	// Where the feature is: everything before it is compared with `feature_first = false`
	const name_index = children.findIndex(
		(child) => is_identifier(child) && child.name.toLowerCase() === feature,
	)
	for (let i = 0; i < children.length; i++) {
		// Only the comparison operators (`<=`, `>`, `=`) tell us something; the rest are names and numbers
		const operator = children[i]!
		const before = i < name_index
		// The number is next to the operator, on the side that is not the feature
		const number = read_number(before ? children[i - 1] : children[i + 1])
		const found = range_direction(operator.text, !before)
		if (number && found) {
			bounds.push({ ...location, ...number, feature, ...found, query })
		}
	}
	return bounds
}

/** The numeric bounds of a `@media` or `@container` prelude, each at its whole feature. `or` and `not` are not interpreted: `query` tells comma separated queries apart. */
export function get_feature_bounds(prelude: AtrulePrelude): FeatureBound[] {
	const bounds: FeatureBound[] = []
	let query = 0
	prelude.for_each(function (query_node) {
		bounds.push(...get_query_feature_bounds(query_node, query))
		query++
	})
	return bounds
}

/** The bounds of one query node (a media query or a container query); `query` is its index */
export function get_query_feature_bounds(query_node: CSSNode, query: number = 0): FeatureBound[] {
	const bounds: FeatureBound[] = []
	walk(query_node, function (node) {
		if (is_media_feature(node)) {
			bounds.push(...bounds_of_feature(node, query))
		} else if (is_feature_range(node)) {
			bounds.push(...bounds_of_range(node, query))
		}
	})
	return bounds
}
