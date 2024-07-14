export class Collection {
	constructor() {
		/** @type {Map<string, number[]>} */
		this._items = new Map()
		this._total = 0
		/** @type {number[]} */
		this._nodes = []
	}

	/**
	 * @param {string} item
	 * @param {import('css-tree').CssLocation} node_location
	 */
	p(item, node_location) {
		let index = this._total

		let start = node_location.start
		let start_offset = start.offset
		let position = index * 4

		this._nodes[position] = start.line
		this._nodes[position + 1] = start.column
		this._nodes[position + 2] = start_offset
		this._nodes[position + 3] = node_location.end.offset - start_offset

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
	 * @returns {{
	 * 	total: number;
	 * 	totalUnique: number;
	 * 	uniquenessRatio: number;
	 * 	locations: Record<string, CssLocation[]>;
	 * }}
	 */
	c() {
		/** @type {Map<string, CssLocation[]>} */
		let uniqueWithLocations = new Map()
		let items = this._items
		let _nodes = this._nodes
		let size = items.size

		items.forEach((list, key) => {
			let nodes = list.map(function (index) {
				let position = index * 4
				/** @type {CssLocation} */
				return {
					line: _nodes[position],
					column: _nodes[position + 1],
					offset: _nodes[position + 2],
					length: _nodes[position + 3],
				}
			})
			uniqueWithLocations.set(key, nodes)
		})

		let total = this._total

		return {
			total,
			totalUnique: size,
			uniquenessRatio: total === 0 ? 0 : size / total,
			locations: Object.fromEntries(uniqueWithLocations)
		}
	}
}
