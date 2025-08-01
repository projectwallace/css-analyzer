import { LocationList } from './location-list.js'
import { UniqueValueList } from './unique-value-list.js'
import { AutoSizeUintArray } from './auto-size-uintarray.js'

function pack(is_custom: boolean, is_shorthand: boolean, is_prefixed: boolean, is_browserhack: boolean, complexity: number): number {
	return ((is_custom ? 1 : 0) << 7) |
		((is_shorthand ? 1 : 0) << 6) |
		((is_prefixed ? 1 : 0) << 5) |
		((is_browserhack ? 1 : 0) << 4) |
		(complexity & 0b1111) // mask to 4 bits
}

function unpack_is_custom(value: number): boolean {
	return (value >> 7 & 1) === 1
}
function unpack_is_shorthand(value: number): boolean {
	return (value >> 6 & 1) === 1
}
function unpack_is_prefixed(value: number): boolean {
	return (value >> 5 & 1) === 1
}
function unpack_is_browserhack(value: number): boolean {
	return (value >> 4 & 1) === 1
}
function unpack_complexity(value: number): number {
	return (value & 0b1111) // mask to 4 bits
}

export class PropertyCollection {
	#size = 0
	#locations: LocationList
	#unique: UniqueValueList<string>
	// Bit 1 = is_custom
	// Bit 2 = is_shorthand
	// Bit 3 = is_prefixed
	// Bit 4 = is_browserhack
	// Remaining bits = complexity (max (2^4-1=) 15, but in practice usually 1, max 4)
	#complexities_and_flags: AutoSizeUintArray
	#total_custom = 0
	#unique_customs: Set<number>
	#total_shorthand = 0
	#unique_shorthands: Set<number>
	#total_prefixed = 0
	#unique_prefixed: Set<number>
	#total_browserhack = 0
	#unique_browserhacks: Set<number>

	constructor() {
		this.#locations = new LocationList()
		this.#unique = new UniqueValueList<string>()
		this.#complexities_and_flags = new AutoSizeUintArray(undefined, Uint8Array)
		this.#unique_customs = new Set()
		this.#unique_shorthands = new Set()
		this.#unique_prefixed = new Set()
		this.#unique_browserhacks = new Set()
	}

	add(line: number, column: number, start: number, end: number, hash: number, complexity: number, is_custom: boolean, is_shorthand: boolean, is_prefixed: boolean, is_browserhack: boolean, property: string) {
		let location_index = this.#locations.add(line, column, start, end)
		this.#unique.add(property, location_index)
		this.#complexities_and_flags.set(location_index, pack(is_custom, is_shorthand, is_prefixed, is_browserhack, complexity))

		if (is_custom) {
			this.#total_custom++
			this.#unique_customs.add(hash)
		}
		if (is_shorthand) {
			this.#total_shorthand++
			this.#unique_shorthands.add(hash)
		}
		if (is_prefixed) {
			this.#total_prefixed++
			this.#unique_prefixed.add(hash)
		}
		if (is_browserhack) {
			this.#total_browserhack++
			this.#unique_browserhacks.add(hash)
		}

		this.#size++
	}

	get total() {
		return this.#size
	}

	get total_unique() {
		return this.#unique.total_unique
	}

	get uniqueness_ratio() {
		return this.total_unique === 0 ? 0 : this.total_unique / this.total
	}

	*get_unique(limit: number = Infinity) {
		let unique = this.#unique
		for (let { value, count, location_indexes } of unique.desc(limit)) {
			let locations = this.#locations
			let complexities_and_flags = this.#complexities_and_flags.at(location_indexes.at(0))
			yield {
				value,
				count,
				get locations() {
					return location_indexes.map(location_index => locations.at(location_index))
				},
				is_custom: unpack_is_custom(complexities_and_flags),
				is_shorthand: unpack_is_shorthand(complexities_and_flags),
				is_prefixed: unpack_is_prefixed(complexities_and_flags),
				is_browserhack: unpack_is_browserhack(complexities_and_flags),
				complexity: unpack_complexity(complexities_and_flags)
			}
		}
	}
}