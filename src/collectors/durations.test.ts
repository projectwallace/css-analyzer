import { test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.js'
import { plain } from '../test-utils.js'
import { durations } from './durations.js'

function run(css: string) {
	return plain(analyze(css, { result: durations() }).result)
}

test('finds simple durations', () => {
	const fixture = `
    durations {
      animation-duration: 1s;
      animation-duration: 2ms;
      transition-duration: 300ms;
      --my-transition-duration: 0s;
    }
  `
	const actual = run(fixture)
	const expected = {
		total: 3,
		total_unique: 3,
		unique: {
			'1s': 1,
			'2ms': 1,
			'300ms': 1,
		},
	}
	expect(actual).toEqual(expected)
})

test('finds duration lists', () => {
	const fixture = `
    durations {
      animation-duration: 1s, 1s;
      transition-duration: 300ms, 400ms;
    }
  `
	const actual = run(fixture)
	const expected = {
		total: 4,
		total_unique: 3,
		unique: {
			'1s': 2,
			'300ms': 1,
			'400ms': 1,
		},
	}
	expect(actual).toEqual(expected)
})

test('normalizes durations', () => {
	const fixture = `
    durations {
      animation-duration: 1S, 1s;
      transition-duration: 300ms, 300MS;
      animation-duration: var(--myDur);
    }
  `
	const actual = run(fixture)
	const expected = {
		total: 5,
		total_unique: 3,
		unique: {
			'1s': 2,
			'300ms': 2,
			'var(--myDur)': 1,
		},
	}
	expect(actual).toEqual(expected)
})

test('finds shorthand durations', () => {
	const fixture = `
    durations {
      animation: 1s ANIMATION_NAME linear;
      animation: 2s ANIMATION_NAME cubic-bezier(0,1,0,1);
      animation: 2S ANIMATION_NAME cubic-bezier(0,1,0,1);

      transition: all 3s;
      transition: all 4s cubic-bezier(0,1,0,1);
      transition: all 5s linear 5000ms;
      transition: all 5S linear 5000ms;

      --my-animation: invalid;
      --my-transition: invalid;
    }
  `
	const actual = run(fixture)
	const expected = {
		total: 7,
		total_unique: 5,
		unique: {
			'1s': 1,
			'2s': 2,
			'3s': 1,
			'4s': 1,
			'5s': 2,
		},
	}
	expect(actual).toEqual(expected)
})

test('counts durations of animations and transitions with value lists', () => {
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
	const actual = run(fixture)
	expect(actual.total).toBe(14)
	expect(actual.total_unique).toBe(14)
	expect(Object.keys(actual.unique)).toEqual([
		'1s',
		'2s',
		'3s',
		'4s',
		'5s',
		'6s',
		'7s',
		'8s',
		'9s',
		'10s',
		'11s',
		'12s',
		'13ms',
		'0.0014s',
	])
})
