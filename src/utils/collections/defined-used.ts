export type DefinedUsedResult = {
	/** Names that were defined (a custom property declaration, `@keyframes name`, ...) */
	defined: string[]
	/** Names that were used (`var(--x)`, `animation-name: x`, ...) */
	used: string[]
	/** Defined, but never used */
	unused: string[]
	/** Used, but never defined (for example defined in another stylesheet) */
	unknown: string[]
}

/** Tracks which names are defined and which are used: `unused` is defined but never used, `unknown` is used but never defined */
export class DefinedUsed {
	#defined = new Set<string>()
	#used = new Set<string>()
	#unused = new Set<string>()
	#unknown = new Set<string>()

	define(name: string): void {
		if (this.#defined.has(name)) {
			return
		}
		this.#defined.add(name)
		if (this.#used.has(name)) {
			this.#unknown.delete(name)
		} else {
			this.#unused.add(name)
		}
	}

	use(name: string): void {
		if (this.#used.has(name)) {
			return
		}
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
