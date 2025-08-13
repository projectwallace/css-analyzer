import { LocationList } from './location-list.js'
import { UniqueValueList } from './unique-value-list.js'
import { str_equals, starts_with } from './string-utils.js'
import { AutoSizeUintArray } from './auto-size-uintarray.js'
import { basename } from './vendor-prefix.js'

const IMPORT = 0
const FONT_FACE = 1
const MEDIA = 2
const SUPPORTS = 3
const KEYFRAMES = 4
const CONTAINER = 5
const CHARSET = 6
const LAYER = 7
const PROPERTY = 8

type AtruleName = 'import' | 'font-face' | 'media' | 'supports' | 'keyframes' | 'container' | 'charset' | 'layer' | 'property' | `-${string}-keyframes`
type AtruleType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

const NAMES: Map<AtruleName, AtruleType> = new Map([
	['import', IMPORT],
	['font-face', FONT_FACE],
	['media', MEDIA],
	['supports', SUPPORTS],
	['keyframes', KEYFRAMES],
	['container', CONTAINER],
	['charset', CHARSET],
	['layer', LAYER],
	['property', PROPERTY],
])

function pack(name: number, nesting_depth: number, is_prefixed: boolean, is_browserhack: boolean) {
	// 1 bit for is_prefixed
	// 1 bit for is_browserhack
	// 5 bits for name
	// 5 bits for nesting depth
	return (is_prefixed ? 1 : 0 << 11) |
		(is_browserhack ? 1 : 0 << 10) |
		(nesting_depth << 5 & 0b11111) |
		(name & 0b11111)
}

function unpack_name(value: number) {
	return (value & 0b11111)
}

function unpack_nesting_depth(value: number) {
	return (value >> 5 & 0b11111)
}

function unpack_is_browserhack(value: number) {
	return (value >> 10 & 1) === 1
}
function unpack_is_prefixed(value: number) {
	return (value >> 11 & 1) === 1
}

export class AtruleCollection {
	#locations: LocationList
	#items: AutoSizeUintArray

	constructor() {
		this.#locations = new LocationList()
		this.#items = new AutoSizeUintArray(32, Uint16Array)
	}

	add(line: number, column: number, start: number, end: number, nesting_depth: number, atrule_name: AtruleName, is_browserhack: boolean, is_prefixed: boolean) {
		let location_index = this.#locations.add(line, column, start, end)
		// - atrule type (number: font-face=1, media=2, supports, keyframes, container, layer, property, import)
		// - is_prefixed (boolean: -webkit-keyframes=true)
		// - is_browserhack (boolean: )
		// - prelude (string: screen and (min-width: 600px))

		let type = NAMES.get(is_prefixed ? basename(atrule_name) as AtruleName : atrule_name as AtruleName)!
		this.#items.set(location_index, pack(type, nesting_depth, is_prefixed, is_browserhack))
	}

	get total() {
		return 0
	}

	get nesting() {
		// let items = this.#items
		let count_per_depth = new UniqueValueList<number>()
		let locations = this.#locations
		let items = this.#items

		let index = 0
		for (let item of items) {
			count_per_depth.add(unpack_nesting_depth(item), index++)
		}
		let numerics = count_per_depth.numerics

		return {
			total: this.total,
			mode: count_per_depth.mode,
			total_unique: count_per_depth.total_unique,
			uniqueness_ratio: count_per_depth.uniqueness_ratio,
			sum: numerics.sum,
			max: numerics.max,
			min: numerics.min,
			average: numerics.average,
			items: items.map(unpack_nesting_depth),
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

	get import() {
		return {
			total: 0,
			total_unique: 0,
			uniqueness_ratio: 0,
			*unique() { },
		}
	}

	get charset() {
		return {
			total: 0,
			total_unique: 0,
			uniqueness_ratio: 0,
			*unique() { },
		}
	}

	get media() {
		return {
			total: 0,
			total_unique: 0,
			uniqueness_ratio: 0,
			*unique() { },
			browserhacks: {
				total: 0,
				total_unique: 0,
				uniqueness_ratio: 0,
				ratio: 0,
				*unique() { },
			},
			features: {
				total: 0,
				total_unique: 0,
				uniqueness_ratio: 0,
				*unique() { },
			},
		}
	}

	get keyframes() {
		return {
			total: 0,
			total_unique: 0,
			uniqueness_ratio: 0,
			*unique() { },
			prefixed: {
				total: 0,
				total_unique: 0,
				uniqueness_ratio: 0,
				ratio: 0,
				*unique() { },
			},
		}
	}

	get supports() {
		return {
			total: 0,
			total_unique: 0,
			uniqueness_ratio: 0,
			*unique() { },
			browserhacks: {
				total: 0,
				total_unique: 0,
				uniqueness_ratio: 0,
				ratio: 0,
				*unique() { }
			},
			declaration_properties: {
				total: 0,
				total_unique: 0,
				uniqueness_ratio: 0,
				*unique() { },
			},
		}
	}

	get container() {
		return {
			total: 0,
			total_unique: 0,
			uniqueness_ratio: 0,
			*unique() { },
			names: {
				total: 0,
				total_unique: 0,
				uniqueness_ratio: 0,
				*unique() { },
			},
		}
	}

	get layer() {
		return {
			total: 0,
			total_unique: 0,
			uniqueness_ratio: 0,
			*unique() { }, // reset, components, components.button
			names: {
				total: 0,
				total_unique: 0,
				uniqueness_ratio: 0,
				*unique() { }, // reset, components, button
			},
		}
	}

	get property() {
		return {
			total: 0,
			total_unique: 0,
			uniqueness_ratio: 0,
			*unique() { },
		}
	}
}
