import { LocationList } from './location-list.js'

export class AtruleCollection {
	#locations: LocationList

	constructor() {
		this.#locations = new LocationList()
	}

	add(line: number, column: number, start: number, end: number) {
		this.#locations.add(line, column, start, end)
		// - atrule type (number: font-face=1, media=2, supports, keyframes, container, layer, property, import)
		// - is_prefixed (boolean: -webkit-keyframes=true)
		// - prelude (string: screen and (min-width: 600px))
	}
}
