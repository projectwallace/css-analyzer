import { test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.ts'
import { plain } from '../test-utils.ts'
import { gradients } from './gradients.ts'

function run(css: string) {
	return plain(analyze(css, { result: gradients() }).result)
}

test('finds linear-gradient', () => {
	const fixture = `
    gradient {
      background-image: -webkit-linear-gradient(to right,#00f 10%,rgba(51,51,255,0) 42%);
      background-image: -moz-linear-gradient(to right,#00f 10%,rgba(51,51,255,0) 42%);
      background-image: -o-linear-gradient(to right,#00f 10%,rgba(51,51,255,0) 42%);
      background-image: linear-gradient(to right,#00f 10%,rgba(51,51,255,0) 42%);
			background: linear-gradient(to bottom,#4b7ad9 0,#00f 100%);
			background: linear-gradient(180deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0));
			background: linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);
			background: -webkit-gradient(linear,left top,left bottom,from(#f50),to(#e83c02));
			background: -webkit-gradient(linear,left top,right top,color-stop(50%,#ccc),color-stop(50%,#fff));
    }
  `
	const actual = run(fixture)
	const expected = {
		total: 9,
		unique: {
			'-webkit-linear-gradient(to right,#00f 10%,rgba(51,51,255,0) 42%)': 1,
			'-moz-linear-gradient(to right,#00f 10%,rgba(51,51,255,0) 42%)': 1,
			'-o-linear-gradient(to right,#00f 10%,rgba(51,51,255,0) 42%)': 1,
			'linear-gradient(to right,#00f 10%,rgba(51,51,255,0) 42%)': 1,
			'linear-gradient(to bottom,#4b7ad9 0,#00f 100%)': 1,
			'linear-gradient(180deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0))': 1,
			'linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent)': 1,
			'-webkit-gradient(linear,left top,left bottom,from(#f50),to(#e83c02))': 1,
			'-webkit-gradient(linear,left top,right top,color-stop(50%,#ccc),color-stop(50%,#fff))': 1,
		},
		total_unique: 9,
	}

	expect(actual).toEqual(expected)
})

test('finds repeating-linear-gradient', () => {
	const fixture = `
    gradient {
      background-image: repeating-linear-gradient(45deg,transparent,transparent 8px,rgba(0,0,0,.03) 8px,rgba(0,0,0,.03) 10px);
			background-image: repeating-linear-gradient(135deg,rgba(255,255,255,.5),rgba(255,255,255,.5) 2px,#000 2px,#000 4px);

			/* MDN */
			background-image: repeating-linear-gradient(
				-45deg,
				transparent,
				transparent 20px,
				black 20px,
				black 40px
			);
			/* with multiple color stop lengths */
			background-image: repeating-linear-gradient(
				-45deg,
				transparent 0 20px,
				black 20px 40px
			);
			background-image: repeating-linear-gradient(
				to bottom,
				rgb(26, 198, 204),
				rgb(26, 198, 204) 7%,
				rgb(100, 100, 100) 10%
			);
    }
  `
	const actual = run(fixture)
	const x = `repeating-linear-gradient(
				-45deg,
				transparent,
				transparent 20px,
				black 20px,
				black 40px
			)`
	const y = `repeating-linear-gradient(
				-45deg,
				transparent 0 20px,
				black 20px 40px
			)`
	const z = `repeating-linear-gradient(
				to bottom,
				rgb(26, 198, 204),
				rgb(26, 198, 204) 7%,
				rgb(100, 100, 100) 10%
			)`
	const expected = {
		total: 5,
		unique: {
			'repeating-linear-gradient(45deg,transparent,transparent 8px,rgba(0,0,0,.03) 8px,rgba(0,0,0,.03) 10px)': 1,
			'repeating-linear-gradient(135deg,rgba(255,255,255,.5),rgba(255,255,255,.5) 2px,#000 2px,#000 4px)': 1,
			[x]: 1,
			[y]: 1,
			[z]: 1,
		},
		total_unique: 5,
	}

	expect(actual).toEqual(expected)
})

test('finds radial gradient', () => {
	const fixture = `
    radial {
      background-image: -webkit-radial-gradient(0% 100%,circle farthest-corner,rgba(255,255,255,.8) 40%,#e5f4e9 0);
			background-image: -moz-radial-gradient(0% 100%,circle farthest-corner,rgba(255,255,255,.8) 40%,#e5f4e9 0);
			background-image: -o-radial-gradient(0% 100%,circle farthest-corner,rgba(255,255,255,.8) 40%,#e5f4e9 0);
			background-image: radial-gradient(0% 100%,circle farthest-corner,rgba(255,255,255,.8) 40%,#e5f4e9 0);
			background: radial-gradient(85.37% 69.72% at 50% 12.59%, rgba(255, 0, 0, 0.8) 3.14%, rgba(178, 1, 1, 0.8) 62.94%, rgba(47, 3, 3, 0.424) 100%);
    }
  `
	const actual = run(fixture)
	const expected = {
		total: 5,
		unique: {
			'-webkit-radial-gradient(0% 100%,circle farthest-corner,rgba(255,255,255,.8) 40%,#e5f4e9 0)': 1,
			'-moz-radial-gradient(0% 100%,circle farthest-corner,rgba(255,255,255,.8) 40%,#e5f4e9 0)': 1,
			'-o-radial-gradient(0% 100%,circle farthest-corner,rgba(255,255,255,.8) 40%,#e5f4e9 0)': 1,
			'radial-gradient(0% 100%,circle farthest-corner,rgba(255,255,255,.8) 40%,#e5f4e9 0)': 1,
			'radial-gradient(85.37% 69.72% at 50% 12.59%, rgba(255, 0, 0, 0.8) 3.14%, rgba(178, 1, 1, 0.8) 62.94%, rgba(47, 3, 3, 0.424) 100%)': 1,
		},
		total_unique: 5,
	}

	expect(actual).toEqual(expected)
})

test('finds repeating-radial-gradient', () => {
	const fixture = `
    gradient {
      background: repeating-radial-gradient(
				black,
				black 5px,
				white 5px,
				white 10px
			);
			background: repeating-radial-gradient(
				ellipse farthest-corner at 20% 20%,
				red,
				black 5%,
				blue 5%,
				green 10%
			);
			background: repeating-radial-gradient(
				ellipse farthest-corner at 20% 20%,
				red 0 5%,
				green 5% 10%
			);
    }
  `
	const actual = run(fixture)
	const x = `repeating-radial-gradient(
				black,
				black 5px,
				white 5px,
				white 10px
			)`
	const y = `repeating-radial-gradient(
				ellipse farthest-corner at 20% 20%,
				red,
				black 5%,
				blue 5%,
				green 10%
			)`
	const z = `repeating-radial-gradient(
				ellipse farthest-corner at 20% 20%,
				red 0 5%,
				green 5% 10%
			)`
	const expected = {
		total: 3,
		unique: {
			[x]: 1,
			[y]: 1,
			[z]: 1,
		},
		total_unique: 3,
	}

	expect(actual).toEqual(expected)
})

test('finds conic gradient', () => {
	const fixture = `
    conic {
      /* A conic gradient rotated 45 degrees,
			starting blue and finishing red */
			background: conic-gradient(from 45deg, blue, red);

			/* A bluish purple box: the gradient goes from blue to red,
				but only the bottom right quadrant is visible, as the
				center of the conic gradient is at the top left corner */
			background: conic-gradient(from 90deg at 0 0, blue, red);

			/* Color wheel */
			background: conic-gradient(
				hsl(360, 100%, 50%),
				hsl(315, 100%, 50%),
				hsl(270, 100%, 50%),
				hsl(225, 100%, 50%),
				hsl(180, 100%, 50%),
				hsl(135, 100%, 50%),
				hsl(90, 100%, 50%),
				hsl(45, 100%, 50%),
				hsl(0, 100%, 50%)
			);
    }
  `
	const wheel = `conic-gradient(
				hsl(360, 100%, 50%),
				hsl(315, 100%, 50%),
				hsl(270, 100%, 50%),
				hsl(225, 100%, 50%),
				hsl(180, 100%, 50%),
				hsl(135, 100%, 50%),
				hsl(90, 100%, 50%),
				hsl(45, 100%, 50%),
				hsl(0, 100%, 50%)
			)`
	const actual = run(fixture)
	const expected = {
		total: 3,
		unique: {
			'conic-gradient(from 45deg, blue, red)': 1,
			'conic-gradient(from 90deg at 0 0, blue, red)': 1,
			[wheel]: 1,
		},
		total_unique: 3,
	}

	expect(actual).toEqual(expected)
})

test('finds repeating-conic-gradient', () => {
	const fixture = `
    gradient {
			background: repeating-conic-gradient(
				from 3deg at 25% 25%,
				green,
				blue 2deg 5deg,
				green,
				yellow 15deg 18deg,
				green 20deg
			);
			background-image: repeating-conic-gradient(#fff 0 9deg, #000 9deg 18deg);
      background: repeating-conic-gradient(red, orange, yellow, green, blue 50%);
			background: repeating-conic-gradient(from -45deg, red 45deg, orange, yellow, green, blue 225deg);
    }
  `
	const actual = run(fixture)
	const x = `repeating-conic-gradient(
				from 3deg at 25% 25%,
				green,
				blue 2deg 5deg,
				green,
				yellow 15deg 18deg,
				green 20deg
			)`
	const expected = {
		total: 4,
		unique: {
			[x]: 1,
			'repeating-conic-gradient(#fff 0 9deg, #000 9deg 18deg)': 1,
			'repeating-conic-gradient(red, orange, yellow, green, blue 50%)': 1,
			'repeating-conic-gradient(from -45deg, red 45deg, orange, yellow, green, blue 225deg)': 1,
		},
		total_unique: 4,
	}

	expect(actual).toEqual(expected)
})

test('ignores keywords', () => {
	const fixture = `
    keywords {
      background-image: none;

      /* Global values */
      background-image: inherit;
      background-image: initial;
      background-image: revert;
      background-image: revert-layer;
      background-image: unset;
    }
  `
	const actual = run(fixture)
	const expected = {
		total: 0,
		unique: {},
		total_unique: 0,
	}

	expect(actual).toEqual(expected)
})
