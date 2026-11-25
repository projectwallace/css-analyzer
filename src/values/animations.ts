import type { Value } from '@projectwallace/css-parser'
import {
	is_identifier,
	is_operator,
	is_dimension,
	is_function,
	is_string,
} from '@projectwallace/css-parser'
import { KeywordSet } from '../utils/collections/keyword-set.ts'
import { keywords } from './values.ts'
import { type Match, type NamedMatch, to_match } from '../utils/location.ts'
import { unquote } from '../utils/string-utils.ts'

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
	durations: Match[]
	delays: Match[]
	timing_functions: Match[]
	names: Match[]
	keywords: Match[]
}

/** Split an `animation` value into its parts */
export function analyze_animation(input: Value): AnimationParts {
	const parts: AnimationParts = {
		durations: [],
		delays: [],
		timing_functions: [],
		names: [],
		keywords: [],
	}
	let duration_found = false

	input.for_each(function (node) {
		// Right after a ',' we start over again
		if (is_operator(node)) {
			duration_found = false
		} else if (is_dimension(node)) {
			// The first time is the duration, the second is the delay
			if (duration_found) {
				parts.delays.push(to_match(node))
			} else {
				duration_found = true
				parts.durations.push(to_match(node))
			}
		} else if (is_identifier(node)) {
			const name = node.name
			if (timing_keywords.has(name)) {
				parts.timing_functions.push(to_match(node))
			} else if (keywords.has(name)) {
				parts.keywords.push(to_match(node))
			} else if (!animation_non_name_keywords.has(name)) {
				parts.names.push(to_match(node))
			}
		} else if (is_function(node) && timing_function_values.has(node.name)) {
			parts.timing_functions.push(to_match(node))
		} else if (is_string(node)) {
			// A quoted string is always a valid animation name, even when it's a reserved keyword (e.g. "none" or "infinite")
			parts.names.push(to_match(node))
		}
	})

	return parts
}

export type TransitionParts = {
	properties: Match[]
	durations: Match[]
	delays: Match[]
	timing_functions: Match[]
	keywords: Match[]
}

/** Split a `transition` value into its parts */
export function analyze_transition(input: Value): TransitionParts {
	const { names, ...parts } = analyze_animation(input)
	return { properties: names, ...parts }
}

/** The names in an `animation-name` value */
export function get_animation_names(input: Value): NamedMatch[] {
	const names: NamedMatch[] = []
	input.for_each(function (node) {
		if (is_identifier(node) && !keywords.has(node.name)) {
			names.push({ ...to_match(node), name: node.text })
		} else if (is_string(node)) {
			names.push({ ...to_match(node), name: unquote(node.text) })
		}
	})
	return names
}
