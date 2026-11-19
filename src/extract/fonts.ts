import { type Value, property_basename } from '@projectwallace/css-parser'
import { KeywordSet } from '../utils/collections/keyword-set.ts'
import { type Match, to_match } from '../utils/location.ts'
import {
	type FontShorthand,
	destructure_font_shorthand,
	system_fonts,
} from '../values/destructure-font-shorthand.ts'
import { get_clean_value_text } from './shared.ts'

export const font_size_properties: KeywordSet = new KeywordSet(['font-size', 'font'])
export const line_height_properties: KeywordSet = new KeywordSet(['line-height', 'font'])
export const font_family_properties: KeywordSet = new KeywordSet(['font-family', 'font'])

// The `font` shorthand of a declaration, or `null` when there is nothing to split: system fonts
// (`font: caption`) and global keywords are not a size, line height or family.
function font_shorthand_of(value: Value): FontShorthand | null {
	const text = get_clean_value_text(value, false)
	return text !== undefined && !system_fonts.has(text) ? destructure_font_shorthand(value) : null
}

// What a declaration says about one part of the font. `property` is the normalized property name.
// A `font` shorthand is split (pass its split as `font` when it is already known, `null` for none):
// the match then points at that part only. Other properties give their whole value (without
// browserhack); keywords such as `inherit` and, for sizes and families, system fonts are no part.
function font_part(
	property: string,
	value: Value,
	own_property: string,
	part: 'font_size' | 'line_height' | 'font_family',
	font: FontShorthand | null | undefined,
): Match | undefined {
	if (property === 'font') {
		return (font === undefined ? font_shorthand_of(value) : font)?.[part] ?? undefined
	}
	if (property !== own_property) {
		return undefined
	}
	const text = get_clean_value_text(value, false)
	if (text === undefined || (part !== 'line_height' && system_fonts.has(text))) {
		return undefined
	}
	return to_match(value, text)
}

export function font_size(
	property: string,
	value: Value,
	font?: FontShorthand | null,
): Match | undefined {
	return font_part(property, value, 'font-size', 'font_size', font)
}

export function line_height(
	property: string,
	value: Value,
	font?: FontShorthand | null,
): Match | undefined {
	return font_part(property, value, 'line-height', 'line_height', font)
}

export function font_family(
	property: string,
	value: Value,
	font?: FontShorthand | null,
): Match | undefined {
	return font_part(property, value, 'font-family', 'font_family', font)
}

function as_list(match: Match | undefined): Match[] {
	return match ? [match] : []
}

export function extract_font_sizes(property: string, input: Value): Match[] {
	return as_list(font_size(property_basename(property), input))
}

export function extract_line_heights(property: string, input: Value): Match[] {
	return as_list(line_height(property_basename(property), input))
}

/** The whole list as written; see `get_font_families()` for one match per family */
export function extract_font_families(property: string, input: Value): Match[] {
	return as_list(font_family(property_basename(property), input))
}
