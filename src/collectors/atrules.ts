import {
	type Atrule,
	type CSSNode,
	type MediaFeature,
	SKIP,
	is_atrule_prelude,
	is_container_query,
	is_custom,
	is_declaration,
	is_function,
	is_identifier,
	is_media_feature,
	str_equals,
	walk,
} from '@projectwallace/css-parser'
import { DefinedUsed, type DefinedUsedResult } from '../defined-used.ts'
import { create_counter } from '../engine/counter.ts'
import { define_collector } from '../engine/define-collector.ts'
import type { CollectorDef, CountOptions, CountResult, Location } from '../engine/types.ts'
import { unquote } from '../string-utils.ts'
import { get_media_browserhacks, get_supports_browserhacks } from '../atrules/atrules.ts'
import { keywords } from '../values/values.ts'
import { basename } from '../properties/property-utils.ts'
import {
	get_animation_names,
	get_first_identifier,
	get_list_items,
	without_sequence,
} from './shared.ts'

/** Media features (`(min-width: 40em)`) anywhere in an at-rule prelude */
function find_media_features(prelude: CSSNode | null | undefined): MediaFeature[] {
	const found: MediaFeature[] = []
	if (!prelude) {
		return found
	}
	walk(prelude, function (child) {
		if (is_media_feature(child)) {
			found.push(child)
			return SKIP
		}
	})
	return found
}

/** `property: value` descriptors inside an at-rule block (e.g. `@font-face`) */
function get_descriptors(block: Atrule['block']): Record<string, string> {
	const descriptors: Record<string, string> = Object.create(null)
	for (const child of block?.children ?? []) {
		if (is_declaration(child) && child.value) {
			descriptors[child.property] = child.value.text
		}
	}
	return descriptors
}

/** The container name in `@container name (min-width: 1px)` */
function get_container_name(prelude: CSSNode | null | undefined): string | undefined {
	if (prelude && is_atrule_prelude(prelude) && is_container_query(prelude.first_child)) {
		const name = prelude.first_child.first_child
		if (name && is_identifier(name)) {
			return name.text
		}
	}
	return undefined
}

/** `supports(...)` and `layer(...)` in an `@import` prelude */
function get_import_functions(prelude: CSSNode | null | undefined) {
	const found: { name: 'supports' | 'layer'; value: string; node: CSSNode }[] = []
	if (!prelude || !is_atrule_prelude(prelude) || !prelude.has_children) {
		return found
	}
	for (const child of prelude) {
		if (!is_function(child) || !child.value) {
			continue
		}
		const name = child.name
		if (str_equals('supports', name)) {
			found.push({ name: 'supports', value: child.value, node: child })
		} else if (str_equals('layer', name)) {
			found.push({ name: 'layer', value: child.value, node: child })
		}
	}
	return found
}

export type AtrulesResult = CountResult & {
	font_faces: {
		total: number
		/** The descriptors of each `@font-face`, as written */
		items: Record<string, string>[]
		locations?: Location[]
	}
	imports: CountResult
	media: CountResult & { browserhacks: CountResult; features: CountResult }
	charsets: CountResult
	supports: CountResult & { browserhacks: CountResult }
	keyframes: CountResult &
		DefinedUsedResult & {
			/** Vendor prefixed `@-webkit-keyframes`, counted as `@-webkit-keyframes name` */
			prefixed: CountResult
		}
	containers: CountResult & { names: CountResult & DefinedUsedResult }
	layers: CountResult & DefinedUsedResult
	/** `@property` registrations: defined by `@property`, used by `var()` */
	properties: CountResult & DefinedUsedResult
	/** `@function` definitions */
	functions: CountResult
	scopes: CountResult
	/** 1 per at-rule, plus 1 for hacks and prefixed keyframes. Items are numbers. */
	complexity: CountResult<number>
	/** Items are numbers */
	nesting: CountResult<number>
}

const CONTAINER_PROPERTIES = new Set(['container-name', 'container'])
const ANIMATION_PROPERTIES = new Set(['animation', 'animation-name'])

/**
 * Every at-rule: counted by name, with a breakdown for @font-face, @import, @media, @charset,
 * @supports, @keyframes, @container, @layer, @property, @function and @scope.
 * Keyframe, container and layer names are tracked as defined and used.
 */
export function atrules(options: CountOptions = {}): CollectorDef<AtrulesResult> {
	return define_collector<AtrulesResult>(function init() {
		const names = create_counter(without_sequence(options))
		const imports = create_counter(without_sequence(options))
		const medias = create_counter(without_sequence(options))
		const media_browserhacks = create_counter(without_sequence(options))
		const media_features = create_counter(without_sequence(options))
		const charsets = create_counter(without_sequence(options))
		const supports = create_counter(without_sequence(options))
		const supports_browserhacks = create_counter(without_sequence(options))
		const keyframes = create_counter(without_sequence(options))
		const prefixed_keyframes = create_counter(without_sequence(options))
		const containers = create_counter(without_sequence(options))
		const container_names = create_counter(without_sequence(options))
		const layers = create_counter(without_sequence(options))
		const registered = create_counter(without_sequence(options))
		const functions = create_counter(without_sequence(options))
		const scopes = create_counter(without_sequence(options))
		const complexity = create_counter<number>(without_sequence(options))
		const nesting = create_counter<number>(options)
		const keyframes_tracking = new DefinedUsed()
		const container_tracking = new DefinedUsed()
		const layer_tracking = new DefinedUsed()
		const property_tracking = new DefinedUsed()
		const font_faces: AtrulesResult['font_faces'] = { total: 0, items: [] }
		if (options.locations) {
			font_faces.locations = []
		}

		return {
			parse: { values: true, atrule_preludes: true },
			atrule(node, ctx) {
				const raw_name = node.name
				const name = basename(raw_name)
				const prelude = node.has_prelude ? node.prelude : undefined
				const prelude_text = prelude?.text
				const block = node.block
				names.add(name, ctx)
				nesting.add(ctx.depth, ctx)

				for (const feature of find_media_features(prelude)) {
					media_features.add(feature.property.toLowerCase(), ctx.at(feature))
				}

				if (name === 'font-face') {
					font_faces.total++
					font_faces.items.push({ ...get_descriptors(block) })
					font_faces.locations?.push(ctx.loc)
					complexity.add(1, ctx)
				}

				if (prelude_text === undefined) {
					if (name === 'layer') {
						// @layer without a prelude is anonymous
						layers.add('<anonymous>', ctx)
						complexity.add(2, ctx)
					}
					return
				}

				let weight = 1
				if (name === 'media') {
					medias.add(prelude_text, ctx)
					for (const hack of get_media_browserhacks(prelude!)) {
						media_browserhacks.add(hack, ctx)
						weight++
					}
				} else if (name === 'supports') {
					supports.add(prelude_text, ctx)
					for (const hack of get_supports_browserhacks(prelude!)) {
						supports_browserhacks.add(hack, ctx)
						weight++
					}
				} else if (name.endsWith('keyframes')) {
					const keyframes_name = unquote(prelude_text)
					keyframes.add(keyframes_name, ctx)
					keyframes_tracking.define(keyframes_name)
					if (node.is_vendor_prefixed) {
						prefixed_keyframes.add(`@${raw_name.toLowerCase()} ${prelude_text}`, ctx)
						weight++
					}
				} else if (name === 'layer') {
					for (const layer of prelude_text.split(',').map((part) => part.trim())) {
						layers.add(layer, ctx)
						// `@layer name { }` places CSS into a layer (use); `@layer a, b;` orders layers (define)
						if (block) {
							layer_tracking.use(layer)
						} else {
							layer_tracking.define(layer)
						}
					}
				} else if (name === 'import') {
					imports.add(prelude_text, ctx)
					for (const item of get_import_functions(prelude)) {
						if (item.name === 'supports') {
							supports.add(item.value, ctx.at(item.node))
						} else {
							// layer() can be empty
							layers.add(item.value, ctx.at(item.node))
							layer_tracking.use(item.value)
						}
					}
				} else if (name === 'container') {
					containers.add(prelude_text, ctx)
					const container_name = get_container_name(prelude)
					if (container_name !== undefined) {
						container_names.add(container_name, ctx)
						container_tracking.use(container_name)
					}
				} else if (name === 'property') {
					registered.add(prelude_text, ctx)
					property_tracking.define(prelude_text)
				} else if (name === 'function') {
					const end = prelude_text.indexOf('(')
					functions.add((end === -1 ? prelude_text : prelude_text.slice(0, end)).trim(), ctx)
				} else if (name === 'charset') {
					charsets.add(prelude_text.toLowerCase(), ctx)
				} else if (name === 'scope') {
					scopes.add(prelude_text, ctx)
				}

				complexity.add(weight, ctx)
			},
			declaration: {
				properties: new Set([...CONTAINER_PROPERTIES, ...ANIMATION_PROPERTIES]),
				enter(_node, ctx) {
					const value = ctx.value
					if (ctx.clean_value_text === undefined || !value) {
						return
					}
					const property = ctx.property
					if (property === 'container-name') {
						for (const item of get_list_items(value)) {
							if (!is_identifier(item)) {
								continue
							}
							const text = item.text
							if (!keywords.has(text)) {
								container_names.add(text, ctx.at(item))
								container_tracking.define(text)
							}
						}
					} else if (property === 'container') {
						// The first identifier in the `container` shorthand is the container name
						// Example: container: my-layout / inline-size;
						const first = get_first_identifier(value)
						if (first !== undefined) {
							container_names.add(first, ctx.at(value))
							if (!keywords.has(first)) {
								container_tracking.define(first)
							}
						}
					} else {
						for (const animation_name of get_animation_names(ctx)) {
							keyframes_tracking.use(animation_name)
						}
					}
				},
			},
			value: {
				types: ['function'],
				enter(node) {
					// var(--x) is a use of a registered custom property
					if (!is_function(node) || !str_equals('var', node.name)) {
						return
					}
					const first = get_first_identifier(node)
					if (first !== undefined && is_custom(first)) {
						property_tracking.use(first)
					}
				},
			},
			result: () => ({
				...names.result(),
				font_faces: {
					total: font_faces.total,
					items: font_faces.items.slice(),
					locations: font_faces.locations?.slice(),
				},
				imports: imports.result(),
				media: {
					...medias.result(),
					browserhacks: media_browserhacks.result(),
					features: media_features.result(),
				},
				charsets: charsets.result(),
				supports: { ...supports.result(), browserhacks: supports_browserhacks.result() },
				keyframes: {
					...keyframes.result(),
					...keyframes_tracking.analyze(),
					prefixed: prefixed_keyframes.result(),
				},
				containers: {
					...containers.result(),
					names: { ...container_names.result(), ...container_tracking.analyze() },
				},
				layers: { ...layers.result(), ...layer_tracking.analyze() },
				properties: { ...registered.result(), ...property_tracking.analyze() },
				functions: functions.result(),
				scopes: scopes.result(),
				complexity: complexity.result(),
				nesting: nesting.result(),
			}),
		}
	})
}
