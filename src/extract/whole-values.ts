import { type Value, property_basename } from '@projectwallace/css-parser'
import { KeywordSet } from '../utils/collections/keyword-set.ts'
import { type Match, to_match } from '../utils/location.ts'
import { border_radius_properties } from '../properties/property-utils.ts'
import { get_clean_value_text } from './shared.ts'

export const z_index_properties: KeywordSet = new KeywordSet(['z-index'])
export const box_shadow_properties: KeywordSet = new KeywordSet(['box-shadow'])
export const text_shadow_properties: KeywordSet = new KeywordSet(['text-shadow'])
export { border_radius_properties }

// Properties of which the whole value is what counts: as written, without browserhack, and not a
// global keyword (`inherit`, `none`, ...)
function whole_value(input: Value, property: string, properties: KeywordSet): Match[] {
	if (!properties.has(property_basename(property))) {
		return []
	}
	const value = input
	const text = get_clean_value_text(value, false)
	return text === undefined ? [] : [to_match(value, text)]
}

export function extract_z_indexes(property: string, input: Value): Match[] {
	return whole_value(input, property, z_index_properties)
}

export function extract_box_shadows(property: string, input: Value): Match[] {
	return whole_value(input, property, box_shadow_properties)
}

export function extract_text_shadows(property: string, input: Value): Match[] {
	return whole_value(input, property, text_shadow_properties)
}

export function extract_border_radiuses(property: string, input: Value): Match[] {
	return whole_value(input, property, border_radius_properties)
}
