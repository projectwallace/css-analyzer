export class AutoSizeUintArray {
	#buffer: Uint16Array;
	#cursor: number;

	constructor(initial_size: number) {
		this.#buffer = new Uint16Array(initial_size)
		this.#cursor = 0
		return this
	}

	#grow() {
		let new_size = this.#buffer.length * 2
		let new_buffer = new Uint16Array(new_size)
		for (let i = 0; i < this.#buffer.length; i++) {
			new_buffer[i] = this.#buffer[i]!
		}
		this.#buffer = new_buffer
	}

	push(n: number) {
		if (this.#cursor === this.#buffer.length) {
			this.#grow()
		}
		this.#buffer[this.#cursor] = n
		this.#cursor++
	}

	at(index: number): number {
		return this.#buffer[index]!
	}

	get length() {
		return this.#cursor
	}

	*[Symbol.iterator]() {
		for (let i = 0; i < this.#cursor; i++) {
			yield this.#buffer[i]
		}
	}

	map<T>(cb: (n: number) => T): T[] {
		let list: T[] = []
		for (let n of this) {
			list.push(cb(n!))
		}
		return list
	}
}