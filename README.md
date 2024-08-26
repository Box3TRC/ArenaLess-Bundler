# ArenaLess-Bundler

重构版：ArenaLess的打包工具
Bundler based on rollup for ArenaLess

## 安装
```bash
npm install --save arenaless-bundler
```

## 使用
这是一个示例使用
```typescript
import { build } from "arenaless-bundler";
import * as fs from "fs";

async function test(){
    let files_text:Record<string,string>={
        "index.ts":`import {hello} from "./hello/hi";
import hellots from "./hello/hi.ts?text";
import hellob64 from "./hello/hi.ts?base64";
hello();
console.log(hellots);
console.log(hellob64);
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
    let start=Date.now();
    let res=await test();
    fs.writeFileSync("./test_output.js",res,{encoding:"utf-8"});
    console.log(`${Date.now()-start}ms`);
})();
```


## 有哪些特性？
### 1. 网络导入
如果你用过`deno`，你会发现十分的熟悉。在ArenaLess中，你可以从URL或者`xxx:yyyy@...`中导入模块。
```typescript
import JSON5 from "npm:json5";
import JSON5 from "https://esm.sh/json5";
```
目前支持的前缀如下：
- `npm:...` -> `https://esm.sh/...`
- `jsr:...` -> `https://esm.sh/jsr/...`
- `http:`和`https:`

### 2. 虚拟的文件系统
为了实现在web环境可以打包构建，ArenaLess提供了一个虚拟文件系统。`Record<string,Uint8Array>`

### 3. 导入本地模块的特殊后缀
目前此功能只能支持本地模块，在线的模块用不了。
#### ?binary 二进制导入
导入一个`Uint8Array`形式的二进制文件。
```typescript
import xxx from "xxx?binary";
```
#### ?text 文本导入
导入一个`string`形式的文本文件。
```typescript
import xxx from "xxx?text";
```
#### ?base64 base64导入
以`base64`的`string`导入一个文件。 
```typescript
import xxx from "xxx?base64";
```
#### ?wasm 导入wasm实例
导入一个`Promise<WebAssembly.Instance>`形式的wasm文件。
> 这个相关的东西你可以到`examples/wasm-hello-world`查看
```typescript
import hellowasm from "hellowasm.wasm?wasm";
hellowasm().then((instance)=>{
    console.log(instance.exports.add(1,100));
})
```
### 4. 默认的JSON格式导入
ArenaLess默认支持JSON的导入，你可以直接导入一个JSON文件。
```json
// xxx.json
{"yyy":100,"zzz":"hello"}
```
```typescript
import xxx from "xxx.json";
console.log(xxx.yyy);
```
