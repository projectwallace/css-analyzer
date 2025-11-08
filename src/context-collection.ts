import { Collection, type CollectionCount } from './collection.js'
import type { CssLocationRange } from '@eslint/css-tree'

export class ContextCollection<UseLocations extends boolean = false> {
	#list: Collection<UseLocations>
	#contexts: Map<string, Collection<UseLocations>>
	#useLocations: UseLocations

	constructor(useLocations: UseLocations) {
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
	push(item: string, context: string, node_location: CssLocationRange) {
		this.#list.p(item, node_location)

		if (!this.#contexts.has(context)) {
			this.#contexts.set(context, new Collection(this.#useLocations))
		}

		this.#contexts.get(context)!.p(item, node_location)
	}

	count() {
		let itemsPerContext: Map<string, CollectionCount<UseLocations>> = new Map()

		for (let [context, value] of this.#contexts.entries()) {
			itemsPerContext.set(context, value.c())
		}

		return Object.assign(this.#list.c(), {
			itemsPerContext: Object.fromEntries(itemsPerContext),
		})
	}
}
