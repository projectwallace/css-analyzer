// NOTICE
// BELOW IS A COPY OF BRAMUS/SPECIFICTY (MIT) AND CSSO's SPECIFICITY (MIT), TAILORED FOR PORJECT WALLACE'S CSS PARSER
// https://github.com/css/csso/blob/221c9a7145721362ae98ef0313cef4f60dbfa65a/lib/restructure/prepare/specificity.js#L30
// https://github.com/bramus/specificity/blob/80938c4cf77518a4d4abe559eb5a5ff919626c39/src/core/calculate.js

import {
	ID_SELECTOR,
	ATTRIBUTE_SELECTOR,
	CLASS_SELECTOR,
	PSEUDO_CLASS_SELECTOR,
	PSEUDO_ELEMENT_SELECTOR,
	TYPE_SELECTOR,
	type CSSNode,
	type Selector,
	type SelectorList,
	type SelectorNode,
	is_selector_list,
	is_nth_of_selector,
	is_selector,
	is_combinator,
} from '@projectwallace/css-parser'
import { parse_selector_list } from '@projectwallace/css-parser/parse-selector'

type Specificity = [number, number, number]

/**
 * @returns 0 if s1 equals s2, a negative number if s1 is lower than s2, or a positive number if s1 higher than s2
 */
export function compare(s1: Specificity, s2: Specificity): number {
	if (s1[0] === s2[0]) {
		if (s1[1] === s2[1]) {
			return s1[2] - s2[2]
		}
		return s1[1] - s2[1]
	}
	return s1[0] - s2[0]
}

/**
 * Lowercases `str` only when it actually contains an ASCII uppercase letter.
 * Real-world pseudo-class/-element names are almost always already lowercase,
 * so this avoids allocating a new string on the common path (`toLowerCase()`
 * always allocates, even when the input is unchanged).
 */
function to_lower(str: string): string {
	for (let i = 0; i < str.length; i++) {
		const code = str.charCodeAt(i)
		if (code >= 65 && code <= 90) {
			return str.toLowerCase()
		}
	}
	return str
}

/**
 * Specificity of the most specific Selector in a SelectorList, e.g. the argument
 * of an `:is()`, `:not()`, `:has()`, or `:nth-child(... of S)`.
 *
 * Streams straight over the SelectorList's own linked-list iterator instead of
 * going through `calculate()` (which would allocate an intermediate array via
 * `convertToAST` + `push`) and instead of sorting that array just to read off
 * its largest element.
 */
function maxSpecificityOf(selector_list: SelectorList): Specificity {
	let best: Specificity = [0, 0, 0]
	for (const selector_node of selector_list) {
		const specificity = calculateForAST(selector_node)
		if (compare(specificity, best) > 0) {
			best = specificity
		}
	}
	return best
}

/**
 * Specificity of the compound selector preceding any combinator inside a
 * `:host()` / `:host-context()` / `::slotted()` argument. Per spec the
 * argument is only ever a compound selector, but a Combinator (and more
 * selectors after it) can still show up there, so this stops at the first
 * one — scoring each part with `nodeSpecificity` directly instead of
 * delegating to `calculateForAST`, which would keep walking the *real*
 * sibling chain past the intended boundary and silently double-count
 * whatever comes after.
 */
function compoundArgumentSpecificity(childSelector: Selector): Specificity {
	let a = 0
	let b = 0
	let c = 0

	let childPart = childSelector.first_child
	while (childPart) {
		if (is_combinator(childPart)) break

		const [pa, pb, pc] = nodeSpecificity(childPart)
		a += pa
		b += pb
		c += pc

		childPart = childPart.next_sibling as SelectorNode
	}

	return [a, b, c]
}

/** Specificity contribution of a single selector part (one child of a Selector). */
function nodeSpecificity(current: SelectorNode): Specificity {
	switch (current.type) {
		case ID_SELECTOR:
			return [1, 0, 0]

		case ATTRIBUTE_SELECTOR:
		case CLASS_SELECTOR:
			return [0, 1, 0]

		case PSEUDO_CLASS_SELECTOR: {
			let a = 0
			let b = 0
			let c = 0

			switch (to_lower(current.name)) {
				// "The specificity of a :where() pseudo-class is replaced by zero."
				case 'where': {
					// Noop :)
					break
				}

				case '-webkit-any':
				case 'any': {
					if (current.first_child) {
						b += 1
					}
					break
				}

				// "The specificity of an :is(), :not(), or :has() pseudo-class is replaced by the specificity of the most specific complex selector in its selector list argument."
				case '-moz-any':
				case 'is':
				case 'matches':
				case 'not':
				case 'has': {
					if (current.has_children) {
						// The first child should be a NODE_SELECTOR_LIST
						const childSelectorList = current.first_child
						if (childSelectorList && is_selector_list(childSelectorList)) {
							// Calculate Specificity for all selectors in the list and get max
							const max1 = maxSpecificityOf(childSelectorList)

							// Adjust orig specificity
							a += max1[0]
							b += max1[1]
							c += max1[2]
						}
					}

					break
				}

				// "The specificity of an :nth-child() or :nth-last-child() selector is the specificity of the pseudo class itself (counting as one pseudo-class selector) plus the specificity of the most specific complex selector in its selector list argument"
				case 'nth-child':
				case 'nth-last-child': {
					b += 1

					// Get NODE_SELECTOR_NTH_OF which contains the "of" selector list
					const nthOf = current.first_child
					if (nthOf && is_nth_of_selector(nthOf) && nthOf.selector) {
						// Use the convenience property to access the selector list directly
						const max2 = maxSpecificityOf(nthOf.selector)

						// Adjust orig specificity
						a += max2[0]
						b += max2[1]
						c += max2[2]
					}
					break
				}
				// "The specificity of :host is that of a pseudo-class. The specificity of :host() is that of a pseudo-class, plus the specificity of its argument."
				// "The specificity of :host-context() is that of a pseudo-class, plus the specificity of its argument."
				case 'host-context':
				case 'host': {
					b += 1

					const selector_list = current.first_child
					const childSelector = selector_list?.first_child
					if (childSelector && is_selector(childSelector)) {
						const contribution = compoundArgumentSpecificity(childSelector)
						a += contribution[0]
						b += contribution[1]
						c += contribution[2]
					}
					break
				}
				// Improper use of Pseudo-Class Selectors instead of a Pseudo-Element
				// @ref https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-elements#index
				case 'after':
				case 'before':
				case 'first-letter':
				case 'first-line': {
					c += 1
					break
				}

				default: {
					b += 1
					break
				}
			}

			return [a, b, c]
		}

		case PSEUDO_ELEMENT_SELECTOR: {
			let a = 0
			let b = 0
			let c = 0

			switch (to_lower(current.name)) {
				// "The specificity of ::slotted() is that of a pseudo-element, plus the specificity of its argument."
				case 'slotted': {
					c += 1

					const selector_list = current.first_child
					const childSelector = selector_list?.first_child
					if (childSelector && is_selector(childSelector)) {
						const contribution = compoundArgumentSpecificity(childSelector)
						a += contribution[0]
						b += contribution[1]
						c += contribution[2]
					}
					break
				}

				case 'view-transition-group':
				case 'view-transition-image-pair':
				case 'view-transition-old':
				case 'view-transition-new': {
					// The specificity of a view-transition selector with a * argument is zero.
					if (current.first_child?.text === '*') {
						break
					}
					// The specificity of a view-transition selector with an argument is the same
					// as for other pseudo - elements, and is equivalent to a type selector.
					c += 1
					break
				}

				default: {
					c += 1
					break
				}
			}

			return [a, b, c]
		}

		case TYPE_SELECTOR:
			// Namespace is already split out into its own `namespace` field by the
			// parser, and the universal selector always parses as a distinct
			// UniversalSelector node (handled by `default` below), so `name` here
			// is always the bare local element name.
			return [0, 0, 1]

		default:
			// NOOP
			return [0, 0, 0]
	}
}

export const calculateForAST = (selectorAST: Selector): Specificity => {
	// https://www.w3.org/TR/selectors-4/#specificity-rules
	let a = 0 /* ID Selectors */
	let b = 0 /* Class selectors, Attributes selectors, and Pseudo-classes */
	let c = 0 /* Type selectors and Pseudo-elements */

	// Iterate through all parts of the selector (children of NODE_SELECTOR)
	let current = selectorAST.first_child

	while (current) {
		const [pa, pb, pc] = nodeSpecificity(current)
		a += pa
		b += pb
		c += pc

		current = current.next_sibling as SelectorNode
	}

	return [a, b, c]
}

const convertToAST = (source: string | CSSNode) => {
	// The passed in argument was a String.
	// ~> Let's try and parse to an AST
	if (typeof source === 'string') {
		try {
			return parse_selector_list(source)
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e)
			throw new TypeError(
				`Could not convert passed in source '${source}' to SelectorList: ${message}`,
			)
		}
	}

	// The passed in argument was an Object.
	// ~> Let's verify if it's a AST of the type NODE_SELECTOR_LIST
	if (source instanceof Object) {
		if (is_selector_list(source)) {
			return source
		}

		throw new TypeError(`Passed in source is an Object but no AST / AST of the type SelectorList`)
	}

	throw new TypeError(
		`Passed in source is not a String nor an Object. I don't know what to do with it.`,
	)
}

export const calculate = (selector: string | CSSNode): Specificity[] => {
	// Quit while you're ahead
	if (!selector) {
		return []
	}

	// Make sure we have a SelectorList AST
	// If not, an exception will be thrown
	const selector_list = convertToAST(selector)

	// SelectorList - the ast is always a SelectorList
	// Its children are NODE_SELECTOR (type 5) nodes
	// ~> Calculate Specificity for each NODE_SELECTOR
	const specificities: Specificity[] = []
	for (const selector_node of selector_list) {
		specificities.push(calculateForAST(selector_node))
	}
	return specificities
}
