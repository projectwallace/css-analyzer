import { Collection, type CollectionCount, type Location, type UniqueWithLocations } from './collection.js'

export class ContextCollection {
	#list: Collection
	#contexts: Map<string, Collection>
	#useLocations: boolean

	constructor(useLocations = false) {
		this.#list = new Collection(useLocations)
		this.#contexts = new Map()
		this.#useLocations = useLocations
	}

	/**
	 * Add an item to this #list's context
	 * @param item Item to push
	 * @param context Context to push Item to
	 * @param node_location
	 */
	push(item: string, context: string, node_location: Location) {
		this.#list.p(item, node_location)

		if (!this.#contexts.has(context)) {
			this.#contexts.set(context, new Collection(this.#useLocations))
		}

		this.#contexts.get(context)!.p(item, node_location)
	}

	count() {
		let itemsPerContext: Map<string, CollectionCount> = new Map()

		for (let [context, value] of this.#contexts.entries()) {
			itemsPerContext.set(context, value.c())
		}

		return Object.assign(this.#list.c(), {
			itemsPerContext: Object.fromEntries(itemsPerContext),
		})
	}

	/** Returns location data for the top-level list, or undefined when not tracking locations */
	locs(): UniqueWithLocations | undefined {
		return this.#list.locs()
	}

	/** Returns location data per context, or undefined when not tracking locations */
	locsPerContext(): Record<string, UniqueWithLocations> | undefined {
		if (!this.#useLocations) return undefined

		let result: Record<string, UniqueWithLocations> = {}
		for (let [context, collection] of this.#contexts.entries()) {
			result[context] = collection.locs() ?? {}
		}
		return result
	}
}
