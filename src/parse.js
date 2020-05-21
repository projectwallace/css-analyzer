const csstree = require('css-tree')

function selector(str) {
	return {
		value: str,
	}
}

function property(str) {
	return {
		name: str,
	}
}

function value(val, important) {
	// Important is either true, false or a string
	// Example: 'ie' when using `color: blue !ie`
	if (typeof important === 'string') {
		val += `!${important}`
	}

	return {
		value: val,
	}
}

function declaration(decl) {
	// when using a value like `blue !ie`, CSSTree marks the
	// `important` property as `'ie'`.

	return {
		isImportant: typeof decl.important === 'boolean' && decl.important === true,
		property: property(decl.property),
		value: value(decl.value.value, decl.important),
	}
}

function atrule(atr, { key, declarations }) {
	return {
		name: atr.name,
		arguments: (atr.prelude && atr.prelude.value) || undefined,
		declarations,
	}
}

module.exports = (css, options) => {
	let rules = []
	let atrules = []

	const ast = csstree.parse(css, {
		parseValue: false,
		parseRulePrelude: false,
		parseAtrulePrelude: false,
		onParseError: function (error, fallbackNode) {
			// optionally store the fallbackNode for reporting
			if (options.throwOnSyntaxError) throw error
		},
	})

	csstree.walk(ast, {
		visit: 'Rule',
		enter(node, item, list) {
			// SELECTORS IN RULESET
			const _selectors = node.prelude.value
				.split(',')
				.filter(Boolean)
				.map((s) => s.trim())
				.map(selector)

			// DECLARATIONS
			const declarations = csstree
				.toPlainObject(node.block)
				.children // Filter any optional broken nodes due to SyntaxErrors (Raw nodes)
				.filter((child) => child.type !== 'Raw')
				.map(declaration)

			// THE RULE ITSELF
			rules = [
				...rules,
				{
					selectors: _selectors,
					declarations: declarations,
				},
			]
		},
	})

	csstree.walk(ast, {
		visit: 'Atrule',
		enter(node) {
			// Some Atrules don't have a body,
			// don't try to get declarations from those
			//
			// Examples:
			// ```css
			// 		@charset 'UTF-8';
			// 		@import url("/fonts.css")
			// ```
			let declarations = []

			if (node.block !== null) {
				declarations = csstree
					.toPlainObject(node.block)
					.children.filter((child) => child.type === 'Declaration')
					.map(declaration)
			}

			atrules = atrules.concat(atrule(node, { declarations }))
		},
	})

	return {
		atrules,
		rules,
	}
}
