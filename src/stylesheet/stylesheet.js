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