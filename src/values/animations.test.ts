import { test } from 'vitest'
import { expect } from 'vitest'
import { analyze } from '../index.js'

test('finds simple durations', () => {
	const fixture = `
    durations {
      animation-duration: 1s;
      animation-duration: 2ms;
      transition-duration: 300ms;
      --my-transition-duration: 0s;
    }
  `
	const actual = analyze(fixture).values.animations.durations
	const expected = {
		total: 3,
		totalUnique: 3,
		unique: {
			'1s': 1,
			'2ms': 1,
			'300ms': 1,
		},
		uniquenessRatio: 3 / 3,
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
	const actual = analyze(fixture).values.animations.durations
	const expected = {
		total: 4,
		totalUnique: 3,
		unique: {
			'1s': 2,
			'300ms': 1,
			'400ms': 1,
		},
		uniquenessRatio: 3 / 4,
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
	const actual = analyze(fixture).values.animations.durations
	const expected = {
		total: 5,
		totalUnique: 3,
		unique: {
			'1s': 2,
			'300ms': 2,
			'var(--myDur)': 1,
		},
		uniquenessRatio: 3 / 5,
	}
	expect(actual).toEqual(expected)
})

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
	const actual = analyze(fixture).values.animations.timingFunctions
	const expected = {
		total: 4,
		totalUnique: 3,
		unique: {
			linear: 1,
			'cubic-bezier(0, 1, 0, 1)': 2,
			'steps(3)': 1,
		},
		uniquenessRatio: 3 / 4,
	}
	expect(actual).toEqual(expected)
})

test('finds timing functions in value lists', () => {
	const fixture = `
    timings {
      animation-timing-function: ease, step-start, cubic-bezier(0.1, 0.7, 1, 0.1);
    }
  `
	const actual = analyze(fixture).values.animations.timingFunctions
	const expected = {
		total: 3,
		totalUnique: 3,
		unique: {
			ease: 1,
			'step-start': 1,
			'cubic-bezier(0.1, 0.7, 1, 0.1)': 1,
		},
		uniquenessRatio: 1,
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
	const actual = analyze(fixture).values.animations.durations
	const expected = {
		total: 7,
		totalUnique: 5,
		unique: {
			'1s': 1,
			'2s': 2,
			'3s': 1,
			'4s': 1,
			'5s': 2,
		},
		uniquenessRatio: 5 / 7,
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
	const actual = analyze(fixture).values.animations.timingFunctions
	const expected = {
		total: 6,
		totalUnique: 2,
		unique: {
			linear: 3,
			'cubic-bezier(0,1,0,1)': 3,
		},
		uniquenessRatio: 2 / 6,
	}
	expect(actual).toEqual(expected)
})

test('analyzes animations/transitions with value lists', () => {
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
	const actual = analyze(fixture).values.animations
	const expected = {
		durations: {
			total: 14,
			totalUnique: 14,
			unique: {
				'1s': 1,
				'2s': 1,
				'3s': 1,
				'4s': 1,
				'5s': 1,
				'6s': 1,
				'7s': 1,
				'8s': 1,
				'9s': 1,
				'10s': 1,
				'11s': 1,
				'12s': 1,
				'13ms': 1,
				'0.0014s': 1,
			},
			uniquenessRatio: 14 / 14,
		},
		timingFunctions: {
			total: 8,
			totalUnique: 5,
			unique: {
				linear: 3,
				ease: 2,
				'ease-in-out': 1,
				'steps(4, step-end)': 1,
				'steps(2)': 1,
			},
			uniquenessRatio: 5 / 8,
		},
	}
	expect(actual).toEqual(expected)
})
