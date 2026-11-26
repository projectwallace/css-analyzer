import { test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.ts'
import { plain } from '../../test/test-utils.ts'
import { functions } from './functions.ts'

function run(css: string) {
	return analyze(css, { result: functions() }).result
}

test('counts defined functions and tracks their use', () => {
	const result = run(`
    @function --neg(--a <length>: 1px) returns <length> { result: calc(-1 * var(--a)); }
    @function --unused() { result: 1; }
    a { width: --neg(2px); margin: calc(--neg(1px) + --other()); }
  `)
	expect(plain(result)).toMatchObject({ total: 2, unique: { '--neg': 1, '--unused': 1 } })
	expect(result.defined).toEqual(['--neg', '--unused'])
	expect(result.used).toEqual(['--neg', '--other'])
	expect(result.unused).toEqual(['--unused'])
	expect(result.unknown).toEqual(['--other'])
})

test('ignores built-in functions', () => {
	expect(run('a { width: calc(1px + var(--x)) }').used).toEqual([])
})
