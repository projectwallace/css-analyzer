import { AutoSizeUintArray } from './auto-size-uintarray.js'

export class LocationList {
	// TODO: we can probably store more than one integer in a single Uint32Array
	// e.g. line and length could be stored in a single Uint32Array
	#size = 0;
	#lines: AutoSizeUintArray;
	#columns: AutoSizeUintArray;
	#starts: AutoSizeUintArray;
	#lengths: AutoSizeUintArray;

	constructor(size?: number) {
		this.#lines = new AutoSizeUintArray(size, Uint32Array)
		this.#columns = new AutoSizeUintArray(size, Uint32Array)
		this.#starts = new AutoSizeUintArray(size, Uint32Array)
		this.#lengths = new AutoSizeUintArray(size, Uint16Array)
	}

	add(line: number, column: number, start: number, end: number) {
		let location_index = this.#size
		this.#lines.set(location_index, line)
		this.#columns.set(location_index, column)
		this.#starts.set(location_index, start)
		this.#lengths.set(location_index, end - start)

		this.#size++
		return location_index
	}

	at(index: number) {
		if (index < 0 || index >= this.#size) {
			return undefined
		}

		let start = this.#starts.at(index)
		return {
			line: this.#lines.at(index)!,
			column: this.#columns.at(index)!,
			start: start!,
			end: start! + this.#lengths.at(index)!
		}
	}

	get length() {
		return this.#size
	}
}
