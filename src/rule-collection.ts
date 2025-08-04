import { AutoSizeUintArray } from './auto-size-uintarray'
import { LocationList } from './location-list'
import { UniqueValueList } from './unique-value-list'

export class RuleCollection {
	#items: AutoSizeUintArray
	#locations: LocationList

	constructor() {
		this.#items = new AutoSizeUintArray(undefined, Uint32Array)
		this.#locations = new LocationList()
	}

	add(line: number, column: number, start: number, end: number, depth: number, declaration_count: number, selector_count: number) {
		this.#locations.add(line, column, start, end)
		let item = this.#pack(depth, declaration_count, selector_count)
		this.#items.push(item)
	}

	#pack(depth: number, declaration_count: number, selector_count: number) {
		return (depth << 16) | (declaration_count << 8) | selector_count
	}

	#unpack_depth(item: number) {
		return (item >> 16) & 0xff
	}

	#unpack_declaration_count(item: number) {
		return (item >> 8) & 0xff
	}

	#unpack_selector_count(item: number) {
		return item & 0xff
	}

	*depths() {
		for (let item of this.#items) {
			yield this.#unpack_depth(item)
		}
	}

	*declaration_counts() {
		for (let item of this.#items) {
			yield this.#unpack_declaration_count(item)
		}
	}

	*selector_counts() {
		for (let item of this.#items) {
			yield this.#unpack_selector_count(item)
		}
	}

	get sizes() {
		let items = this.#items
		let count_per_size = new UniqueValueList<number>()
		let locations = this.#locations

		let index = 0
		for (let item of items) {
			let size = this.#unpack_selector_count(item) + this.#unpack_declaration_count(item)
			count_per_size.add(size, index++)
		}
		let numerics = count_per_size.numerics

		return {
			total: items.length,
			mode: count_per_size.mode,
			total_unique: count_per_size.total_unique,
			uniqueness_ratio: count_per_size.uniqueness_ratio,
			sum: numerics.sum,
			max: numerics.max,
			min: numerics.min,
			average: numerics.average,
			items: items.map(size => this.#unpack_selector_count(size) + this.#unpack_declaration_count(size)),
			unique: function* () {
				for (let { value, location_indexes } of count_per_size) {
					yield {
						value,
						count: location_indexes.length,
						get locations() {
							return location_indexes.map(location_index => locations.at(location_index))
						}
					}
				}
			}
		}
	}

	get total() {
		return this.#items.length
	}

	*[Symbol.iterator]() {
		let location_index = 0
		for (let item of this.#items) {
			yield {
				depth: this.#unpack_depth(item),
				declaration_count: this.#unpack_declaration_count(item),
				selector_count: this.#unpack_selector_count(item),
				size: this.#unpack_selector_count(item) + this.#unpack_declaration_count(item),
				location: this.#locations.at(location_index++),
			}
		}
	}
}