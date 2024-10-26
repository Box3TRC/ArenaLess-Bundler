// import { build } from "arenaless-bundler";
import { build } from "./dist/index";
// import * as fs from "fs";

async function test() {
    let files_text: Record<string, string> = {
        "index.coffee": `
import JSON5 from "npm:json5"
console.log(JSON5.parse("{a:1}"))        
# Assignment:
number   = 42
opposite = true

# Conditions:
number = -42 if opposite

# Functions:
square = (x) -> x * x

# Arrays:
list = [1, 2, 3, 4, 5]

# Objects:
math =
  root:   Math.sqrt
  square: square
  cube:   (x) -> x * square x

# Splats:
race = (winner, runners...) ->
  print winner, runners

# Existence:
alert "I knew it!" if elvis?

# Array comprehensions:
cubes = (math.cube num for num in list)`,
        "importMap.arenaless.jsonc":`{"imports":{"dao3-areact":"npm:dao3-areact"}}`
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
    let res = await build(files, "index.coffee", `{
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
        console.log(res);
    }
})();