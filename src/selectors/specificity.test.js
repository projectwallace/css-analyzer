import { suite } from 'uvu'
import * as assert from 'uvu/assert'
import { analyze } from '../index.js'

const Specificity = suite('Specificity')

Specificity('handles the universal selector', () => {
  const fixture = `
    * {}
  test * {}
  `
  const actual = analyze(fixture).selectors.specificity.items
  const expected = [
    [0, 0, 0],
    [0, 0, 1],
  ]
  assert.equal(actual, expected)
})

Specificity('handles ID selectors', () => {
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
  assert.equal(actual, expected)
})

Specificity('handles class selectors', () => {
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
  assert.equal(actual, expected)
})

Specificity('handles element selectors', () => {
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
  assert.equal(actual, expected)
})

Specificity('handles the :not, :is and :has pseudo classes', () => {
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
  assert.equal(actual, expected)
})

Specificity('handles attribute selectors', () => {
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
  assert.equal(actual, expected)
})

Specificity('handles the :where pseudo class', () => {
  const fixture = `
    .qux:where(em, #foo#bar#baz) /* [0,1,0] only the .qux outside the :where() contributes to selector specificity.  */
    {}
  `
  const actual = analyze(fixture).selectors.specificity.items
  const expected = [
    [0, 1, 0]
  ]
  assert.equal(actual, expected)
})

Specificity('handles pseudo element selectors', () => {
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
  assert.equal(actual, expected)
})

// TODO: test this whenever CSSTree contains 'native' specificity analysis
// https://twitter.com/csstree/status/1386799196355825664
Specificity.skip('handles multiple :where or :is parts')

Specificity('calculates the lowest value', () => {
  const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
  const actual = analyze(fixture).selectors.specificity.min
  assert.equal(actual, [0, 0, 1])
})

Specificity('calculates the highest value', () => {
  const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
  const actual = analyze(fixture).selectors.specificity.max
  assert.equal(actual, [1, 0, 0])
})

Specificity('calculates the mean value', () => {
  const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
  const actual = analyze(fixture).selectors.specificity.mean
  assert.equal(actual, [.25, 1, 0.5])
})

Specificity('calculates the mode value', () => {
  const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
  const actual = analyze(fixture).selectors.specificity.mode
  assert.equal(actual, [0, 0, 0.5])
})

Specificity('calculates the median value', () => {
  const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > check {}
  `
  const actual = analyze(fixture).selectors.specificity.median
  assert.equal(actual, [0, 0.5, 0.5])
})

Specificity('calculates total specificity', () => {
  const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
  const actual = analyze(fixture).selectors.specificity.sum
  assert.equal(actual, [1, 4, 2])
})

Specificity('calculates specificity uniqueness', () => {
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

  assert.equal(actual.unique, {
    '0,0,0': 3,
    '0,0,1': 1,
    '0,0,2': 4,
    '1,0,0': 1,
    '0,1,0': 3,
  })
  assert.is(actual.totalUnique, 5)
  assert.is(actual.uniquenessRatio, 5 / 12)
})

Specificity.run()