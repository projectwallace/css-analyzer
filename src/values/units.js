import walk from 'css-tree/walker'
import { endsWith } from '../string-utils.js'

export function walkUnits(ast, callback) {
	walk(ast, {
		visit: 'Declaration',
		/** @param {import('css-tree').Declaration} declaration */
		enter: function (declaration) {
			walk(declaration, function (node) {
				if (node.type !== 'Dimension') return

				let property = declaration.property
				let unit = endsWith('\\9', node.unit) ? node.unit.substring(0, node.unit.length - 2) : node.unit

				callback({
					unit,
					property
				})
			})
		}
	})
}