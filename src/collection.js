export class Collection {
	constructor({ l = false }) {
		/** @type {Map<string, number[]>} */
		this._items = new Map()
		this._total = 0

		if (l) {
			/** @type {number[]} */
			this._node_lines = []
			/** @type {number[]} */
			this._node_columns = []
			/** @type {number[]} */
			this._node_lengths = []
			/** @type {number[]} */
			this._node_offsets = []
		}

		/** @type {boolean} */
		this._useLocations = l
	}

	/**
	 * @param {string} item
	 * @param {import('css-tree').CssLocation} node_location
	 */
	p(item, node_location) {
		let index = this._total

		if (this._useLocations) {
			let start = node_location.start
			let start_offset = start.offset

			this._node_lines[index] = start.line
			this._node_columns[index] = start.column
			this._node_offsets[index] = start_offset
			this._node_lengths[index] = node_location.end.offset - start_offset
		}

		if (this._items.has(item)) {
			/** @type number[] */
			let list = this._items.get(item)
			list.push(index)
			this._total++
			return
		}

		this._items.set(item, [index])
		this._total++
	}

	size() {
		return this._total
	}

	/**
	 * @typedef CssLocation
	 * @property {number} line
	 * @property {number} column
	 * @property {number} offset
	 * @property {number} length
	 *
	 * @returns {{ total: number; totalUnique: number; uniquenessRatio: number; unique: Record<string, number>; __unstable__uniqueWithLocations: Record<string, CssLocation[]>}}
	 */
	c() {
		let useLocations = this._useLocations
		let uniqueWithLocations = new Map()
		let unique = {}
		this._items.forEach((list, key) => {
			if (useLocations) {
				let nodes = list.map(index => ({
					line: this._node_lines[index],
					column: this._node_columns[index],
					offset: this._node_offsets[index],
					length: this._node_lengths[index],
				}))
				uniqueWithLocations.set(key, nodes)
			}
			unique[key] = list.length
		})

		if (this._useLocations) {
			return {
				total: this._total,
				totalUnique: this._items.size,
				unique,
				uniquenessRatio: this._total === 0 ? 0 : this._items.size / this._total,
				__unstable__uniqueWithLocations: Object.fromEntries(uniqueWithLocations),
			}
		}

		return {
			total: this._total,
			totalUnique: this._items.size,
			unique,
			uniquenessRatio: this._total === 0 ? 0 : this._items.size / this._total,
		}
	}
}
