import parse from 'css-tree/parser'
import walk from 'css-tree/walker'
import { SelectorCollection } from './selector-collection.js'
import { endsWith } from './string-utils.js'
import { getComplexity, isAccessibility, isPrefixed } from "./selectors/utils.js"
import { calculateForAST } from '@bramus/specificity/core'
import type { CssNode, Selector } from 'css-tree'

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
		positions: true, // So we can use stringifyNode()
	})

	function walk_selectors(is_scanning = false, on_selector: (selector_ast: Selector, nesting_depth: number, pseudos: string[] | undefined, combinators: string[] | undefined) => void) {
		let nestingDepth = 0
		walk(ast, {
			enter: function (node: CssNode) {
				if (node.type === 'Selector') {
					if (this.atrule && endsWith('keyframes', this.atrule.name)) {
						return walk.skip
					}

					let pseudos: string[] | undefined = undefined
					let combinators: string[] | undefined = undefined
					// Avoid filling up memory while doing a size scan
					if (!is_scanning) {
						walk(node, function (child: CssNode) {
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
					}

					on_selector(node, nestingDepth, pseudos, combinators)

					// Avoid deeper walking of selectors to not mess with
					// our specificity calculations in case of a selector
					// with :where() or :is() that contain SelectorLists
					// as children
					return walk.skip
				}

				else if (node.type === 'Rule' || node.type === 'Atrule') {
					nestingDepth++
				}
			},
			leave(node: CssNode) {
				if (node.type === 'Rule' || node.type === 'Atrule') {
					nestingDepth--
				}
			}
		})
	}

	return {
		get selectors() {
			let total_selectors = 0
			walk_selectors(true, () => total_selectors++)

			let collection = new SelectorCollection(total_selectors)
			walk_selectors(false, function on_selector(selector_ast, nesting_depth: number, pseudos: string[] | undefined, combinators: string[] | undefined) {
				let specificity = calculateForAST(selector_ast)
				let start = selector_ast.loc!.start
				let end = selector_ast.loc!.end.offset
				collection.add(
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
			})
			return collection
		}
	}
}