import {
	NODE_TYPES,
	is_atrule,
	is_declaration,
	type AnyNode,
	type Atrule,
} from '@projectwallace/css-parser'
import type { AnalyzerInstance } from '../core.js'
import type { Location } from '../internals/location-store.js'

export type FontFaceDescriptors = Record<string, string>

export type AtruleFontFacesResult = {
	total: number
	unique: FontFaceDescriptors[]
	uniqueWithLocations?: Array<{ descriptors: FontFaceDescriptors; location: Location }>
}

export type AtruleFontFacesOptions = { locations?: boolean }

export function atruleFontFaces(
	options: AtruleFontFacesOptions = {},
): AnalyzerInstance<AtruleFontFacesResult> {
	const withLocations = options.locations === true
	const items: Array<{ descriptors: FontFaceDescriptors; location: Location }> = []

	return {
		subscribes: [NODE_TYPES.AT_RULE],
		visit(node: AnyNode): void {
			if (!is_atrule(node)) return
			if ((node.name?.toLowerCase() ?? '') !== 'font-face') return
			const n = node as Atrule
			const descriptors: FontFaceDescriptors = Object.create(null)
			for (const child of n.block?.children ?? []) {
				if (is_declaration(child) && child.value) {
					descriptors[child.property] = child.value.text
				}
			}
			items.push({
				descriptors,
				location: { line: n.line, column: n.column, offset: n.start, length: n.length },
			})
		},
		collect(): AtruleFontFacesResult {
			const base: AtruleFontFacesResult = {
				total: items.length,
				unique: items.map((i) => i.descriptors),
			}
			if (withLocations) {
				base.uniqueWithLocations = items
			}
			return base
		},
	}
}
