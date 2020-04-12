const { FORMATS, AGGREGATES } = require('./_types')
const { stripProperty } = require('../analyze')

function uniqueWithCount(items) {
	return [
		...items.reduce((map, item) => {
			const existingItem = map.get(item.key)
			return map.set(item.key, {
				count: (existingItem && existingItem.count + 1) || 1,
				...item,
			})
		}, new Map()),
	].map(([key, item]) => {
		const { count, ...value } = item
		return { count, value }
	})
}

function stripUnique(item) {
	return {
		...item,
		value: stripProperty(item.value),
	}
}

module.exports = ({ atrules, rules }) => {
	const properties = rules
		.map((rule) => rule.declarations)
		.reduce((all, current) => all.concat(current), [])
		.map((declaration) => declaration.property)

	const unique = uniqueWithCount(properties).map(stripUnique)

	const browserhacks = properties.filter((p) => p.isBrowserHack)
	const uniqueBrowserhacks = uniqueWithCount(browserhacks).map(stripUnique)

	return [
		{
			id: 'properties.total',
			value: properties.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'properties.unique.total',
			value: unique.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'properties.unique.ratio',
			value: unique.length / properties.length,
			format: FORMATS.RATIO,
			aggregate: AGGREGATES.AVERAGE,
		},
		{
			id: 'properties.unique',
			value: unique,
			format: FORMATS.PROPERTY,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'properties.prefixed.total',
			value: void 0,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'properties.prefixed.unique',
			value: void 0,
			format: FORMATS.PROPERTY,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'properties.prefixed.ratio',
			value: void 0,
			format: FORMATS.PROPERTY,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'properties.browserhacks.total',
			value: browserhacks.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'properties.browserhacks.unique',
			value: uniqueBrowserhacks,
			format: FORMATS.PROPERTY,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'properties.browserhacks.unique.total',
			value: uniqueBrowserhacks.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'properties.browserhacks.ratio',
			value: browserhacks.length / properties.length,
			format: FORMATS.PROPERTY,
			aggregate: AGGREGATES.LIST,
		},
	]
}
