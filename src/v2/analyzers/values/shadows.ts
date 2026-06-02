import { NODE_TYPES, is_declaration, type AnyNode, type Declaration } from '@projectwallace/css-parser'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../../internals/count-collection.js'
import type { AnalyzerInstance } from '../../core.js'

export type ShadowsOptions = { locations?: boolean }

export type ShadowsResult = {
	textShadows: CountResult | CountResultWithLocations
	boxShadows: CountResult | CountResultWithLocations
}

export function shadows(options: ShadowsOptions = {}): AnalyzerInstance<ShadowsResult> {
	const withLocations = options.locations === true
	const text = new CountCollection(withLocations)
	const box = new CountCollection(withLocations)

	return {
		subscribes: [NODE_TYPES.DECLARATION],
		visit(node: AnyNode): void {
			if (!is_declaration(node)) return
			const decl = node as Declaration
			if (!decl.value) return
			const prop = decl.property.toLowerCase()
			const vl = decl.value
			if (prop === 'text-shadow') {
				text.add(vl.text, vl.line, vl.column, vl.start, vl.length)
			} else if (prop === 'box-shadow') {
				box.add(vl.text, vl.line, vl.column, vl.start, vl.length)
			}
		},
		collect(): ShadowsResult {
			return { textShadows: text.collect(), boxShadows: box.collect() }
		},
	}
}
