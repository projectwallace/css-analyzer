import { test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.js'
import { plain } from '../test-utils.js'
import { specificity, summarize_specificity } from './specificity.js'

/** The specificity result with the shape the old tests were written for */
function run(css: string) {
	const { spec } = analyze(css, { spec: specificity({ sequence: true }) })
	return {
		...summarize_specificity(spec),
		items: (spec.sequence ?? []).map((item) => item.split(',').map(Number)),
		...plain(spec),
	}
}

test('handles the universal selector', () => {
	const fixture = `
    * {}
  test * {}
  `
	const actual = run(fixture).items
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
	const actual = run(fixture).items
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
	const actual = run(fixture).items
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
	const actual = run(fixture).items
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
	const actual = run(fixture).items
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
	const actual = run(fixture).items
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
	const actual = run(fixture).items
	const expected = [[0, 1, 0]]
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
	const actual = run(fixture).items
	const expected = [
		[0, 0, 2],
		[0, 0, 2],
		[0, 0, 2],
		[0, 0, 2],
		[0, 0, 2],
		[0, 0, 2],
		[0, 0, 2],
		[0, 0, 2],
		[0, 1, 0],
	]
	expect(actual).toEqual(expected)
})

test('handles the ::part pseudo element', () => {
	const fixture = `
    ::part(my-ident),
    ::part(first-ident second-ident)
    {}
  `
	const actual = run(fixture).items
	const expected = [
		[0, 0, 1],
		[0, 0, 1],
	]
	expect(actual).toEqual(expected)
})

test('handles the ::highlight pseudo element', () => {
	const fixture = `
    ::highlight,
    ::highlight(),
    ::highlight(my-ident),
    ::highlight(*)
    {}
  `
	const actual = run(fixture).items
	const expected = [
		[0, 0, 0],
		[0, 0, 0],
		[0, 0, 1],
		[0, 0, 0],
	]
	expect(actual).toEqual(expected)
})

test('calculates the lowest value', () => {
	const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
	const actual = run(fixture).min
	expect(actual).toEqual([0, 0, 1])
})

test('calculates the highest value', () => {
	const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
	const actual = run(fixture).max
	expect(actual).toEqual([1, 0, 0])
})

test('calculates the mean value', () => {
	const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
	const actual = run(fixture).mean
	expect(actual).toEqual([0.25, 1, 0.5])
})

test('calculates the mode value', () => {
	const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
	const actual = run(fixture).mode
	expect(actual).toEqual([0, 0, 0.5])
})

test('calculates total specificity', () => {
	const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
	const actual = run(fixture).sum
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
	const actual = run(fixture)

	expect(actual.unique).toEqual({
		'0,0,0': 3,
		'0,0,1': 1,
		'0,0,2': 4,
		'1,0,0': 1,
		'0,1,0': 3,
	})
	expect(actual.total_unique).toBe(5)
})

test('does not double count nested pseudo-class functions', () => {
	const fixture = `
    :is(.a),
    :is(:is(.a)),
    :is(:is(:is(#a))),
    :not(:is(.a, .b)),
    .x:has(:is(.a, .b)),
    :is(.a :is(.b)),
    :is(.a, :is(.b)),
    :where(:is(.a)) {}
  `
	const actual = run(fixture).items
	expect(actual).toEqual([
		[0, 1, 0],
		[0, 1, 0],
		[1, 0, 0],
		[0, 1, 0],
		[0, 2, 0],
		[0, 2, 0],
		[0, 1, 0],
		[0, 0, 0],
	])
})
