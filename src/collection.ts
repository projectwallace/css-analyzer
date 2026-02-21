export type Location = {
	line: number
	column: number
	offset: number
	length: number
}

export type UniqueWithLocations = Record<string, Location[]>

export type CollectionCount = {
	total: number
	totalUnique: number
	unique: Record<string, number>
	uniquenessRatio: number
}

export class Collection {
	#items: Map<string | number, number[]>
	#total: number
	#nodes: number[] | null
	#useLocations: boolean

	constructor(useLocations = false) {
		this.#items = new Map()
		this.#total = 0
		this.#nodes = useLocations ? [] : null
		this.#useLocations = useLocations
	}

	p(item: string | number, node_location: Location) {
		let index = this.#total

		if (this.#nodes !== null) {
			let position = index * 4
			this.#nodes[position] = node_location.line
			this.#nodes[position + 1] = node_location.column
			this.#nodes[position + 2] = node_location.offset
			this.#nodes[position + 3] = node_location.length
		}

		if (this.#items.has(item)) {
			this.#items.get(item)!.push(index)
			this.#total++
			return
		}

		this.#items.set(item, [index])
		this.#total++
	}

	size() {
		return this.#total
	}

	/** Returns counts only — never location data */
	c(): CollectionCount {
		let unique: Record<string, number> = {}
		let items = this.#items

		items.forEach((list, key) => {
			unique[key] = list.length
		})

		let total = this.#total
		let size = items.size

		return {
			total,
			totalUnique: size,
			unique,
			uniquenessRatio: total === 0 ? 0 : size / total,
		}
	}

	/** Returns location data per unique value, or undefined when not tracking locations */
	locs(): UniqueWithLocations | undefined {
		if (!this.#useLocations || this.#nodes === null) return undefined

		let result: UniqueWithLocations = {}
		let _nodes = this.#nodes

		this.#items.forEach((list, key) => {
			result[String(key)] = list.map(function (index) {
				let position = index * 4
				return {
					line: _nodes[position]!,
					column: _nodes[position + 1]!,
					offset: _nodes[position + 2]!,
					length: _nodes[position + 3]!,
				}
			})
		})

		return result
	}
}
