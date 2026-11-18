import {
	type Value,
	is_number,
	property_basename,
	walk_values,
	BREAK,
} from '@projectwallace/css-parser'
import { KeywordSet } from '../utils/collections/keyword-set.ts'
import { type ValueInput, as_value } from '../utils/input.ts'
import { type Match, to_match } from '../utils/location.ts'
import { border_radius_properties } from '../properties/property-utils.ts'
import { get_clean_value_text } from './shared.ts'

export const z_index_properties: KeywordSet = new KeywordSet(['z-index'])
export const box_shadow_properties: KeywordSet = new KeywordSet(['box-shadow'])
export const text_shadow_properties: KeywordSet = new KeywordSet(['text-shadow'])
export { border_radius_properties }

// Properties of which the whole value is what counts: as written, without browserhack, and not a
// global keyword (`inherit`, `none`, ...)
function whole_value(input: ValueInput, property: string, properties: KeywordSet): Match[] {
	if (!properties.has(property_basename(property))) {
		return []
	}
	const value: Value = as_value(input)
	const text = get_clean_value_text(value, false)
	return text === undefined ? [] : [to_match(value, text)]
}

export function extract_z_indexes(property: string, input: ValueInput): Match[] {
	return whole_value(input, property, z_index_properties)
}

export function extract_box_shadows(property: string, input: ValueInput): Match[] {
	return whole_value(input, property, box_shadow_properties)
}

export function extract_text_shadows(property: string, input: ValueInput): Match[] {
	return whole_value(input, property, text_shadow_properties)
}

export function extract_border_radiuses(property: string, input: ValueInput): Match[] {
	return whole_value(input, property, border_radius_properties)
}

const int32_min = -2147483648
const int32_max = 2147483647

/** `false` when a value has a number that is not an integer that fits in 32 bits. Keywords, `var()` and other values are not judged. */
export function is_valid_z_index(input: ValueInput): boolean {
	let valid = true
	walk_values(as_value(input), function (node) {
		if (is_number(node)) {
			const number = node.value
			if (
				number !== null &&
				(!Number.isInteger(number) || number < int32_min || number > int32_max)
			) {
				valid = false
				return BREAK
			}
		}
	})
	return valid
}
