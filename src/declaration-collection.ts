import { LocationList } from './location-list.js';
import { UniqueValueList } from './unique-value-list.js';
import { AutoSizeUintArray } from './auto-size-uintarray.js';

export class DeclarationCollection {
	#total: number
	#locations: LocationList
	#unique: Set<number>
	#list: AutoSizeUintArray

	constructor() {
		this.#total = 0
		this.#locations = new LocationList()
		this.#unique = new Set<number>()
		// 8 bits:
		// 1 = is_important
		// 2 = is_in_keyframes
		// 3-4 = complexity (max (2^2-1=) 3, but in practice usually 1, max 3)
		// 5-8 = nesting depth (max (2^4-1=) 15
		this.#list = new AutoSizeUintArray(undefined, Uint8Array)
	}

	#encode(is_important: boolean, is_in_keyframes: boolean, complexity: number, depth: number): number {
		return ((is_important ? 1 : 0) << 7) |
			((is_in_keyframes ? 1 : 0) << 6) |
			((complexity & 0b11) << 4) | // mask to 2 bits
			(depth & 0b1111); // mask to 4 bits
	}

	#decode(encoded: number): { is_important: boolean, is_in_keyframes: boolean, complexity: number, depth: number } {
		return {
			is_important: (encoded >> 7 & 1) === 1,
			is_in_keyframes: (encoded >> 6 & 1) === 1,
			complexity: (encoded >> 4 & 0b11), // mask to 2 bits
			depth: (encoded & 0b1111), // mask to 4 bits
		};
	}

	add(start: number, end: number, line: number, column: number, hash: number, complexity: number, depth: number, is_important: boolean, is_in_keyframes: boolean) {
		this.#locations.add(line, column, start, end)
		this.#unique.add(hash)
		this.#total++
		this.#list.push(this.#encode(is_important, is_in_keyframes, complexity, depth))
	}

	get total() {
		return this.#total
	}

	get total_unique() {
		return this.#unique.size
	}

	get uniqueness_ratio() {
		return this.total === 0 ? 0 : this.total_unique / this.total
	}

	get items() {
		let list = this.#list
		let decode = this.#decode
		let locations = this.#locations

		return list.map((encoded, index) => {
			return {
				...decode(encoded),
				get location() {
					return locations.at(index)
				}
			}
		})
	}

	get importants() {
		let total = 0
		let total_in_keyframes = 0
		let list = this.#list
		let decode = this.#decode

		for (let encoded of list) {
			let { is_important, is_in_keyframes } = decode(encoded)
			if (is_important) {
				total++
				if (is_in_keyframes) {
					total_in_keyframes++
				}
			}
		}

		let ratio = total === 0 ? 0 : total / this.total

		return {
			total,
			ratio,
			in_keyframes: {
				total: total_in_keyframes,
				ratio: total_in_keyframes === 0 ? 0 : total_in_keyframes / total,
			},
		}
	}

	get complexity() {
		let count_per_complexity = new UniqueValueList<number>()
		let locations = this.#locations

		let location_index = 0
		for (let encoded of this.#list) {
			let { complexity } = this.#decode(encoded)
			count_per_complexity.add(complexity, location_index++)
		}
		let numerics = count_per_complexity.numerics

		return {
			sum: numerics.sum,
			max: numerics.max,
			min: numerics.min,
			average: numerics.average,
			mode: count_per_complexity.mode,
			*unique() {
				for (let { value, count, location_indexes } of count_per_complexity) {
					yield {
						value,
						count,
						get locations() {
							return location_indexes.map(location_index => locations.at(location_index))
						},
					}
				}
			}
		}
	}

	get nesting() {
		let nesting_depths = new UniqueValueList<number>()
		let locations = this.#locations

		let index = 0
		for (let encoded of this.#list) {
			let { depth } = this.#decode(encoded)
			nesting_depths.add(depth, index++)
		}
		let numerics = nesting_depths.numerics

		return {
			sum: numerics.sum,
			max: numerics.max,
			min: numerics.min,
			average: numerics.average,
			mode: nesting_depths.mode,
			total_unique: nesting_depths.total_unique,
			uniqueness_ratio: nesting_depths.uniqueness_ratio,
			*unique() {
				for (let { value, count, location_indexes } of nesting_depths) {
					yield {
						value,
						count,
						get locations() {
							return location_indexes.map(location_index => locations.at(location_index))
						},
					}
				}
			}
		}
	}

	toJSON() {
		return {
			total: this.total,
			total_unique: this.total_unique,
			uniqueness_ratio: this.uniqueness_ratio,
			importants: this.importants,
			complexity: this.complexity,
			nesting: this.nesting,
			items: this.items,
		}
	}
}