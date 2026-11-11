import { test, expect, expectTypeOf } from 'vitest'
import type {
	CollectorDef,
	ContextCountOptions,
	ContextCountResult,
	CountResult,
	ResultOf,
	WithContexts,
} from './types.ts'

type ByContext = { by_context: Map<string, CountResult> }

test('WithContexts: by_context exists exactly when contexts is true', () => {
	expectTypeOf<WithContexts<CountResult, { contexts: true }>>().toEqualTypeOf<
		CountResult & ByContext
	>()
	expectTypeOf<WithContexts<CountResult, { contexts: false }>>().toEqualTypeOf<CountResult>()
	expectTypeOf<WithContexts<CountResult, { contexts: undefined }>>().toEqualTypeOf<CountResult>()
	expectTypeOf<WithContexts<CountResult, {}>>().toEqualTypeOf<CountResult>()
	expectTypeOf<WithContexts<CountResult, { locations: true }>>().toEqualTypeOf<CountResult>()
})

test('WithContexts: by_context is optional when contexts is only known to be a boolean', () => {
	type Result = WithContexts<CountResult, { contexts: boolean }>
	expectTypeOf<Result>().toExtend<CountResult>()
	expectTypeOf<Result>().toExtend<Partial<ByContext>>()
	expectTypeOf<Result['by_context']>().toEqualTypeOf<Map<string, CountResult> | undefined>()
	expectTypeOf<WithContexts<CountResult, ContextCountOptions>>().toEqualTypeOf<Result>()
})

test('ResultOf maps every key of a collector map to the result of its collector', () => {
	type Map = {
		a: CollectorDef<CountResult>
		b: CollectorDef<number>
		c: CollectorDef<ContextCountResult>
	}
	expectTypeOf<ResultOf<Map>>().toEqualTypeOf<{
		a: CountResult
		b: number
		c: ContextCountResult
	}>()
	expectTypeOf<keyof ResultOf<Map>>().toEqualTypeOf<'a' | 'b' | 'c'>()
	expect(true).toBe(true)
})
