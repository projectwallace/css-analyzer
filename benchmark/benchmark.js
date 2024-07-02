import { Bench } from "tinybench"
import { withCodSpeed } from "@codspeed/tinybench-plugin"
import * as fs from "fs"
import { analyze } from '../src/index.js'

let filelist = fs.readdirSync('./src/__fixtures__')

let bench = withCodSpeed(new Bench())

for (let filename of filelist) {
  if (!filename.endsWith('.css')) continue
  let css = fs.readFileSync(`./src/__fixtures__/${filename}`, 'utf8')
  let byte_size = (Buffer.byteLength(css) / 1024).toFixed(1)
  bench.add(`${filename} (${byte_size}kB)`, () => analyze(css))
}

await bench.warmup()
await bench.run()

console.table(bench.table())
