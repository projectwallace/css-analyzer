import { type Value, property_basename } from '@projectwallace/css-parser'
import { KeywordSet } from '../utils/collections/keyword-set.ts'
import { type ValueInput, as_value } from '../utils/input.ts'
import { type Match, to_match } from '../utils/location.ts'
import { analyze_animation } from '../values/animations.ts'
import { get_clean_value_text, get_list_items } from './shared.ts'

export const duration_properties: KeywordSet = new KeywordSet([
	'transition',
	'animation',
	'transition-duration',
	'animation-duration',
])

export const timing_function_properties: KeywordSet = new KeywordSet([
	'transition',
	'animation',
	'transition-timing-function',
	'animation-timing-function',
])

// The items of a `transition` or `animation` shorthand are found by what they are (a time, a timing
// function); in a longhand every item of the list is one. `property` is the normalized property name.
function animation_items(
	property: string,
	value: Value,
	properties: KeywordSet,
	part: 'durations' | 'timing_functions',
): Match[] {
	if (!properties.has(property) || get_clean_value_text(value, false) === undefined) {
		return []
	}
	if (property === 'transition' || property === 'animation') {
		return analyze_animation(value)[part]
	}
	return get_list_items(value).map((item) => to_match(item))
}

export function durations_of(property: string, value: Value): Match[] {
	return animation_items(property, value, duration_properties, 'durations')
}

export function timing_functions_of(property: string, value: Value): Match[] {
	return animation_items(property, value, timing_function_properties, 'timing_functions')
}

export function extract_durations(property: string, input: ValueInput): Match[] {
	return durations_of(property_basename(property), as_value(input))
}

export function extract_timing_functions(property: string, input: ValueInput): Match[] {
	return timing_functions_of(property_basename(property), as_value(input))
}
