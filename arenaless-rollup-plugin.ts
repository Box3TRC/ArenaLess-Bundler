import { type Plugin, type ResolveIdResult } from "@rollup/browser";
import * as path from 'path-browserify';
import { Base64 } from 'js-base64';

const VFS_PREFIX = "\0fs:";

const specifiers = ["npm:", "jsr:", "http:", "https:"];
function hasSpecifiers(id: string) {
    if (id.startsWith(VFS_PREFIX)) {
        return false;
    }
    let regex = /^([a-zA-Z0-9_]+):(.+)$/;
    return regex.test(id);
}
function resolveIdWithSpecifiers(id: string): ResolveIdResult {
    let specifier = specifiers.find(specifier => id.startsWith(specifier));
    if (specifier == null) {
        throw Error(`Specifier ${specifier} not found`);
    }
    let content = id.replace(specifier, "");
    if (specifier == "npm:") {
        return { id: `https://esm.sh/${content}`, };
    } else if (specifier == "jsr:") {
        return { id: `https://esm.sh/jsr/${content}` };
    } else if (specifier == "http:" || specifier == "https:") {
        return { id: id };
    }
}
function resolveVirtualFS(id: string, importer: string | undefined, modules: Record<string, any>,aliasmode:boolean=false) {
    if (!importer) {
        return `${VFS_PREFIX}${id}`;
    }
    const importerNoPrefix = importer.startsWith(VFS_PREFIX)
        ? importer.slice(VFS_PREFIX.length)
        : importer;
    if (id.startsWith("./")) {
        id = id.slice(2);
    }
    let resolved = path.join(path.dirname(importerNoPrefix), id).replace(/\\/g, "/");
    if(aliasmode)resolved=id;
    if (resolved.startsWith("./")) {
        resolved = resolved.slice(2);
    }
    if (resolved.endsWith(".js") || resolved.endsWith(".ts")) {
        return VFS_PREFIX + resolved;
    } else if (modules[resolved]) {
        return VFS_PREFIX + resolved;
    }
    else if (modules[resolved + ".ts"]) {
        return VFS_PREFIX + resolved + ".ts";
    }
    else if (modules[resolved + ".js"]) {
        return VFS_PREFIX + resolved + ".js";
    } else {
        throw Error(`File ${resolved} not found`);
    }
}

class Cache{
    cache:Record<string,any>;
    max:number=64;
    constructor(){
        this.cache = {};
    }
    get(key:string){
        return this.cache[key];
    }
    set(key:string,value:any){
        let keys=Object.keys(this.cache);
        if(keys.length >= this.max){
            // delete one
            delete this.cache[keys[0]];
        }
        this.cache[key]=value;
    }
    clear(){
        this.cache = {};
    }
}

export const alCache=new Cache();

export function arenaless(config: { modules_raw: Record<string, Uint8Array>,aliases?: Array<{find:string,replacement:string}> }): Plugin {
    let modules: Record<string, string|{binary:boolean}> = {};
    let aliases=config.aliases||[];
    for (let key in config.modules_raw) {
        // test if text can be decoded
        let b64 = Base64.fromUint8Array(config.modules_raw[key]);
        modules[`${key}?binary`]=`import {toByteArray as $arenaless_internel_base64ToUint8Array} from "https://esm.sh/base64-js@1.5.1";export default $arenaless_internel_base64ToUint8Array("${b64}");`;
        modules[`${key}?base64`]=`export default "${b64}";`;
        try {
            
            let text = new TextDecoder("utf-8", { fatal: true }).decode(config.modules_raw[key]);
            modules[key] = text;
            modules[`${key}?text`]=`export default \`${text}\`;`;
        } catch (e) {
            modules[key] = {binary:true};
            if(key.endsWith(".wasm"))modules[`${key}?wasm`]=`import {toByteArray as $arenaless_internel_base64ToUint8Array} from "https://esm.sh/base64-js@1.5.1";let buf=$arenaless_internel_base64ToUint8Array("${b64}");export default async()=>{let module=await WebAssembly.compile(buf);let instance=await WebAssembly.instantiate(module,{});return instance;}`
        }
    }
    return {
        name: "arenaless",
        resolveId(id, importer, options) {
            if (hasSpecifiers(id)) {
                return resolveIdWithSpecifiers(id);
            }
            if ((id.startsWith("/") || id.startsWith("./")) && importer && (importer.startsWith("http://") || importer.startsWith("https://")) && hasSpecifiers(importer!)) {
                try {
                    new URL(id, importer);
                    return new URL(id, importer).href;
                } catch {

                }
            }
            // resolve alias
            let hasAlias=aliases.find(alias=>id.startsWith(alias.find));
            if(hasAlias){
                let replacement=hasAlias.replacement;
                let newId=id.replace(hasAlias.find,replacement);
                if(hasSpecifiers(newId)){
                    // console.log(newId)
                    return resolveIdWithSpecifiers(newId);
                }
                return resolveVirtualFS(newId, importer, modules,true);
            }
            return resolveVirtualFS(id, importer, modules);
        }, async load(id) {
            // vfs
            if (id.startsWith(VFS_PREFIX)) {
                let file = id.slice(VFS_PREFIX.length);
                let content = modules[file];
                if (typeof content == "string") {
                    return content;
                }else if(typeof content=="object"&&content.binary){
                    throw Error(`File ${file} is binary, if you need binary data, please import <path>?binary"`);
                }
            }
            // url
            if (id.startsWith("http://") || id.startsWith("https://")) {
                // console.log("loading url",id)
                let content=alCache.get(id);
                if(content){
                    return content;
                }
                content=await (await fetch(id)).text();
                alCache.set(id,content);
                return content;
            }
        }
    }
}
export function jsonLoader():Plugin{
    return {
        name: "jsonLoader",
        transform(code, id) {
            if(id.endsWith(".json")){
                return `export default ${JSON.stringify(JSON.parse(code))};`
            }
        },
    }
}