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
        return { id: content };
    }
}
function resolveVirtualFS(id: string, importer: string | undefined, modules: Record<string, any>) {
    if (!importer) {
        return `${VFS_PREFIX}${id}`;
    }
    const importerNoPrefix = importer.startsWith(VFS_PREFIX)
        ? importer.slice(VFS_PREFIX.length)
        : importer;
    if (id.startsWith("./")) {
        id = id.slice(2);
    }
    let resolved = path.dirname(importerNoPrefix) + "/" + id;
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

export function arenaless(config: { modules_raw: Record<string, Uint8Array> }): Plugin {
    let modules: Record<string, string|{binary:boolean}> = {};
    let base64flag = false;
    for (let key in config.modules_raw) {
        // test if text can be decoded
        try {
            let text = new TextDecoder("utf-8", { fatal: true }).decode(config.modules_raw[key]);
            modules[key] = text;
        } catch (e) {
            // to base64
            base64flag = true;
            let b64 = Base64.fromUint8Array(config.modules_raw[key]);
            // b64="<debug removed>"
            modules[key] = {binary:true};
            modules[`${key}?binary`]=`export default $arenaless_internel_base64ToUint8Array("${b64}");`;
        }
    }
    return {
        name: "arenaless",
        intro() {
            if (!base64flag) {
                return "";
            }
            // base64 to uint array(but without atob)
            return `function $arenaless_internel_base64ToUint8Array(b){ const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"; let s = b.replace(/[^A-Za-z0-9\+\/]/g,"").split(''), l = s.length, u8 = new Uint8Array(l * 3 / 4 - 4), j = 0, o1, o2, o3, o4; for(let i = 0; i < l;) { o1 = B64.indexOf(s[i++]); o2 = B64.indexOf(s[i++]); o3 = B64.indexOf(s[i++]); o4 = B64.indexOf(s[i++]); u8[j++] = (o1 << 2) | (o2 >> 4); if(o3 !== 64)u8[j++] = ((o2 & 15) << 4) | (o3 >> 2); if(o4 !== 64)u8[j++] = ((o3 & 3) << 6) | o4; } return u8; }`
        },
        resolveId(id, importer, options) {
            if (hasSpecifiers(id)) {
                return resolveIdWithSpecifiers(id);
            }
            if ((id.startsWith("/") || id.startsWith("./") && importer && (importer.startsWith("http://") || importer.startsWith("https://"))) && hasSpecifiers(importer!)) {
                try {
                    new URL(id, importer);
                    return new URL(id, importer).href;
                } catch {

                }
            }
            return resolveVirtualFS(id, importer, modules);
        }, async load(id) {
            // vfs
            if (id.startsWith(VFS_PREFIX)) {
                let file = id.slice(VFS_PREFIX.length);
                let content = modules[file];
                if (typeof content == "string") {
                    return content;
                }else if(content.binary){
                    throw Error(`File ${file} is binary, if you need binary data, please import <path>?binary"`);
                }
            }
            // url
            if (id.startsWith("http://") || id.startsWith("https://")) {
                return await (await fetch(id)).text();
            }
        },
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