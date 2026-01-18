// NOTICE
// BELOW IS A COPY OF BRAMUS/SPECIFICTY TAILORED FOR PORJECT WALLACE'S CSS PARSER
// https://github.com/bramus/specificity/blob/80938c4cf77518a4d4abe559eb5a5ff919626c39/src/core/calculate.js

import {
	type CSSNode,
	ID_SELECTOR,
	ATTRIBUTE_SELECTOR,
	CLASS_SELECTOR,
	PSEUDO_CLASS_SELECTOR,
	SELECTOR_LIST,
	NTH_OF_SELECTOR,
	SELECTOR,
	COMBINATOR,
	PSEUDO_ELEMENT_SELECTOR,
	TYPE_SELECTOR,
} from '@projectwallace/css-parser'
import { parse_selector } from '@projectwallace/css-parser/parse-selector'

type Specificity = [number, number, number]

function compare(s1: Specificity, s2: Specificity): number {
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

export const calculateForAST = (selectorAST: CSSNode): Specificity => {
	// https://www.w3.org/TR/selectors-4/#specificity-rules
	let a = 0 /* ID Selectors */
	let b = 0 /* Class selectors, Attributes selectors, and Pseudo-classes */
	let c = 0 /* Type selectors and Pseudo-elements */

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
					case 'where':
						// Noop :)
						break

					case '-webkit-any':
					case 'any':
						if (current.first_child) {
							b += 1
						}
						break

					// "The specificity of an :is(), :not(), or :has() pseudo-class is replaced by the specificity of the most specific complex selector in its selector list argument."
					case '-moz-any':
					case 'is':
					case 'matches':
					case 'not':
					case 'has':
						if (current.has_children) {
							// The first child should be a NODE_SELECTOR_LIST
							const childSelectorList = current.first_child
							if (childSelectorList?.type === SELECTOR_LIST) {
								// Calculate Specificity for all selectors in the list and get max
								const max1 = max(calculate(childSelectorList))

								// Adjust orig specificity
								a += max1[0]
								b += max1[1]
								c += max1[2]
							}
						}

						break

					// "The specificity of an :nth-child() or :nth-last-child() selector is the specificity of the pseudo class itself (counting as one pseudo-class selector) plus the specificity of the most specific complex selector in its selector list argument"
					case 'nth-child':
					case 'nth-last-child':
						b += 1

						// Get NODE_SELECTOR_NTH_OF which contains the "of" selector list
						const nthOf = current.first_child
						if (nthOf?.type === NTH_OF_SELECTOR && nthOf.selector) {
							// Use the convenience property to access the selector list directly
							const max2 = max(calculate(nthOf.selector))

							// Adjust orig specificity
							a += max2[0]
							b += max2[1]
							c += max2[2]
						}
						break

					// "The specificity of :host is that of a pseudo-class. The specificity of :host() is that of a pseudo-class, plus the specificity of its argument."
					// "The specificity of :host-context() is that of a pseudo-class, plus the specificity of its argument."
					case 'host-context':
					case 'host':
						b += 1

						const childSelector = current.first_child?.first_child
						if (childSelector?.type === SELECTOR) {
							// Calculate specificity for parts before the first combinator
							let childPart = childSelector.first_child
							while (childPart) {
								if (childPart.type === COMBINATOR) break

								// Calculate contribution from this part
								const partSpecificity = calculateForAST({
									type_name: 'Selector',
									first_child: childPart,
									has_children: true,
								} as CSSNode)
								a += partSpecificity[0] ?? 0
								b += partSpecificity[1] ?? 0
								c += partSpecificity[2] ?? 0

								childPart = childPart.next_sibling
							}
						}
						break

					// Improper use of Pseudo-Class Selectors instead of a Pseudo-Element
					// @ref https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-elements#index
					case 'after':
					case 'before':
					case 'first-letter':
					case 'first-line':
						c += 1
						break

					default:
						b += 1
						break
				}
				break

			case PSEUDO_ELEMENT_SELECTOR:
				switch (current.name.toLowerCase()) {
					// "The specificity of ::slotted() is that of a pseudo-element, plus the specificity of its argument."
					case 'slotted':
						c += 1

						const childSelector = current.first_child?.first_child
						if (childSelector?.type === SELECTOR) {
							// Calculate specificity for parts before the first combinator
							let childPart = childSelector.first_child
							while (childPart) {
								if (childPart.type === COMBINATOR) break

								// Calculate contribution from this part
								const partSpecificity = calculateForAST({
									type_name: 'Selector',
									first_child: childPart,
									has_children: true,
								} as CSSNode)
								a += partSpecificity[0] ?? 0
								b += partSpecificity[1] ?? 0
								c += partSpecificity[2] ?? 0

								childPart = childPart.next_sibling
							}
						}
						break

					case 'view-transition-group':
					case 'view-transition-image-pair':
					case 'view-transition-old':
					case 'view-transition-new':
						// The specificity of a view-transition selector with a * argument is zero.
						if (current.first_child?.text === '*') {
							break
						}
						// The specificity of a view-transition selector with an argument is the same
						// as for other pseudo - elements, and is equivalent to a type selector.
						c += 1
						break

					default:
						c += 1
						break
				}
				break

			case TYPE_SELECTOR:
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

			default:
				// NOOP
				break
		}

		current = current.next_sibling
	}

	return [a, b, c]
}

const convertToAST = (source: string | CSSNode) => {
	// The passed in argument was a String.
	// ~> Let's try and parse to an AST
	if (typeof source === 'string') {
		try {
			return parse_selector(source)
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e)
			throw new TypeError(`Could not convert passed in source '${source}' to SelectorList: ${message}`)
		}
	}

	// The passed in argument was an Object.
	// ~> Let's verify if it's a AST of the type NODE_SELECTOR_LIST
	if (source instanceof Object) {
		if (source.type === SELECTOR_LIST) {
			return source
		}

		throw new TypeError(`Passed in source is an Object but no AST / AST of the type SelectorList`)
	}

	throw new TypeError(`Passed in source is not a String nor an Object. I don't know what to do with it.`)
}

export const calculate = (selector: string | CSSNode): Specificity[] => {
	// Quit while you're ahead
	if (!selector) {
		return []
	}

	// Make sure we have a SelectorList AST
	// If not, an exception will be thrown
	const ast = convertToAST(selector)

	// SelectorList - the ast is always a SelectorList
	// Its children are NODE_SELECTOR (type 5) nodes
	// ~> Calculate Specificity for each NODE_SELECTOR
	const specificities: Specificity[] = []
	let selectorNode = ast.first_child
	while (selectorNode) {
		specificities.push(calculateForAST(selectorNode))
		selectorNode = selectorNode.next_sibling
	}
	return specificities
}
