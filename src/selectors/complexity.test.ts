import { test, expect } from 'vitest'
import { analyze } from '../index.js'

const fixture = `
  *,
  * + *,
  a,
  a b,
  a + b,
  a ~ b,
  #id,
  .className,
  [attr],
  [attr=value],
  :where(#id, .class),
  :where(#a #b #c #d #e #f #g #h #i #j #k #l #m #n #o #p #q #r #s #t #u #v #w #x #y #z),
  main > :is(h1, h2),
  input[type=text]::-webkit-input-placeholder,
  ::-webkit-scrollbar,
  :-moz-any(header, footer) {}
`

test('calculates complexity', () => {
	const actual = analyze(fixture, { samples: true }).selectors.complexity.items
	const expected = [1, 3, 1, 3, 3, 3, 1, 1, 1, 2, 3, 52, 5, 5, 2, 4]

	expect(actual).toEqual(expected)
})

test('calculates complexity with vendor prefixes', () => {
	const actual = analyze(`
  input[type=text]::-webkit-input-placeholder,
  ::-webkit-scrollbar,
  .site-header .main-nav:hover>ul>li:nth-child(1) svg,
  :-moz-any(header, footer) {}

  /* not vendor prefixed */
  no-prefix,
  fake-webkit,
  .-mt-px,
  .-space-x-1,
  .-pd-translate-y-2,
  .-pd-translate-x-full {}
  `).selectors.complexity

	expect(actual.unique).toEqual({
		1: 6,
		5: 1,
		2: 1,
		12: 1,
		4: 1,
	})
})

test('calculates complexity uniqueness', () => {
	const actual = analyze(fixture).selectors.complexity
	const expected = {
		1: 5,
		2: 2,
		3: 5,
		4: 1,
		5: 2,
		52: 1,
	}

	expect(actual.totalUnique).toBe(6)
	expect(actual.uniquenessRatio).toBe(6 / 16)
	expect(actual.unique).toEqual(expected)
})

test('calculates the lowest complexity', () => {
	const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
	const actual = analyze(fixture).selectors.complexity.min
	expect(actual).toBe(1)
})

test('calculates the highest complexity', () => {
	const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
	const actual = analyze(fixture).selectors.complexity.max
	expect(actual).toBe(8)
})

test('calculates the complexity mean', () => {
	const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
	const result = analyze(fixture)
	const actual = result.selectors.complexity.mean
	expect(actual).toBe((1 + 1 + 1 + 8) / 4)
})

test('calculates the complexity mode', () => {
	const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
	const actual = analyze(fixture).selectors.complexity.mode
	expect(actual).toBe(1)
})

test('calculates total complexity', () => {
	const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
	const actual = analyze(fixture).selectors.complexity.sum
	expect(actual).toBe(11)
})
