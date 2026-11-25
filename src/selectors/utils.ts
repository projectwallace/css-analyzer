import {
	type Combinator,
	walk,
	str_equals,
	str_starts_with,
	is_pseudo_element_selector,
	is_pseudo_class_selector,
	is_type_selector,
	is_attribute_selector,
	is_combinator,
	type AttributeSelector,
	type Selector,
} from '@projectwallace/css-parser'
import { unquote } from '../utils/string-utils.ts'
import { type Match, type NamedMatch, to_match } from '../utils/location.ts'

/** An attribute selector for `role` or `aria-*`: `value` is the source text, `selector` the normalized selector */
export type AccessibilityMatch = Match & { selector: string }

export function get_vendor_prefixes(selector: Selector): NamedMatch[] {
	const found: NamedMatch[] = []
	walk(selector, function (node) {
		if (
			is_pseudo_element_selector(node) ||
			is_pseudo_class_selector(node) ||
			is_type_selector(node)
		) {
			if (node.is_vendor_prefixed) {
				let prefix = ''
				if (is_pseudo_class_selector(node)) {
					prefix = ':'
				} else if (is_pseudo_element_selector(node)) {
					prefix = '::'
				}
				found.push({ ...to_match(node), name: prefix + node.name })
			}
		}
	})
	return found
}

function normalize_accessibility_selector(node: AttributeSelector) {
	// // We're intentionally not adding attr_flags here because they don't matter for normalization
	// // Also not lowercasing node.value because that DOES matter for CSS
	const name = node.name.toLowerCase()
	if (node.value) {
		return `[${name}${node.attr_operator ?? ''}"${unquote(node.value || '')}"]`
	}
	return `[${name}]`
}

export function get_accessibility_selectors(selector: Selector): AccessibilityMatch[] {
	const found: AccessibilityMatch[] = []

	walk(selector, function (node) {
		if (is_attribute_selector(node)) {
			const name = node.name
			if (str_equals('role', name) || str_starts_with('aria-', name)) {
				found.push({ ...to_match(node), selector: normalize_accessibility_selector(node) })
			}
		}
	})
	return found
}

/** A combinator's name; `' '` for the descendant combinator */
export function combinator_name(node: Combinator): string {
	return node.name.trim() === '' ? ' ' : node.name
}

/** Find all combinators; `value` is `' '` for the descendant combinator */
export function get_combinators(selector: Selector): NamedMatch[] {
	const found: NamedMatch[] = []
	walk(selector, function (node) {
		if (is_combinator(node)) {
			found.push({ ...to_match(node, { length: 1 }), name: combinator_name(node) })
		}
	})
	return found
}
