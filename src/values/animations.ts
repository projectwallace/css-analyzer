import {
	is_identifier,
	is_operator,
	is_dimension,
	is_function,
	is_string,
} from '@projectwallace/css-parser'
import { KeywordSet } from '../utils/collections/keyword-set.ts'
import { keywords } from './values.ts'
import { type ValueInput, as_value } from '../utils/input.ts'

const timing_keywords = new KeywordSet([
	'linear',
	'ease',
	'ease-in',
	'ease-out',
	'ease-in-out',
	'step-start',
	'step-end',
])

const timing_function_values = new KeywordSet(['cubic-bezier', 'steps'])

// All identifier keywords valid in an animation shorthand that are NOT the animation name
const animation_non_name_keywords = new KeywordSet([
	// animation-direction
	'normal',
	'reverse',
	'alternate',
	'alternate-reverse',
	// animation-fill-mode (none is covered by the global keywords set)
	'forwards',
	'backwards',
	'both',
	// animation-play-state
	'running',
	'paused',
	// animation-iteration-count
	'infinite',
])

export type AnimationParts = {
	/** Durations and delays-as-first-dimension, as written */
	durations: string[]
	/** Timing function keywords and functions (`ease-in`, `cubic-bezier(...)`) */
	timing_functions: string[]
	/** Animation names, as written (quoted names keep their quotes) */
	names: string[]
	/** Global keywords such as `inherit` or `none` */
	keywords: string[]
}

/** Split an `animation` or `transition` value into its parts */
export function analyze_animation(input: ValueInput): AnimationParts {
	const parts: AnimationParts = { durations: [], timing_functions: [], names: [], keywords: [] }
	let duration_found = false

	as_value(input).for_each(function (node) {
		// Right after a ',' we start over again
		if (is_operator(node)) {
			duration_found = false
		} else if (is_dimension(node) && duration_found === false) {
			// The first Dimension is the duration, the second is the delay
			duration_found = true
			parts.durations.push(node.text)
		} else if (is_identifier(node)) {
			const name = node.name
			if (timing_keywords.has(name)) {
				parts.timing_functions.push(node.text)
			} else if (keywords.has(name)) {
				parts.keywords.push(node.text)
			} else if (!animation_non_name_keywords.has(name)) {
				parts.names.push(node.text)
			}
		} else if (is_function(node) && timing_function_values.has(node.name)) {
			parts.timing_functions.push(node.text)
		} else if (is_string(node)) {
			// A quoted string is always a valid animation name, even when it's a reserved keyword (e.g. "none" or "infinite")
			parts.names.push(node.text)
		}
	})

	return parts
}
