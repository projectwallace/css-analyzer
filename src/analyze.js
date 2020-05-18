const csstree = require('css-tree')
const isPropertyBrowserhack = require('is-property-browserhack')
const isSelectorBrowserhack = require('is-selector-browserhack')
const isMediaBrowserhack = require('is-media-browserhack')
const isSupportsBrowserhack = require('is-supports-browserhack')
const selectorComplexity = require('selector-complexity')
const specificity = require('specificity')
const isVendorPrefixed = require('is-vendor-prefixed')

function withSelectorAnalysis(selector) {
	const { value } = selector
	let complexity

	try {
		complexity = selectorComplexity(value)
	} catch (error) {
		complexity = 1
	}

	return {
		...selector,
		stats: {
			key: value,
			specificity: specificity.calculate(value).shift().specificityArray,
			isBrowserhack: isSelectorBrowserhack(value),
			isId: /(?![^[]*])#/.test(value),
			isUniversal: /(?![^[]*])\*/.test(value),
			isJavaScript: /[.|#(?:=")]js/i.test(value),
			isAccessibility: value.includes('[aria-') || value.includes('[role='),
			complexity,
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
		stats: {
			isVendorPrefixed: void 0,
			isBrowserhack: void 0,
			colors: void 0,
			fontsize: void 0,
			fontfamily: void 0,
			textshadow: void 0,
			boxshadow: void 0,
			animationduration: void 0,
			animationfunction: void 0,
			key: value.value,
		},
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
	let key = atrule.arguments
	const descriptors = atrule.declarations.map(withDeclarationAnalysis)

	// Uniqueness for @font-face is based on the `src` property,
	// because this is very likely to be unique
	if (atrule.name === 'font-face') {
		const src = descriptors.find(
			(descriptor) => descriptor.property.name === 'src'
		)
		key = src.value.value
	}

	if (atrule.name.endsWith('keyframes')) {
		// atrule.name contains an optional vendor prefix
		// which is important for marking the keyframes as unique
		key = `@${atrule.name} ${atrule.arguments}`
	}

	return {
		...atrule,
		declarations: descriptors,
		stats: {
			isVendorPrefixed: ((atrule) => {
				if (atrule.name.endsWith('keyframes')) {
					return isVendorPrefixed(atrule.name)
				}
				return false
			})(atrule),
			isBrowserhack: ((atrule) => {
				if (atrule.name === 'media') {
					return isMediaBrowserhack(atrule.arguments)
				}
				if (atrule.name === 'supports') {
					return isSupportsBrowserhack(atrule.arguments)
				}
				return false
			})(atrule),
			key,
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
