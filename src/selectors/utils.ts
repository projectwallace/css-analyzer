import { KeywordSet } from '../keyword-set.js'
import { type CSSNode, is_vendor_prefixed, SKIP, BREAK, walk } from '@projectwallace/css-parser'

const PSEUDO_FUNCTIONS = new KeywordSet(['nth-child', 'where', 'not', 'is', 'has', 'nth-last-child', 'matches', '-webkit-any', '-moz-any'])

export function isPrefixed(selector: CSSNode): boolean {
	let isPrefixed = false

	walk(selector, function (node) {
		if (node.type_name === 'PseudoElementSelector' || node.type_name === 'PseudoClassSelector' || node.type_name === 'TypeSelector') {
			if (node.is_vendor_prefixed) {
				isPrefixed = true
				return BREAK
			}
		}
	})

	return isPrefixed
}

/**
 * Check if a Wallace selector is an accessibility selector (has aria-* or role attribute)
 */
export function isAccessibility(selector: CSSNode): boolean {
	let isA11y = false

	walk(selector, function (node) {
		if (node.type_name === 'AttributeSelector') {
			const name = node.name || ''
			if (name === 'role' || name.startsWith('aria-')) {
				isA11y = true
				return BREAK
			}
		}
		// Test for [aria-] or [role] inside :is()/:where() and friends
		else if (node.type_name === 'PseudoClassSelector' && PSEUDO_FUNCTIONS.has(node.name || '')) {
			// Check if any child selectors are accessibility selectors
			if (node.has_children) {
				for (const child of node) {
					if (child.type_name === 'Selector' && isAccessibility(child)) {
						isA11y = true
						return BREAK
					}
				}
			}
		}
	})

	return isA11y
}

/**
 * @returns {string[] | false} The pseudo-class name if it exists, otherwise false
 */
export function hasPseudoClass(selector: CSSNode): string[] | false {
	let pseudos: string[] = []

	walk(selector, function (node) {
		if (node.type_name === 'PseudoClassSelector') {
			pseudos.push(node.name)
		}
	})

	if (pseudos.length === 0) {
		return false
	}

	return pseudos
}

/**
 * Get the Complexity for a Wallace Selector Node
 * @param selector - Wallace CSSNode for a Selector
 * @return The numeric complexity of the Selector
 */
export function getComplexity(selector: CSSNode): number {
	let complexity = 0

	// Helper function to find all Selector nodes recursively
	function findSelectors(node: CSSNode, complexities: number[]): void {
		walk(node, function (n) {
			if (n.type_name === 'Selector') {
				complexities.push(getComplexity(n))
			}
		})
	}

	walk(selector, function (node) {
		const type = node.type_name

		// Skip Selector nodes (don't count the selector container itself)
		if (type === 'Selector') {
			return
		}

		// In Wallace, Nth is a leaf node. Count it if it has content
		if (type === 'Nth') {
			// Count non-empty Nth nodes (like "1", "2n+1", etc.)
			if (node.text && node.text.trim()) {
				complexity++
			}
			// No children to recurse into in Wallace's Nth
			return
		}

		complexity++

		// Check for vendor-prefixed pseudo-elements, type selectors, and pseudo-classes
		if (type === 'PseudoElementSelector' || type === 'TypeSelector' || type === 'PseudoClassSelector') {
			const name = node.name || node.text || ''
			if (is_vendor_prefixed(name)) {
				complexity++
			}
		}

		// Handle AttributeSelector - add complexity if it has a value
		if (type === 'AttributeSelector') {
			if (node.value) {
				complexity++
			}
			// Skip children (equivalent to walk.skip)
			return SKIP
		}

		// Handle PseudoClass functions like :nth-child(), :where(), :not(), etc.
		if (type === 'PseudoClassSelector') {
			const name = node.name || ''

			if (PSEUDO_FUNCTIONS.has(name.toLowerCase())) {
				// Find child selectors and recursively calculate their complexity
				const childComplexities: number[] = []

				if (node.has_children) {
					for (const child of node) {
						if (child.type_name === 'Selector') {
							childComplexities.push(getComplexity(child))
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

/**
 * Walk a selector node and trigger a callback every time a Combinator was found
 */
export function getCombinators(
	selector: CSSNode,
	onMatch: ({
		name,
		loc,
	}: {
		name: string
		loc: { start: { line: number; column: number; offset: number }; end: { offset: number } }
	}) => void,
) {
	walk(selector, function (node) {
		if (node.type_name === 'Combinator') {
			onMatch({
				name: node.name.trim() === '' ? ' ' : node.name,
				loc: {
					start: {
						offset: node.start,
						line: node.line,
						column: node.column,
					},
					end: {
						offset: node.start + 1,
					},
				},
			})
		}
	})
}
