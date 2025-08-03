import parse from 'css-tree/parser'
import walk_tree from 'css-tree/walker'
import { SelectorCollection } from './selector-collection.js'
import { PropertyCollection } from './property-collection.js'
import { DeclarationCollection } from './declaration-collection.js'
import { ends_with } from './string-utils.js'
import { getComplexity, isAccessibility, isPrefixed } from "./selectors/utils.js"
import { calculateForAST } from '@bramus/specificity/core'
import type { CssNode, Declaration, Selector } from 'css-tree'
import { has_vendor_prefix } from './vendor-prefix.js'
import { is_browserhack, is_custom as is_custom_property, is_shorthand as is_shorthand_property } from './properties/property-utils.js'

/**
 * Analyze CSS
 * @param {string} css
 */
export function analyze(css: string) {
	/**
	 * Recreate the authored CSS from a CSSTree node
	 * @param {import('css-tree').CssNode} node - Node from CSSTree AST to stringify
	 * @returns {string} str - The stringified node
	 */
	function stringifyNode(node: CssNode): string {
		return stringifyNodePlain(node).trim()
	}

	function stringifyNodePlain(node: CssNode): string {
		return css.substring(node.loc!.start.offset, node.loc!.end.offset)
	}

	function hash(start: number, end: number) {
		let hash = 0
		for (let i = start; i <= end; i++) {
			hash = (hash << 5) - hash + css.charCodeAt(i)
			hash |= 0
		}
		return hash >>> 0
	}

	let ast = parse(css, {
		// parseCustomProperty: true, // To find font-families, colors, etc.
		positions: true, // So we can use stringifyNode() and hash()
	})

	let selectors = new SelectorCollection()
	let properties = new PropertyCollection()
	let declarations = new DeclarationCollection()

	function on_selector(selector_ast: Selector, nesting_depth: number, pseudos: string[] | undefined, combinators: string[] | undefined) {
		let specificity = calculateForAST(selector_ast)
		let start = selector_ast.loc!.start
		let end = selector_ast.loc!.end.offset
		selectors.add(
			start.line,
			start.column,
			start.offset,
			end,
			getComplexity(selector_ast),
			isPrefixed(selector_ast),
			isAccessibility(selector_ast),
			specificity.a,
			specificity.b,
			specificity.c,
			() => stringifyNode(selector_ast),
			nesting_depth,
			hash(start.offset, end),
			pseudos,
			combinators
		)
	}

	function on_declaration(declaration_ast: Declaration, is_in_keyframes: boolean, nesting_depth: number) {
		let property = declaration_ast.property
		let start = declaration_ast.loc!.start
		let property_end = start.offset + property.length
		let is_custom = is_custom_property(property)
		let is_prefixed = has_vendor_prefix(property)
		let is_hack = is_browserhack(property)
		let is_shorthand = is_shorthand_property(property)
		let property_complexity = 1

		if (is_custom) {
			property_complexity++
		}
		if (is_prefixed) {
			property_complexity++
		}
		if (is_hack) {
			property_complexity++
		}
		if (is_shorthand) {
			property_complexity++
		}

		properties.add(
			start.line,
			start.column,
			start.offset,
			property_end,
			hash(start.offset, property_end),
			property_complexity,
			is_custom,
			is_shorthand,
			is_prefixed,
			is_hack,
			property
		)

		let is_important = declaration_ast.important !== false
		let declaration_complexity = 1
		if (is_important) {
			declaration_complexity++
		}
		declarations.add(
			start.line,
			start.column,
			start.offset,
			declaration_ast.loc!.end.offset,
			hash(start.offset, declaration_ast.loc!.end.offset),
			declaration_complexity,
			nesting_depth - 1,
			is_important,
			is_in_keyframes,
		)
	}

	function walk() {
		let nesting_depth = 0
		walk_tree(ast, {
			enter: function (node: CssNode) {
				if (node.type === 'Selector') {
					// @ts-expect-error `this.atrule` is the nearest ancestor Atrule node, if present. Null otherwise.
					if (this.atrule && ends_with('keyframes', this.atrule.name)) {
						return walk_tree.skip
					}

					let pseudos: string[] | undefined = undefined
					let combinators: string[] | undefined = undefined

					walk_tree(node, function (child: CssNode) {
						if (child.type === 'PseudoClassSelector') {
							if (pseudos === undefined) {
								pseudos = [child.name]
							} else {
								pseudos.push(child.name)
							}
						}
						else if (child.type === 'Combinator') {
							if (combinators === undefined) {
								combinators = [child.name]
							} else {
								combinators.push(child.name)
							}
						}
					})

					on_selector(node, nesting_depth, pseudos, combinators)

					// Avoid deeper walking of selectors to not mess with
					// our specificity calculations in case of a selector
					// with :where() or :is() that contain SelectorLists
					// as children
					return walk_tree.skip
				}

				else if (node.type === 'Rule' || node.type === 'Atrule') {
					nesting_depth++
				}

				else if (node.type === 'Declaration') {
					// Do not walk declaration in places like `@supports (display: grid)`
					// @ts-expect-error `this.atrule` is the nearest ancestor Atrule node, if present. Null otherwise.
					if (this.atrulePrelude !== null) {
						return walk_tree.skip
					}

					// @ts-expect-error `this.atrule` is the nearest ancestor Atrule node, if present. Null otherwise.
					on_declaration(node, this.atrule !== null && ends_with('keyframes', this.atrule.name), nesting_depth)
				}
			},
			leave(node: CssNode) {
				if (node.type === 'Rule' || node.type === 'Atrule') {
					nesting_depth--
				}
			}
		})
	}

	walk()

	return {
		get selectors() {
			return selectors
		},
		get declarations() {
			return declarations
		},
		get properties() {
			return properties
		}
	}
}