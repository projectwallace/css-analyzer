import { AutoGrowBuffer } from '../auto-grow-buffer.js'

/** @param property {string} */
function is_prefixed(property) {
	if (property.length < 3) return false
	if (property.charCodeAt(0) == 45 && property.charCodeAt(1) != 45) {
		return property.indexOf('-', 2) !== -1
	}
	return false
}

/** @param property {string} */
function is_browserhack(property) {
	let code = property.charCodeAt(0)

	return code === 47 // /
		|| code === 95 // _
		|| code === 43 // +
		|| code === 42 // *
		|| code === 38 // &
		|| code === 36 // $
		|| code === 35 // #
}

/** @param property {string} */
function is_custom(property) {
	if (property.length < 3) return false
	return property.charCodeAt(0) == 45 && property.charCodeAt(1) == 45
}

export class PropertiesCollection {
	constructor() {
		this.total = 0
		this.total_unique = 0
		this.total_custom = 0
		this.total_unique_custom = 0
		this.total_browserhacks = 0
		this.total_unique_browserhacks = 0
		this.total_prefixed = 0
		this.total_unique_prefixed = 0
		/** @type Map<number, AutoGrowBuffer> */
		this.unique = new Map()
	}

	/**
	 *
	 * @param {number} hash
	 * @param {string} property
	 * @param {number} nodeIndex
	 */
	add(hash, property, nodeIndex) {
		this.total++

		let custom = is_custom(property)
		let prefix = is_prefixed(property)
		let hack = !custom && !prefix && is_browserhack(property)
		let value = 0

		if (custom) {
			value += 1 << 1
			this.total_custom++
		}
		if (hack) {
			value += 1 << 2
			this.total_browserhacks++
		}
		if (prefix) {
			value += 1 << 3
			this.total_prefixed++
		}

		let list = this.unique.get(hash)

		if (list) {
			list.push(nodeIndex)
		} else {
			list = new AutoGrowBuffer(2)
			list.push(value)
			list.push(nodeIndex)
			this.total_unique++
			if (custom) this.total_unique_custom++
			if (hack) this.total_unique_browserhacks++
			if (prefix) this.total_unique_prefixed++
		}

		this.unique.set(hash, list)
	}

	/**
	 * @typedef Property
	 * @property {boolean} is_custom
	 * @property {boolean} is_browserhack
	 * @property {boolean} is_prefixed
	 * @property {number} complexity
	 * @property {number} count
	 * @property {Uint32Array} items
	 *
	 * @callback forEachCb
	 * @param {Property} property
	 */
	/** @param {forEachCb} callback */
	forEach(callback) {
		this.unique.forEach((list) => {
			let property = list.at(0)
			let is_custom = property >> 1 === 1
			let is_browserhack = property >> 2 === 1
			let is_prefixed = property >> 3 === 1
			let complexity = 1 + (is_custom ? 1 : 0) + (is_prefixed ? 1 : 0) + (is_browserhack ? 1 : 0)

			callback({
				is_custom,
				is_browserhack,
				is_prefixed,
				complexity,
				count: list.cursor - 1,
				items: list.slice(1, list.cursor),
			})
		})
	}
}
