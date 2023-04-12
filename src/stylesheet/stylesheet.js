import walk from 'css-tree/walker'
import { startsWith } from '../string-utils.js'

/** @param {string} embed */
export function getEmbedType(embed) {
	// data:image/gif;base64,R0lG
	let start = 5 // `data:`.length
	let semicolon = embed.indexOf(';')
	let comma = embed.indexOf(',')

	if (semicolon === -1) {
		return embed.substring(start, comma)
	}

	if (comma !== -1 && comma < semicolon) {
		return embed.substring(start, comma);
	}

	return embed.substring(start, semicolon)
}

export function walkEmbeds(ast, callback) {
	walk(ast, {
		visit: 'Url',
		enter: function (node) {
			if (startsWith('data:', node.value)) {
				let embed = node.value
				let size = embed.length
				let type = getEmbedType(embed)
				callback({
					size,
					type,
					embed
				})
			}
		}
	})
}