import type { Value } from '@projectwallace/css-parser'
import {
	type CSSNode,
	is_dimension,
	property_basename,
	walk_values,
} from '@projectwallace/css-parser'
import { type Match, to_match } from '../utils/location.ts'
import { strip_unit_hack } from '../values/units.ts'

// Properties whose units are not counted.
const skipped_properties = new Set(['font-family', 'z-index'])

// The unit of a dimension node, as written and without a browserhack (`10px\9` is `px`), or '' when the
// node has no unit: not a dimension, a unit that is only a hack (`0\9`), or a value that holds no units.
// `property` is the normalized property name.
export function unit_of(node: CSSNode, property: string): string {
	if (skipped_properties.has(property) || !is_dimension(node)) {
		return ''
	}
	return strip_unit_hack(node.unit)
}

/** A dimension: `value` is the text, `unit` the unit without a browserhack */
export type UnitMatch = Match & { unit: string }

export function extract_units(property: string, input: Value): UnitMatch[] {
	const name = property_basename(property)
	const found: UnitMatch[] = []
	walk_values(input, function (node) {
		const unit = unit_of(node, name)
		if (unit !== '') {
			found.push({ ...to_match(node), unit })
		}
	})
	return found
}
