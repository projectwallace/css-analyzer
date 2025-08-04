import { AutoSizeUintArray } from './auto-size-uintarray.js'

type MinMax<T> = {
	value: T
	count: number
}

export class UniqueValueList<T extends string | number> {
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
		return this
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

	get numerics() {
		let first = this.#items.keys().next()
		let min: number | undefined = undefined
		let max: number | undefined = undefined
		let sum = 0

		if (typeof first.value === 'number') {
			for (let [value, list] of this.#items as Map<number, AutoSizeUintArray>) {
				sum += (value * list.length)
				if (min === undefined || value < min) {
					min = value
				}
				if (max === undefined || value > max) {
					max = value
				}
			}
		}

		return {
			sum,
			max,
			min,
			average: this.total === 0 ? 0 : sum / this.total,
		}
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
