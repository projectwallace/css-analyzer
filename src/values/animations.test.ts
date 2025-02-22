import { describe, it, expect } from 'vitest'
import { analyze } from '../index.js'

it('finds simple durations', () => {
  const fixture = `
      durations {
        animation-duration: 1s;
        animation-duration: 2ms;
        transition-duration: 300ms;
        --my-transition-duration: 0s;
      }
    `
  const actual = analyze(fixture).values.animations.durations
  expect(actual.total).toBe(3)
  expect(actual.total_unique).toBe(3)
  expect(Array.from(actual.list())).toEqual([
    { name: '1s', count: 1 },
    { name: '2ms', count: 1 },
    { name: '300ms', count: 1 },
  ])
})

it('finds duration lists', () => {
  const fixture = `
      durations {
        animation-duration: 1s, 1s;
        transition-duration: 300ms, 400ms;
      }
    `
  const actual = analyze(fixture).values.animations.durations
  expect(actual.total).toBe(4)
  expect(actual.total_unique).toBe(3)
  expect(Array.from(actual.list())).toEqual([
    { name: '1s', count: 2 },
    { name: '300ms', count: 1 },
    { name: '400ms', count: 1 },
  ])
})

it('finds simple timing functions', () => {
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
  expect(actual.total).toBe(4)
  expect(actual.total_unique).toBe(3)
  expect(Array.from(actual.list())).toEqual([
    { name: 'linear', count: 1 },
    { name: 'cubic-bezier(0, 1, 0, 1)', count: 2 },
    { name: 'steps(3)', count: 1 },
  ])
})

it('finds timing functions in value lists', () => {
  const fixture = `
      timings {
        animation-timing-function: ease, step-start, cubic-bezier(0.1, 0.7, 1, 0.1);
      }
    `
  const actual = analyze(fixture).values.animations.timingFunctions
  expect(actual.total).toBe(3)
  expect(actual.total_unique).toBe(3)
  expect(Array.from(actual.list())).toEqual([
    { name: 'ease', count: 1 },
    { name: 'step-start', count: 1 },
    { name: 'cubic-bezier(0.1, 0.7, 1, 0.1)', count: 1 },
  ])
})

it('finds shorthand durations', () => {
  const fixture = `
      durations {
        animation: 1s ANIMATION_NAME linear;
        animation: 2s ANIMATION_NAME cubic-bezier(0,1,0,1);

        transition: all 3s;
        transition: all 4s cubic-bezier(0,1,0,1);
        transition: all 5s linear 5000ms;

        --my-animation: invalid;
        --my-transition: invalid;
      }
    `
  const actual = analyze(fixture).values.animations.durations
  expect(actual.total).toBe(5)
  expect(actual.total_unique).toBe(5)
  expect(Array.from(actual.list())).toEqual([
    { name: '1s', count: 1 },
    { name: '2s', count: 1 },
    { name: '3s', count: 1 },
    { name: '4s', count: 1 },
    { name: '5s', count: 1 },
  ])
})

it('finds shorthand timing functions', () => {
  const fixture = `
      durations {
        animation: 1s ANIMATION_NAME linear;
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
  expect(actual.total).toBe(5)
  expect(actual.total_unique).toBe(3)
  expect(Array.from(actual.list())).toEqual([
    { name: 'linear', count: 2 },
    { name: 'cubic-bezier(0,1,0,1)', count: 2 },
    { name: 'Cubic-Bezier(0,1,0,1)', count: 1 },
  ])
})

it('analyzes animations/transitions with value lists', () => {
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
  expect(actual.durations.total).toBe(14)
  expect(actual.durations.total_unique).toBe(14)
  expect(Array.from(actual.durations.list())).toEqual([
    { name: '1s', count: 1 },
    { name: '2s', count: 1 },
    { name: '3s', count: 1 },
    { name: '4s', count: 1 },
    { name: '5s', count: 1 },
    { name: '6s', count: 1 },
    { name: '7s', count: 1 },
    { name: '8s', count: 1 },
    { name: '9s', count: 1 },
    { name: '10s', count: 1 },
    { name: '11s', count: 1 },
    { name: '12s', count: 1 },
    { name: '13ms', count: 1 },
    { name: '0.0014s', count: 1 },
  ])
  expect(actual.timingFunctions.total).toBe(8)
  expect(actual.timingFunctions.total_unique).toBe(5)
  expect(Array.from(actual.timingFunctions.list())).toEqual([
    { name: 'linear', count: 3 },
    { name: 'ease', count: 2 },
    { name: 'ease-in-out', count: 1 },
    { name: 'steps(4, step-end)', count: 1 },
    { name: 'steps(2)', count: 1 },
  ])
})
