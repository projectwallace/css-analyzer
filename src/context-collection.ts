import type { CssLocation } from 'css-tree'
import { Collection } from './collection.js'

export class ContextCollection {
	#list: Collection
	#contexts: Map<string, Collection>
	#useLocations: boolean

	constructor(useLocations: boolean) {
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
	push(item: string, context: string, node_location: CssLocation) {
		this.#list.p(item, node_location)

		if (!this.#contexts.has(context)) {
			this.#contexts.set(context, new Collection(this.#useLocations))
		}

		this.#contexts.get(context)!.p(item, node_location)
	}

	count() {
		let itemsPerContext = new Map()

		for (let [context, value] of this.#contexts.entries()) {
			itemsPerContext.set(context, value.c())
		}

		return Object.assign(this.#list.c(), {
			itemsPerContext: Object.fromEntries(itemsPerContext),
		})
	}
}
