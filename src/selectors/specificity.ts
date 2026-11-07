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
import { type Input, as_selectors } from '../input.js'

export type Specificity = [number, number, number]

/**
 * @returns 0 if s1 equals s2, a negative number if s1 is lower than s2, or a positive number if s1 higher than s2
 */
export function compare_specificity(s1: Specificity, s2: Specificity): number {
	if (s1[0] === s2[0]) {
		if (s1[1] === s2[1]) {
			return s1[2] - s2[2]
		}
		return s1[1] - s2[1]
	}
	return s1[0] - s2[0]
}

function max(list: Specificity[]): Specificity {
	return list.sort(compare_specificity).at(-1)!
}

function argument_specificity(node: CSSNode): Specificity {
	let a = 0
	let b = 0
	let c = 0
	const child_selector = node.first_child?.first_child
	if (child_selector && is_selector(child_selector)) {
		// Only the parts before the first combinator count
		let part = child_selector.first_child
		while (part && !is_combinator(part)) {
			const [pa, pb, pc] = selector_specificity({ first_child: part } as Selector)
			a += pa
			b += pb
			c += pc
			part = part.next_sibling as SelectorNode
		}
	}
	return [a, b, c]
}

function selector_specificity(selector_ast: Selector): Specificity {
	// https://www.w3.org/TR/selectors-4/#specificity-rules
	let a = 0 /* ID Selectors */
	let b = 0 /* Class selectors, Attributes selectors, and Pseudo-classes */
	let c = 0 /* Type selectors and Pseudo-elements */
	const add = ([x, y, z]: Specificity) => {
		a += x
		b += y
		c += z
	}

	// Iterate through all parts of the selector (children of NODE_SELECTOR)
	let current = selector_ast.first_child

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
							const child_selector_list = current.first_child
							if (child_selector_list && is_selector_list(child_selector_list)) {
								// Calculate Specificity for all selectors in the list and get max
								const max1 = max(get_specificity(child_selector_list))

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
						const nth_of = current.first_child
						if (nth_of && is_nth_of_selector(nth_of) && nth_of.selector) {
							// Use the convenience property to access the selector list directly
							const max2 = max(get_specificity(nth_of.selector))

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
				let type_selector = current.name ?? ''
				if (type_selector.includes('|')) {
					type_selector = type_selector.split('|')[1] ?? ''
				}

				// "Ignore the universal selector"
				if (type_selector !== '*') {
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

/**
 * Calculate the specificity of a selector (list).
 * @param input - Selector text, or an already parsed Selector/SelectorList node
 * @returns One `[a, b, c]` tuple for every selector in the list
 */
export function get_specificity(input: Input): Specificity[] {
	// Quit while you're ahead
	if (!input) {
		return []
	}

	return as_selectors(input).map((selector) => selector_specificity(selector as Selector))
}
