export type DefinedUsedResult = {
	defined: string[]
	used: string[]
	unused: string[]
	unknown: string[]
}

export class DefinedUsed {
	#defined = new Set<string>()
	#used = new Set<string>()
	#unused = new Set<string>()
	#unknown = new Set<string>()

	define(name: string): void {
		if (this.#defined.has(name)) return
		this.#defined.add(name)
		if (this.#used.has(name)) {
			this.#unknown.delete(name)
		} else {
			this.#unused.add(name)
		}
	}

	use(name: string): void {
		if (this.#used.has(name)) return
		this.#used.add(name)
		if (this.#defined.has(name)) {
			this.#unused.delete(name)
		} else {
			this.#unknown.add(name)
		}
	}

	analyze(): DefinedUsedResult {
		return {
			defined: [...this.#defined],
			used: [...this.#used],
			unused: [...this.#unused],
			unknown: [...this.#unknown],
		}
	}
}
