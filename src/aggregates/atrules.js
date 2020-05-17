const uniqueWithCount = require('array-unique-with-count')
const { FORMATS, AGGREGATES } = require('./_types')
const { stripAtruleAnalysis } = require('../analyze')

function stripUnique(item) {
	return {
		...item,
		value: stripAtruleAnalysis(item.value).arguments,
	}
}

module.exports = ({ atrules }) => {
	const charsets = atrules.filter((atrule) => atrule.name === 'charset')
	const uniqueCharsets = uniqueWithCount(charsets).map(stripUnique)

	const fontfaces = atrules.filter((atrule) => atrule.name === 'font-face')
	const uniqueFontfaces = uniqueWithCount(fontfaces).map((item) => {
		return {
			...item,
			value: {
				declarations: stripAtruleAnalysis(item.value).declarations.map(
					(declaration) => {
						return {
							property: declaration.property.name,
							value: declaration.value.value,
						}
					}
				),
			},
		}
	})

	return [
		{
			id: 'atrules.charset.total',
			value: charsets.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.charset.totalUnique',
			value: uniqueCharsets.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.charset.unique',
			value: uniqueCharsets,
			format: FORMATS.ATRULE,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'atrules.fontface.total',
			value: fontfaces.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.fontface.totalUnique',
			value: uniqueFontfaces.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.fontface.unique',
			value: uniqueFontfaces,
			format: FORMATS.ATRULE,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'atrules.import.total',
			value: void 0,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.import.totalUnique',
			value: void 0,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.keyframes.total',
			value: void 0,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.keyframes.totalUnique',
			value: void 0,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.media.total',
			value: void 0,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.media.totalUnique',
			value: void 0,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.page.total',
			value: void 0,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.page.totalUnique',
			value: void 0,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.supports.total',
			value: void 0,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.supports.totalUnique',
			value: void 0,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
	]
}
