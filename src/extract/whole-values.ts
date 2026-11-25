import type { Value } from '@projectwallace/css-parser'
import { KeywordSet } from '../utils/collections/keyword-set.ts'
import { type TextMatch, to_location } from '../utils/location.ts'
import { clean_value_text } from './shared.ts'

export const z_index_properties: KeywordSet = new KeywordSet(['z-index'])
export const box_shadow_properties: KeywordSet = new KeywordSet(['box-shadow'])
export const text_shadow_properties: KeywordSet = new KeywordSet(['text-shadow'])
export { border_radius_properties } from '../properties/property-utils.ts'

// The whole value is what counts for these properties: as written, without browserhack, and not a
// global keyword (`inherit`, `none`, ...). Which properties is up to the caller (see the `*_properties` sets).
function whole_value(value: Value): TextMatch[] {
	const source = value.text
	const text = clean_value_text(source, false)
	return text === undefined ? [] : [{ value: source, ...to_location(value), text }]
}

export function extract_z_indexes(value: Value): TextMatch[] {
	return whole_value(value)
}

export function extract_box_shadows(value: Value): TextMatch[] {
	return whole_value(value)
}

export function extract_text_shadows(value: Value): TextMatch[] {
	return whole_value(value)
}

export function extract_border_radiuses(value: Value): TextMatch[] {
	return whole_value(value)
}
