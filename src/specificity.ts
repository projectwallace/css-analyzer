/**
 * @returns >0 if a is greater than b, 0 if equal, <0 if a is smaller than b
 */
function compare_specificity(a1: number, b1: number, c1: number, a2: number, b2: number, c2: number): number {
	if (a1 === a2) {
		if (b1 === b2) {
			return c2 - c1
		}

		return b2 - b1
	}

	return a2 - a1
}

export class Specificity {
	// Uint8Array allows specificity values to be between 0 and 255
	// Uses less memory than 3 seperate numbers (Uint8Array is 3 bytes, 3 numbers would be 3*8=24 bytes)
	#value: Uint8Array;

	constructor(a: number, b: number, c: number) {
		this.#value = new Uint8Array(3)
		this.#value[0] = a
		this.#value[1] = b
		this.#value[2] = c
	}

	at(index: number): number {
		return this.#value[index]!
	}

	/**
	 * Returns the specificity as an array of numbers instead of JSON.stringify's default behavior of converting it to an
	 * object with indexes as key and the value as value => {"0": 1, "1": 2, "2": 3 }
	 */
	toJSON() {
		return [this.at(0), this.at(1), this.at(2)]
	}

	add(specificity: Specificity): void {
		this.#value[0]! += specificity.at(0)
		this.#value[1]! += specificity.at(1)
		this.#value[2]! += specificity.at(2)
	}

	compare(specificity: Specificity): number {
		return compare_specificity(
			this.#value[0]!, this.#value[1]!, this.#value[2]!,
			specificity.at(0), specificity.at(1), specificity.at(2)
		)
	}
}
