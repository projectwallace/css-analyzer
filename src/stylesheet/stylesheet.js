/**
 * @param {string} str
 * @param {number} start
 * @param {number} end
 */
function substring(str, start, end) {
	return str.substring(start, end)
}

/** @param {string} embed */
export function getEmbedType(embed) {
	// data:image/gif;base64,R0lG
	let start = 5 // `data:`.length
	let semicolon = embed.indexOf(';')
	let comma = embed.indexOf(',')

	if (semicolon === -1) {
		return substring(embed, start, comma)
	}

	if (comma !== -1 && comma < semicolon) {
		return substring(embed, start, comma);
	}

	return substring(embed, start, semicolon)
}