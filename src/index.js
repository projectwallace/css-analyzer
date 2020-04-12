const csstree = require('css-tree')

function selector(str) {
	return {
		value: str,
		specificity: {
			a: 0,
			b: 0,
			c: 0,
			d: 0,
		},
		isBrowserHack: false,
		isId: false,
		isAttribute: false,
		isUniversal: false,
		isJavaScript: false,
		isAccessibility: false,
		complexity: 0,
	}
}

function property(str) {
	const prop = csstree.property(str)

	return {
		name: str, // not `prop.name`, to maintain case sensitivity
		isBrowserHack: Boolean(prop.hack),
		isVendorPrefixed: Boolean(prop.vendor),
		isCustom: prop.custom,
		complexity: 0,
	}
}

function declaration(decl) {
	return {
		isImportant: Boolean(decl.important),
		property: property(decl.property),
		value: decl.value.value,
		complexity: 0,
	}
}

function atrule(atr, { key, declarations }) {
	return {
		name: atr.name,
		key: key || (atr.prelude && atr.prelude.value), // @unique
		arguments: (atr.prelude && atr.prelude.value) || undefined,
		isVendorPrefixed: false,
		isBrowserHack: false,
		declarations,
	}
}

const defaultOptions = {
	throwOnSyntaxError: false,
}

module.exports = (css, options = defaultOptions) => {
	let rules = []
	let atrules = []

	const ast = csstree.parse(css, {
		parseValue: false,
		parseRulePrelude: false,
		parseAtrulePrelude: false,
		onParseError: function (error, fallbackNode) {
			if (options.throwOnSyntaxError) {
				throw error
			}
		},
	})

	csstree.walk(ast, {
		visit: 'Rule',
		enter(node, item, list) {
			// SELECTORS
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
			const declarations = csstree
				.toPlainObject(node.block)
				.children.filter((child) => child.type === 'Declaration')
				.map(declaration)

			atrules = atrules.concat(atrule(node, { declarations }))
		},
	})

	return {
		atrules,
		rules,
		selectors: rules.map((rule) => rule.selectors).flat(),
		declarations: rules.map((rule) => rule.declarations).flat(),
	}
}
