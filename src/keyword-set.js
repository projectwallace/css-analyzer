/**
 * @description A Set-like construct to search CSS keywords in a case-insensitive way
 */
export class KeywordSet {

	/** @param {Lowercase<string>[]} items */
	constructor(items) {
		/** @type {Set<string>} */
		this.set = new Set(items)
	}

	/** @param {string} item */
	has(item) {
		return this.set.has(item.toLowerCase())
	}
}