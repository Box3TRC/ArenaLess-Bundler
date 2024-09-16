import { rollup } from "./rollup-browser";
import { type Plugin } from "./rollup-browser";
// import { transformSync } from "./swc-wasm-typescript";
import ts from "typescript"
import * as JSON5 from "json5";
import { arenaless, jsonLoader } from "./arenaless-rollup-plugin";
// import alias from "./plugins/alias/src/index"
let minifyTerser:any;
(async()=>{
  minifyTerser=(await import("terser")).minify;
})();

async function toTypeScriptAPIReadable(tsconfig: any) {
  let res: ts.CompilerOptions = {};
  for (let key in tsconfig) {
    if (
      !["target", "moduleResolution", "module", "baseUrl", "rootDir"].includes(
        key,
      )
    ) {
      res[key] = tsconfig[key];
    }
  }
  return res;
}

export async function build(
  fileList: Record<string, Uint8Array>,
  entry: string,
  tsconfigRaw: string,
  logger:any,
  format: "es" | "cjs" = "cjs",
  importMap?: string | undefined,
  developmentMode: boolean = false,
) {
  // read paths
  let aliases:any[] = [], tsconfig:any={};
  if (tsconfigRaw) {
    try {
      tsconfig = JSON5.parse(tsconfigRaw).compilerOptions||tsconfig;
    } catch (e) {
      throw new Error(`tsconfig读取出错！${e}`);
    }
    if(!tsconfig.paths){
      tsconfig.paths={};
    }
    if (tsconfig.paths) {
      for (let key in tsconfig.paths) {
        // prob suffix
        // if (tsconfig.paths[key][0].startsWith("./")) {
        //   tsconfig.paths[key][0] = tsconfig.paths[key][0].slice(2);
        // }
        if (
          !tsconfig.paths[key][0].endsWith(".ts") &&
          !tsconfig.paths[key][0].endsWith(".tsx") &&
          !tsconfig.paths[key][0].endsWith(".jsx") &&
          !tsconfig.paths[key][0].endsWith(".js")
        ) {
          if (fileList[`${tsconfig.paths[key][0]}.ts`]) {
            tsconfig.paths[key][0] = `${tsconfig.paths[key][0]}.ts`;
          } else if (fileList[`${tsconfig.paths[key][0]}.js`]) {
            tsconfig.paths[key][0] = `${tsconfig.paths[key][0]}.js`;
          } else if(fileList[`${tsconfig.paths[key][0]}.jsx`]){
            tsconfig.paths[key][0] = `${tsconfig.paths[key][0]}.jsx`;
          }else if(fileList[`${tsconfig.paths[key][0]}.tsx`]){
            tsconfig.paths[key][0] = `${tsconfig.paths[key][0]}.tsx`;
          }
        }
        // aliases.push({
        //   find: key,
        //   replacement: tsconfig.paths[key][0],
        // });
      }
    }
  }
  if (importMap) {
    let importMapJSON: any;
    try {
      importMapJSON = JSON5.parse(importMap);
      // add to alias
      for(let key in importMapJSON.imports){
        // aliases.push({
        //   find: key,
        //   replacement: importMapJSON.imports[key],
        // });
        tsconfig.paths[key]=[importMapJSON.imports[key]];
      }
    } catch (e) {
      throw new Error(`importMap读取出错！${e}`);
    }
  }
  let finaltsconfig=await toTypeScriptAPIReadable(tsconfig);
  Object.assign(finaltsconfig, {
    target: ts.ScriptTarget.ESNext,
    paths: tsconfig.paths,
  });
  let newfileList: Record<string, Uint8Array> = {};
  // load tsconfig compilerOptions to interface CompilerOptions
  for (let key in fileList) {
    if (key.startsWith("dist/") || key.startsWith(".log/")) {continue;}
    newfileList[key]=fileList[key];
  }
  // logger.info(`fileList:${JSON.stringify(newfileList)}`);
  const rolled = await rollup({
    input: [entry],
    plugins: [
      // alias({
      //   entries: aliases,
      // }) as Plugin,
      {
        name:"tsc",
        transform(code, id) {
            if(id.endsWith(".ts")||id.endsWith(".jsx")||id.endsWith(".tsx")){
              return ts.transpile(code,finaltsconfig)
            }
        },
      },
      arenaless({
        modules_raw: newfileList,
        tsconfig:finaltsconfig
      })as Plugin,
      jsonLoader()as Plugin,
      {
        name:"terser-minify",
        async renderChunk(code,chunk){
          if(developmentMode){return;}
          return (await minifyTerser(code, {})).code;
        }
      }
    ],
  });
  // ts
  const out = await rolled.generate({ format: format });
  return out.output[0].code;
}