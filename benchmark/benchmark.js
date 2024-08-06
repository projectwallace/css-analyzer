import { Bench } from "tinybench"
import { withCodSpeed } from "@codspeed/tinybench-plugin"
import * as fs from "fs"
import { analyze } from '../src/index.js'
import { namedColors, systemColors, colorKeywords } from "../src/values/colors.js"

let filelist = fs.readdirSync('./src/__fixtures__')
let files = filelist
  .filter(filename => filename.endsWith('.css'))
  .filter(filename => filename.includes('css-tricks'))
  .reduce((acc, filename) => {
    let css = fs.readFileSync(`./src/__fixtures__/${filename}`, 'utf8')
    acc.set(filename, css)
    return acc
  }, new Map())

let bench = withCodSpeed(new Bench())

for (let [filename, css] of files) {
  let byte_size = (Buffer.byteLength(css) / 1024).toFixed(1)
  bench.add(`${filename} (${byte_size}kB)`, () => analyze(css))
}

bench.add('high complexity/specificity selectors', () => {
  analyze(`a :is(:hover, :active) > li:not(.test) {
    color: red;
  }`)
})
bench.add('font shorthand', () => {
  analyze(`a {
    font: 12px/14px sans-serif;
  }`)
})
bench.add('color names', () => {
  analyze(`a {
    color: rebeccapurple;
    background-color: Highlight;
    border-color: currentColor;
  }`)
})

bench.add('slice of Syntax.fm', () => {
  analyze(`
    .presented.svelte-1w1ipb6 {
      box-shadow: inset 0 0 0 4px #0003;
      border-radius: var(--brad);
      padding: 1rem;
      margin: 2rem 0;
      background: var(--sentry-footer-bg);
      background-blend-mode: hard-light;
      background-size: 300px 300px, cover;
      margin-left: auto;
      margin-right: auto;
      max-width: none;
    }

    footer.svelte-1ifxoc0.svelte-1ifxoc0 {
      padding: 2rem .5rem 5rem;
      background-image: url(/svg/grit.svg?dark&count=100&w=5000&h=500);
      background-size: 1500px;
    }

    @media (min-width: 1280px) {
      footer.svelte-1ifxoc0.svelte-1ifxoc0 {
        padding: 2rem 0 5rem;
      }
    }

    .links-col.svelte-1ifxoc0.svelte-1ifxoc0 {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .social-links.svelte-1ifxoc0.svelte-1ifxoc0 {
      flex-direction: row;
    }

    .social-links.svelte-1ifxoc0 a.svelte-1ifxoc0 {
      display: block;
    }

    .social-links.svelte-1ifxoc0 a.svelte-1ifxoc0::after {
      content: "";
    }

    .social-links.svelte-1ifxoc0 a.svelte-1ifxoc0:hover {
      color: var(--accent);
    }

    a.svelte-1ifxoc0.svelte-1ifxoc0 {
      color: var(--fg);
    }

    a.svelte-1ifxoc0.svelte-1ifxoc0:hover {
      -webkit-text-decoration: underline;
      text-decoration: underline;
      text-decoration-color: var(--primary);
    }

    .loader.svelte-ziw36b.svelte-ziw36b {
      z-index: 10;
      position: fixed;
      background: #000e;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    h3.svelte-ziw36b.svelte-ziw36b {
      color: var(--primary);
    }

    .loader.svelte-ziw36b svg.svelte-ziw36b {
      width: 150px;
      height: 150px;
      margin: 0 auto;
    }

    #logo_dot {
      animation: svelte-ziw36b-spin 1s infinite;
      transform-origin: 93% 91%;
    }

    @keyframes svelte-ziw36b-spin {
      0% {
        transform: rotate(0);
      }

      to {
        transform: rotate(360deg);
      }
    }
`)
})

bench.add('slice of nerdy.dev', () => {
  analyze(`
@layer components.fresh {
	.Pingbacks {
		display: flex;
		flex-wrap: wrap;
		gap: var(--size-2);
		list-style-type: none;
		padding-inline: 0 var(--size-5);

		& > li {
			background: var(--surface-1);
			border-radius: var(--radius-round);
			display: flex;
			flex-shrink: 0;
			font-size: var(--font-size-0);
			padding-block: var(--size-1);
			padding-inline: var(--size-3);
			place-content: center;
			place-items: center;

			&:hover {
				background: var(--surface-2);
			}

			& > a {
				margin: 0;
				padding: 0;
			}
		}
	}
}

@layer components.fresh {
	.Reposts {
		display: flex;
		flex-wrap: wrap;
		list-style-type: none;
		padding-inline: 0 var(--size-5);
		row-gap: 0;

		& > li {
			margin-inline-end: -24px;
			padding: 0;
			transition: translate .8s var(--ease-squish-3);

			&:hover {
				translate: 0 -5px;
			}

			& > a {
				margin: 0;
				padding: 0;
			}

			& img {
				aspect-ratio: var(--ratio-square);
				border-radius: var(--radius-round);
			}
		}
	}
}

@layer components.fresh {
	.Nav {
		align-items: center;
		display: flex;
		gap: var(--size-3);
		inset-block-start: 0;
		justify-content: end;
		padding-block: var(--size-3);
		padding-inline: var(--size-inline-1);
		position: sticky;
		z-index: var(--layer-2);
		view-transition-name: site-nav;
		pointer-events: none;

		& > * {
			pointer-events: auto;

			&:nth-child(2) {
				transition-delay: 0s, 0s, 50ms;
			}

			&:nth-child(3) {
				transition-delay: 0s, 0s, .1s;
			}

			&:nth-child(4) {
				transition-delay: 0s, 0s, .15s;
			}

			&:nth-child(5) {
				transition-delay: 0s, 0s, .2s;
			}
		}

		&[scroll-direction=down] > * {
			translate: 0 -200%;
		}

		@media (prefers-reduced-motion: no-preference) {
			& > * {
				transition: outline-offset 145ms var(--ease-2), box-shadow .5s var(--ease-out-4), translate .3s var(--ease-3);
			}
		}

		& > a:first-of-type {
			@media (min-width: 768px) {
				margin-inline-end: auto;
			}

			[page-type=detail] &{margin-inline-end:auto}
		}

		& > h1 {
			font-size: var(--font-size-5);
		}
	}
    `)
})

bench.add('KeywordSet', () => {
  namedColors.has('rebeccapurple')
  namedColors.has('Highlight')
  systemColors.has('Highlight')
  systemColors.has('currentColor')
  namedColors.has('not-a-color')
  colorKeywords.has('currentColor')
})

await bench.warmup()
await bench.run()

console.table(bench.table())
