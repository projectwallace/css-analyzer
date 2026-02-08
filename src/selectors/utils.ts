import type { Location } from '../collection.js'
import { KeywordSet } from '../keyword-set.js'
import {
	type CSSNode,
	SKIP,
	BREAK,
	walk,
	PSEUDO_ELEMENT_SELECTOR,
	PSEUDO_CLASS_SELECTOR,
	TYPE_SELECTOR,
	ATTRIBUTE_SELECTOR,
	SELECTOR,
	COMBINATOR,
	NTH_SELECTOR,
} from '@projectwallace/css-parser'

const PSEUDO_FUNCTIONS = new KeywordSet(['nth-child', 'where', 'not', 'is', 'has', 'nth-last-child', 'matches', '-webkit-any', '-moz-any'])

export function isPrefixed(selector: CSSNode): boolean {
	let isPrefixed = false

	walk(selector, function (node) {
		if (node.type === PSEUDO_ELEMENT_SELECTOR || node.type === PSEUDO_CLASS_SELECTOR || node.type === TYPE_SELECTOR) {
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
export function isAccessibility(selector: CSSNode): false | string[] {
	let isA11y = false
	let a11y: string[] = []

	walk(selector, function (node) {
		if (node.type === ATTRIBUTE_SELECTOR) {
			const name = node.name || ''
			if (name === 'role' || name.startsWith('aria-')) {
				isA11y = true
				return BREAK
			}
		}
		// Test for [aria-] or [role] inside :is()/:where() and friends
		else if (node.type === PSEUDO_CLASS_SELECTOR && PSEUDO_FUNCTIONS.has(node.name || '')) {
			// Check if any child selectors are accessibility selectors
			if (node.has_children) {
				for (const child of node) {
					if (child.type === SELECTOR && isAccessibility(child)) {
						isA11y = true
						return BREAK
					}
				}
			}
		}
	})

	return isA11y ? a11y : false
}

/**
 * @returns {string[] | false} The pseudo-class name if it exists, otherwise false
 */
export function hasPseudoClass(selector: CSSNode): string[] | false {
	let pseudos: string[] = []

	walk(selector, function (node) {
		if (node.type === PSEUDO_CLASS_SELECTOR && node.name) {
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
			if (n.type === SELECTOR) {
				complexities.push(getComplexity(n))
			}
		})
	}

	walk(selector, function (node) {
		const type = node.type

		// Skip Selector nodes (don't count the selector container itself)
		if (type === SELECTOR) {
			return
		}

		// In Wallace, Nth is a leaf node. Count it if it has content
		if (type === NTH_SELECTOR) {
			// Count non-empty Nth nodes (like "1", "2n+1", etc.)
			if (node.text && node.text.trim()) {
				complexity++
			}
			// No children to recurse into in Wallace's Nth
			return
		}

		complexity++

		// Check for vendor-prefixed pseudo-elements, type selectors, and pseudo-classes
		if (type === PSEUDO_ELEMENT_SELECTOR || type === TYPE_SELECTOR || type === PSEUDO_CLASS_SELECTOR) {
			if (node.is_vendor_prefixed) {
				complexity++
			}
		}

		// Handle AttributeSelector - add complexity if it has a value
		if (type === ATTRIBUTE_SELECTOR) {
			if (node.value) {
				complexity++
			}
			// Skip children
			return SKIP
		}

		// Handle PseudoClass functions like :nth-child(), :where(), :not(), etc.
		if (type === PSEUDO_CLASS_SELECTOR) {
			const name = node.name || ''

			if (PSEUDO_FUNCTIONS.has(name.toLowerCase())) {
				// Find child selectors and recursively calculate their complexity
				const childComplexities: number[] = []

				if (node.has_children) {
					for (const child of node) {
						if (child.type === SELECTOR) {
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
export function getCombinators(selector: CSSNode, onMatch: ({ name, loc }: { name: string; loc: Location }) => void) {
	walk(selector, function (node) {
		if (node.type === COMBINATOR) {
			onMatch({
				name: node.name?.trim() === '' ? ' ' : node.name!,
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
