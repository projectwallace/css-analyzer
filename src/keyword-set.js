import { strEquals } from "./string-utils.js"

/**
 * @description A Set-like construct to search CSS keywords in a case-insensitive way
 */
export class KeywordSet {

	/** @param {string[]} items */
	constructor(items) {
		/** @type {string[]} */
		this.set = items
	}

	/** @param {string} item */
	has(item) {
		let len = this.set.length

		for (let index = 0; index < len; index++) {
			if (strEquals(this.set[index], item)) {
				return true
			}
		}
		return false
	}
}