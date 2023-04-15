export class Collection {
	constructor() {
		/** @type {Map<string, Array<Number>>} */
		this._items = new Map()
		this._total = 0
		this.node_lines = []
		this.node_columns = []
		this.node_lenghts = []
		this.node_offsets = []
	}

	/**
	 * @param {string} item
	 * @param {import('css-tree').CssLocation} node_location
	 */
	push(item, node_location) {
		let index = this._totalq
		this.node_lines[index] = node_location.start.line
		this.node_columns[index] = node_location.start.column
		this.node_offsets[index] = node_location.start.offset
		this.node_lenghts[index] = node_location.end.offset - node_location.start.offset

		if (this._items.has(item)) {
			/** @type number[] */
			let list = this._items.get(item)
			list.push(index)
			// this._items.set(item, list)
			this._total++
			return
		}

		this._items.set(item, [index])
		this._total++
	}

	size() {
		return this._total
	}

	count() {
		let items = new Map()
		let unique = {}
		this._items.forEach((list, key) => {
			let nodes = list.map(index => ({
				line: this.node_lines[index],
				column: this.node_columns[index],
				offset: this.node_offsets[index],
				length: this.node_lenghts[index],
			}))
			items.set(key, nodes)
			unique[key] = list.length
		})

		return {
			total: this._total,
			totalUnique: this._items.size,
			// unique: Object.fromEntries(this._items),
			unique,
			uniquenessRatio: this._total === 0 ? 0 : this._items.size / this._total,
			// __unstable__itemsWithLocations: Object.fromEntries(items),
		}
	}
}
