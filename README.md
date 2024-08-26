# ArenaLess-Bundler

重构版：ArenaLess的打包工具
Bundler based on rollup for ArenaLess

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
