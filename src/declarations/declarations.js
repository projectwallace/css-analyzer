import walk from 'css-tree/walker'
import { endsWith } from '../string-utils.js'

export function walkDeclarations(ast, callback) {
	walk(ast, {
		visit: 'Declaration',
		/** @param {import('css-tree').Declaration} node */
		enter: function (node) {
			// Do not process Declarations in atRule preludes
			// because we will handle them manually
			if (this.atrulePrelude !== null) {
				return this.skip
			}

			let is_in_keyframes = this.atrule !== null && endsWith('keyframes', this.atrule.name)

			callback({
				node,
				is_important: node.important === true,
				is_in_keyframes,
			})
		}
	})
}