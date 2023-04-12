import walk from 'css-tree/walker'
import { isHack, isCustom } from './property-utils.js'
import { hasVendorPrefix } from '../vendor-prefix.js'

export function walkProperties(ast, callback) {
	walk(ast, {
		visit: 'Declaration',
		/** @param {import('css-tree').Declaration} node */
		enter: function (node) {
			// Do not process Declarations in atRule preludes
			// because we will handle them manually
			if (this.atrulePrelude !== null) {
				return this.skip
			}

			let property = node.property

			let complexity = 1
			let has_vendor_prefix = false
			let is_custom = false
			let is_browserhack = false

			if (isCustom(property)) {
				complexity++
				is_custom = true
			} else if (hasVendorPrefix(property)) {
				complexity++
				has_vendor_prefix = true
			} else if (isHack(property)) {
				complexity++
				is_browserhack = true
			}

			callback({
				property,
				complexity,
				is_custom,
				is_browserhack,
				has_vendor_prefix,
				is_important: node.important === true
			})

			return this.skip
		}
	})
}