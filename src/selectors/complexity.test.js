import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { analyze } from '../index.js'

const Complexity = suite('Selector Complexity')

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

Complexity('calculates complexity', () => {
  const actual = analyze(fixture).selectors.complexity.items
  const expected = [
    1,
    3,
    1,
    3,
    3,
    3,
    1,
    1,
    1,
    2,
    3,
    52,
    5,
    5,
    2,
    4,
  ]

  assert.equal(actual, expected)
})

Complexity('calculates complexity with vendor prefixes', () => {
  const actual = analyze(`
  no-prefix,
  fake-webkit,
  input[type=text]::-webkit-input-placeholder,
  ::-webkit-scrollbar,
  .site-header .main-nav:hover>ul>li:nth-child(1) svg,
  :-moz-any(header, footer) {}
  `).selectors.complexity

  assert.equal(actual.unique, {
    '1': 2,
    '5': 1,
    '2': 1,
    '12': 1,
    '4': 1,
  })
})

Complexity('calculates complexity uniqueness', () => {
  const actual = analyze(fixture).selectors.complexity
  const expected = {
    '1': 5,
    '2': 2,
    '3': 5,
    '4': 1,
    '5': 2,
    '52': 1,
  }

  assert.is(actual.totalUnique, 6)
  assert.is(actual.uniquenessRatio, 6 / 16)
  assert.equal(actual.unique, expected)
})

Complexity('calculates the lowest complexity', () => {
  const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
  const actual = analyze(fixture).selectors.complexity.min
  assert.equal(actual, 1)
})

Complexity('calculates the highest complexity', () => {
  const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
  const actual = analyze(fixture).selectors.complexity.max
  assert.equal(actual, 8)
})

Complexity('calculates the complexity mean', () => {
  const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
  const result = analyze(fixture)
  const actual = result.selectors.complexity.mean
  assert.equal(actual, (1 + 1 + 1 + 8) / 4)
})

Complexity('calculates the complexity mode', () => {
  const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
  const actual = analyze(fixture).selectors.complexity.mode
  assert.equal(actual, 1)
})

Complexity('calculates the complexity median', () => {
  const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > check {}
  `
  const actual = analyze(fixture).selectors.complexity.median
  assert.equal(actual, 1)
})

Complexity('calculates total complexity', () => {
  const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
  const actual = analyze(fixture).selectors.complexity.sum
  assert.equal(actual, 11)
})

Complexity.run()