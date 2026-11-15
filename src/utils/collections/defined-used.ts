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

/** What was passed in with each name, in the order it came: for pointing at every definition and use */
export type DefinedUsedPayloads<T> = {
	definitions: Map<string, T[]>
	usages: Map<string, T[]>
}

/**
 * Tracks which names are defined and which are used: `unused` is defined but never used, `unknown` is
 * used but never defined. Pass a payload (a node, a `Match`) to `define` and `use` to get it back from
 * `payloads()`, for every time the name was defined or used.
 */
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

	/** The payloads per name. Names that were passed without a payload are not in here. */
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
