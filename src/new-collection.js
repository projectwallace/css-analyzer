/**
 * @description A loosened version of the CssLocation type from css-tree
 * @typedef {Object} CssLocation
 * @property {string | undefined | null} source
 * @property {{ offset: number; line: number; column: number }} start
 * @property {{ offset: number; line: number | undefined; column: number | undefined }} end
 */

/**
 * @param {CssLocation} location
 */
function location_to_array(location) {
	return new Uint32Array([
		location.start.line,
		location.start.column,
		location.start.offset,
		location.end.offset
	])
}

/**
 * @param {ReturnType<typeof location_to_array>} array
 */
function array_to_location(array) {
	return {
		line: array[0],
		column: array[1],
		start: array[2],
		end: array[3],
	}
}

export class Collection {
	/** @type {Map<string | number, Array<ReturnType<location_to_array>>>} */
	#collection
	#total

	constructor() {
		this.#collection = new Map()
		this.#total = 0
	}

	/**
	 * @param {string | number} item
	 * @param {import('css-tree').CssLocation} location
	 */
	add(item, location) {
		let match = this.#collection.get(item)
		let location_as_array = location_to_array(location)
		if (match) {
			match.push(location_as_array)
		} else {
			this.#collection.set(item, [location_as_array])
		}
		this.#total++
	}

	*[Symbol.iterator]() {
		for (let [key, value] of this.#collection) {
			yield {
				name: key,
				count: value.length,
				locations: value.map(array_to_location)
			}
		}
	}

	* list() {
		for (let [key, value] of this.#collection) {
			yield {
				name: key,
				count: value.length
			}
		}
	}

	/** @param {string} name */
	* locations(name) {
		let match = this.#collection.get(name)
		if (match) {
			for (let location of match) {
				yield array_to_location(location)
			}
		}
	}

	/** @param {string} name */
	has(name) {
		return this.#collection.has(name)
	}

	get total_unique() {
		return this.#collection.size
	}

	get total() {
		return this.#total
	}

	get uniqueness_ratio() {
		if (this.total === 0) {
			return 0
		}
		return this.total_unique / this.total
	}

	toJSON() {
		return Array.from(this)
	}
}