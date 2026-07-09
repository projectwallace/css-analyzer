// Context-aware color analyzer — like uniqueColors but also groups by property.
// Used by the compat layer to produce values.colors.itemsPerContext.

import {
	NODE_TYPES,
	walk,
	SKIP,
	is_hash,
	is_identifier,
	is_function,
	is_declaration,
	type AnyNode,
	type Declaration,
} from '@projectwallace/css-parser'
import { colorFunctions, colorKeywords, namedColors, systemColors } from '../../values/colors.js'
import { endsWith } from '../../string-utils.js'
import {
	ContextCountCollection,
	type ContextCountResult,
	type ContextCountResultWithLocations,
} from '../internals/context-count-collection.js'
import { CountCollection, type CountResult, type CountResultWithLocations } from '../internals/count-collection.js'
import type { AnalyzerInstance } from '../core.js'

const SKIPS_COLOR_LOOKUP = new Set([
	// font shorthand (but NOT color, background, border, outline, etc.)
	'font', 'font-family',
	// typography — no color values possible
	'font-size', 'font-weight', 'font-style', 'font-variant', 'font-stretch',
	'font-kerning', 'font-size-adjust',
	'line-height', 'letter-spacing', 'word-spacing', 'text-indent',
	'text-align', 'text-align-last', 'text-transform', 'text-overflow',
	'text-rendering', 'white-space', 'word-break', 'overflow-wrap', 'word-wrap',
	'hyphens', 'tab-size', 'direction', 'unicode-bidi', 'writing-mode', 'text-orientation',
	// layout
	'display', 'position', 'float', 'clear',
	'overflow', 'overflow-x', 'overflow-y', 'overflow-clip-margin',
	'visibility', 'z-index', 'box-sizing', 'appearance', '-webkit-appearance',
	// sizing
	'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
	'inline-size', 'block-size', 'min-inline-size', 'max-inline-size', 'min-block-size', 'max-block-size',
	// spacing
	'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
	'margin-block', 'margin-block-start', 'margin-block-end',
	'margin-inline', 'margin-inline-start', 'margin-inline-end',
	'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
	'padding-block', 'padding-block-start', 'padding-block-end',
	'padding-inline', 'padding-inline-start', 'padding-inline-end',
	// flex
	'flex', 'flex-grow', 'flex-shrink', 'flex-basis', 'flex-direction', 'flex-wrap', 'flex-flow',
	// grid
	'grid-template-columns', 'grid-template-rows', 'grid-template-areas',
	'grid-column', 'grid-row', 'grid-area',
	'grid-auto-flow', 'grid-auto-columns', 'grid-auto-rows',
	'grid-column-start', 'grid-column-end', 'grid-row-start', 'grid-row-end',
	// alignment & gap
	'align-items', 'align-content', 'align-self',
	'justify-items', 'justify-content', 'justify-self',
	'place-items', 'place-content', 'place-self',
	'gap', 'row-gap', 'column-gap',
	// stacking / compositing
	'order', 'isolation', 'mix-blend-mode', 'background-blend-mode',
	// transforms
	'transform', 'transform-origin', 'transform-style', 'transform-box',
	'perspective', 'perspective-origin', 'backface-visibility',
	// transition & animation (timing, not color)
	'transition', 'transition-property', 'transition-duration',
	'transition-timing-function', 'transition-delay',
	'animation', 'animation-name', 'animation-duration', 'animation-timing-function',
	'animation-delay', 'animation-iteration-count', 'animation-direction',
	'animation-fill-mode', 'animation-play-state',
	// content & counters
	'content', 'quotes', 'counter-increment', 'counter-reset', 'counter-set',
	// list (type/position only — not list-style-image which can be a gradient)
	'list-style-type', 'list-style-position',
	// interaction / UX
	'cursor', 'pointer-events', 'user-select', '-webkit-user-select',
	'touch-action', 'resize', 'will-change',
	// columns (widths/counts, not column-rule-color)
	'columns', 'column-count', 'column-width', 'column-span', 'column-fill',
	// table layout
	'table-layout', 'border-collapse', 'border-spacing', 'caption-side', 'empty-cells',
	'vertical-align',
	// fragmentation
	'break-before', 'break-after', 'break-inside',
	'page-break-before', 'page-break-after', 'page-break-inside',
	'orphans', 'widows',
	// object fitting
	'object-fit', 'object-position',
	// opacity (number, not a color)
	'opacity',
	// clip (geometry, not color)
	'clip-path',
])

export type ColorsContextOptions = { locations?: boolean }

export type ColorsContextResult = (ContextCountResult | ContextCountResultWithLocations) & {
	formats: CountResult | CountResultWithLocations
}

export function colorsContext(
	options: ColorsContextOptions = {},
): AnalyzerInstance<ColorsContextResult> {
	const withLocations = options.locations === true
	const collection = new ContextCountCollection(withLocations)
	const formats = new CountCollection(withLocations)

	return {
		subscribes: [NODE_TYPES.DECLARATION],

		visit(node: AnyNode): void {
			const decl = node as Declaration
			if (!is_declaration(decl)) return
			const value = decl.value
			if (!value) return
			const property = decl.property.toLowerCase()
			if (SKIPS_COLOR_LOOKUP.has(property)) return

			walk(value, (vn) => {
				if (is_hash(vn)) {
					const text = vn.text
					if (!text || text.charCodeAt(0) !== 35) return SKIP
					const lc = text.toLowerCase()
					collection.add(lc, property, vn.line, vn.column, vn.start, vn.length)
					let hexLen = lc.length - 1
					if (endsWith('\\9', lc) || endsWith('\\7', lc)) hexLen -= 2
					formats.add(`hex${hexLen}`, vn.line, vn.column, vn.start, vn.length)
					return SKIP
				}

				if (is_identifier(vn)) {
					const ident = vn.text
					const len = ident.length
					if (len < 3 || len > 20) return SKIP
					if (colorKeywords.has(ident)) {
						const lc = ident.toLowerCase()
						collection.add(lc, property, vn.line, vn.column, vn.start, vn.length)
						formats.add(lc, vn.line, vn.column, vn.start, vn.length)
					} else if (namedColors.has(ident)) {
						collection.add(ident.toLowerCase(), property, vn.line, vn.column, vn.start, vn.length)
						formats.add('named', vn.line, vn.column, vn.start, vn.length)
					} else if (systemColors.has(ident)) {
						collection.add(ident.toLowerCase(), property, vn.line, vn.column, vn.start, vn.length)
						formats.add('system', vn.line, vn.column, vn.start, vn.length)
					}
					return SKIP
				}

				if (is_function(vn)) {
					if (colorFunctions.has(vn.name)) {
						collection.add(vn.text, property, vn.line, vn.column, vn.start, vn.length)
						formats.add(vn.name.toLowerCase(), vn.line, vn.column, vn.start, vn.length)
						return SKIP
					}
				}
			})
		},

		collect(): ColorsContextResult {
			return { ...collection.collect(), formats: formats.collect() }
		},
	}
}
