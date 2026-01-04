// @ts-expect-error types missing
import parse from 'css-tree/parser'
// @ts-expect-error types missing
import walk from 'css-tree/walker'
// Wallace parser for dual-parser migration
import {
	type CSSNode,
	is_custom,
	is_vendor_prefixed,
	SKIP,
	str_equals,
	str_starts_with,
	walk as wallaceWalk2,
	parse as wallaceParse,
} from '@projectwallace/css-parser'
// @ts-expect-error types missing
import { calculateForAST } from '@bramus/specificity/core'
import { isSupportsBrowserhack, isMediaBrowserhack } from './atrules/atrules.js'
import { getCombinators, getComplexity, isPrefixed, hasPseudoClass, isAccessibility } from './selectors/utils.js'
import { colorFunctions, colorKeywords, namedColors, systemColors } from './values/colors.js'
import { destructure, isSystemFont } from './values/destructure-font-shorthand.js'
import { isValueKeyword, keywords, isValueReset } from './values/values.js'
import { analyzeAnimation } from './values/animations.js'
import { isValuePrefixed } from './values/vendor-prefix.js'
import { ContextCollection } from './context-collection.js'
import { Collection, type Location } from './collection.js'
import { AggregateCollection } from './aggregate-collection.js'
import { strEquals, endsWith, unquote } from './string-utils.js'
import { isProperty } from './properties/property-utils.js'
import { getEmbedType } from './stylesheet/stylesheet.js'
import { isIe9Hack } from './values/browserhacks.js'
import { basename } from './properties/property-utils.js'
import { Atrule, Selector, Dimension, Url, Value, Hash, Rule, Identifier, Func, Operator } from './css-tree-node-types.js'
import { KeywordSet } from './keyword-set.js'
import type { CssNode, Declaration } from 'css-tree'

export type Specificity = [number, number, number]

let border_radius_properties = new KeywordSet([
	'border-radius',
	'border-top-left-radius',
	'border-top-right-radius',
	'border-bottom-right-radius',
	'border-bottom-left-radius',
	'border-start-start-radius',
	'border-start-end-radius',
	'border-end-end-radius',
	'border-end-start-radius',
])

function ratio(part: number, total: number): number {
	if (total === 0) return 0
	return part / total
}

export type Options = {
	/** @description Use Locations (`{ 'item': [{ line, column, offset, length }] }`) instead of a regular count per occurrence (`{ 'item': 3 }`) */
	useLocations?: boolean
}

export function analyze(css: string, options?: Options & { useLocations?: false | undefined }): ReturnType<typeof analyzeInternal<false>>
export function analyze(css: string, options: Options & { useLocations: true }): ReturnType<typeof analyzeInternal<true>>
export function analyze(css: string, options: Options = {}): any {
	const useLocations = options.useLocations === true
	if (useLocations) {
		return analyzeInternal(css, options, true)
	}
	return analyzeInternal(css, options, false)
}

function analyzeInternal<T extends boolean>(css: string, options: Options, useLocations: T) {
	let start = Date.now()

	/**
	 * Recreate the authored CSS from a CSSTree node
	 * @param node - Node from CSSTree AST to stringify
	 * @returns The stringified node
	 */
	function stringifyNode(node: CssNode): string {
		return stringifyNodePlain(node).trim()
	}

	function stringifyNodePlain(node: CssNode): string {
		let loc = node.loc!
		return css.substring(loc.start.offset, loc.end.offset)
	}

	// Stylesheet
	let totalComments = 0
	let commentsSize = 0
	let embedSize = 0
	let embedTypes = {
		total: 0,
		unique: new Map() as Map<
			string,
			{
				size: number
				count: number
				uniqueWithLocations?: Location[]
			}
		>,
	}

	let startParse = Date.now()

	let ast = parse(css, {
		parseCustomProperty: true, // To find font-families, colors, etc.
		positions: true, // So we can use stringifyNode()
		onComment: function (comment: string) {
			totalComments++
			commentsSize += comment.length
		},
	})

	let startAnalysis = Date.now()
	let linesOfCode = ast.loc.end.line - ast.loc.start.line + 1

	// Atrules
	let atrules = new Collection(useLocations)
	let atRuleComplexities = new AggregateCollection()
	/** @type {Record<string, string>[]} */
	let fontfaces: Record<string, string>[] = []
	let fontfaces_with_loc = new Collection(useLocations)
	let layers = new Collection(useLocations)
	let imports = new Collection(useLocations)
	let medias = new Collection(useLocations)
	let mediaBrowserhacks = new Collection(useLocations)
	let mediaFeatures = new Collection(useLocations)
	let charsets = new Collection(useLocations)
	let supports = new Collection(useLocations)
	let supportsBrowserhacks = new Collection(useLocations)
	let keyframes = new Collection(useLocations)
	let prefixedKeyframes = new Collection(useLocations)
	let containers = new Collection(useLocations)
	let containerNames = new Collection(useLocations)
	let registeredProperties = new Collection(useLocations)
	let atruleNesting = new AggregateCollection()
	let uniqueAtruleNesting = new Collection(useLocations)

	// Rules
	let totalRules = 0
	let emptyRules = 0
	let ruleSizes = new AggregateCollection()
	let selectorsPerRule = new AggregateCollection()
	let declarationsPerRule = new AggregateCollection()
	let uniqueRuleSize = new Collection(useLocations)
	let uniqueSelectorsPerRule = new Collection(useLocations)
	let uniqueDeclarationsPerRule = new Collection(useLocations)
	let ruleNesting = new AggregateCollection()
	let uniqueRuleNesting = new Collection(useLocations)

	// Selectors
	let keyframeSelectors = new Collection(useLocations)
	let uniqueSelectors = new Set()
	let prefixedSelectors = new Collection(useLocations)
	let maxSpecificity: Specificity | undefined
	let minSpecificity: Specificity | undefined
	let specificityA = new AggregateCollection()
	let specificityB = new AggregateCollection()
	let specificityC = new AggregateCollection()
	let uniqueSpecificities = new Collection(useLocations)
	let selectorComplexities = new AggregateCollection()
	let uniqueSelectorComplexities = new Collection(useLocations)
	let specificities: Specificity[] = []
	let ids = new Collection(useLocations)
	let a11y = new Collection(useLocations)
	let pseudoClasses = new Collection(useLocations)
	let combinators = new Collection(useLocations)
	let selectorNesting = new AggregateCollection()
	let uniqueSelectorNesting = new Collection(useLocations)

	// Declarations
	let uniqueDeclarations = new Set()
	let totalDeclarations = 0
	let declarationComplexities = new AggregateCollection()
	let importantDeclarations = 0
	let importantsInKeyframes = 0
	let importantCustomProperties = new Collection(useLocations)
	let declarationNesting = new AggregateCollection()
	let uniqueDeclarationNesting = new Collection(useLocations)

	// Properties
	let properties = new Collection(useLocations)
	let propertyHacks = new Collection(useLocations)
	let propertyVendorPrefixes = new Collection(useLocations)
	let customProperties = new Collection(useLocations)
	let propertyComplexities = new AggregateCollection()

	// Values
	let valueComplexities = new AggregateCollection()
	let vendorPrefixedValues = new Collection(useLocations)
	let valueBrowserhacks = new Collection(useLocations)
	let zindex = new Collection(useLocations)
	let textShadows = new Collection(useLocations)
	let boxShadows = new Collection(useLocations)
	let fontFamilies = new Collection(useLocations)
	let fontSizes = new Collection(useLocations)
	let lineHeights = new Collection(useLocations)
	let timingFunctions = new Collection(useLocations)
	let durations = new Collection(useLocations)
	let colors = new ContextCollection(useLocations)
	let colorFormats = new Collection(useLocations)
	let units = new ContextCollection(useLocations)
	let gradients = new Collection(useLocations)
	let valueKeywords = new Collection(useLocations)
	let borderRadiuses = new ContextCollection(useLocations)
	let resets = new Collection(useLocations)

	let nestingDepth = 0

	// Use Wallace parser to count basic structures (migrating from css-tree)
	let wallaceAst = wallaceParse(css)

	function wallaceLoc(node: CSSNode) {
		return {
			start: {
				offset: node.start,
				line: node.line,
				column: node.column,
			},
			end: {
				offset: node.end,
			},
		}
	}

	function wallaceWalk(node: CSSNode, depth: number = 0, inKeyframes: boolean = false) {
		// Count nodes and track nesting
		if (node.type_name === 'Atrule') {
			let atruleLoc = wallaceLoc(node)
			atruleNesting.push(depth)
			uniqueAtruleNesting.p(depth, atruleLoc)
			atrules.p(node.name, atruleLoc)

			//#region @FONT-FACE
			if (str_equals('font-face', node.name)) {
				let descriptors = Object.create(null)
				if (useLocations) {
					fontfaces_with_loc.p(node.start, wallaceLoc(node))
				}
				let block = node.children.find((child) => child.type_name === 'Block')
				for (let descriptor of block?.children || []) {
					if (descriptor.type_name === 'Declaration' && descriptor.value) {
						descriptors[descriptor.property] = (descriptor.value as CSSNode).text
					}
				}
				atRuleComplexities.push(1)
				fontfaces.push(descriptors)
			}
			//#endregion

			if (node.prelude === null || node.prelude === undefined) {
				if (str_equals('layer', node.name)) {
					// @layer without a prelude is anonymous
					layers.p('<anonymous>', wallaceLoc(node))
					atRuleComplexities.push(2)
				}
			} else {
				let { name } = node
				let complexity = 1

				// All the AtRules in here MUST have a prelude, so we can count their names
				if (str_equals('media', name)) {
					medias.p(node.prelude.text, wallaceLoc(node))
					if (isMediaBrowserhack(node.prelude)) {
						mediaBrowserhacks.p(node.prelude.text, wallaceLoc(node))
						complexity++
					}
				} else if (str_equals('supports', name)) {
					supports.p(node.prelude.text, wallaceLoc(node))
					if (isSupportsBrowserhack(node.prelude)) {
						supportsBrowserhacks.p(node.prelude.text, wallaceLoc(node))
						complexity++
					}
				} else if (endsWith('keyframes', name)) {
					let prelude = `@${name} ${node.prelude.text}`
					keyframes.p(prelude, wallaceLoc(node))

					if (is_vendor_prefixed(name)) {
						prefixedKeyframes.p(prelude, wallaceLoc(node))
						complexity++
					}

					// Mark that we're inside a keyframes atrule
					inKeyframes = true
				} else if (str_equals('layer', name)) {
					for (let layer of node.prelude.text.split(',').map((s) => s.trim())) {
						layers.p(layer, wallaceLoc(node))
					}
				} else if (str_equals('import', name)) {
					imports.p(node.prelude.text, wallaceLoc(node))

					if (node.prelude.has_children) {
						for (let child of node.prelude) {
							if (child.type_name === 'SupportsQuery' && typeof child.value === 'string') {
								supports.p(child.value, wallaceLoc(child))
							} else if (child.type_name === 'Layer' && typeof child.value === 'string') {
								layers.p(child.value, wallaceLoc(child))
							}
						}
					}
				} else if (str_equals('container', name)) {
					containers.p(node.prelude.text, wallaceLoc(node))
					if (node.prelude.first_child?.type_name === 'ContainerQuery') {
						if (node.prelude.first_child.first_child?.type_name === 'Identifier') {
							containerNames.p(node.prelude.first_child.first_child.text, wallaceLoc(node))
						}
					}
				} else if (str_equals('property', name)) {
					registeredProperties.p(node.prelude.text, wallaceLoc(node))
				} else if (str_equals('charset', name)) {
					charsets.p(node.prelude.text, wallaceLoc(node))
				}

				atRuleComplexities.push(complexity)
			}
		} else if (node.type_name === 'Rule') {
			// Handle keyframe rules specially
			if (inKeyframes && node.prelude) {
				// In keyframes, the prelude is a SelectorList that may not have Selector children
				// (e.g., "50%" is just a SelectorList with text, no Selector child)
				if (node.prelude.type_name === 'SelectorList' && node.prelude.text) {
					keyframeSelectors.p(node.prelude.text, wallaceLoc(node.prelude))
				}
				// Don't count keyframe rules as regular rules, but continue walking
				// children to count declarations inside keyframes
				// (Declarations are counted in the Declaration handler below)
			} else {
				// Only count non-keyframe rules
				totalRules++

				// Check if rule is empty (no declarations in block)
				if (node.block?.is_empty) {
					emptyRules++
				}

				// Count selectors and declarations in this rule
				let numSelectors = 0
				let numDeclarations = 0
				let loc = wallaceLoc(node)

				// Find the SelectorList child and count Selector nodes inside it
				if (node.prelude) {
					for (const selector of node.prelude.children) {
						if (selector.type_name === 'Selector') {
							numSelectors++
						}
					}
				}

				// Count declarations in the block
				if (node.block) {
					for (const declaration of node.block.children) {
						if (declaration.type_name === 'Declaration') {
							numDeclarations++
						}
					}
				}

				// Track rule metrics
				ruleSizes.push(numSelectors + numDeclarations)
				uniqueRuleSize.p(numSelectors + numDeclarations, loc)

				selectorsPerRule.push(numSelectors)
				uniqueSelectorsPerRule.p(numSelectors, loc)

				declarationsPerRule.push(numDeclarations)
				uniqueDeclarationsPerRule.p(numDeclarations, loc)

				ruleNesting.push(depth)
				uniqueRuleNesting.p(depth, loc)
			}
		} else if (node.type_name === 'Selector') {
			// Keyframe selectors are now handled at the Rule level, so skip them here
			if (inKeyframes) {
				return SKIP
			}

			let loc = wallaceLoc(node)

			selectorNesting.push(depth > 0 ? depth - 1 : 0)
			uniqueSelectorNesting.p(depth > 0 ? depth - 1 : 0, loc)
			uniqueSelectors.add(node.text)

			let complexity = getComplexity(node)
			selectorComplexities.push(complexity)
			uniqueSelectorComplexities.p(complexity, loc)

			if (isPrefixed(node)) {
				prefixedSelectors.p(node.text, loc)
			}

			// Check for accessibility selectors
			if (isAccessibility(node)) {
				a11y.p(node.text, loc)
			}

			let pseudos = hasPseudoClass(node)
			if (pseudos !== false) {
				for (let pseudo of pseudos) {
					// Loc is off for some reason, TODO fix
					pseudoClasses.p(pseudo, loc)
				}
			}

			getCombinators(node, function onCombinator(combinator) {
				// Loc is off for some reason, TODO fix
				combinators.p(combinator.name, combinator.loc)
			})

			// Avoid deeper walking of selectors to not mess with
			// our specificity calculations in case of a selector
			// with :where() or :is() that contain SelectorLists
			// as children
			return SKIP
		} else if (node.type_name === 'Declaration') {
			totalDeclarations++
			uniqueDeclarations.add(node.text)

			let declarationDepth = depth > 0 ? depth - 1 : 0
			declarationNesting.push(declarationDepth)
			uniqueDeclarationNesting.p(declarationDepth, wallaceLoc(node))

			//#region PROPERTIES
			let { is_important, property, is_browserhack, is_vendor_prefixed } = node

			let propertyLoc = wallaceLoc(node)

			properties.p(property, propertyLoc)

			if (is_important) {
				importantDeclarations++
			}

			// Count important declarations
			if (is_vendor_prefixed) {
				propertyComplexities.push(2)
				propertyVendorPrefixes.p(property, propertyLoc)
			} else if (is_custom(property)) {
				customProperties.p(property, propertyLoc)
				propertyComplexities.push(is_important ? 3 : 2)

				if (is_important) {
					importantCustomProperties.p(property, propertyLoc)
				}
			} else if (is_browserhack) {
				propertyHacks.p(property, propertyLoc)
				propertyComplexities.push(2)
			} else {
				propertyComplexities.push(1)
			}
			//#endregion
		} else if (node.type_name === 'Value') {
			let { text } = node

			if (keywords.has(text)) {
				valueKeywords.p(text, wallaceLoc(node))
				return
			}
		} else if (node.type_name === 'Url') {
			let { value } = node
			let embed = unquote((value as string) || '')
			if (str_starts_with(embed, 'data:')) {
				let size = embed.length
				let type = getEmbedType(embed)

				embedTypes.total++
				embedSize += size

				let loc = {
					line: node.line,
					column: node.column,
					offset: node.start,
					length: node.length,
				}

				if (embedTypes.unique.has(type)) {
					let item = embedTypes.unique.get(type)!
					item.count++
					item.size += size
					embedTypes.unique.set(type, item)
					if (useLocations && item.uniqueWithLocations) {
						item.uniqueWithLocations.push(loc)
					}
				} else {
					let item = {
						count: 1,
						size,
						uniqueWithLocations: useLocations ? [loc] : undefined,
					}
					embedTypes.unique.set(type, item)
				}
			}
		}

		// Walk children with increased depth for Rules and Atrules
		const nextDepth = node.type_name === 'Rule' || node.type_name === 'Atrule' ? depth + 1 : depth

		if (node.children && Array.isArray(node.children)) {
			for (const child of node.children) {
				wallaceWalk(child, nextDepth, inKeyframes)
			}
		}
	}

	wallaceWalk(wallaceAst)

	walk(ast, {
		enter(node: CssNode) {
			switch (node.type) {
				// @ts-expect-error Oudated css-tree types
				case 'Feature': {
					// @ts-expect-error Oudated css-tree types
					mediaFeatures.p(node.name, node.loc)
					break
				}
				case Selector: {
					let selector = stringifyNode(node)
					let loc = node.loc!

					// #region specificity
					let specificity: Specificity = calculateForAST(node).toArray()
					let [sa, sb, sc] = specificity

					uniqueSpecificities.p(specificity.toString(), loc)

					specificityA.push(sa)
					specificityB.push(sb)
					specificityC.push(sc)

					if (maxSpecificity === undefined) {
						maxSpecificity = specificity
					}

					if (minSpecificity === undefined) {
						minSpecificity = specificity
					}

					if (minSpecificity !== undefined && compareSpecificity(minSpecificity, specificity) < 0) {
						minSpecificity = specificity
					}

					if (maxSpecificity !== undefined && compareSpecificity(maxSpecificity, specificity) > 0) {
						maxSpecificity = specificity
					}

					specificities.push(specificity)
					// #endregion

					if (sa > 0) {
						ids.p(selector, loc)
					}

					// Avoid deeper walking of selectors to not mess with
					// our specificity calculations in case of a selector
					// with :where() or :is() that contain SelectorLists
					// as children
					return this.skip
				}
				case Dimension: {
					if (!this.declaration) {
						break
					}

					let unit = node.unit

					if (endsWith('\\9', unit)) {
						units.push(unit.substring(0, unit.length - 2), this.declaration.property, node.loc!)
					} else {
						units.push(unit, this.declaration.property, node.loc!)
					}

					return this.skip
				}
				case Value: {
					let loc = node.loc!

					if (isValueKeyword(node)) {
						valueComplexities.push(1)
						break
					}

					let declaration: Declaration = this.declaration
					let { property, important } = declaration
					let complexity = 1

					// i.e. `background-image: -webkit-linear-gradient()`
					if (isValuePrefixed(node)) {
						vendorPrefixedValues.p(stringifyNode(node), loc)
						complexity++
					}

					// i.e. `property: value !ie`
					if (typeof important === 'string') {
						valueBrowserhacks.p(stringifyNodePlain(node) + '!' + important, loc)
						complexity++
					}

					// i.e. `property: value\9`
					if (isIe9Hack(node)) {
						valueBrowserhacks.p(stringifyNode(node), loc)
						complexity++
					}

					let children = node.children

					// TODO: should shorthands be counted towards complexity?
					valueComplexities.push(complexity)

					// Process properties first that don't have colors,
					// so we can avoid further walking them;
					if (
						isProperty('margin', property) ||
						isProperty('margin-block', property) ||
						isProperty('margin-inline', property) ||
						isProperty('margin-top', property) ||
						isProperty('margin-right', property) ||
						isProperty('margin-bottom', property) ||
						isProperty('margin-left', property) ||
						isProperty('padding', property) ||
						isProperty('padding-block', property) ||
						isProperty('padding-inline', property) ||
						isProperty('padding-top', property) ||
						isProperty('padding-right', property) ||
						isProperty('padding-bottom', property) ||
						isProperty('padding-left', property)
					) {
						if (isValueReset(node)) {
							resets.p(property, declaration.loc!)
						}
					} else if (isProperty('z-index', property)) {
						zindex.p(stringifyNode(node), loc)
						return this.skip
					} else if (isProperty('font', property)) {
						if (isSystemFont(node)) return

						let result = destructure(node, stringifyNode, function (item) {
							if (item.type === 'keyword') {
								valueKeywords.p(item.value, loc)
							}
						})

						if (!result) {
							return this.skip
						}

						let { font_size, line_height, font_family } = result
						if (font_family) {
							fontFamilies.p(font_family, loc)
						}

						if (font_size) {
							fontSizes.p(font_size, loc)
						}

						if (line_height) {
							lineHeights.p(line_height, loc)
						}

						break
					} else if (isProperty('font-size', property)) {
						if (!isSystemFont(node)) {
							fontSizes.p(stringifyNode(node), loc)
						}
						break
					} else if (isProperty('font-family', property)) {
						if (!isSystemFont(node)) {
							fontFamilies.p(stringifyNode(node), loc)
						}
						break
					} else if (isProperty('line-height', property)) {
						lineHeights.p(stringifyNode(node), loc)
					} else if (isProperty('transition', property) || isProperty('animation', property)) {
						analyzeAnimation(children, function (item: { type: string; value: CssNode }) {
							if (item.type === 'fn') {
								timingFunctions.p(stringifyNode(item.value), loc)
							} else if (item.type === 'duration') {
								durations.p(stringifyNode(item.value), loc)
							} else if (item.type === 'keyword') {
								valueKeywords.p(stringifyNode(item.value), loc)
							}
						})
						break
					} else if (isProperty('animation-duration', property) || isProperty('transition-duration', property)) {
						if (children && children.size > 1) {
							children.forEach((child) => {
								if (child.type !== Operator) {
									durations.p(stringifyNode(child), loc)
								}
							})
						} else {
							durations.p(stringifyNode(node), loc)
						}
						break
					} else if (isProperty('transition-timing-function', property) || isProperty('animation-timing-function', property)) {
						if (children && children.size > 1) {
							children.forEach((child) => {
								if (child.type !== Operator) {
									timingFunctions.p(stringifyNode(child), loc)
								}
							})
						} else {
							timingFunctions.p(stringifyNode(node), loc)
						}
						break
					} else if (isProperty('container-name', property)) {
						containerNames.p(stringifyNode(node), loc)
					} else if (isProperty('container', property)) {
						// The first identifier is the container name
						// Example: container: my-layout / inline-size;
						if (children.first?.type === 'Identifier') {
							containerNames.p(children.first.name, loc)
						}
					} else if (border_radius_properties.has(basename(property))) {
						if (!isValueKeyword(node)) {
							borderRadiuses.push(stringifyNode(node), property, loc)
						}
						break
					} else if (isProperty('text-shadow', property)) {
						if (!isValueKeyword(node)) {
							textShadows.p(stringifyNode(node), loc)
						}
						// no break here: potentially contains colors
					} else if (isProperty('box-shadow', property)) {
						if (!isValueKeyword(node)) {
							boxShadows.p(stringifyNode(node), loc)
						}
						// no break here: potentially contains colors
					}

					walk(node, function (valueNode: CssNode) {
						// @ts-expect-error TODO: fix this
						let nodeName = valueNode.name

						switch (valueNode.type) {
							case Hash: {
								let hexLength = valueNode.value.length
								if (endsWith('\\9', valueNode.value)) {
									hexLength = hexLength - 2
								}
								colors.push('#' + valueNode.value, property, loc)
								colorFormats.p(`hex` + hexLength, loc)

								return walk.skip
							}
							case Identifier: {
								if (keywords.has(nodeName)) {
									valueKeywords.p(nodeName, loc)
								}

								// Bail out if it can't be a color name
								// 20 === 'lightgoldenrodyellow'.length
								// 3 === 'red'.length
								let nodeLen = nodeName.length
								if (nodeLen > 20 || nodeLen < 3) {
									return walk.skip
								}

								// A keyword is most likely to be 'transparent' or 'currentColor'
								if (colorKeywords.has(nodeName)) {
									let stringified = stringifyNode(valueNode)
									colors.push(stringified, property, loc)
									colorFormats.p(nodeName.toLowerCase(), loc)
									return
								}

								// Or it can be a named color
								if (namedColors.has(nodeName)) {
									let stringified = stringifyNode(valueNode)
									colors.push(stringified, property, loc)
									colorFormats.p('named', loc)
									return
								}

								// Or it can be a system color
								if (systemColors.has(nodeName)) {
									let stringified = stringifyNode(valueNode)
									colors.push(stringified, property, loc)
									colorFormats.p('system', loc)
									return
								}
								return walk.skip
							}
							case Func: {
								// Don't walk var() multiple times
								if (strEquals('var', nodeName)) {
									return walk.skip
								}

								// rgb(a), hsl(a), color(), hwb(), lch(), lab(), oklab(), oklch()
								if (colorFunctions.has(nodeName)) {
									colors.push(stringifyNode(valueNode), property, valueNode.loc!)
									colorFormats.p(nodeName.toLowerCase(), valueNode.loc!)
									return
								}

								if (endsWith('gradient', nodeName)) {
									gradients.p(stringifyNode(valueNode), valueNode.loc!)
									return
								}
								// No walk.skip here intentionally,
								// otherwise we'll miss colors in linear-gradient() etc.
							}
						}
					})
					break
				}
				case 'Declaration': {
					// Do not process Declarations in atRule preludes
					// because we will handle them manually
					if (this.atrulePrelude !== null) {
						return this.skip
					}

					let complexity = 1

					if (node.important === true) {
						// importantDeclarations now counted by Wallace parser
						complexity++

						if (this.atrule && endsWith('keyframes', this.atrule.name)) {
							importantsInKeyframes++
							complexity++
						}
					}

					declarationComplexities.push(complexity)

					break
				}
			}

			if (node.type === Rule || node.type === Atrule) {
				nestingDepth++
			}
		},
		leave(node: CssNode) {
			if (node.type === Rule || node.type === Atrule) {
				nestingDepth--
			}
		},
	})

	let totalUniqueDeclarations = uniqueDeclarations.size

	let totalSelectors = selectorComplexities.size()
	let specificitiesA = specificityA.aggregate()
	let specificitiesB = specificityB.aggregate()
	let specificitiesC = specificityC.aggregate()
	let totalUniqueSelectors = uniqueSelectors.size
	let assign = Object.assign
	let cssLen = css.length
	let fontFacesCount = fontfaces.length
	let atRuleComplexity = atRuleComplexities.aggregate()
	let selectorComplexity = selectorComplexities.aggregate()
	let declarationComplexity = declarationComplexities.aggregate()
	let propertyComplexity = propertyComplexities.aggregate()
	let valueComplexity = valueComplexities.aggregate()
	let atruleCount = atrules.c()

	return {
		stylesheet: {
			sourceLinesOfCode: atruleCount.total + totalSelectors + totalDeclarations + keyframeSelectors.size(),
			linesOfCode,
			size: cssLen,
			complexity: atRuleComplexity.sum + selectorComplexity.sum + declarationComplexity.sum + propertyComplexity.sum + valueComplexity.sum,
			comments: {
				total: totalComments,
				size: commentsSize,
			},
			embeddedContent: {
				size: {
					total: embedSize,
					ratio: ratio(embedSize, cssLen),
				},
				types: {
					total: embedTypes.total,
					totalUnique: embedTypes.unique.size,
					uniquenessRatio: ratio(embedTypes.unique.size, embedTypes.total),
					unique: Object.fromEntries(embedTypes.unique),
				},
			},
		},
		atrules: assign(atruleCount, {
			fontface: assign(
				{
					total: fontFacesCount,
					totalUnique: fontFacesCount,
					unique: fontfaces,
					uniquenessRatio: fontFacesCount === 0 ? 0 : 1,
				},
				useLocations
					? {
							uniqueWithLocations: fontfaces_with_loc.c().uniqueWithLocations,
						}
					: {},
			),
			import: imports.c(),
			media: assign(medias.c(), {
				browserhacks: mediaBrowserhacks.c(),
				features: mediaFeatures.c(),
			}),
			charset: charsets.c(),
			supports: assign(supports.c(), {
				browserhacks: supportsBrowserhacks.c(),
			}),
			keyframes: assign(keyframes.c(), {
				prefixed: assign(prefixedKeyframes.c(), {
					ratio: ratio(prefixedKeyframes.size(), keyframes.size()),
				}),
			}),
			container: assign(containers.c(), {
				names: containerNames.c(),
			}),
			layer: layers.c(),
			property: registeredProperties.c(),
			complexity: atRuleComplexity,
			nesting: assign(
				atruleNesting.aggregate(),
				{
					items: atruleNesting.toArray(),
				},
				uniqueAtruleNesting.c(),
			),
		}),
		rules: {
			total: totalRules,
			empty: {
				total: emptyRules,
				ratio: ratio(emptyRules, totalRules),
			},
			sizes: assign(
				ruleSizes.aggregate(),
				{
					items: ruleSizes.toArray(),
				},
				uniqueRuleSize.c(),
			),
			nesting: assign(
				ruleNesting.aggregate(),
				{
					items: ruleNesting.toArray(),
				},
				uniqueRuleNesting.c(),
			),
			selectors: assign(
				selectorsPerRule.aggregate(),
				{
					items: selectorsPerRule.toArray(),
				},
				uniqueSelectorsPerRule.c(),
			),
			declarations: assign(
				declarationsPerRule.aggregate(),
				{
					items: declarationsPerRule.toArray(),
				},
				uniqueDeclarationsPerRule.c(),
			),
		},
		selectors: {
			total: totalSelectors,
			totalUnique: totalUniqueSelectors,
			uniquenessRatio: ratio(totalUniqueSelectors, totalSelectors),
			specificity: assign(
				{
					/** @type Specificity */
					min: minSpecificity === undefined ? [0, 0, 0] : minSpecificity,
					/** @type Specificity */
					max: maxSpecificity === undefined ? [0, 0, 0] : maxSpecificity,
					/** @type Specificity */
					sum: [specificitiesA.sum, specificitiesB.sum, specificitiesC.sum],
					/** @type Specificity */
					mean: [specificitiesA.mean, specificitiesB.mean, specificitiesC.mean],
					/** @type Specificity */
					mode: [specificitiesA.mode, specificitiesB.mode, specificitiesC.mode],
					/** @type Specificity */
					items: specificities,
				},
				uniqueSpecificities.c(),
			),
			complexity: assign(selectorComplexity, uniqueSelectorComplexities.c(), {
				items: selectorComplexities.toArray(),
			}),
			nesting: assign(
				selectorNesting.aggregate(),
				{
					items: selectorNesting.toArray(),
				},
				uniqueSelectorNesting.c(),
			),
			id: assign(ids.c(), {
				ratio: ratio(ids.size(), totalSelectors),
			}),
			pseudoClasses: pseudoClasses.c(),
			accessibility: assign(a11y.c(), {
				ratio: ratio(a11y.size(), totalSelectors),
			}),
			keyframes: keyframeSelectors.c(),
			prefixed: assign(prefixedSelectors.c(), {
				ratio: ratio(prefixedSelectors.size(), totalSelectors),
			}),
			combinators: combinators.c(),
		},
		declarations: {
			total: totalDeclarations,
			totalUnique: totalUniqueDeclarations,
			uniquenessRatio: ratio(totalUniqueDeclarations, totalDeclarations),
			importants: {
				total: importantDeclarations,
				ratio: ratio(importantDeclarations, totalDeclarations),
				inKeyframes: {
					total: importantsInKeyframes,
					ratio: ratio(importantsInKeyframes, importantDeclarations),
				},
			},
			complexity: declarationComplexity,
			nesting: assign(
				declarationNesting.aggregate(),
				{
					items: declarationNesting.toArray(),
				},
				uniqueDeclarationNesting.c(),
			),
		},
		properties: assign(properties.c(), {
			prefixed: assign(propertyVendorPrefixes.c(), {
				ratio: ratio(propertyVendorPrefixes.size(), properties.size()),
			}),
			custom: assign(customProperties.c(), {
				ratio: ratio(customProperties.size(), properties.size()),
				importants: assign(importantCustomProperties.c(), {
					ratio: ratio(importantCustomProperties.size(), customProperties.size()),
				}),
			}),
			browserhacks: assign(propertyHacks.c(), {
				ratio: ratio(propertyHacks.size(), properties.size()),
			}),
			complexity: propertyComplexity,
		}),
		values: {
			colors: assign(colors.count(), {
				formats: colorFormats.c(),
			}),
			gradients: gradients.c(),
			fontFamilies: fontFamilies.c(),
			fontSizes: fontSizes.c(),
			lineHeights: lineHeights.c(),
			zindexes: zindex.c(),
			textShadows: textShadows.c(),
			boxShadows: boxShadows.c(),
			borderRadiuses: borderRadiuses.count(),
			animations: {
				durations: durations.c(),
				timingFunctions: timingFunctions.c(),
			},
			prefixes: vendorPrefixedValues.c(),
			browserhacks: valueBrowserhacks.c(),
			units: units.count(),
			complexity: valueComplexity,
			keywords: valueKeywords.c(),
			resets: resets.c(),
		},
		__meta__: {
			parseTime: startAnalysis - startParse,
			analyzeTime: Date.now() - startAnalysis,
			total: Date.now() - start,
		},
	}
}

/**
 * Compare specificity A to Specificity B
 * @returns 0 when a==b, 1 when a<b, -1 when a>b
 */
export function compareSpecificity(a: Specificity, b: Specificity): number {
	if (a[0] === b[0]) {
		if (a[1] === b[1]) {
			return b[2] - a[2]
		}

		return b[1] - a[1]
	}

	return b[0] - a[0]
}

export {
	getComplexity as selectorComplexity,
	isPrefixed as isSelectorPrefixed,
	isAccessibility as isAccessibilitySelector,
} from './selectors/utils.js'

export { isSupportsBrowserhack, isMediaBrowserhack } from './atrules/atrules.js'

export { isHack as isPropertyHack } from './properties/property-utils.js'

export { isValuePrefixed } from './values/vendor-prefix.js'

export { colorFunctions, colorKeywords, namedColors, systemColors } from './values/colors.js'

export { keywords as cssKeywords } from './values/values.js'

export { hasVendorPrefix } from './vendor-prefix.js'

export { KeywordSet } from './keyword-set.js'

export type { Location, UniqueWithLocations } from './collection.js'
