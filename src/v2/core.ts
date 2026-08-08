// Composable analysis pipeline.
//
// Each analyzer declares which AST node types it subscribes to. The pipeline
// parses once, walks once, and dispatches each visited node to subscribed
// analyzers via a precomputed table keyed on the numeric node type.
//
// Walk context available to every visit() call:
//   depth      — rule nesting depth (as reported by the parser's walk function)
//   inKeyframes — true when inside a @keyframes / @-webkit-keyframes block

import { parse, walk, is_atrule, type AnyNode, type ParserOptions } from '@projectwallace/css-parser'

export interface WalkContext {
	readonly depth: number
	readonly inKeyframes: boolean
}

export interface AnalyzerInstance<TResult> {
	readonly subscribes: readonly number[]
	/** Called with the raw CSS string before the AST walk. Use for string-level metrics. */
	prepare?(css: string): void
	/** Called for each comment during parsing. */
	on_comment?(info: { length: number }): void
	visit(node: AnyNode, ctx: WalkContext): void
	collect(): TResult
}

type Results<T extends Record<string, AnalyzerInstance<unknown>>> = {
	[K in keyof T]: ReturnType<T[K]['collect']>
}

export function createPipeline<T extends Record<string, AnalyzerInstance<unknown>>>(analyzers: T) {
	// Precompute dispatch: node type → analyzers interested in it.
	const dispatchMap = new Map<number, AnalyzerInstance<unknown>[]>()
	const prepareList: AnalyzerInstance<unknown>[] = []
	const commentList: AnalyzerInstance<unknown>[] = []

	for (const key in analyzers) {
		const inst = analyzers[key]!
		for (const nt of inst.subscribes) {
			let bucket = dispatchMap.get(nt)
			if (!bucket) {
				bucket = []
				dispatchMap.set(nt, bucket)
			}
			bucket.push(inst)
		}
		if (inst.prepare) prepareList.push(inst)
		if (inst.on_comment) commentList.push(inst)
	}

	// Convert Map to flat array keyed by node type (small dense integers → O(1) array access).
	let maxType = 0
	for (const t of dispatchMap.keys()) if (t > maxType) maxType = t
	const dispatch: (AnalyzerInstance<unknown>[] | undefined)[] = new Array(maxType + 1).fill(undefined)
	for (const [t, bucket] of dispatchMap) dispatch[t] = bucket

	return {
		run(css: string): Results<T> {
			for (let i = 0; i < prepareList.length; i++) prepareList[i]!.prepare!(css)

			const parseOptions: ParserOptions =
				commentList.length > 0
					? {
							on_comment(info) {
								for (let i = 0; i < commentList.length; i++) commentList[i]!.on_comment!(info)
							},
						}
					: {}

			const ast = parse(css, parseOptions)

			// Reuse one mutable context object — analyzers read it synchronously and must not retain it.
			const ctx = { depth: 0, inKeyframes: false }
			let keyframesDepth = -1
			walk(ast, (node, depth) => {
				if (keyframesDepth >= 0 && depth <= keyframesDepth) keyframesDepth = -1

				// Only check for @keyframes when not already inside one.
				if (keyframesDepth < 0 && is_atrule(node)) {
					const name = node.name
					if (name) {
						const lc = name.toLowerCase()
						if (lc === 'keyframes' || lc.endsWith('-keyframes')) keyframesDepth = depth
					}
				}

				ctx.depth = depth
				ctx.inKeyframes = keyframesDepth >= 0 && depth > keyframesDepth

				const handlers = dispatch[node.type]
				if (handlers !== undefined) {
					for (let i = 0; i < handlers.length; i++) handlers[i]!.visit(node, ctx as WalkContext)
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
