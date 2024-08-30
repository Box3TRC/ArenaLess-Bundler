// import { build } from "arenaless-bundler";
import { build } from "./index";
import * as fs from "fs";

async function test() {
    let files_text: Record<string, string> = {
        "hello/index.ts": `import {hello} from "./hi";
import hellots from "@/hello/hi.ts?text";
import hellob64 from "./hi.ts?base64";
hello();
console.log(hellots);
console.log(hellob64);
import JSON5 from "json5";
console.log(JSON5.parse("{a:1}"))
import foo from "foo";
console.log(foo)`,
        "hello/hi.ts": `export function hello():void{
            console.log("hello");
        }`,
        "foo.json": `{"bar":12345}`
    }
    // let imagebuf=fs.readFileSync("./image.png");
    // to uint array
    // let image=new Uint8Array(imagebuf);
    let files: Record<string, Uint8Array> = {
        //"image.png": image,
    };
    for (let key in files_text) {
        files[key] = new TextEncoder().encode(files_text[key]);
    }
    let res = await build(files, "hello/index.ts", `{
    "compilerOptions": {
        "target": "ESNext",
        "module": "commonjs",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "experimentalDecorators": true,
        "moduleResolution": "node",
        "baseUrl": "./",
        "rootDir": "./",
        "outDir": "dist", // do not change this
        "lib": [],
        "paths": {
            "foo": [
                "./foo.json"
            ],"@/*":[
                "./*"
            ]
        },
        
    },
    "include": [
        "./**/*.ts",
        "./**/*.d.ts",
        "./types"
    ],
    "exclude": [
        "node_modules",
        "dist"
    ]
}`, console, "cjs", `{
    "imports":{"json5":"npm:json5"}
}`, false);
    // console.log(res)
    return res;
};
(async () => {
    for (let i = 1; i < 10 + 1; i++) {
        let start = Date.now();
        let res = await test();
        fs.writeFileSync("./test_output.js", res, { encoding: "utf-8" });
        console.log(`${i}. ${Date.now() - start}ms`);
    }
})();