/**
 * Find the mode (most occurring value) in an array of Numbers
 * Takes the mean/average of multiple values if multiple values occur the same amount of times.
 *
 * @see https://github.com/angus-c/just/blob/684af9ca0c7808bc78543ec89379b1fdfce502b1/packages/array-mode/index.js
 * @param arr - Array to find the mode value for
 * @returns mode - The `mode` value of `arr`
 */
function Mode(arr: unknown[]): number {
	let frequencies = new Map()
	let maxOccurrences = -1
	let maxOccurenceCount = 0
	let sum = 0
	let len = arr.length

	for (let i = 0; i < len; i++) {
		let element = arr[i]
		let updatedCount = (frequencies.get(element) || 0) + 1
		frequencies.set(element, updatedCount)

		if (updatedCount > maxOccurrences) {
			maxOccurrences = updatedCount
			maxOccurenceCount = 0
			sum = 0
		}

		if (updatedCount >= maxOccurrences) {
			maxOccurenceCount++
			// @ts-expect-error TODO: fix this
			sum += element
		}
	}

	return sum / maxOccurenceCount
}

export class AggregateCollection {
	#items: number[]
	#sum: number

	constructor() {
		this.#items = []
		this.#sum = 0
	}

	/**
	 * Add a new Integer at the end of this AggregateCollection
	 * @param item - The item to add
	 */
	push(item: number) {
		this.#items.push(item)
		this.#sum += item
	}

	size() {
		return this.#items.length
	}

	aggregate() {
		let len = this.#items.length

		if (len === 0) {
			return {
				min: 0,
				max: 0,
				mean: 0,
				mode: 0,
				range: 0,
				sum: 0,
			}
		}

		// TODO: can we avoid this sort()? It's slow
		let sorted = this.#items.slice().sort((a, b) => a - b)
		let min = sorted[0]!
		let max = sorted[len - 1]!

		let mode = Mode(sorted)
		let sum = this.#sum

		return {
			min,
			max,
			mean: sum / len,
			mode,
			range: max - min,
			sum: sum,
		}
	}

	toArray() {
		return this.#items
	}
}
