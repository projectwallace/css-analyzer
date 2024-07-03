import { Bench } from "tinybench"
import { withCodSpeed } from "@codspeed/tinybench-plugin"
import * as fs from "fs"
import { analyze } from '../src/index.js'

let filelist = fs.readdirSync('./src/__fixtures__')
let files = filelist
  .filter(filename => filename.endsWith('.css'))
  .filter(filename => filename.includes('github') || filename.includes('css-tricks'))
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

await bench.warmup()
await bench.run()

console.table(bench.table())
