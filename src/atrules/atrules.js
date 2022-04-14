import { strEquals } from '../string-utils.js'

export function isSupportsBrowserhack(prelude) {
  console.log('->', prelude.children)

  if (prelude.children.first.type !== 'Parentheses') {
    return false
  }

  console.log('moving on')

  // walk(ast, function (node) {
  //   console.log(node)
  // })

  console.log()

  return false
}