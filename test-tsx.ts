// @ts-ignore
// import { build } from "arenaless-bundler";
// @ts-ignore
import { build } from "./dist/index";
import * as fs from "fs";

async function test() {
    let files_text: Record<string, string> = {
        "clientApp.tsx":`import { AUIApp, hooks } from "npm:dao3-aui";
let aui = new AUIApp();

function App() {
  const [count,setCount]=hooks.useState<number>(0);
  return (<>
    <ui-text x="0" y="0" height="50px" width="200px" 
      background-color="#ffffff" background-opacity="100%" 
      onClick={()=>setCount(count+1)}
      text-content={"点击次数："+count.toString()+"次"}></ui-text>
  </>)
}
aui.mount(<App />, ui);
`
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
    let res = await build(files, "clientApp.tsx", `{
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
        "noImplicitAny": false,
        "jsxFactory": "AUIApp.h",
        "jsxFragmentFactory": "AUIApp.frag",
        "jsx": "react",
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
}`, console, "es", `{
    "imports":{}
}`, false);
    // console.log(res)
    return res;
};
(async () => {
    let res = await test();
    console.log(res)
})();