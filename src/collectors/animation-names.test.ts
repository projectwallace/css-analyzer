import { test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.js'
import { plain } from '../test-utils.js'
import { animation_names } from './values.js'

function run(css: string) {
	return plain(analyze(css, { result: animation_names() }).result)
}

test('counts the names of animations in shorthands and lists', () => {
	expect(
		run(`
    multi-value {
      animation: 1s ANIMATION_NAME linear, 2s ANIMATION_NAME linear;
      animation: 3s ANIMATION_NAME ease 3ms, 4s ANIMATION_NAME ease-in-out 4ms;
      transition: all 5s, color 6s;
    }
  `),
	).toEqual({ total: 4, total_unique: 1, unique: { ANIMATION_NAME: 4 } })
})

test('reads animation-name, with strings unquoted and keywords ignored', () => {
	expect(run('a { animation-name: spin, "quoted name", none, fade }').unique).toEqual({
		spin: 1,
		'quoted name': 1,
		fade: 1,
	})
})

test('transitions have no animation names', () => {
	expect(run('a { transition: opacity 1s ease }').total).toBe(0)
})
