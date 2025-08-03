import { AutoSizeUintArray } from './auto-size-uintarray.js'

type MinMax<T> = {
	value: T
	count: number
}

export class UniqueValueList<T> {
	#items: Map<T, AutoSizeUintArray> = new Map()
	#total = 0

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
		}
		else {
			item.push(location_index)
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
		let _min: MinMax<T> | undefined = undefined
		for (let [value, location_indexes] of this.#items) {
			let count = location_indexes.length
			if (_min === undefined || count < _min.count) {
				_min = {
					value,
					count,
				}
			}
		}
		return _min
	}

	/**
	 * The highest count of locations for a value in this list.
	 */
	get max() {
		let _max: MinMax<T> | undefined = undefined
		for (let [value, location_indexes] of this.#items) {
			let count = location_indexes.length
			if (_max === undefined || count > _max.count) {
				_max = {
					value,
					count,
				}
			}
		}
		return _max
	}

	get mode() {
		return this.max?.value // The value with the highest count of locations
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
		if (this.max === undefined) {
			return
		}

		for (let max = this.max.count; max > 0; max--) {
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
