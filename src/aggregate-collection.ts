export class AggregateCollection {
	#min: number
	#max: number
	#sum: number
	#count: number
	#frequencies: Map<number, number>
	#items: number[] | null

	constructor(samples = false) {
		this.#min = Infinity
		this.#max = -Infinity
		this.#sum = 0
		this.#count = 0
		this.#frequencies = new Map()
		this.#items = samples ? [] : null
	}

	/**
	 * Add a new Integer at the end of this AggregateCollection
	 * @param item - The item to add
	 */
	push(item: number) {
		this.#sum += item
		this.#count++
		if (item < this.#min) this.#min = item
		if (item > this.#max) this.#max = item

		let freq = (this.#frequencies.get(item) || 0) + 1
		this.#frequencies.set(item, freq)

		if (this.#items !== null) {
			this.#items.push(item)
		}
	}

	size() {
		return this.#count
	}

	aggregate() {
		let len = this.#count

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

		// Find max frequency for mode calculation — O(k) where k = unique values
		let maxFreq = 0
		for (let freq of this.#frequencies.values()) {
			if (freq > maxFreq) maxFreq = freq
		}

		// Average of all values with max frequency (matches prior behavior)
		let modeSum = 0
		let modeCount = 0
		for (let [val, freq] of this.#frequencies) {
			if (freq === maxFreq) {
				modeSum += val
				modeCount++
			}
		}

		let min = this.#min
		let max = this.#max

		return {
			min,
			max,
			mean: this.#sum / len,
			mode: modeSum / modeCount,
			range: max - min,
			sum: this.#sum,
		}
	}

	toArray(): number[] {
		return this.#items ?? []
	}
}
