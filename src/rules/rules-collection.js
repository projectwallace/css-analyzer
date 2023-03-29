import { AutoGrowBuffer } from "../auto-grow-buffer.js"

const BIT_MASK_16 = 2 ** 16 - 1

class UniqueNumberCounter {
	constructor() {
		this.total = 0
		this.total_unique = 0
		this.values = new AutoGrowBuffer(48)
		this.counts = new AutoGrowBuffer(48)
	}

	/** @param {number} number */
	add(number) {
		let index = this.values.indexOf(number)
		this.total++

		if (index === -1) {
			let new_index = this.values.push(number)
			this.counts.set(new_index, 1)
			this.total_unique++
		} else {
			this.counts.set(index, this.values.at(index) + 1)
		}
	}
}

export class RulesCollection {
	constructor() {
		this.items = new AutoGrowBuffer()
		this.total = 0
		this.total_empty = 0
		this.unique_sizes = new UniqueNumberCounter()
		this.unique_declaration_sizes = new UniqueNumberCounter()
		this.unique_selector_sizes = new UniqueNumberCounter()
	}

	/**
	 * @param {number} selector_count
	 * @param {number} declaration_count
	 */
	add(selector_count, declaration_count) {
		let value = 0
		value += selector_count << 16
		value += declaration_count
		this.items.push(value)
		this.unique_sizes.add(selector_count + declaration_count)
		this.unique_selector_sizes.add(selector_count)
		this.unique_declaration_sizes.add(declaration_count)

		this.total++

		if (declaration_count === 0) {
			this.total_empty++
		}
	}

	/**
	 * @typedef Rule
	 * @property {number} selector_count
	 * @property {number} declaration_count
	 * @property {boolean} is_empty
	 * @property {number} size
	 */

	/** @param {number} index */
	at(index) {
		let item = this.items.at(index)
		let selector_count = item >> 16 & BIT_MASK_16
		let declaration_count = item & BIT_MASK_16

		return {
			selector_count,
			declaration_count,
			size: selector_count + declaration_count,
			is_empty: declaration_count === 0,
		}
	}

	/**
	 * @callback forEachCb
	 * @param {Rule} rule
	 */

	/** @param {forEachCb} callback */
	forEach(callback) {
		let len = this.items.cursor
		for (let index = 0; index < len; index++) {
			callback(this.at(index))
		}
	}
}