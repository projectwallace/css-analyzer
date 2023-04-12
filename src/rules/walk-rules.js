import walk from 'css-tree/walker'

export function walkRules(ast, callback) {
	walk(ast, {
		visit: 'Rule',
		/** @param {import('css-tree').Rule} node */
		enter: function (node) {
			let selector_count = node.prelude.children ? node.prelude.children.size : 0
			let declaration_count = node.block.children ? node.block.children.size : 0

			callback({
				node,
				selector_count,
				declaration_count,
				size: selector_count + declaration_count,
			})

			return this.skip
		}
	})
}