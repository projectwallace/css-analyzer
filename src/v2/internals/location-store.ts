// Flat Uint32Array, 4 slots per location: [line, col, offset, length].
// One LocationStore per unique value in a CountCollection; or a single store
// for ordered samples in a NumericCollection.

export type Location = {
	line: number
	column: number
	offset: number
	length: number
}

export class LocationStore {
	private data: Uint32Array
	private n: number

	constructor(initialCapacity = 8) {
		this.data = new Uint32Array(initialCapacity * 4)
		this.n = 0
	}

	push(line: number, column: number, offset: number, length: number): void {
		const need = this.n + 4
		if (need > this.data.length) {
			let cap = this.data.length
			while (cap < need) cap *= 2
			const next = new Uint32Array(cap)
			next.set(this.data)
			this.data = next
		}
		this.data[this.n] = line
		this.data[this.n + 1] = column
		this.data[this.n + 2] = offset
		this.data[this.n + 3] = length
		this.n += 4
	}

	get count(): number {
		return this.n >>> 2
	}

	toArray(): Location[] {
		const out: Location[] = new Array(this.count)
		for (let i = 0, j = 0; i < this.n; i += 4, j++) {
			out[j] = {
				line: this.data[i]!,
				column: this.data[i + 1]!,
				offset: this.data[i + 2]!,
				length: this.data[i + 3]!,
			}
		}
		return out
	}
}
