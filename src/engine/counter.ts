import type { CSSNode } from '@projectwallace/css-parser'
import type {
	ContextCountOptions,
	CountItem,
	CountMap,
	CountOptions,
	CountResult,
	Location,
} from './types.ts'

/** Where `node` is in the source. `length` overrides the node's length (e.g. only the property name). */
export function to_location(node: CSSNode, length: number = node.length): Location {
	return {
		line: node.line,
		column: node.column,
		offset: node.start,
		length,
	}
}

export type Counter<T extends CountItem = string> = {
	/** Count `item`, found at `node`; the location is only read when locations are enabled */
	add(item: T, node: CSSNode, length?: number): void
	result(): CountResult<T>
}

export type ContextCounter<T extends CountItem = string> = {
	add(item: T, context: string, node: CSSNode, length?: number): void
	/** `by_context` is only there when the counter was created with `{ contexts: true }` */
	result(): CountResult<T> & { by_context?: Map<string, CountResult<T>> }
}

function add_to<T extends CountItem>(
	map: CountMap<T>,
	item: T,
	node: CSSNode,
	length: number | undefined,
	locations: boolean,
): void {
	const entry = map.get(item)
	if (entry) {
		entry.count++
		if (locations) {
			entry.locations!.push(to_location(node, length))
		}
		return
	}
	map.set(item, locations ? { count: 1, locations: [to_location(node, length)] } : { count: 1 })
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

	function add(item: T, node: CSSNode, length?: number): void {
		total++
		sequence?.push(item)
		add_to(map, item, node, length, locations)
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

	function add(item: T, context: string, node: CSSNode, length?: number): void {
		total++
		add_to(map, item, node, length, locations)
		if (!track_contexts) {
			return
		}
		let scoped = contexts.get(context)
		if (!scoped) {
			scoped = { map: new Map(), total: 0 }
			contexts.set(context, scoped)
		}
		scoped.total++
		add_to(scoped.map, item, node, length, locations)
	}

	function result(): CountResult<T> & {
		by_context?: Map<string, CountResult<T>>
	} {
		const counted = to_result(map, total)
		if (!track_contexts) {
			return counted
		}
		const by_context = new Map<string, CountResult<T>>()
		for (const [context, scoped] of contexts) {
			by_context.set(context, to_result(scoped.map, scoped.total))
		}
		return { ...counted, by_context }
	}

	return { add, result }
}

/** Derived numbers for a count result. Kept out of the core so unused stats cost nothing. */
export function summarize(counts: CountResult<CountItem>): {
	uniqueness_ratio: number
} {
	return {
		uniqueness_ratio: counts.total === 0 ? 0 : counts.total_unique / counts.total,
	}
}
