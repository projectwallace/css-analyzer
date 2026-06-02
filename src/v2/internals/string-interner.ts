// Maps strings to dense integer IDs. One per analyzer instance, so IDs are
// contiguous from 0 and can index directly into a parallel Uint32Array.
// The reverse lookup (id → string) is derived from the Map at collect() time
// rather than maintained as a parallel array.

export class StringInterner {
	private map = new Map<string, number>()
	private count = 0

	intern(s: string): number {
		let id = this.map.get(s)
		if (id === undefined) {
			id = this.count++
			this.map.set(s, id)
		}
		return id
	}

	get size(): number {
		return this.map.size
	}

	entries(): IterableIterator<[string, number]> {
		return this.map.entries()
	}
}
