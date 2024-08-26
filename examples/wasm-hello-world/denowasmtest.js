// run with deno
import * as fs from "node:fs";
let buf=fs.readFileSync("./hellowasm.wasm");
let instance=await WebAssembly.instantiate(await WebAssembly.compile(buf));
console.log(instance.exports.add(1,10))