// Lines-of-code analyzer.
//
// Operates on the raw CSS string (via prepare), not AST nodes.
// A "line" is any sequence terminated by \n — the last line counts even if
// it has no trailing newline.

import type { AnyNode } from '@projectwallace/css-parser'
import type { AnalyzerInstance } from '../core.js'

export type LinesOfCodeResult = {
	total: number
}

export function linesOfCode(): AnalyzerInstance<LinesOfCodeResult> {
	let total = 0

	return {
		subscribes: [],

		prepare(css: string): void {
			let count = 1
			for (let i = 0; i < css.length; i++) {
				if (css.charCodeAt(i) === 10 /* \n */) count++
			}
			total = count
		},

		visit(_node: AnyNode): void {},

		collect(): LinesOfCodeResult {
			return { total }
		},
	}
}
