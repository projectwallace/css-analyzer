// Composable analysis pipeline.
//
// Each analyzer declares which AST node types it subscribes to. The pipeline
// parses once, walks once, and dispatches each visited node to subscribed
// analyzers via a precomputed table keyed on the numeric node type.

import { parse, walk, type AnyNode } from '@projectwallace/css-parser'

export interface AnalyzerInstance<TResult> {
	readonly subscribes: readonly number[]
	/** Called with the raw CSS string before the AST walk. Use for string-level metrics. */
	prepare?(css: string): void
	visit(node: AnyNode): void
	collect(): TResult
}

type Results<T extends Record<string, AnalyzerInstance<unknown>>> = {
	[K in keyof T]: ReturnType<T[K]['collect']>
}

export function createPipeline<T extends Record<string, AnalyzerInstance<unknown>>>(analyzers: T) {
	// Precompute dispatch: node type → analyzers interested in it.
	// Using a Map<number, Instance[]> keeps the hot loop branch-free per node.
	const dispatch = new Map<number, AnalyzerInstance<unknown>[]>()
	for (const key in analyzers) {
		const inst = analyzers[key]!
		for (const nt of inst.subscribes) {
			let bucket = dispatch.get(nt)
			if (!bucket) {
				bucket = []
				dispatch.set(nt, bucket)
			}
			bucket.push(inst)
		}
	}

	// Collect analyzers that have a prepare() hook so we can call them once.
	const prepareList: AnalyzerInstance<unknown>[] = []
	for (const key in analyzers) {
		if (analyzers[key]!.prepare) prepareList.push(analyzers[key]!)
	}

	return {
		run(css: string): Results<T> {
			for (let i = 0; i < prepareList.length; i++) prepareList[i]!.prepare!(css)

			const ast = parse(css)
			walk(ast, (node) => {
				const handlers = dispatch.get(node.type)
				if (handlers !== undefined) {
					for (let i = 0; i < handlers.length; i++) handlers[i]!.visit(node)
				}
			})

			const out = {} as Results<T>
			for (const key in analyzers) {
				;(out as Record<string, unknown>)[key] = analyzers[key]!.collect()
			}
			return out
		},
	}
}
