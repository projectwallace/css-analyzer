import type {
	ContextCountOptions,
	ContextCountResult,
	CountItem,
	CountMap,
	CountOptions,
	CountResult,
	LocationSource,
} from './types.ts'

export type Counter<T extends CountItem = string> = {
	/** Count `item`. Pass the context (or `ctx.at(node)`); its location is only read if locations are enabled. */
	add(item: T, at: LocationSource): void
	result(): CountResult<T>
}

export type ContextCounter<T extends CountItem = string> = {
	add(item: T, context: string, at: LocationSource): void
	result(): ContextCountResult<T>
}

function add_to<T extends CountItem>(
	map: CountMap<T>,
	item: T,
	at: LocationSource,
	locations: boolean,
): void {
	const entry = map.get(item)
	if (entry) {
		entry.count++
		if (locations) {
			entry.locations!.push(at.loc)
		}
		return
	}
	map.set(item, locations ? { count: 1, locations: [at.loc] } : { count: 1 })
}

function to_result<T extends CountItem>(map: CountMap<T>, total: number): CountResult<T> {
	// Copy so that results stay stable if more input is added afterwards
	const unique: CountMap<T> = new Map()
	for (const [item, entry] of map) {
		unique.set(
			item,
			entry.locations
				? { count: entry.count, locations: entry.locations.slice() }
				: { count: entry.count },
		)
	}
	return { total, total_unique: unique.size, unique }
}

/** Count strings (the default) or numbers: `create_counter<number>()` */
export function create_counter<T extends CountItem = string>(
	options: CountOptions = {},
): Counter<T> {
	const locations = options.locations === true
	const sequence: T[] | undefined = options.sequence === true ? [] : undefined
	const map: CountMap<T> = new Map()
	let total = 0

	function add(item: T, at: LocationSource): void {
		total++
		sequence?.push(item)
		add_to(map, item, at, locations)
	}

	function result(): CountResult<T> {
		const counted = to_result(map, total)
		if (sequence) {
			counted.sequence = sequence.slice()
		}
		return counted
	}

	return { add, result }
}

export function create_context_counter<T extends CountItem = string>(
	options: ContextCountOptions = {},
): ContextCounter<T> {
	const locations = options.locations === true
	const track_contexts = options.contexts === true
	const map: CountMap<T> = new Map()
	const contexts = new Map<string, { map: CountMap<T>; total: number }>()
	let total = 0

	function add(item: T, context: string, at: LocationSource): void {
		total++
		add_to(map, item, at, locations)
		if (!track_contexts) {
			return
		}
		let scoped = contexts.get(context)
		if (!scoped) {
			scoped = { map: new Map(), total: 0 }
			contexts.set(context, scoped)
		}
		scoped.total++
		add_to(scoped.map, item, at, locations)
	}

	function result(): ContextCountResult<T> {
		const by_context = new Map<string, CountResult<T>>()
		for (const [context, scoped] of contexts) {
			by_context.set(context, to_result(scoped.map, scoped.total))
		}
		return { ...to_result(map, total), by_context }
	}

	return { add, result }
}

/** Derived numbers for a count result. Kept out of the core so unused stats cost nothing. */
export function summarize(counts: CountResult<CountItem>): { uniqueness_ratio: number } {
	return {
		uniqueness_ratio: counts.total === 0 ? 0 : counts.total_unique / counts.total,
	}
}
