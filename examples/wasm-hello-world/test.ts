import { build } from "../../index";
import * as fs from "fs";
async function test(){
    let files_text:Record<string,string>={
        "index.ts":`import {hello} from "./hello/hi";
hello();
// import wasm from "./hellowasm.wasm?binary";
// WebAssembly.compile(wasm).then((module)=>{
//     WebAssembly.instantiate(module).then((instance)=>{
//         console.log(instance.exports.add(1,10))
//     })
// })
import hellowasm from "./hellowasm.wasm?wasm";
hellowasm().then((instance)=>{
    console.log(instance.exports.add(1,10))
})
`,
        "hello/hi.ts":`export function hello():void{
            console.log("hello");
        }`,
        "foo.json":`{"bar":12345}`
    }
    let buf=fs.readFileSync("./hellowasm.wasm");
    // let wasm=await WebAssembly.compile(buf);
    // console.log(wasm);
    // to uint array
    let uarr=new Uint8Array(buf);
    let files:Record<string,Uint8Array>={
        "hellowasm.wasm": uarr,
    };
    for (let key in files_text) {
        files[key]=new TextEncoder().encode(files_text[key]);
    }
    let res=await build(files,"index.ts","{}",console,"cjs","{}",false);
    // console.log(res)
    return res;
};
(async ()=>{
    let start=Date.now();
    let res=await test();
    fs.writeFileSync("./test_output.js",res,{encoding:"utf-8"});
    console.log(`${Date.now()-start}ms`);
})();