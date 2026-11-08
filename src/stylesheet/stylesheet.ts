export function getEmbedType(embed: string): string {
	// data:image/gif;base64,R0lG
	const start = 5 // `data:`.length
	const semicolon = embed.indexOf(';')
	const comma = embed.indexOf(',')

	if (semicolon === -1) {
		return embed.substring(start, comma)
	}

	if (comma !== -1 && comma < semicolon) {
		return embed.substring(start, comma)
	}

	return embed.substring(start, semicolon)
}
