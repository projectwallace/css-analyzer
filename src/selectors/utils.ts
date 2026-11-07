import { KeywordSet } from '../keyword-set.js'
import {
	type CSSNode,
	SKIP,
	walk,
	str_equals,
	str_starts_with,
	is_pseudo_element_selector,
	is_pseudo_class_selector,
	is_type_selector,
	is_attribute_selector,
	is_selector,
	is_nth_selector,
	is_combinator,
} from '@projectwallace/css-parser'
import { unquote } from '../string-utils.js'
import { type Input, type Location, as_selectors } from '../adapter/css-parser.js'

const PSEUDO_FUNCTIONS = new KeywordSet([
	'nth-child',
	'where',
	'not',
	'is',
	'has',
	'nth-last-child',
	'matches',
	'-webkit-any',
	'-moz-any',
])

/**
 * Find vendor prefixed pseudo-classes, pseudo-elements and type selectors.
 * @returns The prefixed names, including their colons (`:-moz-focusring`, `::-webkit-scrollbar`)
 */
export function get_vendor_prefixes(input: Input): string[] {
	const found: string[] = []
	for (const selector of as_selectors(input)) {
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
					found.push(prefix + node.name)
				}
			}
		})
	}
	return found
}

/**
 * Find accessibility selectors: attribute selectors for `role` and `aria-*`.
 * @returns The normalized attribute selectors, e.g. `[aria-hidden="true"]`
 */
export function get_accessibility_selectors(input: Input): string[] {
	const found: string[] = []
	function normalize(node: CSSNode) {
		const clone = node.clone()
		// We're intentionally not adding attr_flags here because they don't matter for normalization
		// Also not lowercasing node.value because that DOES matter for CSS
		if (clone.value) {
			return (
				'[' +
				clone.name?.toLowerCase() +
				clone.attr_operator +
				'"' +
				unquote(clone.value.toString()) +
				'"' +
				']'
			)
		}
		return '[' + clone.name?.toLowerCase() + ']'
	}

	for (const selector of as_selectors(input)) {
		walk(selector, function (node) {
			if (is_attribute_selector(node)) {
				const name = node.name || ''
				if (str_equals('role', name) || str_starts_with('aria-', name)) {
					found.push(normalize(node))
				}
			}
		})
	}
	return found
}

/**
 * Get the complexity of every selector in a selector (list).
 * @param input - Selector text, or an already parsed Selector/SelectorList node
 */
export function get_complexity(input: Input): number[] {
	return as_selectors(input).map((selector) => selector_complexity(selector))
}

function selector_complexity(selector: CSSNode): number {
	let complexity = 0

	// Helper function to find all Selector nodes recursively
	function findSelectors(tree: CSSNode, complexities: number[]): void {
		walk(tree, function (node) {
			if (is_selector(node)) {
				complexities.push(selector_complexity(node))
				// getComplexity already counted everything nested inside this selector
				return SKIP
			}
		})
	}

	walk(selector, function (node) {
		const type = node.type

		// Skip Selector nodes (don't count the selector container itself)
		if (is_selector(node)) {
			return
		}

		// In Wallace, Nth is a leaf node. Count it if it has content
		if (is_nth_selector(node)) {
			// Count non-empty Nth nodes (like "1", "2n+1", etc.)
			if (node.text.trim()) {
				complexity++
			}
			// No children to recurse into
			return
		}

		complexity++

		// Check for vendor-prefixed pseudo-elements, type selectors, and pseudo-classes
		if (
			is_pseudo_class_selector(node) ||
			is_type_selector(node) ||
			is_pseudo_element_selector(node)
		) {
			if (node.is_vendor_prefixed) {
				complexity++
			}
		}

		// Handle AttributeSelector - add complexity if it has a value
		if (is_attribute_selector(node)) {
			if (node.value) {
				complexity++
			}
			// Skip children
			return SKIP
		}

		// Handle PseudoClass functions like :nth-child(), :where(), :not(), etc.
		if (is_pseudo_class_selector(node)) {
			const name = node.name

			if (PSEUDO_FUNCTIONS.has(name.toLowerCase())) {
				// Find child selectors and recursively calculate their complexity
				const childComplexities: number[] = []

				if (node.has_children) {
					for (const child of node) {
						if (is_selector(child)) {
							childComplexities.push(selector_complexity(child))
						} else {
							// Recurse to find nested selectors
							findSelectors(child, childComplexities)
						}
					}
				}

				// If there are child selectors (like in :where(), :is(), etc.), add their complexity
				if (childComplexities.length > 0) {
					for (const c of childComplexities) {
						complexity += c
					}
					// Skip further processing of children since we already processed them
					return SKIP
				}

				// If no child selectors (like :nth-child(1)), continue to process children normally
				// This allows Nth nodes and their content to be counted
			}
		}
	})

	return complexity
}

export type CombinatorMatch = { name: string; loc: Location }

/**
 * Find all combinators in a selector (list).
 * @returns The combinator (`' '` for the descendant combinator) and where it was found
 */
export function get_combinators(input: Input): CombinatorMatch[] {
	const found: CombinatorMatch[] = []
	for (const selector of as_selectors(input)) {
		walk(selector, function (node) {
			if (is_combinator(node)) {
				found.push({
					name: node.name.trim() === '' ? ' ' : node.name,
					loc: {
						offset: node.start,
						line: node.line,
						column: node.column,
						length: 1,
					},
				})
			}
		})
	}
	return found
}
