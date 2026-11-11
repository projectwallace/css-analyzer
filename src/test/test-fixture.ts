// Shared CSS used by tests that compare analyzers

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
