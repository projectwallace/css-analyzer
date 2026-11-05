// Stylesheet-level metadata: byte size and comment statistics.
// These are purely string/parse-level — no AST walking needed.

import type { AnyNode } from '@projectwallace/css-parser'
import type { AnalyzerInstance } from '../core.js'

export type StylesheetMetaResult = {
	size: number
	comments: {
		total: number
		size: number
	}
}

export function stylesheetMeta(): AnalyzerInstance<StylesheetMetaResult> {
	let size = 0
	let commentCount = 0
	let commentSize = 0

	return {
		subscribes: [],

		prepare(css: string): void {
			size = css.length
		},

		on_comment(info: { length: number }): void {
			commentCount++
			commentSize += info.length
		},

		visit(_node: AnyNode): void {},

		collect(): StylesheetMetaResult {
			return {
				size,
				comments: { total: commentCount, size: commentSize },
			}
		},
	}
}
