import { AutoSizeUintArray } from './auto-size-uintarray.js'

export class UniqueValueList<T> {
	#items: Map<T, AutoSizeUintArray> = new Map()
	#total = 0
	#min = 0
	#max = 0

	/**
	 * @param value The value to add to the list
	 * @param location_index location_index at which the location is stored
	 */
	add(value: T, location_index: number) {
		this.#total++
		let item = this.#items.get(value)

		if (item === undefined) {
			let list = new AutoSizeUintArray(4)
			list.push(location_index)
			this.#items.set(value, list)

			if (this.#min === 0) {
				this.#min = 1
			}
			if (this.#max === 0) {
				this.#max = 1
			}
		}
		else {
			item.push(location_index)

			if (item.length > this.#max) {
				this.#max = item.length
			}
			if (item.length < this.#min) {
				this.#min = item.length
			}
		}
	}

	get total() {
		return this.#total
	}

	get total_unique() {
		return this.#items.size
	}

	get uniqueness_ratio() {
		return this.total_unique === 0 ? 0 : this.total_unique / this.total
	}

	/**
	 * The lowest count of locations for a value in this list.
	 */
	get min() {
		return this.#min
	}

	/**
	 * The highest count of locations for a value in this list.
	 */
	get max() {
		return this.#max
	}

	*[Symbol.iterator]() {
		for (let [value, location_indexes] of this.#items) {
			yield {
				value,
				count: location_indexes.length,
				location_indexes
			}
		}
	}

	*desc(limit: number = Infinity) {
		let max = this.#max

		for (; max > 0; max--) {
			for (let [value, location_indexes] of this.#items) {
				if (location_indexes.length === max) {
					yield {
						value,
						count: location_indexes.length,
						location_indexes
					}
					limit--
					if (limit === 0) {
						return
					}
				}
			}
		}
	}
}
