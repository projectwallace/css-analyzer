import type { Value } from '@projectwallace/css-parser'
import { KeywordSet } from '../utils/collections/keyword-set.ts'
import { type TextMatch, to_match } from '../utils/location.ts'
import { border_radius_properties } from '../properties/property-utils.ts'
import { get_clean_value_text } from './shared.ts'

export const z_index_properties: KeywordSet = new KeywordSet(['z-index'])
export const box_shadow_properties: KeywordSet = new KeywordSet(['box-shadow'])
export const text_shadow_properties: KeywordSet = new KeywordSet(['text-shadow'])
export { border_radius_properties }

// The whole value is what counts for these properties: as written, without browserhack, and not a
// global keyword (`inherit`, `none`, ...). Which properties is up to the caller (see the `*_properties` sets).
function whole_value(value: Value): TextMatch[] {
	const text = get_clean_value_text(value, false)
	return text === undefined ? [] : [{ ...to_match(value), text }]
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
