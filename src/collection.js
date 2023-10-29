export class Collection {
	constructor({ useLocations = false }) {
		/** @type {Map<string, number[]>} */
		this._items = new Map()
		this._total = 0
		/** @type {number[]} */
		this.node_lines = []
		/** @type {number[]} */
		this.node_columns = []
		/** @type {number[]} */
		this.node_lengths = []
		/** @type {number[]} */
		this.node_offsets = []

		/** @type {boolean} */
		this._useLocations = useLocations
	}

	/**
	 * @param {string} item
	 * @param {import('css-tree').CssLocation} node_location
	 */
	push(item, node_location) {
		let index = this._total

		this.node_lines[index] = node_location.start.line
		this.node_columns[index] = node_location.start.column
		this.node_offsets[index] = node_location.start.offset
		this.node_lengths[index] = node_location.end.offset - node_location.start.offset

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
	count() {
		let uniqueWithLocations = new Map()
		let unique = {}
		this._items.forEach((list, key) => {
			let nodes = list.map(index => ({
				line: this.node_lines[index],
				column: this.node_columns[index],
				offset: this.node_offsets[index],
				length: this.node_lengths[index],
			}))
			uniqueWithLocations.set(key, nodes)
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
