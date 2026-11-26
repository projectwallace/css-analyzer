import type { CollectorDef, CountOptions, CountResult } from '../engine/types.ts'
import { create_counter } from '../engine/counter.ts'
import { define_collector } from '../engine/define-collector.ts'
import { DefinedUsed, type DefinedUsedResult } from '../utils/collections/defined-used.ts'
import { extract_mixins } from '../extract/mixins.ts'
import { without_sequence } from './shared.ts'

export type MixinsResult = CountResult & DefinedUsedResult

/** Mixins defined by `@mixin` (counted) and used by `@apply` */
export function mixins(options: CountOptions = {}): CollectorDef<MixinsResult> {
	return define_collector<MixinsResult>(function init() {
		const counter = create_counter(without_sequence(options))
		const tracking = new DefinedUsed()
		return {
			atrule(node) {
				for (const { name, kind } of extract_mixins(node)) {
					if (kind === 'definition') {
						counter.add(name, node)
						tracking.define(name)
					} else {
						tracking.use(name)
					}
				}
			},
			result: () => ({ ...counter.result(), ...tracking.analyze() }),
		}
	})
}
