declare module 'css-tree/parser' {
	import { parse } from "css-tree"
	export default parse
}

declare module "css-tree/walker" {
	import { walk } from "css-tree"
	export default walk
}
declare module '@bramus/specificity/core' {
	import { calculateForAST } from "@bramus/specificity"
	export { calculateForAST }
}