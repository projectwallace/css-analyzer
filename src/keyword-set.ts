/**
 * @description A Set-like construct to search CSS keywords in a case-insensitive way
 */
export class KeywordSet {
	set: Set<string>

	constructor(items: string[]) {
		this.set = new Set(items)
	}

	has(item: string): boolean {
		return this.set.has(item.toLowerCase())
	}
}