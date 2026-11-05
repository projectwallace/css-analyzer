// Uint32Array that doubles in capacity on demand.

export class GrowableUint32Array {
	private buf: Uint32Array
	private len: number

	constructor(initialCapacity = 64) {
		this.buf = new Uint32Array(initialCapacity)
		this.len = 0
	}

	push(value: number): number {
		const i = this.len
		if (i >= this.buf.length) this.growTo(i + 1)
		this.buf[i] = value
		this.len = i + 1
		return i
	}

	increment(i: number): void {
		if (i >= this.buf.length) this.growTo(i + 1)
		this.buf[i]++
		if (i >= this.len) this.len = i + 1
	}

	get(i: number): number {
		return this.buf[i] ?? 0
	}

	get length(): number {
		return this.len
	}

	// Returns a view into the live buffer up to `len`. Do not retain after further growth.
	view(): Uint32Array {
		return this.buf.subarray(0, this.len)
	}

	private growTo(minLen: number): void {
		let cap = this.buf.length
		while (cap < minLen) cap *= 2
		const next = new Uint32Array(cap)
		next.set(this.buf)
		this.buf = next
	}
}
