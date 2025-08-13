import { AutoSizeUintArray } from './auto-size-uintarray.js'

export class LocationList {
	#size = 0;
	#items: AutoSizeUintArray;

	constructor(size?: number) {
		this.#items = new AutoSizeUintArray(size, Uint32Array)
	}

	/**
	 * @returns The index at which the location was inserted
	 */
	add(line: number, column: number, start: number, end: number) {
		let location_index = this.#size
		this.#items.set(location_index * 4, line)
		this.#items.set(location_index * 4 + 1, column)
		this.#items.set(location_index * 4 + 2, start)
		this.#items.set(location_index * 4 + 3, end)

		this.#size++
		return location_index
	}

	at(index: number) {
		if (index < 0 || index >= this.#size) {
			return undefined
		}
		return {
			line: this.#items.at(index * 4),
			column: this.#items.at((index * 4) + 1),
			start: this.#items.at((index * 4) + 2),
			end: this.#items.at((index * 4) + 3),
		}
	}

	get length() {
		return this.#size
	}
}
