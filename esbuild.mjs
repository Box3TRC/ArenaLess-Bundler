import { build } from "esbuild";
// import { polyfillNode } from "esbuild-plugin-polyfill-node";

build({
	entryPoints: ["index.ts"],
	bundle: true,
	outfile: "dist/index.js",
	minify: true,
	platform: "browser",
	format: "esm",
	plugins: [
		// polyfillNode({
		// 	polyfills:{
		// 		"fs":"empty",
		// 	},globals:{
		// 		buffer:false,
		// 		process:false,
		// 		navigator:false
		// 	}
		// }),
	],
}).then((x)=>{
	console.log(x)
});