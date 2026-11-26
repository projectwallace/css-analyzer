import { test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.ts'
import { plain } from '../../test/test-utils.ts'
import { mixins } from './mixins.ts'

function run(css: string) {
	return analyze(css, { result: mixins() }).result
}

test('counts defined mixins and tracks their use', () => {
	const result = run(`
    @mixin --a(--x) { color: red; }
    @mixin --b { color: blue; }
    a { @apply --a(1px); @apply --c; }
  `)
	expect(plain(result)).toMatchObject({ total: 2, unique: { '--a': 1, '--b': 1 } })
	expect(result.defined).toEqual(['--a', '--b'])
	expect(result.used).toEqual(['--a', '--c'])
	expect(result.unused).toEqual(['--b'])
	expect(result.unknown).toEqual(['--c'])
})

test('ignores other at-rules', () => {
	expect(run('@function --a() { result: 1; } @media print { a { color: red } }').total).toBe(0)
})
