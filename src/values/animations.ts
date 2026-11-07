import {
	is_identifier,
	is_operator,
	is_dimension,
	is_function,
	is_string,
} from '@projectwallace/css-parser'
import { KeywordSet } from '../keyword-set.js'
import { keywords } from './values.js'
import { type Input, as_value } from '../input.js'

const TIMING_KEYWORDS = new KeywordSet([
	'linear',
	'ease',
	'ease-in',
	'ease-out',
	'ease-in-out',
	'step-start',
	'step-end',
])

const TIMING_FUNCTION_VALUES = new KeywordSet(['cubic-bezier', 'steps'])

// All identifier keywords valid in an animation shorthand that are NOT the animation name
const ANIMATION_NON_NAME_KEYWORDS = new KeywordSet([
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

/**
 * Split an `animation` or `transition` value into its parts.
 * @param input - Value text, or an already parsed Value node
 */
export function analyze_animation(input: Input): AnimationParts {
	const parts: AnimationParts = { durations: [], timing_functions: [], names: [], keywords: [] }
	let duration_found = false

	for (const node of as_value(input)) {
		// Right after a ',' we start over again
		if (is_operator(node)) {
			duration_found = false
		} else if (is_dimension(node) && duration_found === false) {
			// The first Dimension is the duration, the second is the delay
			duration_found = true
			parts.durations.push(node.text)
		} else if (is_identifier(node)) {
			const name = node.name
			if (TIMING_KEYWORDS.has(name)) {
				parts.timing_functions.push(node.text)
			} else if (keywords.has(name)) {
				parts.keywords.push(node.text)
			} else if (!ANIMATION_NON_NAME_KEYWORDS.has(name)) {
				parts.names.push(node.text)
			}
		} else if (is_function(node) && TIMING_FUNCTION_VALUES.has(node.name)) {
			parts.timing_functions.push(node.text)
		} else if (is_string(node)) {
			// A quoted string is always a valid animation name, even when it's a reserved keyword (e.g. "none" or "infinite")
			parts.names.push(node.text)
		}
	}

	return parts
}
