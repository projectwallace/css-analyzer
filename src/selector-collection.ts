import { UniqueValueList } from './unique-value-list.js'
import { Specificity } from './specificity.js'
import { LocationList } from './location-list.js'
import { AutoSizeUintArray } from './auto-size-uintarray.js'

/**
 * Packs specificity and complexity into a single Uint32.
 * @param a specificity a
 * @param b specificity b
 * @param c specificity c
 * @param complexity complexity of the selector
 * @returns packed specificity and complexity into a single Uint32
 */
function pack_specificity_and_complexity(a: number, b: number, c: number, complexity: number): number {
	return (complexity << 24) | (a << 16) | (b << 8) | c
}

/**
 * Unpacks specificity from a packed Uint32.
 * Specificity is stored in the last 24, 16, 8 bits of the Uint32.
 */
function unpack_specificity(encoded: number): Specificity {
	let a = (encoded >> 16) & 0xff
	let b = (encoded >> 8) & 0xff
	let c = encoded & 0xff
	return new Specificity(a, b, c)
}

/**
 * Unpacks complexity from a packed Uint32.
 * Complexity is stored in the first 8 bits of the Uint32.
 */
function unpack_complexity(encoded: number): number {
	return (encoded >> 24) & 0xff
}

export class SelectorCollection {
	#size = 0;
	#locations: LocationList;
	#depths: AutoSizeUintArray;
	#specificities_and_complexities: AutoSizeUintArray;
	#prefixed: UniqueValueList<string>;
	#accessibility: UniqueValueList<string>;
	#id: UniqueValueList<string>;
	#pseudos: UniqueValueList<string>;
	#combinators: UniqueValueList<string>;
	#unique: Set<number>;

	constructor() {
		this.#locations = new LocationList()
		this.#depths = new AutoSizeUintArray(undefined, Uint8Array)
		this.#specificities_and_complexities = new AutoSizeUintArray(undefined, Uint32Array)
		this.#prefixed = new UniqueValueList()
		this.#accessibility = new UniqueValueList()
		this.#id = new UniqueValueList()
		this.#pseudos = new UniqueValueList()
		this.#combinators = new UniqueValueList()
		this.#unique = new Set()
	}

	/**
	 * @param line
	 * @param column
	 * @param start
	 * @param end
	 * @param complexity
	 * @param is_prefixed
	 * @param is_accessibility
	 * @param specificity_a
	 * @param specificity_b
	 * @param specificity_c
	 * @param stringify_selector
	 * @param nesting_depth
	 * @param hashed
	 * @param pseudos
	 * @param combinators
	 */
	add(line: number, column: number, start: number, end: number, complexity: number, is_prefixed: boolean, is_accessibility: boolean, specificity_a: number, specificity_b: number, specificity_c: number, stringify_selector: { (): string; }, nesting_depth: number, hashed: number, pseudos: string[] | undefined, combinators: string[] | undefined) {
		let location_index = this.#locations.add(line, column, start, end)

		this.#specificities_and_complexities.push(pack_specificity_and_complexity(specificity_a, specificity_b, specificity_c, complexity))

		if (specificity_a > 0) {
			this.#id.add(stringify_selector(), location_index)
		}
		if (is_accessibility) {
			this.#accessibility.add(stringify_selector(), location_index)
		}
		if (is_prefixed) {
			this.#prefixed.add(stringify_selector(), location_index)
		}

		this.#depths.push(nesting_depth - 1)

		if (pseudos !== undefined) {
			for (let pseudo of pseudos) {
				this.#pseudos.add(pseudo, location_index)
			}
		}

		if (combinators !== undefined) {
			for (let combinator of combinators) {
				this.#combinators.add(combinator, location_index)
			}
		}

		this.#unique.add(hashed)

		this.#size++
	}

	get total() {
		return this.#locations.length
	}

	get total_unique() {
		return this.#unique.size
	}

	get uniqueness_ratio() {
		return this.total === 0 ? 0 : this.total_unique / this.total
	}

	get prefixes() {
		let items = this.#prefixed
		let size = this.total
		let locations = this.#locations

		return {
			total: items.total,
			total_unique: items.total_unique,
			uniqueness_ratio: items.uniqueness_ratio,
			ratio: items.total === 0 ? 0 : items.total / size,
			get_unique: function* () {
				for (let { value, location_indexes } of items) {
					yield {
						value,
						count: location_indexes.length,
						get locations() {
							return location_indexes.map(location_index => locations.at(location_index))
						},
					}
				}
			},
		}
	}

	get accessibility() {
		let items = this.#accessibility
		let size = this.#size
		let locations = this.#locations

		return {
			total: items.total,
			total_unique: items.total_unique,
			uniqueness_ratio: items.uniqueness_ratio,
			ratio: items.total === 0 ? 0 : items.total / size,
			get_unique: function* () {
				for (let { value, location_indexes } of items) {
					yield {
						value,
						count: location_indexes.length,
						get locations() {
							return location_indexes.map(location_index => locations.at(location_index))
						},
					}
				}
			},
		}
	}

	get complexity() {
		let specificities_and_complexities = this.#specificities_and_complexities
		let min = Infinity
		let max = 0
		let sum = 0
		let count_per_complexity = new UniqueValueList<number>()
		let locations = this.#locations

		let index = 0
		for (let encoded of specificities_and_complexities) {
			let complexity = unpack_complexity(encoded)
			count_per_complexity.add(complexity, index)
			sum += complexity

			if (complexity < min) {
				min = complexity
			}
			if (complexity > max) {
				max = complexity
			}
			index++
		}

		return {
			sum,
			max,
			min,
			average: sum === 0 ? 0 : sum / this.total,
			total_unique: count_per_complexity.total_unique,
			uniqueness_ratio: count_per_complexity.uniqueness_ratio,
			get items() {
				return specificities_and_complexities.map(unpack_complexity)
			},
			get_unique: function* () {
				for (let { value, location_indexes } of count_per_complexity) {
					yield {
						value,
						count: location_indexes.length,
						get locations() {
							return location_indexes.map(location_index => locations.at(location_index))
						},
					}
				}
			},
		}
	}

	get specificity() {
		let specificities_and_complexities = this.#specificities_and_complexities
		let min = new Specificity(Infinity, Infinity, Infinity)
		let max = new Specificity(0, 0, 0)
		let sum = new Specificity(0, 0, 0)
		let location_index = 0
		let count_per_specificity = new UniqueValueList<number>()
		let locations = this.#locations

		for (let encoded of specificities_and_complexities) {
			let specificity = unpack_specificity(encoded)

			if (specificity.compare(min) > 0) {
				min = specificity
			}
			else if (specificity.compare(max) < 0) {
				max = specificity
			}

			sum.add(specificity)

			let encoded_specificity = pack_specificity_and_complexity(specificity.at(0), specificity.at(1), specificity.at(2), 0)
			count_per_specificity.add(encoded_specificity, location_index)

			location_index++
		}

		return {
			min,
			max,
			sum,
			get mode() {
				let mode: Specificity | undefined = undefined
				let max_count = 0

				for (let { value, location_indexes } of count_per_specificity) {
					if (location_indexes.length > max_count) {
						mode = unpack_specificity(value)
						max_count = location_indexes.length
					}
				}
				return mode
			},
			*get_unique() {
				for (let { value, location_indexes } of count_per_specificity) {
					yield {
						specificity: unpack_specificity(value),
						count: location_indexes.length,
						get locations() {
							return location_indexes.map(location_index => locations.at(location_index))
						}
					}
				}
			}
		}
	}

	get nesting() {
		let depths = this.#depths
		let min = Infinity
		let max = 0
		let sum = 0
		let count_per_depth = new UniqueValueList<number>()
		let locations = this.#locations

		let index = 0
		for (let depth of depths) {
			count_per_depth.add(depth, index)
			sum += depth
			if (depth < min) {
				min = depth
			}
			if (depth > max) {
				max = depth
			}
			index++
		}

		return {
			sum,
			max,
			min,
			average: sum === 0 ? 0 : sum / this.total,
			total_unique: count_per_depth.total_unique,
			uniqueness_ratio: count_per_depth.uniqueness_ratio,
			items: depths,
			unique: function* () {
				for (let { value, location_indexes } of count_per_depth) {
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

	get pseudos() {
		let items = this.#pseudos
		let size = this.total
		let locations = this.#locations

		return {
			total: items.total,
			total_unique: items.total_unique,
			uniqueness_ratio: items.uniqueness_ratio,
			ratio: size === 0 ? 0 : items.total / size,
			get_unique: function* () {
				for (let { value, location_indexes } of items) {
					yield {
						value,
						count: location_indexes.length,
						get locations() {
							return location_indexes.map(location_index => locations.at(location_index))
						},
					}
				}
			},
		}
	}

	get combinators() {
		let items = this.#combinators
		let size = this.total
		let locations = this.#locations

		return {
			total: items.total,
			total_unique: items.total_unique,
			uniqueness_ratio: items.uniqueness_ratio,
			ratio: size === 0 ? 0 : items.total / size,
			get_unique: function* () {
				for (let { value, location_indexes } of items) {
					yield {
						value,
						count: location_indexes.length,
						get locations() {
							return location_indexes.map(location_index => locations.at(location_index))
						},
					}
				}
			},
		}
	}

	toJSON() {
		return {
			total: this.total,
			total_unique: this.total_unique,
			uniqueness_ratio: this.uniqueness_ratio,
			prefixes: this.prefixes,
			accessibility: this.accessibility,
			complexity: this.complexity,
			specificity: this.specificity,
			nesting: this.nesting,
			pseudos: this.pseudos,
			combinators: this.combinators
		}
	}
}
