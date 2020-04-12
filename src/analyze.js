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

function stripSelector(selector) {
	const {
		specificity,
		isBrowserHack,
		isId,
		isAccessibility,
		isAttribute,
		isUniversal,
		isJavaScript,
		complexity,
		...rest
	} = selector
	return rest
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

function stripProperty(property) {
	const {
		isBrowserHack,
		isVendorPrefixed,
		isCustom,
		complexity,
		...rest
	} = property
	return rest
}

function withValueAnalysis(value) {
	return value
}

function stripValue(value) {
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

function stripDeclaration(declaration) {
	const { complexity, key, ...rest } = declaration
	return {
		...rest,
		property: stripProperty(rest.property),
		value: stripValue(rest.value),
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

function stripAtrule(atrule) {
	const { isVendorPrefixed, isBrowserHack, ...rest } = atrule
	return {
		...rest,
		declarations: rest.declarations.map(stripDeclaration),
	}
}

function withRuleAnalysis(rule) {
	return {
		...rule,
		declarations: rule.declarations.map(withDeclarationAnalysis),
		selectors: rule.selectors.map(withSelectorAnalysis),
		isEmpty: rule.declarations.length === 0,
	}
}

function stripRule(rule) {
	const { isEmpty, ...rest } = rule
	return {
		...rest,
		selectors: rest.selectors.map(stripSelector),
		declarations: rest.declarations.map(stripDeclaration),
	}
}

module.exports = ({ atrules, rules }) => {
	return {
		atrules: atrules.map(withAtruleAnalysis),
		rules: rules.map(withRuleAnalysis),
	}
}

module.exports.stripAtrule = stripAtrule
module.exports.stripRule = stripRule
module.exports.stripSelector = stripSelector
module.exports.stripDeclaration = this.stripDeclaration
module.exports.stripProperty = this.stripProperty
module.exports.stripValue = this.stripValue
