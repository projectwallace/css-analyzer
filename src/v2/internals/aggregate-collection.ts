// Aggregate statistics over a stream of numbers.
// Values are buffered in a GrowableUint32Array; statistics are computed at collect() time.

import { GrowableUint32Array } from './growable-u32.js'

export type AggregateResult = {
	total: number
	sum: number
	min: number
	max: number
	mean: number
	mode: number
	range: number
	items: number[]
}

function mode(sorted: number[]): number {
	const len = sorted.length
	if (len === 0) return 0
	let maxOccurrences = -1
	let maxCount = 0
	let sum = 0
	const freq = new Map<number, number>()
	for (let i = 0; i < len; i++) {
		const v = sorted[i]!
		const c = (freq.get(v) ?? 0) + 1
		freq.set(v, c)
		if (c > maxOccurrences) {
			maxOccurrences = c
			maxCount = 0
			sum = 0
		}
		if (c >= maxOccurrences) {
			maxCount++
			sum += v
		}
	}
	return sum / maxCount
}

export class AggregateCollection {
	private values = new GrowableUint32Array(64)
	private sumValue = 0

	push(value: number): void {
		this.values.push(value)
		this.sumValue += value
	}

	get total(): number {
		return this.values.length
	}

	collect(): AggregateResult {
		const view = this.values.view()
		const len = view.length
		if (len === 0) {
			return { total: 0, sum: 0, min: 0, max: 0, mean: 0, mode: 0, range: 0, items: [] }
		}

		const items = Array.from(view).sort((a, b) => a - b)
		const min = items[0]!
		const max = items[len - 1]!
		return {
			total: len,
			sum: this.sumValue,
			min,
			max,
			mean: this.sumValue / len,
			mode: mode(items),
			range: max - min,
			items: Array.from(view),
		}
	}
}
