// Source lines of code: counts nodes that represent a "logical line" in CSS.
// Mirrors v9: atrule count + non-keyframe selector count + declaration count + keyframe selector count.

import {
	NODE_TYPES,
	is_atrule,
	is_selector_list,
	is_selector,
	type AnyNode,
	type Rule,
} from '@projectwallace/css-parser'
import type { AnalyzerInstance, WalkContext } from '../core.js'

export type SourceLinesOfCodeResult = {
	total: number
}

export function sourceLinesOfCode(): AnalyzerInstance<SourceLinesOfCodeResult> {
	let count = 0

	return {
		subscribes: [NODE_TYPES.AT_RULE, NODE_TYPES.STYLE_RULE, NODE_TYPES.DECLARATION],

		visit(node: AnyNode, ctx: WalkContext): void {
			if (is_atrule(node)) {
				count++
				return
			}

			// STYLE_RULE — count each selector in the selector list
			if (node.type === NODE_TYPES.STYLE_RULE) {
				const rule = node as Rule
				if (ctx.inKeyframes) {
					// Keyframe percentage selectors also count
					if (rule.has_prelude && is_selector_list(rule.prelude)) {
						for (const sel of rule.prelude) {
							if (is_selector(sel)) count++
						}
					}
				} else {
					if (rule.has_prelude && is_selector_list(rule.prelude)) {
						for (const sel of rule.prelude) {
							if (is_selector(sel)) count++
						}
					}
				}
				return
			}

			// DECLARATION
			count++
		},

		collect(): SourceLinesOfCodeResult {
			return { total: count }
		},
	}
}
