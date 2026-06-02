export type DefinedUsedResult = {
	defined: string[]
	used: string[]
	unused: string[]
	unknown: string[]
}

export class DefinedUsed {
	#defined = new Set<string>()
	#used = new Set<string>()

	define(name: string): void {
		this.#defined.add(name)
	}

	use(name: string): void {
		this.#used.add(name)
	}

	analyze(): DefinedUsedResult {
		let defined = [...this.#defined]
		let used = [...this.#used]
		let usedSet = this.#used
		let definedSet = this.#defined
		return {
			defined,
			used,
			unused: defined.filter((n) => !usedSet.has(n)),
			unknown: used.filter((n) => !definedSet.has(n)),
		}
	}
}
