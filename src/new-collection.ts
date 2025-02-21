type CssLocation = {
	source?: string
	start: {
		offset: number
		line: number
		column: number
	}
	end: {
		offset: number
		line?: number
		column?: number
	}
}

type CssLocationArray = Uint32Array

type Item = string | number

function location_to_array(location: CssLocation) {
	return new Uint32Array([
		location.start.line,
		location.start.column,
		location.start.offset,
		location.end.offset
	])
}

function array_to_location(array: CssLocationArray) {
	return {
		line: array[0],
		column: array[1],
		start: array[2],
		end: array[3],
	}
}

export class Collection {
	#collection: Map<Item, Array<CssLocationArray>>
	#total: number

	constructor() {
		this.#collection = new Map()
		this.#total = 0
	}

	add(item: Item, location: CssLocation) {
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

	* locations(name: string) {
		let match = this.#collection.get(name)
		if (match) {
			for (let location of match) {
				yield array_to_location(location)
			}
		}
	}

	has(name: string) {
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