import { test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.ts'
import { plain } from '../test-utils.ts'
import { timing_functions } from './timing-functions.ts'

function run(css: string) {
	return plain(analyze(css, { result: timing_functions() }).result)
}

test('finds simple timing functions', () => {
	const fixture = `
    timings {
      animation-timing-function: linear;
      animation-timing-function: cubic-bezier(0, 1, 0, 1);

      transition-timing-function: steps(3);
      transition-timing-function: cubic-bezier(0, 1, 0, 1);

      --my-animation-timing-function: invalid;
      --my-transition-timing-function: invalid;
    }
  `
	const actual = run(fixture)
	const expected = {
		total: 4,
		total_unique: 3,
		unique: {
			linear: 1,
			'cubic-bezier(0, 1, 0, 1)': 2,
			'steps(3)': 1,
		},
	}
	expect(actual).toEqual(expected)
})

test('finds timing functions in value lists', () => {
	const fixture = `
    timings {
      animation-timing-function: ease, step-start, cubic-bezier(0.1, 0.7, 1, 0.1);
    }
  `
	const actual = run(fixture)
	const expected = {
		total: 3,
		total_unique: 3,
		unique: {
			ease: 1,
			'step-start': 1,
			'cubic-bezier(0.1, 0.7, 1, 0.1)': 1,
		},
	}
	expect(actual).toEqual(expected)
})

test('finds shorthand timing functions', () => {
	const fixture = `
    durations {
      animation: 1s ANIMATION_NAME linear;
      animation: 1s ANIMATION_NAME LINEAR;
      animation: 2s ANIMATION_NAME cubic-bezier(0,1,0,1);

      transition: all 3s;
      transition: all 4s cubic-bezier(0,1,0,1);
      transition: all 5s linear 5000ms;

      transition: all 6s Cubic-Bezier(0,1,0,1);

      --my-animation: invalid;
      --my-transition: invalid;
    }
  `
	const actual = run(fixture)
	const expected = {
		total: 6,
		total_unique: 2,
		unique: {
			linear: 3,
			'cubic-bezier(0,1,0,1)': 3,
		},
	}
	expect(actual).toEqual(expected)
})

test('counts timing functions of animations and transitions with value lists', () => {
	const fixture = `
    multi-value {
      animation: 1s ANIMATION_NAME linear, 2s ANIMATION_NAME linear;
      animation: 3s ANIMATION_NAME ease 3ms, 4s ANIMATION_NAME ease-in-out 4ms;
      transition: all 5s, color 6s;
      transition: all 7s ease, all 8s linear;
      transition: all 9s steps(4, step-end) 9ms, all 10s steps(2) 10ms;
      transition: all 11s, font-size 12s 12ms, line-height 13ms, border 0.0014s;
    }
  `
	expect(run(fixture)).toEqual({
		total: 8,
		total_unique: 5,
		unique: {
			linear: 3,
			ease: 2,
			'ease-in-out': 1,
			'steps(4, step-end)': 1,
			'steps(2)': 1,
		},
	})
})
