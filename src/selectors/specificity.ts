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

function max(list: Specificity[]): Specificity {
	return list.sort(compare).at(-1)!
}

function argument_specificity(node: CSSNode): Specificity {
	let a = 0
	let b = 0
	let c = 0
	const childSelector = node.first_child?.first_child
	if (childSelector && is_selector(childSelector)) {
		// Only the parts before the first combinator count
		let part = childSelector.first_child
		while (part && !is_combinator(part)) {
			const [pa, pb, pc] = calculateForAST({ first_child: part } as Selector)
			a += pa
			b += pb
			c += pc
			part = part.next_sibling as SelectorNode
		}
	}
	return [a, b, c]
}

export function calculateForAST(selectorAST: Selector): Specificity {
	// https://www.w3.org/TR/selectors-4/#specificity-rules
	let a = 0 /* ID Selectors */
	let b = 0 /* Class selectors, Attributes selectors, and Pseudo-classes */
	let c = 0 /* Type selectors and Pseudo-elements */
	function add([x, y, z]: Specificity) {
		a += x
		b += y
		c += z
	}

	// Iterate through all parts of the selector (children of NODE_SELECTOR)
	let current = selectorAST.first_child

	while (current) {
		switch (current.type) {
			case ID_SELECTOR:
				a += 1
				break

			case ATTRIBUTE_SELECTOR:
			case CLASS_SELECTOR:
				b += 1
				break

			case PSEUDO_CLASS_SELECTOR:
				switch (current.name.toLowerCase()) {
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
								const max1 = max(calculate(childSelectorList))

								add(max1)
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
							const max2 = max(calculate(nthOf.selector))

							add(max2)
						}
						break
					}
					// "The specificity of :host is that of a pseudo-class. The specificity of :host() is that of a pseudo-class, plus the specificity of its argument."
					// "The specificity of :host-context() is that of a pseudo-class, plus the specificity of its argument."
					case 'host-context':
					case 'host': {
						b += 1

						add(argument_specificity(current))
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
				break

			case PSEUDO_ELEMENT_SELECTOR:
				switch (current.name.toLowerCase()) {
					// "The specificity of ::slotted() is that of a pseudo-element, plus the specificity of its argument."
					case 'slotted': {
						c += 1

						add(argument_specificity(current))
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

					case 'highlight': {
						if (current.first_child) {
							// The specificity of a ::highlight() selector with a * argument is zero.
							if (current.first_child.text === '*') {
								break
							}
							// The specificity of a ::highlight() selector with a <custom-ident> argument
							// is equivalent to a type selector.
							c += 1
						}
						break
					}

					default: {
						c += 1
						break
					}
				}
				break

			case TYPE_SELECTOR: {
				// Omit namespace
				let typeSelector = current.name ?? ''
				if (typeSelector.includes('|')) {
					typeSelector = typeSelector.split('|')[1] ?? ''
				}

				// "Ignore the universal selector"
				if (typeSelector !== '*') {
					c += 1
				}
				break
			}

			default: {
				// NOOP
				break
			}
		}

		current = current.next_sibling as SelectorNode
	}

	return [a, b, c]
}

export function calculate(selector: string | CSSNode): Specificity[] {
	if (!selector) {
		return []
	}

	let selector_list: CSSNode
	if (typeof selector === 'string') {
		try {
			selector_list = parse_selector_list(selector)
		} catch (event) {
			const message = event instanceof Error ? event.message : String(event)
			throw new TypeError(
				`Could not convert passed in source '${selector}' to SelectorList: ${message}`,
			)
		}
	} else if (is_selector_list(selector)) {
		selector_list = selector
	} else {
		throw new TypeError('Passed in source is not a string or a SelectorList AST')
	}

	return Array.from(selector_list, (node) => calculateForAST(node as Selector))
}
