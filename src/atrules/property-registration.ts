import {
	type CSSNode,
	is_custom,
	is_dimension,
	is_function,
	is_identifier,
	is_number,
	is_string,
	parse_value,
	str_equals,
	str_index_of,
	walk_values,
	BREAK,
} from '@projectwallace/css-parser'
import type { KeywordSet } from '../utils/collections/keyword-set.ts'
import {
	angle_units,
	flex_units,
	length_units,
	resolution_units,
	time_units,
} from '../values/units.ts'
import { unquote } from '../utils/string-utils.ts'

function is_dimension_of(node: CSSNode, units: KeywordSet): boolean {
	return is_dimension(node) && units.has(node.unit)
}

function is_zero(node: CSSNode): boolean {
	return is_number(node) && node.value === 0
}

function is_percentage(node: CSSNode): boolean {
	return is_dimension(node) && node.unit === '%'
}

function is_length(node: CSSNode): boolean {
	return is_dimension_of(node, length_units) || is_zero(node)
}

// An <integer> is written without a decimal point or exponent: `2.0` and `1e3` are numbers, not integers
function is_integer(node: CSSNode): boolean {
	return (
		is_number(node) &&
		Number.isInteger(node.value) &&
		str_index_of('.', node.text) === -1 &&
		str_index_of('e', node.text) === -1
	)
}

type Matcher = (node: CSSNode) => boolean

const matchers: Record<string, Matcher> = {
	'<number>': (node) => is_number(node),
	'<integer>': is_integer,
	'<percentage>': is_percentage,
	'<length>': is_length,
	'<length-percentage>': (node) => is_length(node) || is_percentage(node),
	'<angle>': (node) => is_dimension_of(node, angle_units) || is_zero(node),
	'<time>': (node) => is_dimension_of(node, time_units),
	'<resolution>': (node) => is_dimension_of(node, resolution_units),
	'<flex>': (node) => is_dimension_of(node, flex_units),
	// A color is never a bare number, dimension or percentage
	'<color>': (node) => !(is_number(node) || is_dimension(node)),
}

export type PropertyRegistrationIssue =
	| { type: 'invalid_name' }
	| { type: 'missing_descriptor'; descriptor: 'syntax' | 'inherits' }
	| { type: 'missing_initial_value'; syntax: string }
	| { type: 'invalid_syntax'; value: string }
	| { type: 'invalid_inherits'; value: string }
	| { type: 'dependent_initial_value'; value: string }
	| { type: 'mismatched_initial_value'; value: string; syntax: string }

/**
 * What is wrong with an `@property` registration, in the order it is found. `descriptors` has the
 * lowercased names (`syntax`, `inherits`, `initial-value`) with their value as written.
 * Syntaxes that are not a single data type (`<length> | auto`, `*`) are not checked against the initial value.
 */
export function validate_property_registration(
	name: string,
	descriptors: Record<string, string | undefined>,
): PropertyRegistrationIssue[] {
	const issues: PropertyRegistrationIssue[] = []
	if (!is_custom(name)) {
		issues.push({ type: 'invalid_name' })
	}

	const syntax_value = descriptors['syntax']
	const inherits_value = descriptors['inherits']
	const initial_value = descriptors['initial-value']

	if (syntax_value === undefined) {
		issues.push({ type: 'missing_descriptor', descriptor: 'syntax' })
	}
	if (inherits_value === undefined) {
		issues.push({ type: 'missing_descriptor', descriptor: 'inherits' })
	} else {
		const value = inherits_value.trim()
		const [node, ...rest] = parse_value(value).children
		const valid =
			node &&
			rest.length === 0 &&
			is_identifier(node) &&
			(str_equals('true', node.name) || str_equals('false', node.name))
		if (!valid) {
			issues.push({ type: 'invalid_inherits', value })
		}
	}

	let syntax: string | undefined
	if (syntax_value !== undefined) {
		const value = syntax_value.trim()
		const [node, ...rest] = parse_value(value).children
		if (node && rest.length === 0 && is_string(node)) {
			syntax = unquote(node.text).trim()
		} else {
			issues.push({ type: 'invalid_syntax', value })
		}
	}

	// Without a (valid) syntax nothing can be said about the initial value
	if (syntax === undefined) {
		return issues
	}
	if (initial_value === undefined) {
		if (syntax !== '*') {
			issues.push({ type: 'missing_initial_value', syntax })
		}
		return issues
	}

	const value = initial_value.trim()
	const parsed = parse_value(value)
	if (uses_var(parsed)) {
		issues.push({ type: 'dependent_initial_value', value })
		return issues
	}
	// Only single, non-composite, non-function values are checked against a single data type
	const nodes = [...parsed.children]
	const matcher = matchers[syntax.toLowerCase()]
	if (!matcher || nodes.some((node) => is_function(node))) {
		return issues
	}
	if (nodes.length !== 1 || !matcher(nodes[0]!)) {
		issues.push({ type: 'mismatched_initial_value', value, syntax })
	}
	return issues
}

function uses_var(value: CSSNode): boolean {
	let found = false
	walk_values(value, function (node) {
		if (is_function(node) && str_equals('var', node.name)) {
			found = true
			return BREAK
		}
	})
	return found
}
