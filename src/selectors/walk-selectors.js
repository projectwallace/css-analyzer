import walk from 'css-tree/walker'
import { calculate } from '@bramus/specificity/core'
import { getComplexity, isAccessibility } from './utils.js'
import { endsWith } from '../string-utils.js'

/**
 * @param {import('css-tree').CssNode} ast
 * @param {Function} callback
 */
export function walkSelectors(ast, callback) {
	walk(ast,
		/** @param {import('css-tree').Selector} node */
		function (node) {
			if (node.type !== 'Selector') return

			if (this.atrule && endsWith('keyframes', this.atrule.name)) {
				callback({
					is_keyframe_selector: true,
					specificity: null,
					complexity: null,
					is_prefixed: null,
					is_accesibility: null,
					node
				})
				return this.skip
			}

			let [{ value: { a, b, c } }] = calculate(node)
			let [complexity, is_prefixed] = getComplexity(node)

			callback({
				is_keyframe_selector: false,
				/** @type {Specificity} */
				specificity: [a, b, c],
				complexity,
				is_prefixed,
				is_accesibility: isAccessibility(node),
				node,
				context: this.rule
			})

			// Avoid deeper walking of selectors to not mess with
			// our specificity calculations in case of a selector
			// with :where()/:is()/:not()/etc. that contain
			// SelectorLists as children
			return this.skip
		})
}