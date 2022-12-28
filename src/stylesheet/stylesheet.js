export function getEmbedType(embed) {
	// data:image/gif;base64,R0lG
	var start = 5 // `data:`.length
	var semicolon = embed.indexOf(';')

	if (semicolon === -1) {
		var comma = embed.indexOf(',')
		return embed.substring(start, comma)
	}

	return embed.substring(start, semicolon)
}