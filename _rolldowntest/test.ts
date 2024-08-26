import { build } from "./index";
import * as fs from "fs";

async function test(){
    let files_text:Record<string,string>={
        "index.ts":`import {hello} from "./hello/hi";
hello();
import JSON5 from "npm:json5";
console.log(JSON5.parse("{a:1}"))
import foo from "./foo.json";
console.log(foo)`,
        "hello/hi.ts":`export function hello():void{
            console.log("hello");
        }`,
        "foo.json":`{"bar":12345}`
    }
    // let imagebuf=fs.readFileSync("./image.png");
    // to uint array
    // let image=new Uint8Array(imagebuf);
    let files:Record<string,Uint8Array>={
        //"image.png": image,
    };
    for (let key in files_text) {
        files[key]=new TextEncoder().encode(files_text[key]);
    }
    let res=await build(files,"index.ts","{}",console,"cjs","{}",false);
    // console.log(res)
    return res;
};
(async ()=>{
    for(let i=1;i<10+1;i++){
        let start=Date.now();
        let res=await test();
        fs.writeFileSync("./test_output.js",res,{encoding:"utf-8"});
        console.log(`${i}. ${Date.now()-start}ms`);
    }
})();