type BufferType = Uint8ArrayConstructor | Uint16ArrayConstructor | Uint32ArrayConstructor;

export class AutoSizeUintArray {
	#buffer_type: BufferType;
	#buffer: Uint8Array | Uint16Array | Uint32Array;
	#cursor: number;

	constructor(initial_size: number = 16, TypedArray: BufferType = Uint16Array) {
		this.#buffer = new TypedArray(initial_size)
		this.#buffer_type = TypedArray
		this.#cursor = 0
		return this
	}

	#grow() {
		let new_size = this.#buffer.length * 2
		let new_buffer = new this.#buffer_type(new_size)
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

	set(index: number, n: number) {
		this.#buffer[index] = n
	}

	at(index: number): number {
		return this.#buffer[index]!
	}

	get length() {
		return this.#cursor
	}

	*[Symbol.iterator]() {
		for (let i = 0; i < this.#cursor; i++) {
			yield this.#buffer[i]!
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