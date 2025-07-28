export class LocationList {
	// TODO: we can probably store more than one integer in a single Uint32Array
	// e.g. line and length could be stored in a single Uint32Array
	#size = 0;
	#lines: Uint32Array;
	#columns: Uint32Array;
	#starts: Uint32Array;
	#lengths: Uint16Array;

	constructor(size: number) {
		this.#lines = new Uint32Array(size)
		this.#columns = new Uint32Array(size)
		this.#starts = new Uint32Array(size)
		this.#lengths = new Uint16Array(size)
	}

	add(line: number, column: number, start: number, end: number) {
		let location_index = this.#size
		this.#lines[location_index] = line
		this.#columns[location_index] = column
		this.#starts[location_index] = start
		this.#lengths[location_index] = end - start

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
