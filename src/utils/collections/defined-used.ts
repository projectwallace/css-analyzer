export type DefinedUsedResult = {
	defined: string[]
	used: string[]
	unused: string[]
	unknown: string[]
}

export type DefinedUsedPayloads<T> = {
	definitions: Map<string, T[]>
	usages: Map<string, T[]>
}

/** Tracks defined and used names; payloads come back from `payloads()` */
export class DefinedUsed<T = never> {
	#defined = new Set<string>()
	#used = new Set<string>()
	#unused = new Set<string>()
	#unknown = new Set<string>()
	#definitions = new Map<string, T[]>()
	#usages = new Map<string, T[]>()

	define(name: string, payload?: T): void {
		if (payload !== undefined) {
			push_payload(this.#definitions, name, payload)
		}
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

	use(name: string, payload?: T): void {
		if (payload !== undefined) {
			push_payload(this.#usages, name, payload)
		}
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

	payloads(): DefinedUsedPayloads<T> {
		return {
			definitions: new Map([...this.#definitions].map(([name, list]) => [name, list.slice()])),
			usages: new Map([...this.#usages].map(([name, list]) => [name, list.slice()])),
		}
	}
}

function push_payload<T>(map: Map<string, T[]>, name: string, payload: T): void {
	const list = map.get(name)
	if (list) {
		list.push(payload)
	} else {
		map.set(name, [payload])
	}
}
