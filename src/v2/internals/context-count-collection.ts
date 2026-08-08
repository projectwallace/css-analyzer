// Like CountCollection but also groups items by a "context" string (e.g. property name).
// Used for: colors per property, units per property, font families, border radii per property.

import { StringInterner } from './string-interner.js'
import { GrowableUint32Array } from './growable-u32.js'
import { LocationStore, type Location } from './location-store.js'
import { CountCollection, type CountResult, type CountResultWithLocations } from './count-collection.js'

export type ContextCountResult = CountResult & {
	itemsPerContext: Record<string, CountResult>
}

export type ContextCountResultWithLocations = CountResultWithLocations & {
	itemsPerContext: Record<string, CountResultWithLocations>
}

export class ContextCountCollection {
	private global: CountCollection
	private contexts = new Map<string, CountCollection>()
	private withLocations: boolean

	constructor(withLocations: boolean) {
		this.withLocations = withLocations
		this.global = new CountCollection(withLocations)
	}

	add(
		value: string,
		context: string,
		line: number,
		column: number,
		offset: number,
		length: number,
	): void {
		this.global.add(value, line, column, offset, length)

		let ctx = this.contexts.get(context)
		if (!ctx) {
			ctx = new CountCollection(this.withLocations)
			this.contexts.set(context, ctx)
		}
		ctx.add(value, line, column, offset, length)
	}

	collect(): ContextCountResult | ContextCountResultWithLocations {
		const globalResult = this.global.collect()
		const itemsPerContext: Record<string, CountResult | CountResultWithLocations> = {}
		for (const [ctx, coll] of this.contexts) {
			itemsPerContext[ctx] = coll.collect()
		}
		return { ...globalResult, itemsPerContext } as ContextCountResult | ContextCountResultWithLocations
	}
}
