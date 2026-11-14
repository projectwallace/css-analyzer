import { create_counter } from '../engine/counter.ts'
import { define_collector } from '../engine/define-collector.ts'
import type { Counter } from '../engine/counter.ts'
import type {
	CollectorDef,
	CollectorInstance,
	CountOptions,
	CountItem,
	CountResult,
	DeclarationContext,
} from '../engine/types.ts'

export type Normalize = 'lowercase' | 'none'

// Most collectors just count strings: this wires a counter to a handler set
// and returns the standard count result.
export function define_counting_collector<T extends CountItem = string>(
	options: CountOptions,
	setup: (counter: Counter<T>) => Omit<CollectorInstance<CountResult<T>>, 'result'>,
): CollectorDef<CountResult<T>> {
	return define_collector<CountResult<T>>(function init() {
		const counter = create_counter<T>(options)
		return { ...setup(counter), result: () => counter.result() }
	})
}

/** Options for counters that only need counts (sequences are for numeric series) */
export function without_sequence(options: CountOptions): CountOptions {
	return { locations: options.locations }
}

/** The property to count under, following the `property` option of context collectors */
export function get_context_property(
	ctx: DeclarationContext,
	mode: 'normalized' | 'as_written' | undefined,
): string {
	return mode === 'as_written' ? ctx.raw_property : ctx.property
}
