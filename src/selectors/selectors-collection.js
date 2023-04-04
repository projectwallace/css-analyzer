import { AutoGrowBuffer } from "../auto-grow-buffer.js"
import { isAccessibility, getComplexity } from "./utils.js"
import { calculate } from '@bramus/specificity/core'

const BIT_MASK_8 = 2 ** 8 - 1
const A11Y_OFFSET = 30
const BIT_MASK_A11Y = 2 ** A11Y_OFFSET - 1

export class SelectorsCollection {
	constructor() {
		this.total = 0
		this.total_unique = 0
		this.complexities_and_accessibilities = new AutoGrowBuffer()
		this.specificities = new AutoGrowBuffer()
		this.unique = new AutoGrowBuffer()
		this.indexes = new AutoGrowBuffer()
	}

	/**
	 *
	 * @param {import('css-tree').Selector} node
	 * @param {number} hash
	 * @param {number} nodeIndex
	 */
	add(node, hash, nodeIndex) {
		let complexity_and_a11y = 0
		if (isAccessibility(node)) {
			complexity_and_a11y += 1 << A11Y_OFFSET
		}
		complexity_and_a11y += getComplexity(node)[0]
		this.complexities_and_accessibilities.push(complexity_and_a11y)

		const [{ value: specificityObj }] = calculate(node)
		this.specificities.push(
			(specificityObj.a << 24) + (specificityObj.b << 16) + specificityObj.c
		)
		this.indexes.push(nodeIndex)

		if (!this.unique.has(hash)) {
			this.unique.push(hash)
			this.total_unique++
		}

		this.total++
	}

	/**
	 * @typedef Selector
	 * @property {number} complexity
	 * @property {[number, number, number]} specificity
	 * @property {boolean} is_id
	 * @property {boolean} is_accessibility
	 * @property {boolean} is_prefixed
	 */

	/** @param {number} index */
	at(index) {
		let s = this.specificities.at(index)
		let specificity = [
			(s >> 24) & BIT_MASK_8,
			(s >> 16) & BIT_MASK_8,
			s & BIT_MASK_8,
		]

		let complexitiesAndAccessibilities = this.complexities_and_accessibilities.at(index)
		let complexity = complexitiesAndAccessibilities & BIT_MASK_A11Y
		let is_accessibility = complexitiesAndAccessibilities >> A11Y_OFFSET == 1

		return {
			complexity,
			specificity,
			is_id: specificity[0] > 0,
			is_accessibility,
			node_index: this.indexes.at(index),
		}
	}

	forEach(callback) {
		for (let index = 0; index < this.total; index++) {
			callback(this.at(index))
		}
	}
}
