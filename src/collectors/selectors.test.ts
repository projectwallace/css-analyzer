import { describe, test, expect } from 'vitest'
import { analyze } from '../engine/analyzer.ts'
import { plain, series } from '../test-utils.ts'
import { selectors } from './selectors.ts'
import { specificity, summarize_specificity } from './specificity.ts'

/** Selector results with the shape the old tests were written for */
function run(css: string) {
	const { s, spec } = analyze(css, {
		s: selectors({ sequence: true }),
		spec: specificity({ sequence: true }),
	})
	const summary = summarize_specificity(spec)
	return {
		...plain(s),
		complexity: series(s.complexity),
		nesting: series(s.nesting),
		id: plain(s.ids),
		pseudo_classes: plain(s.pseudo_classes),
		pseudo_elements: plain(s.pseudo_elements),
		accessibility: plain(s.accessibility),
		attributes: plain(s.attributes),
		custom_elements: plain(s.custom_elements),
		keyframes: plain(s.keyframes),
		prefixed: plain(s.prefixed),
		combinators: plain(s.combinators),
		specificity: {
			...summary,
			items: (spec.sequence ?? []).map((item) => item.split(',').map(Number)),
			...plain(spec),
		},
	}
}

// --- complexity ---
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
	const actual = run(fixture).complexity.items
	const expected = [1, 3, 1, 3, 3, 3, 1, 1, 1, 2, 3, 52, 5, 5, 2, 4]

	expect(actual).toEqual(expected)
})

test('calculates complexity with vendor prefixes', () => {
	const actual = run(`
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
  `).complexity

	expect(actual.unique).toEqual({
		1: 6,
		5: 1,
		2: 1,
		12: 1,
		4: 1,
	})
})

test('calculates complexity uniqueness', () => {
	const actual = run(fixture).complexity
	const expected = {
		1: 5,
		2: 2,
		3: 5,
		4: 1,
		5: 2,
		52: 1,
	}

	expect(actual.total_unique).toBe(6)
	expect(actual.unique).toEqual(expected)
})

test('calculates the lowest complexity', () => {
	const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
	const actual = run(fixture).complexity.min
	expect(actual).toBe(1)
})

test('calculates the highest complexity', () => {
	const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
	const actual = run(fixture).complexity.max
	expect(actual).toBe(8)
})

test('calculates the complexity mean', () => {
	const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
	const result = run(fixture)
	const actual = result.complexity.mean
	expect(actual).toBe((1 + 1 + 1 + 8) / 4)
})

test('calculates the complexity mode', () => {
	const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
	const actual = run(fixture).complexity.mode
	expect(actual).toBe(1)
})

test('calculates total complexity', () => {
	const fixture = `
    #test,
    .me,
    now,
    [crazy] ~ .selector > for [no|="good"] {}
  `
	const actual = run(fixture).complexity.sum
	expect(actual).toBe(11)
})

test.each([
	[':is(.a)', 2],
	[':is(:is(.a))', 3],
	[':is(:is(:is(.a)))', 4],
	[':where(:not(.a))', 3],
	['.x:has(:is(.a, .b))', 5],
	[':is(.a :is(.b))', 5],
	[':is(.a, :is(.b))', 4],
])('does not double count nested selectors in %s', (selector, expected) => {
	expect(run(`${selector}{}`).complexity.max).toBe(expected)
})

// --- a11y ---
test('counts Accessibility selectors', () => {
	const fixture = `
		.test,
    [aria-hidden],
    img[role="presentation"],
    body.intent-mouse [role=tabpanel][tabindex="0"]:focus {}
  `
	const actual = run(fixture).accessibility
	const expected = {
		total: 3,
		total_unique: 3,
		unique: {
			'[aria-hidden]': 1,
			'[role="presentation"]': 1,
			'[role="tabpanel"]': 1,
		},
	}

	expect(actual).toEqual(expected)
})

test('finds selectors within pseudo classes', () => {
	const fixture = `
    .selector:not([role="tablist"]) {}
  `
	const actual = run(fixture).accessibility
	expect(actual.unique).toEqual({ '[role="tablist"]': 1 })
})

test('groups by attribute & value', () => {
	const fixture = `
    [aria-hidden],
    [ARIA-HIDDEN],
    [ROLE=tablist],
    [ROLE="tablist"],
    body.intent-mouse [role=tablist][tabindex="0"]:focus {}
  `
	const actual = run(fixture).accessibility
	const expected = {
		total: 5,
		total_unique: 2,
		unique: {
			'[aria-hidden]': 2,
			'[role="tablist"]': 3,
		},
	}

	expect(actual).toEqual(expected)
})

test('handles attribute selector flags', () => {
	const fixture = `
    [aria-hidden i],
    [ARIA-HIDDEN="false" I],
    [ROLE="tablist" s],
    [ROLE="tablist" S] {}
  `
	const actual = run(fixture).accessibility
	const expected = {
		total: 4,
		total_unique: 3,
		unique: {
			'[aria-hidden]': 1,
			'[aria-hidden="false"]': 1,
			'[role="tablist"]': 2,
		},
	}

	expect(actual).toEqual(expected)
})

test('normalizes attribute name', () => {
	const fixture = `
    [ARIA-HIDDEN],
    img[ROLE="presentation"],
    img[ROLE="PRESENTATION"],
    .selector:not([ROLE="tablist"]),
		body.intent-mouse [role=tabpanel][tabindex="0"]:focus {}
  `
	const actual = run(fixture).accessibility
	const expected = {
		total: 5,
		total_unique: 5,
		unique: {
			'[aria-hidden]': 1,
			'[role="presentation"]': 1,
			'[role="PRESENTATION"]': 1, // makes a difference for CSS, but not for accessibility tree
			'[role="tablist"]': 1,
			'[role="tabpanel"]': 1,
		},
	}

	expect(actual).toEqual(expected)
})

test('does not report false positives', () => {
	const fixture = `
    img[loading="lazy"],
    [hidden] {}
  `
	const actual = run(fixture).accessibility
	expect(actual.total).toEqual(0)
	expect(actual.unique).toEqual({})
})

// --- pseudos ---
describe('pseudo classes', () => {
	test('calculates pseudo classes', () => {
		const actual = run(`
			a,
			a:hover,
			a:active,
			a:lang(en),
			a:dir(ltr),
			a:dir(ltr),
			a:has(.thing) {}`).pseudo_classes
		const expected = {
			total: 6,
			total_unique: 5,
			unique: {
				hover: 1,
				active: 1,
				lang: 1,
				dir: 2,
				has: 1,
			},
		}
		expect(actual).toEqual(expected)
	})

	test('normalizes pseudo-class names', () => {
		const fixture = `
			a:hover,
			A:HOVER {}
		`
		const actual = run(fixture).pseudo_classes
		expect(actual.unique).toEqual({ hover: 2 })
		expect(actual.total_unique).toBe(1)
	})

	test('can find multiple pseudo classes in one selector', () => {
		const fixture = `
			main:has(a) a:hover {}
		`
		const actual = run(fixture).pseudo_classes
		expect(actual.unique).toEqual({ has: 1, hover: 1 })
		expect(actual.total_unique).toBe(2)
	})
})

describe('pseudo elements', () => {
	test('calculates simple pseudo elements', () => {
		const actual = run(`
			a,
			a::before,
			a::after {}`).pseudo_elements
		const expected = {
			total: 2,
			total_unique: 2,
			unique: {
				before: 1,
				after: 1,
			},
		}
		expect(actual).toEqual(expected)
	})

	test('calculates pseudo elements that have children', () => {
		const actual = run(`
			::highlight(Name),
			::highlight(name) {}`).pseudo_elements
		const expected = {
			total: 2,
			total_unique: 1,
			unique: {
				highlight: 2,
			},
		}
		expect(actual).toEqual(expected)
	})

	test('normalizes pseudo element names', () => {
		const fixture = `
			a::before,
			A::BEFORE {}
		`
		const actual = run(fixture).pseudo_elements
		expect(actual.unique).toEqual({ before: 2 })
		expect(actual.total_unique).toBe(1)
	})

	test('can find multiple pseudo elements in one selector', () => {
		const fixture = `
			custom-element::slotted(::grammer-error) {}
		`
		const actual = run(fixture).pseudo_elements
		expect(actual.unique).toEqual({ slotted: 1, 'grammer-error': 1 })
		expect(actual.total_unique).toBe(2)
	})
})

// --- selectors ---
test('are analyzed', () => {
	const fixture = `
    rule {
      color: green;
    }

    @media print {
      @media (min-width: 1000px) {
        @supports (display: grid) {
          another-rule {
            color: purple;
          }
        }
      }
    }
  `
	const actual = run(fixture)

	expect(actual.total).toBe(2)
	expect(actual.total_unique).toBe(2)
})

test('handles CSS without selectors', () => {
	const fixture = `
    @font-face {
      font-family: url('/test');
      font-family: test;
    }
  `
	const actual = run(fixture)
	const expected = {
		total: 0,
		total_unique: 0,
		specificity: {
			sum: [0, 0, 0],
			min: [0, 0, 0],
			max: [0, 0, 0],
			mean: [0, 0, 0],
			mode: [0, 0, 0],
			items: [],
			unique: {},
			total: 0,
			total_unique: 0,
		},
		complexity: {
			min: 0,
			max: 0,
			mean: 0,
			mode: 0,
			range: 0,
			sum: 0,
			total: 0,
			total_unique: 0,
			unique: {},
			items: [],
		},
		id: {
			total: 0,
			total_unique: 0,
			unique: {},
		},
		pseudo_classes: {
			total: 0,
			total_unique: 0,
			unique: {},
		},
		pseudo_elements: {
			total: 0,
			total_unique: 0,
			unique: {},
		},
		accessibility: {
			total: 0,
			total_unique: 0,
			unique: {},
		},
		attributes: {
			total: 0,
			total_unique: 0,
			unique: {},
		},
		custom_elements: {
			total: 0,
			total_unique: 0,
			unique: {},
		},
		keyframes: {
			total: 0,
			total_unique: 0,
			unique: {},
		},
		prefixed: {
			total: 0,
			total_unique: 0,
			unique: {},
		},
		combinators: {
			total: 0,
			total_unique: 0,
			unique: {},
		},
		nesting: {
			min: 0,
			max: 0,
			mean: 0,
			mode: 0,
			range: 0,
			sum: 0,
			items: [],
			total: 0,
			total_unique: 0,
			unique: {},
		},
	}
	expect(actual).toEqual({ ...expected, unique: {} })
})

test('have their complexity calculated', () => {
	const fixture = `
    rule {
      color: green;
    }

    @media print {
      @media (min-width: 1000px) {
        @supports (display: grid) {
          another-rule {
            color: purple;
          }
        }
      }
    }
  `
	const actual = run(fixture).complexity.items
	const expected = [1, 1]

	expect(actual).toEqual(expected)
})

test('have their specificity calculated', () => {
	const fixture = `
    rule {
      color: green;
    }

    * {
      color: brown;
    }

    @media print {
      @media (min-width: 1000px) {
        @supports (display: grid) {
          another-rule {
            color: purple;
          }
        }
      }
    }
  `
	const actual = run(fixture)
	const expected = [
		[0, 0, 1],
		[0, 0, 0],
		[0, 0, 1],
	]

	expect(actual.specificity.items).toEqual(expected)
	expect(actual.total).toEqual(3)
})

test('calculates selector uniqueness', () => {
	const fixture = `
    a {}
    b {}

    @media print {
      b {}
      c {}
    }
  `
	const actual = run(fixture)

	expect(actual.total).toBe(4)
	expect(actual.total_unique).toBe(3)
})

test('counts <keyframes-selector>s', () => {
	const fixture = `
    myElement1 {
      opacity: 1;
    }

    @keyframes test1 {
      from {
        opacity: 1;
      }
      50% {
        opacity: 0;
      }
      90%,
      to {
        opacity: 1;
      }
    }

    @media only screen {
      myElement2 {
        opacity: 1;
      }

      @keyframes test2 {
        from {
          opacity: 0.1;
        }
      }
    }
  `
	const actual = run(fixture)
	expect(actual.total).toBe(2)
	expect(actual.keyframes).toEqual({
		total: 5,
		total_unique: 4,
		unique: {
			from: 2,
			'90%': 1,
			to: 1,
			'50%': 1,
		},
	})
})

test('counts ID selectors', () => {
	const fixture = `
    #myId,
    #myId,
    element#id,
    #multiple #ids { }

    /* Not an ID */
    [href="#hash"] { }
  `
	const actual = run(fixture).id
	const expected = {
		total: 4,
		total_unique: 3,
		unique: {
			'#myId': 2,
			'element#id': 1,
			'#multiple #ids': 1,
		},
	}

	expect(actual).toEqual(expected)
})

test('counts attribute selectors', () => {
	const fixture = `
    [ROLE],
		[role="status"],
		[href^="test"],
		[name$="test"],
    [HREF="#hash"] { }
  `
	const actual = run(fixture).attributes

	expect(actual.total).toEqual(5)
	expect(actual.total_unique).toEqual(3)
	expect(actual.unique).toEqual({
		role: 2,
		href: 2,
		name: 1,
	})
})

test('counts custom element selectors', () => {
	const fixture = `
		product-card,
		event-date,
		next-route-announcer,
		Camel-Cased-Element {}

		/* Not custom elements, but custom identifiers */
		::view-transition-new(--light-box-img),
		::view-transition-old(--light-box-img) {}
	`
	const actual = run(fixture).custom_elements

	expect(actual.total).toBe(4)
	expect(actual.total_unique).toBe(4)
	expect(actual.unique).toEqual({
		'product-card': 1,
		'event-date': 1,
		'next-route-announcer': 1,
		'camel-cased-element': 1,
	})
})

test('handles emoji selectors', () => {
	const fixture = `
    .💩 {}
  `
	const result = run(fixture)
	const actual = result

	const expected = {
		total: 1,
		total_unique: 1,
		specificity: {
			sum: [0, 1, 0],
			min: [0, 1, 0],
			max: [0, 1, 0],
			mean: [0, 1, 0],
			mode: [0, 1, 0],
			items: [[0, 1, 0]],
			unique: {
				'0,1,0': 1,
			},
			total: 1,
			total_unique: 1,
		},
		complexity: {
			min: 1,
			max: 1,
			mean: 1,
			mode: 1,
			range: 0,
			sum: 1,
			total: 1,
			total_unique: 1,
			unique: { 1: 1 },
			items: [1],
		},
		id: {
			total: 0,
			total_unique: 0,
			unique: {},
		},
		pseudo_classes: {
			total: 0,
			total_unique: 0,
			unique: {},
		},
		pseudo_elements: {
			total: 0,
			total_unique: 0,
			unique: {},
		},
		accessibility: {
			total: 0,
			total_unique: 0,
			unique: {},
		},
		attributes: {
			total: 0,
			total_unique: 0,
			unique: {},
		},
		custom_elements: {
			total: 0,
			total_unique: 0,
			unique: {},
		},
		keyframes: {
			total: 0,
			total_unique: 0,
			unique: {},
		},
		prefixed: {
			total: 0,
			total_unique: 0,
			unique: {},
		},
		combinators: {
			total: 0,
			total_unique: 0,
			unique: {},
		},
		nesting: {
			min: 0,
			max: 0,
			mean: 0,
			mode: 0,
			range: 0,
			sum: 0,
			items: [0],
			total: 1,
			total_unique: 1,
			unique: {
				0: 1,
			},
		},
	}
	expect(actual).toEqual({ ...expected, unique: { '.💩': 1 } })
})

test('analyzes vendor prefixed selectors', () => {
	const actual = run(`
    input[type=text]::-webkit-input-placeholder {
        color: green;
    }
    input[type=text]::-moz-placeholder {
        color: green;
    }
    input[type=text]:-ms-input-placeholder {
        color: green;
    }
    input[type=text]:-moz-placeholder {
      color: green;
    }
		input:-MOZ-PLACEHOLDER {}

    no-prefix,
    fake-webkit,
    ::-webkit-scrollbar,
    .site-header .main-nav:hover>ul>li:nth-child(1) svg,
    :-moz-any(header, footer) {}
  `).prefixed

	expect(actual.total).toBe(7)
	expect(actual.total_unique).toBe(6)
	expect(actual.unique).toEqual({
		':-moz-any': 1,
		':-moz-placeholder': 2,
		':-ms-input-placeholder': 1,
		'::-webkit-input-placeholder': 1,
		'::-webkit-scrollbar': 1,
		'::-moz-placeholder': 1,
	})
})

test('counts combinators', () => {
	const result = run(`
    a,
    a b,
    a > b,
    a ~ b,
    a + b,
    a    b,
    a + b c > d e ~ f,
    :is(a + b, a, e > f) {
    }
  `)
	const actual = result.combinators

	expect(actual.total).toBe(12)
	expect(actual.total_unique).toBe(4)
	expect(actual.unique).toEqual({
		' ': 4,
		'>': 3,
		'~': 2,
		'+': 3,
	})
})

test('tracks nesting depth', () => {
	const fixture = `
    a {
      color: red;
    }

    b {
      color: green;

      &:hover {
        color: blue;
      }

      color: deepskyblue;

      @container (width > 400px) {
        color: rebeccapurple
      }
    }

    @media print {
      @supports (display: grid) {
        c {
          color: orange;
        }
      }
    }
  `
	const actual = run(fixture).nesting
	const expected = {
		min: 0,
		max: 2,
		mean: 0.75,
		mode: 0,
		range: 2,
		sum: 3,
		items: [0, 0, 1, 2],
		total: 4,
		total_unique: 3,
		unique: {
			0: 2,
			1: 1,
			2: 1,
		},
	}
	expect(actual).toEqual(expected)
})
