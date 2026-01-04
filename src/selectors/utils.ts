// @ts-expect-error CSS Tree types are incomplete
import walk from 'css-tree/walker'
import { startsWith, strEquals } from '../string-utils.js'
import { hasVendorPrefix } from '../vendor-prefix.js'
import { KeywordSet } from '../keyword-set.js'
import { Nth } from '../css-tree-node-types.js'
import type { AttributeSelector, CssLocation, CssNode, PseudoClassSelector, PseudoElementSelector, Selector, TypeSelector } from 'css-tree'
import { type CSSNode, is_vendor_prefixed, SKIP, BREAK, walk as wallaceWalk } from '@projectwallace/css-parser'

/**
 * @returns Analyzed selectors in the selectorList
 */
function analyzeList(selectorListAst: Selector | PseudoClassSelector, cb: (node: Selector) => unknown): Selector[] {
	let childSelectors: Selector[] = []
	walk(selectorListAst, {
		visit: 'Selector',
		enter: function (node: Selector) {
			// @ts-expect-error TODO: fix this
			childSelectors.push(cb(node))
		},
	})

	return childSelectors
}

const PSEUDO_FUNCTIONS = new KeywordSet(['nth-child', 'where', 'not', 'is', 'has', 'nth-last-child', 'matches', '-webkit-any', '-moz-any'])

export function isAccessibility(selector: Selector | PseudoClassSelector): boolean {
	let isA11y = false

	walk(selector, function (node: CssNode) {
		if (node.type === 'AttributeSelector') {
			let name = node.name.name
			if (strEquals('role', name) || startsWith('aria-', name)) {
				isA11y = true
				return walk.break
			}
		}
		// Test for [aria-] or [role] inside :is()/:where() and friends
		else if (node.type === 'PseudoClassSelector' && PSEUDO_FUNCTIONS.has(node.name)) {
			let list = analyzeList(node, isAccessibility)

			for (let c of list) {
				// @ts-expect-error TODO: fix this
				if (c === true) {
					isA11y = true
					break
				}
			}

			return walk.skip
		}
	})

	return isA11y
}

export function isPrefixed(selector: CSSNode): boolean {
	let isPrefixed = false

	wallaceWalk(selector, function (node) {
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
 * @returns {string[] | false} The pseudo-class name if it exists, otherwise false
 */
export function hasPseudoClass(selector: CSSNode): string[] | false {
	let pseudos: string[] = []

	wallaceWalk(selector, function (node) {
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
 * Get the Complexity for the AST of a Selector Node
 * @param selector - AST Node for a Selector
 * @return The numeric complexity of the Selector and whether it's prefixed or not
 */
export function getComplexity(selector: Selector): number {
	let complexity = 0

	walk(selector, function (node: CssNode) {
		let type = node.type
		if (type === 'Selector' || type === Nth) return

		complexity++

		if (type === 'PseudoElementSelector' || type === 'TypeSelector' || type === 'PseudoClassSelector') {
			if (hasVendorPrefix((node as PseudoElementSelector | TypeSelector | PseudoClassSelector).name)) {
				complexity++
			}
		}

		if (type === 'AttributeSelector') {
			if ((node as AttributeSelector).value) {
				complexity++
			}
			return walk.skip
		}

		if (type === 'PseudoClassSelector') {
			if (PSEUDO_FUNCTIONS.has((node as PseudoClassSelector).name)) {
				let list = analyzeList(node as PseudoClassSelector, getComplexity)

				// Bail out for empty/non-existent :nth-child() params
				if (list.length === 0) return

				for (let c of list) {
					// @ts-expect-error TODO: fix this
					complexity += c
				}
				return walk.skip
			}
		}
	})

	return complexity
}

/**
 * Get the Complexity for a Wallace Selector Node
 * @param selector - Wallace CSSNode for a Selector
 * @return The numeric complexity of the Selector
 */
export function getComplexityWallace(selector: CSSNode): number {
	let complexity = 0

	function walkNode(node: CSSNode): void | typeof SKIP {
		const type = node.type_name

		// Skip Selector and Nth nodes (equivalent to css-tree logic)
		if (type === 'Selector' || type === 'Nth') {
			if (node.has_children) {
				for (const child of node) {
					walkNode(child)
				}
			}
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
							childComplexities.push(getComplexityWallace(child))
						} else {
							// Recurse to find nested selectors
							findSelectors(child, childComplexities)
						}
					}
				}

				// Bail out for empty/non-existent params
				if (childComplexities.length === 0) {
					return SKIP
				}

				for (const c of childComplexities) {
					complexity += c
				}
				// Skip further processing of children
				return SKIP
			}
		}

		// Continue walking children
		if (node.has_children) {
			for (const child of node) {
				walkNode(child)
			}
		}
	}

	// Helper function to find all Selector nodes recursively
	function findSelectors(node: CSSNode, complexities: number[]): void {
		if (node.type_name === 'Selector') {
			complexities.push(getComplexityWallace(node))
		}
		if (node.has_children) {
			for (const child of node) {
				findSelectors(child, complexities)
			}
		}
	}

	walkNode(selector)
	return complexity
}

/**
 * Walk a selector node and trigger a callback every time a Combinator was found
 */
export function getCombinators(selector: CSSNode, onMatch: ({ name, loc }: { name: string; loc: CssLocation }) => void) {
	// Get CSS source from the selector's arena
	// const css = selector.source || ''

	wallaceWalk(selector, function (node) {
		if (node.type_name === 'Combinator') {
			onMatch({
				name: node.name.trim() === '' ? ' ' : node.name,
				loc: {
					source: '',
					start: {
						offset: node.start,
						line: node.line,
						column: node.column,
					},
					end: {
						offset: node.start + 1,
						line: node.line,
						column: node.column,
					},
				},
			})
		}
	})
}
