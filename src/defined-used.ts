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
		let defined: string[] = []
		let unused: string[] = []
		let used: string[] = []
		let unknown: string[] = []
		for (let name of this.#defined) {
			defined.push(name)
			if (!this.#used.has(name)) unused.push(name)
		}
		for (let name of this.#used) {
			used.push(name)
			if (!this.#defined.has(name)) unknown.push(name)
		}
		return { defined, used, unused, unknown }
	}
}
