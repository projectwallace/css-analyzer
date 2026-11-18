import { type Atrule, is_declaration } from '@projectwallace/css-parser'

/** The `descriptor: value` pairs in the block of an at-rule like `@font-face` or `@property`; names are lowercased, values as written */
export function get_atrule_descriptors(node: Atrule): Record<string, string> {
	const descriptors: Record<string, string> = Object.create(null)
	node.block?.for_each(function (child) {
		if (is_declaration(child) && child.value) {
			descriptors[child.property.toLowerCase()] = child.value.text
		}
	})
	return descriptors
}
