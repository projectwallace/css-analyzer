import type { Location } from './collection.js'

export type TransferResult = {
	/** Compact JSON string of the main metrics */
	json: string
	/**
	 * Flat array of location tuples encoded as [line, column, offset, length, ...].
	 * Each group of 4 numbers is one Location.
	 * Can be transferred zero-copy via postMessage as a transferable.
	 */
	locationBuffer: Uint32Array | null
	/** Mapping from index in locationBuffer (divided by 4) to metric key + value */
	locationIndex: Array<{ key: string; value: string }> | null
}

/**
 * Packages an analysis result for efficient postMessage transfer.
 *
 * Usage:
 * ```ts
 * const { json, locationBuffer } = transfer(result)
 * worker.postMessage({ json, locationBuffer }, locationBuffer ? [locationBuffer.buffer] : [])
 * ```
 */
export function transfer(result: Record<string, unknown>): TransferResult {
	// Extract locations map if present
	let locationsMap = result.locations as Record<string, Record<string, Location[]>> | undefined

	// Clone result without the locations field for the compact JSON
	let mainResult: Record<string, unknown> = {}
	for (let key of Object.keys(result)) {
		if (key !== 'locations') {
			mainResult[key] = result[key]
		}
	}

	if (!locationsMap) {
		return {
			json: JSON.stringify(mainResult),
			locationBuffer: null,
			locationIndex: null,
		}
	}

	// Pack location data into a flat Uint32Array for zero-copy transfer
	let locationIndex: Array<{ key: string; value: string }> = []
	let tuples: number[] = []

	for (let [metricKey, valueMap] of Object.entries(locationsMap)) {
		for (let [value, locs] of Object.entries(valueMap)) {
			for (let loc of locs) {
				locationIndex.push({ key: metricKey, value })
				tuples.push(loc.line, loc.column, loc.offset, loc.length)
			}
		}
	}

	return {
		json: JSON.stringify(mainResult),
		locationBuffer: tuples.length > 0 ? new Uint32Array(tuples) : null,
		locationIndex: locationIndex.length > 0 ? locationIndex : null,
	}
}
