export function get_embed_type(embed: string): string {
	// data:image/gif;base64,R0lG
	const start = 5 // `data:`.length
	const semicolon = embed.indexOf(';')
	const comma = embed.indexOf(',')

	if (semicolon === -1) {
		// data:image/svg+xml,%3Csvg -> image/svg+xml
		return embed.substring(start, comma)
	}

	if (comma !== -1 && comma < semicolon) {
		// data:text/plain,a;b -> text/plain
		return embed.substring(start, comma)
	}

	// data:image/gif;base64,R0lG -> image/gif
	return embed.substring(start, semicolon)
}
