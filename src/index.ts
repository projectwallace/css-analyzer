// The package root is the engine: run collectors and write your own. The built-in collectors live in `/collectors`.
export { analyze } from './engine/analyzer.ts'
export { define_collector } from './engine/define-collector.ts'
export { create_counter, create_context_counter, summarize } from './engine/counter.ts'
export { to_location } from './utils/location.ts'
export { summarize_frequencies, summarize_numbers, type NumberSummary } from './engine/summary.ts'
export type { Counter, ContextCounter } from './engine/counter.ts'
export type {
	CSSNode,
	CollectorDef,
	CollectorInstance,
	CollectorMap,
	Context,
	ContextCountOptions,
	ContextCountResult,
	CountEntry,
	CountItem,
	CountMap,
	CountOptions,
	CountResult,
	DeclarationContext,
	Location,
	Match,
	ParseOptions,
	ResultOf,
	StylesheetContext,
	WithContexts,
} from './engine/types.ts'
