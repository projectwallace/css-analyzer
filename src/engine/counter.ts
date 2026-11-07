import type {
	ContextCountResult,
	CountEntry,
	CountOptions,
	CountResult,
	LocationSource,
} from './types.js'

export type Counter = {
	/** Count `item`. Pass the context (or `ctx.at(node)`); its location is only read if locations are enabled. */
	add(item: string, at: LocationSource): void
	result(): CountResult
}

export type ContextCounter = {
	add(item: string, context: string, at: LocationSource): void
	result(): ContextCountResult
}

function add_to(
	map: Map<string, CountEntry>,
	item: string,
	at: LocationSource,
	locations: boolean,
): void {
	const entry = map.get(item)
	if (entry) {
		entry.count++
		if (locations) entry.locations!.push(at.loc)
		return
	}
	map.set(item, locations ? { count: 1, locations: [at.loc] } : { count: 1 })
}

function to_result(map: Map<string, CountEntry>, total: number): CountResult {
	// Copy so that results stay stable if more input is added afterwards
	const unique = new Map<string, CountEntry>()
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

export function create_counter(options: CountOptions = {}): Counter {
	const locations = options.locations === true
	const map = new Map<string, CountEntry>()
	let total = 0

	function add(item: string, at: LocationSource): void {
		total++
		add_to(map, item, at, locations)
	}

	function result(): CountResult {
		return to_result(map, total)
	}

	return { add, result }
}

export function create_context_counter(options: CountOptions = {}): ContextCounter {
	const locations = options.locations === true
	const map = new Map<string, CountEntry>()
	const contexts = new Map<string, { map: Map<string, CountEntry>; total: number }>()
	let total = 0

	function add(item: string, context: string, at: LocationSource): void {
		total++
		add_to(map, item, at, locations)
		let scoped = contexts.get(context)
		if (!scoped) {
			scoped = { map: new Map(), total: 0 }
			contexts.set(context, scoped)
		}
		scoped.total++
		add_to(scoped.map, item, at, locations)
	}

	function result(): ContextCountResult {
		const by_context = new Map<string, CountResult>()
		for (const [context, scoped] of contexts) {
			by_context.set(context, to_result(scoped.map, scoped.total))
		}
		return { ...to_result(map, total), by_context }
	}

	return { add, result }
}

export function merge_counts(a: CountResult, b: CountResult): CountResult {
	const unique = new Map<string, CountEntry>()
	for (const source of [a.unique, b.unique]) {
		for (const [item, entry] of source) {
			const existing = unique.get(item)
			if (!existing) {
				unique.set(
					item,
					entry.locations
						? { count: entry.count, locations: entry.locations.slice() }
						: { count: entry.count },
				)
				continue
			}
			existing.count += entry.count
			if (entry.locations) {
				existing.locations = (existing.locations ?? []).concat(entry.locations)
			}
		}
	}
	return { total: a.total + b.total, total_unique: unique.size, unique }
}

export function merge_context_counts(
	a: ContextCountResult,
	b: ContextCountResult,
): ContextCountResult {
	const by_context = new Map<string, CountResult>()
	for (const source of [a.by_context, b.by_context]) {
		for (const [context, counts] of source) {
			const existing = by_context.get(context)
			by_context.set(
				context,
				existing ? merge_counts(existing, counts) : merge_counts(counts, empty()),
			)
		}
	}
	return { ...merge_counts(a, b), by_context }
}

function empty(): CountResult {
	return { total: 0, total_unique: 0, unique: new Map() }
}

/** Derived numbers for a count result. Kept out of the core so unused stats cost nothing. */
export function summarize(counts: CountResult): { uniqueness_ratio: number } {
	return {
		uniqueness_ratio: counts.total === 0 ? 0 : counts.total_unique / counts.total,
	}
}
