import {
	type CSSNode,
	is_dimension,
	property_basename,
	walk_values,
} from '@projectwallace/css-parser'
import { type ValueInput, as_value } from '../utils/input.ts'
import { type Match, to_match } from '../utils/location.ts'
import { strip_unit_hack } from '../values/units.ts'

// These are units, not lengths: `s` and `ms` in `transition` and `animation` count too. Only the values
// that are names and numbers are left out (a font name, a z-index), as 9.x did.
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

export function extract_units(property: string, input: ValueInput): Match[] {
	const name = property_basename(property)
	const found: Match[] = []
	walk_values(as_value(input), function (node) {
		const unit = unit_of(node, name)
		if (unit !== '') {
			found.push(to_match(node, unit))
		}
	})
	return found
}
