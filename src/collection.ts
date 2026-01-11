export type Location = {
	line: number
	column: number
	offset: number
	length: number
}

export type UniqueWithLocations = Record<string, Location[]>

export type CollectionCount<WithLocations extends boolean = false> = {
	total: number
	totalUnique: number
	unique: Record<string, number>
	uniquenessRatio: number
} & (WithLocations extends true ? { uniqueWithLocations: UniqueWithLocations } : { uniqueWithLocations?: undefined })

export class Collection<UseLocations extends boolean = false> {
	#items: Map<string | number, number[]>
	#total: number
	#nodes: number[] = []
	#useLocations: UseLocations

	constructor(useLocations: UseLocations = false as UseLocations) {
		this.#items = new Map()
		this.#total = 0

		if (useLocations) {
			this.#nodes = []
		}

		this.#useLocations = useLocations
	}

	p(item: string | number, node_location: Location) {
		let index = this.#total

		if (this.#useLocations) {
			let position = index * 4

			this.#nodes[position] = node_location.line
			this.#nodes[position + 1] = node_location.column
			this.#nodes[position + 2] = node_location.offset
			this.#nodes[position + 3] = node_location.length
		}

		if (this.#items.has(item)) {
			let list = this.#items.get(item)!
			list.push(index)
			this.#total++
			return
		}

		this.#items.set(item, [index])
		this.#total++
	}

	size() {
		return this.#total
	}

	c(): CollectionCount<UseLocations> {
		let uniqueWithLocations: Map<string | number, Location[]> = new Map()
		let unique: Record<string, number> = {}
		let useLocations = this.#useLocations
		let items = this.#items
		let _nodes = this.#nodes
		let size = items.size

		items.forEach((list, key) => {
			if (useLocations) {
				let nodes = list.map(function (index) {
					let position = index * 4
					return {
						line: _nodes[position]!,
						column: _nodes[position + 1]!,
						offset: _nodes[position + 2]!,
						length: _nodes[position + 3]!,
					}
				})
				uniqueWithLocations.set(key, nodes)
			} else {
				unique[key] = list.length
			}
		})

		let total = this.#total

		if (useLocations) {
			return {
				total,
				totalUnique: size,
				unique,
				uniquenessRatio: total === 0 ? 0 : size / total,
				uniqueWithLocations: Object.fromEntries(uniqueWithLocations),
			} as unknown as CollectionCount<UseLocations>
		}

		return {
			total,
			totalUnique: size,
			unique,
			uniquenessRatio: total === 0 ? 0 : size / total,
			uniqueWithLocations: undefined,
		} as unknown as CollectionCount<UseLocations>
	}
}
