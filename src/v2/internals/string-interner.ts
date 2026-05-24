// Maps strings to dense integer IDs. One per analyzer instance, so IDs are
// contiguous from 0 and can index directly into a parallel Uint32Array.

export class StringInterner {
	private map = new Map<string, number>()
	private strings: string[] = []

	intern(s: string): number {
		let id = this.map.get(s)
		if (id === undefined) {
			id = this.strings.length
			this.strings.push(s)
			this.map.set(s, id)
		}
		return id
	}

	get(id: number): string {
		return this.strings[id]!
	}

	get size(): number {
		return this.strings.length
	}

	entries(): IterableIterator<[string, number]> {
		return this.map.entries()
	}
}
