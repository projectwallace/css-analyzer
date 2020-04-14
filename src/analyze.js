const csstree = require('css-tree')
const isPropertyBrowserhack = require('is-property-browserhack')

function withSelectorAnalysis(selector) {
	return {
		...selector,
		stats: {
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
		},
	}
}

function stripSelectorAnalysis(selector) {
	const { stats, ...rest } = selector
	return rest
}

function withPropertyAnalysis(property) {
	const { custom, hack, vendor } = csstree.property(property.name)

	return {
		...property,
		stats: {
			isBrowserHack: hack || isPropertyBrowserhack(property.name),
			isVendorPrefixed: Boolean(vendor),
			isCustom: Boolean(custom),
			complexity: -1,
			key: property.name,
		},
	}
}

function stripPropertyAnalysis(property) {
	const { stats, ...rest } = property
	return rest
}

function withValueAnalysis(value) {
	return {
		...value,
		stats: {},
	}
}

function stripValueAnalysis(value) {
	const { stats, ...rest } = value
	return rest
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
		stats: {
			complexity: -1,
			key: `${declaration.property.name}:${declaration.value}!${declaration.isImportant}`,
		},
	}
}

function stripDeclarationAnalysis(declaration) {
	const { stats, ...rest } = declaration
	return {
		...rest,
		property: stripPropertyAnalysis(rest.property),
		value: stripValueAnalysis(rest.value),
	}
}

function withAtruleAnalysis(atrule) {
	return {
		...atrule,
		declarations: atrule.declarations.map(withDeclarationAnalysis),
		stats: {
			isVendorPrefixed: false,
			isBrowserHack: false,
		},
	}
}

function stripAtruleAnalysis(atrule) {
	const { stats, ...rest } = atrule
	return {
		...rest,
		declarations: rest.declarations.map(stripDeclarationAnalysis),
	}
}

function withRuleAnalysis(rule) {
	return {
		...rule,
		declarations: rule.declarations.map(withDeclarationAnalysis),
		selectors: rule.selectors.map(withSelectorAnalysis),
		stats: {
			isEmpty: rule.declarations.length === 0,
		},
	}
}

function stripRuleAnalysis(rule) {
	const { stats, ...rest } = rule
	return {
		...rest,
		selectors: rest.selectors.map(stripSelectorAnalysis),
		declarations: rest.declarations.map(stripDeclarationAnalysis),
	}
}

module.exports = ({ atrules, rules }) => {
	return {
		atrules: atrules.map(withAtruleAnalysis),
		rules: rules.map(withRuleAnalysis),
	}
}

module.exports.stripAtruleAnalysis = stripAtruleAnalysis
module.exports.stripRuleAnalysis = stripRuleAnalysis
module.exports.stripSelectorAnalysis = stripSelectorAnalysis
module.exports.stripDeclarationAnalysis = stripDeclarationAnalysis
module.exports.stripPropertyAnalysis = stripPropertyAnalysis
module.exports.stripValueAnalysis = stripValueAnalysis
