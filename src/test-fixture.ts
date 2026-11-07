// Shared CSS used by tests that compare analyzers

export const stylesheet_fixture = `@charset "UTF-8";
@import url("a.css") layer(base) supports(display: grid) screen and (min-width: 40em);
@import "b.css";
@layer reset, base;
@layer base { a { color: red } }
@layer { b { color: blue } }
@property --registered { syntax: "<color>"; inherits: false; initial-value: red }
@function --double(--x) { result: calc(var(--x) * 2) }
@scope (.card) to (.content) { img { border: 1px solid } }
@font-face { font-family: "Face"; src: url(data:font/woff2;base64,AAAA) format("woff2"); font-display: swap }
@font-face { font-family: "Two"; src: url(two.woff2) }
@container sidebar (min-width: 400px) { .c { color: green } }
@container (min-width: 10px) { .c2 { color: green } }
@supports (-webkit-appearance: none) { .s { display: -webkit-box } }
@supports (display: grid) and (not (display: inline)) { .s2 { display: Grid } }
@media screen and (min-width: 40em) and (max-width: 60em) { .m { margin: 0 } }
@media \\0screen { .hack { color: red } }
@media (-ms-high-contrast: none) { .hack2 { color: red } }
@-webkit-keyframes pulse { from { opacity: 0 } to { opacity: 1 } }
@keyframes pulse { 0% { opacity: 0 } 50% { opacity: .5 !important } 100% { opacity: 1 } }
@keyframes "unused" { from { top: 0 } }

:root { --brand: #f00; --unused: 1px; --imp: red !important; --used: 2px }
/* a comment */
html, body { margin: 0; padding: 0 0 0 0; color: var(--brand); width: calc(var(--used) + var(--missing)) }
.card, ul li:nth-child(2n+1) > a[href^="http"]:hover::before { color: red\\9; *zoom: 1; _height: 1px }
#id.cls:not(.x, #y) ~ my-element + x-foo::-webkit-scrollbar { -webkit-transition: all 1s; transition: all 1s ease }
[role="button"], [aria-hidden=true], [data-x] { filter: progid:DXImageTransform.Microsoft.gradient(startColorstr='#80000000', endColorstr='#80000000'); background: -webkit-linear-gradient(red, blue) }
.empty {}
.parent { color: red; .child { color: blue; &:hover { color: green } } }
.shadow { text-shadow: 0 0 1px #000, 1px 1px red; box-shadow: none; display: none; display: FLEX; display: var(--d) }
.units { width: 10PX; height: 2.5em; margin: -1rem 5% 0 auto; transform: rotate(45deg) translate(1Q) }
.anim { animation: spin 1s ease-in-out infinite, "quoted name" 2s; animation-name: pulse, fade; transition: opacity 1S, transform 2s inherit }
.anchor { anchor-name: --a, --b; position-anchor: --a; top: anchor(--b top); width: anchor-size(--missing width) }
.contain { container-name: sidebar main; container: layout / inline-size; container-type: size }
.kw { color: inherit; font: inherit; border: initial; width: AUTO }
.important { color: red !important; margin: 0!IMPORTANT; padding: 1px !ie }
.bg { background: url(data:image/gif;base64,R0lGODlhAQABAAAAACw=) no-repeat, url("x.png"), url(data:image/svg+xml;utf8,<svg></svg>) }
`

export const tokens_fixture = `
	:root {
		--brand: #FF0000;
		--font: "Open Sans", sans-serif;
	}
	body {
		color: red;
		background: #fff url(a.png);
		border-color: RGBA(0, 0, 0, .5) transparent currentColor;
		font: italic bold 16px/1.5 "Helvetica Neue", Arial, sans-serif;
		box-shadow: 0 0 0 1px rgb(0 0 0 / 10%), 0 1px 2px #000;
		-webkit-box-shadow: 0 0 1px red;
		transition: color 200ms ease-in-out, background-color 1S cubic-bezier(0, 0, 1, 1) 0.5s;
		animation: spin 2s linear infinite;
	}
	h1 {
		font-size: 2EM;
		font-size: var(--size);
		font-size: caption;
		font-size: inherit;
		font-family: Arial, Helvetica;
		font-family: caption;
		line-height: 1.2;
		line-height: var(--lh, 1.5);
		border-radius: 4px 2px;
		border-top-left-radius: 50%;
		color: #ABC;
		color: #aabbccdd;
	}
	@media (min-width: 40em) {
		.a {
			background: linear-gradient(to right, #111 0%, #222 100%), -webkit-linear-gradient(red, blue);
			background-image: radial-gradient(circle, color-mix(in srgb, #fff, #000), transparent);
			font: 12px/14px Georgia;
			font: caption;
			font: inherit;
			animation-duration: 300ms, 1s;
			transition-duration: 0.3s;
			animation-timing-function: ease, steps(4, jump-end);
			transition-timing-function: cubic-bezier(.1, .2, .3, .4);
			animation-name: red;
			color: red\\9;
		}
	}
	@keyframes spin {
		from { transform: rotate(0deg) }
		to { transform: rotate(360deg) }
	}
`
