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
	// @charset
	const charsets = atrules.filter((atrule) => atrule.name === 'charset')
	const uniqueCharsets = uniqueWithCount(charsets).map(stripUnique)

	// @font-face
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

	// @import
	const imports = atrules.filter((atrule) => atrule.name === 'import')
	const uniqueImports = uniqueWithCount(imports).map(stripUnique)

	// @keyframes
	const keyframes = atrules.filter((atrule) =>
		atrule.name.endsWith('keyframes')
	)
	const uniqueKeyframes = uniqueWithCount(keyframes).map(stripUnique)
	const prefixedKeyframes = keyframes.filter(
		(keyframe) => keyframe.stats.isVendorPrefixed
	)
	const uniquePrefixedKeyframes = uniqueWithCount(prefixedKeyframes).map(
		(item) => {
			return {
				...item,
				value: item.value.stats.key,
			}
		}
	)

	// @media
	const medias = atrules.filter((atrule) => atrule.name === 'media')
	const uniqueMedias = uniqueWithCount(medias).map(stripUnique)
	const browserhackMedias = medias.filter((media) => media.stats.isBrowserhack)
	const uniqueBrowserhackMedias = uniqueWithCount(browserhackMedias).map(
		stripUnique
	)

	// @supports
	const supports = atrules.filter((atrule) => atrule.name === 'supports')
	const uniqueSupports = uniqueWithCount(supports).map(stripUnique)
	const browserhackSupports = supports.filter(
		(atrule) => atrule.stats.isBrowserhack
	)
	const uniqueBrowserhackSupports = uniqueWithCount(browserhackSupports).map(
		stripUnique
	)

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
			value: imports.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.import.totalUnique',
			value: uniqueImports.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.import.unique',
			value: uniqueImports,
			format: FORMATS.ATRULE,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'atrules.keyframes.total',
			value: keyframes.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.keyframes.totalUnique',
			value: uniqueKeyframes.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.keyframes.unique',
			value: uniqueKeyframes,
			format: FORMATS.ATRULE,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'atrules.keyframes.prefixed.total',
			value: prefixedKeyframes.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.keyframes.prefixed.totalUnique',
			value: uniquePrefixedKeyframes.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.keyframes.prefixed.unique',
			value: uniquePrefixedKeyframes,
			format: FORMATS.ATRULE,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'atrules.media.total',
			value: medias.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.media.totalUnique',
			value: uniqueMedias.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.media.unique',
			value: uniqueMedias,
			format: FORMATS.ATRULE,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'atrules.media.browserhacks.total',
			value: browserhackMedias.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.media.browserhacks.totalUnique',
			value: uniqueBrowserhackMedias.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.media.browserhacks.unique',
			value: uniqueBrowserhackMedias,
			format: FORMATS.ATRULE,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'atrules.supports.total',
			value: supports.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.supports.totalUnique',
			value: uniqueSupports.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.supports.unique',
			value: uniqueSupports,
			format: FORMATS.ATRULE,
			aggregate: AGGREGATES.LIST,
		},
		{
			id: 'atrules.supports.browserhacks.total',
			value: browserhackSupports.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.supports.browserhacks.totalUnique',
			value: uniqueBrowserhackSupports.length,
			format: FORMATS.COUNT,
			aggregate: AGGREGATES.SUM,
		},
		{
			id: 'atrules.supports.browserhacks.unique',
			value: uniqueBrowserhackSupports,
			format: FORMATS.ATRULE,
			aggregate: AGGREGATES.LIST,
		},
	]
}
