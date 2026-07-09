// Records a distribution of unsigned-integer samples (e.g. declarations-per-rule).
//
// Samples are stored in a GrowableUint32Array; locations (the originating node
// per sample) are stored in a parallel LocationStore. Aggregate statistics are
// not computed by this collection — callers should opt into them on top.

import { GrowableUint32Array } from './growable-u32.js'
import { LocationStore, type Location } from './location-store.js'

export type NumericResult = {
	total: number
	sum: number
	items: number[]
}

export type NumericResultWithLocations = NumericResult & {
	itemsWithLocations: Array<{ value: number; location: Location }>
}

export class NumericCollection {
	private values = new GrowableUint32Array(64)
	private locs: LocationStore | null
	private sumValue = 0

	constructor(withLocations: boolean) {
		this.locs = withLocations ? new LocationStore() : null
	}

	push(value: number, line: number, column: number, offset: number, length: number): void {
		this.values.push(value)
		this.sumValue += value
		if (this.locs !== null) {
			this.locs.push(line, column, offset, length)
		}
	}

	collect(): NumericResult | NumericResultWithLocations {
		const view = this.values.view()
		const items: number[] = new Array(view.length)
		for (let i = 0; i < view.length; i++) items[i] = view[i]!

		const base: NumericResult = {
			total: view.length,
			sum: this.sumValue,
			items,
		}

		if (this.locs === null) return base

		const locArray = this.locs.toArray()
		const itemsWithLocations = new Array(view.length) as NumericResultWithLocations['itemsWithLocations']
		for (let i = 0; i < view.length; i++) {
			itemsWithLocations[i] = { value: items[i]!, location: locArray[i]! }
		}
		return { ...base, itemsWithLocations }
	}
}
