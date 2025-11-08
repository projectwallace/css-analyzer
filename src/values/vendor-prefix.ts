import { hasVendorPrefix } from '../vendor-prefix.js'
import { Func, Identifier } from '../css-tree-node-types.js'
import type { CssNode, Value } from 'css-tree'

export function isValuePrefixed(node: Value | CssNode): boolean {
	// @ts-expect-error TODO: fix this
	let children = node.children

	if (!children) {
		return false
	}

	for (let node of children) {
		let { type, name } = node

		if (type === Identifier && hasVendorPrefix(name)) {
			return true
		}

		if (type === Func) {
			if (hasVendorPrefix(name) || isValuePrefixed(node)) {
				return true
			}
		}
	}

	return false
}
