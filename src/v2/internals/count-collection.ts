// Counts unique string values, optionally with locations.
//
// Internals:
// - StringInterner assigns dense integer IDs to strings.
// - GrowableUint32Array stores per-ID counts, indexed by ID.
// - Optional Map<id, LocationStore> stores ordered locations per unique value.
//
// This avoids the heap-object-per-occurrence cost of Map<string, number[]>
// with per-occurrence {line, col, ...} objects.

import { StringInterner } from './string-interner.js'
import { GrowableUint32Array } from './growable-u32.js'
import { LocationStore, type Location } from './location-store.js'

export type CountResult = {
	total: number
	totalUnique: number
	uniquenessRatio: number
	unique: Record<string, number>
}

export type CountResultWithLocations = CountResult & {
	uniqueWithLocations: Record<string, Location[]>
}

export class CountCollection {
	private interner = new StringInterner()
	private counts = new GrowableUint32Array(32)
	private locs: Map<number, LocationStore> | null
	private totalCount = 0

	constructor(withLocations: boolean) {
		this.locs = withLocations ? new Map() : null
	}

	add(value: string, line: number, column: number, offset: number, length: number): void {
		const id = this.interner.intern(value)
		this.counts.increment(id)
		this.totalCount++

		if (this.locs !== null) {
			let store = this.locs.get(id)
			if (!store) {
				store = new LocationStore()
				this.locs.set(id, store)
			}
			store.push(line, column, offset, length)
		}
	}

	collect(): CountResult | CountResultWithLocations {
		const unique: Record<string, number> = {}
		for (const [str, id] of this.interner.entries()) {
			unique[str] = this.counts.get(id)
		}

		const base: CountResult = {
			total: this.totalCount,
			totalUnique: this.interner.size,
			uniquenessRatio: this.totalCount === 0 ? 0 : this.interner.size / this.totalCount,
			unique,
		}

		if (this.locs === null) return base

		const uniqueWithLocations: Record<string, Location[]> = {}
		for (const [id, store] of this.locs) {
			uniqueWithLocations[this.interner.get(id)] = store.toArray()
		}
		return { ...base, uniqueWithLocations }
	}
}
