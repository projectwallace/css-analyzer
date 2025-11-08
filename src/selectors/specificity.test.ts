import { test, expect } from 'vitest'
import { analyze } from '../index.js'

test('handles the universal selector', () => {
  const fixture = `
    * {}
  test * {}
  `
  const actual = analyze(fixture).selectors.specificity.items
  const expected = [
    [0, 0, 0],
    [0, 0, 1],
  ]
  expect(actual).toEqual(expected)
})

test('handles ID selectors', () => {
  const fixture = `
    #id,
    .Foo > .Bar ~ .Baz [type="text"] + span::before #bazz #fizz #buzz #brick #house,

    /* https://drafts.csswg.org/selectors-4/#example-d97bd125 */
    :not(span,strong#foo), /* a=1 b=0 c=1 */
    #x34y,                /* a=1 b=0 c=0 */
    #s12:not(FOO)         /* a=1 b=0 c=1 */
    {}
  `
  const actual = analyze(fixture).selectors.specificity.items
  const expected = [
    [1, 0, 0],
    [5, 4, 2],
    [1, 0, 1],
    [1, 0, 0],
    [1, 0, 1],
  ]
  expect(actual).toEqual(expected)
})

test('handles class selectors', () => {
  const fixture = `
    .class,
    .class.class
    {}
  `
  const actual = analyze(fixture).selectors.specificity.items
  const expected = [
    [0, 1, 0],
    [0, 2, 0],
  ]
  expect(actual).toEqual(expected)
})

test('handles element selectors', () => {
  const fixture = `
    element,
    element element
    {}
  `
  const actual = analyze(fixture).selectors.specificity.items
  const expected = [
    [0, 0, 1],
    [0, 0, 2],
  ]
  expect(actual).toEqual(expected)
})

test('handles the :not, :is and :has pseudo classes', () => {
  const fixture = `
    /* https://drafts.csswg.org/selectors-4/#example-bd54871c */
    :is(em, #foo), /* [1,0,0] like an ID selector (#foo)—when matched against any of <em>, <p id=foo>, or <em id=foo>. */
    :not(span, strong#foo), /* [1,0,1] like a tag selector (strong) combined with an ID selector (#foo)—when matched against any element. */

    /* https://drafts.csswg.org/selectors-4/#example-d97bd125 */
    #s12:not(FOO),       /* a=1 b=0 c=1 */
    .foo :is(.bar, #baz) /* a=1 b=1 c=0 */
    {}
  `
  const actual = analyze(fixture).selectors.specificity.items
  const expected = [
    [1, 0, 0],
    [1, 0, 1],
    [1, 0, 1],
    [1, 1, 0],
  ]
  expect(actual).toEqual(expected)
})

test('handles attribute selectors', () => {
  const fixture = `
    [attribute],
    .Foo > .Bar ~ .Baz [type="text"] + span::before #bazz #fizz #buzz #brick #house,
    H1 + *[REL=up],
    /* https://drafts.csswg.org/selectors-4/#attribute-representation */
    a[rel~="copyright"],
    a[hreflang=fr],
    a[hreflang|="en"],
    /* https://drafts.csswg.org/selectors-4/#attribute-substrings */
    object[type^="image"],
    a[href$=".html"],
    p[title*="hello"],
    /* https://drafts.csswg.org/selectors-4/#attribute-case */
    [frame=hsides i],
    [type="a" s],
    [type="A" s],
    /* https://drafts.csswg.org/selectors-4/#attrnmsp */
    [foo|att=val],
    [*|att],
    [|att]
    {}
  `
  const actual = analyze(fixture).selectors.specificity.items
  const expected = [
    [0, 1, 0],
    [5, 4, 2],
    [0, 1, 1],

    [0, 1, 1],
    [0, 1, 1],
    [0, 1, 1],

    [0, 1, 1],
    [0, 1, 1],
    [0, 1, 1],

    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],

    [0, 1, 0],
    [0, 1, 0],
    [0, 1, 0],
  ]
  expect(actual).toEqual(expected)
})

test('handles the :where pseudo class', () => {
  const fixture = `
    .qux:where(em, #foo#bar#baz) /* [0,1,0] only the .qux outside the :where() contributes to selector specificity.  */
    {}
  `
  const actual = analyze(fixture).selectors.specificity.items
  const expected = [
    [0, 1, 0]
  ]
  expect(actual).toEqual(expected)
})

test('handles pseudo element selectors', () => {
  const fixture = `
    element::before,
    element:before,
    element::first-letter,
    element:first-letter,
    element::after,
    element:after,
    element::first-line,
    element:first-line,
    :nth-child(2n+1)
    {}
  `
  const actual = analyze(fixture).selectors.specificity.items
  const expected = [
    [0, 0, 2],
    [0, 0, 2],
    [0, 0, 2],
    [0, 0, 2],
    [0, 0, 2],
    [0, 0, 2],
    [0, 0, 2],
    [0, 0, 2],
    [0, 1, 0]
  ]
  expect(actual).toEqual(expected)
})

// TODO: test this whenever CSSTree contains 'native' specificity analysis
// https://twitter.com/csstree/status/1386799196355825664
test.skip('handles multiple :where or :is parts', () => {})

test('calculates the lowest value', () => {
  const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
  const actual = analyze(fixture).selectors.specificity.min
  expect(actual).toEqual([0, 0, 1])
})

test('calculates the highest value', () => {
  const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
  const actual = analyze(fixture).selectors.specificity.max
  expect(actual).toEqual([1, 0, 0])
})

test('calculates the mean value', () => {
  const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
  const actual = analyze(fixture).selectors.specificity.mean
  expect(actual).toEqual([.25, 1, 0.5])
})

test('calculates the mode value', () => {
  const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
  const actual = analyze(fixture).selectors.specificity.mode
  expect(actual).toEqual([0, 0, 0.5])
})

test('calculates total specificity', () => {
  const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
  const actual = analyze(fixture).selectors.specificity.sum
  expect(actual).toEqual([1, 4, 2])
})

test('calculates specificity uniqueness', () => {
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
    main > :is(h1, h2) {}
  `
  const actual = analyze(fixture).selectors.specificity

  expect(actual.unique).toEqual({
    '0,0,0': 3,
    '0,0,1': 1,
    '0,0,2': 4,
    '1,0,0': 1,
    '0,1,0': 3,
  })
  expect(actual.totalUnique).toBe(5)
  expect(actual.uniquenessRatio).toBe(5 / 12)
})