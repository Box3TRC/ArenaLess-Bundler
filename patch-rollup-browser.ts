import PackageJSON from "./node_modules/@rollup/browser/package.json";
import * as fs from "node:fs";
import * as path from "node:path"

const SOURCE_URL=`bindings_wasm_bg.wasm`;
const WASM_URL=`https://esm.sh/@rollup/browser@${PackageJSON.version}/dist/bindings_wasm_bg.wasm`;
const PACKAGE_SOURCE_DIR=`./node_modules/@rollup/browser/`;
const PACKAGE_TARGET_DIR="rollup-browser";
const files=[PackageJSON.module,PackageJSON.main];
if(fs.existsSync(PACKAGE_TARGET_DIR)){
    fs.rmSync(PACKAGE_TARGET_DIR,{recursive: true});
}
fs.cpSync(PACKAGE_SOURCE_DIR,PACKAGE_TARGET_DIR,{recursive: true});
for(const file of files){
    const fullpath=path.join(PACKAGE_TARGET_DIR,file);
    const content=fs.readFileSync(fullpath,{encoding:"utf-8"});
    fs.writeFileSync(fullpath,content.replace(SOURCE_URL,WASM_URL));
    console.log(`patched ${file}`);
}