const csstree = require('css-tree')

function withSelectorAnalysis(selector) {
	return {
		...selector,
		specificity: {
			a: -1,
			b: -1,
			c: -1,
			d: -1,
		},
		isBrowserHack: false,
		isId: false,
		isAttribute: false,
		isUniversal: false,
		isJavaScript: false,
		isAccessibility: false,
		complexity: -1,
	}
}

function withPropertyAnalysis(property) {
	const prop = csstree.property(property.name)

	return {
		...property,
		isBrowserHack: Boolean(prop.hack),
		isVendorPrefixed: Boolean(prop.vendor),
		isCustom: prop.custom,
		complexity: -1,
	}
}

function withValueAnalysis(value) {
	return value
}

function withDeclarationAnalysis(declaration) {
	return {
		...declaration,
		property: {
			...declaration.property,
			...withPropertyAnalysis(declaration.property),
		},
		value: {
			...declaration.value,
			...withValueAnalysis(declaration.value),
		},
		complexity: -1,
		key: `${declaration.property.name}:${declaration.value}!${declaration.isImportant}`,
	}
}

function withAtruleAnalysis(atrule) {
	return {
		...atrule,
		isVendorPrefixed: false,
		isBrowserHack: false,
		declarations: atrule.declarations.map(withDeclarationAnalysis),
	}
}

function withRuleAnalysis(rule) {
	return {
		...rule,
		declarations: rule.declarations.map(withDeclarationAnalysis),
		selectors: rule.selectors.map(withSelectorAnalysis),
	}
}

module.exports = ({ atrules, rules }) => {
	return {
		atrules: atrules.map(withAtruleAnalysis),
		rules: rules.map(withRuleAnalysis),
	}
}
