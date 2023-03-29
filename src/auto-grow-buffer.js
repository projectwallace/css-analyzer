export class AutoGrowBuffer {
	constructor(size = 512) {
		this._size = size
		this.items = new Uint32Array(size)
		this.cursor = 0
	}

	/** @param {number} item */
	push(item) {
		if (this._size == this.cursor) {
			if (this._size >= 128) {
				this._size = Math.ceil(this._size * 1.3)
			} else {
				this._size = this._size * 2
			}
			let newItems = new Uint32Array(this._size)
			newItems.set(this.items)
			this.items = newItems
		}

		this.items[this.cursor] = item
		this.cursor++
	}

	/** @param {number} index */
	at(index) {
		return this.items[index]
	}

	/** @param {number} item */
	indexOf(item) {
		return this.items.indexOf(item)
	}

	/** @param {number} item */
	has(item) {
		return this.indexOf(item) != -1
	}

	size() {
		return this._size
	}

	/**
	 * @param {number} start
	 * @param {number} end
	 */
	slice(start, end) {
		return this.items.slice(start, end)
	}
}
