import { FUNCTION } from '@projectwallace/css-parser'
import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { create_counter } from '../engine/counter.ts'
import { define_collector } from '../engine/define-collector.ts'
import { DefinedUsed, type DefinedUsedResult } from '../utils/collections/defined-used.ts'
import { extract_functions, get_function_usage } from '../extract/functions.ts'
import { without_sequence } from './shared.ts'

export type FunctionsResult = CountResult & DefinedUsedResult

/** Custom functions defined by `@function` (counted) and used as `--name()` in values */
export function functions(options: CountOptions = {}): CollectorDef<FunctionsResult> {
	return define_collector<FunctionsResult>(function init() {
		const counter = create_counter(without_sequence(options))
		const tracking = new DefinedUsed()
		return {
			parse: { values: true },
			atrule(node) {
				for (const { name } of extract_functions(node)) {
					counter.add(name, node)
					tracking.define(name)
				}
			},
			value: {
				types: [FUNCTION],
				enter(node) {
					const usage = get_function_usage(node)
					if (usage) {
						tracking.use(usage.name)
					}
				},
			},
			result: () => ({ ...counter.result(), ...tracking.analyze() }),
		}
	})
}
