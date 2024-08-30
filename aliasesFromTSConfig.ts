import JSON5 from "json5"
import { join, dirname, resolve } from 'path-browserify';

/**
 * An object with the aliases as property keys and paths as its values.
 *
 * @example
 * For this given `jsconfig.json`:
 * ```json
 * {
 *   "compilerOptions": {
 *     "baseUrl": "./app",
 *     "paths": {
 *       "@": ["src/index.mjs"],
 *       "@/*": ["src/*"],
 *       "@ui/*": ["src/components/ui/*"]
 *     }
 *   }
 * }
 * ```
 * It would be something like this object:
 * ```js
 * {
 *   '@': '/home/user/projects/example/app/src',
 *   '@ui': '/home/user/projects/example/app/src/components/ui'
 * }
 * ```
 */

class AliasesFromTSConfig {
  private baseUrl: string;

  private aliases: {
    alias: string;
    matcher: RegExp;
    replacer: string;
  }[];

  constructor(config_string:any) {
    const config = JSON5.parse(config_string);
    const paths = config.compilerOptions?.paths ?? {};

    this.baseUrl = config.compilerOptions?.baseUrl ?? '.';

    this.aliases = Object.entries(paths).map(([alias, locations]) => {
      const group = `(?:${alias.replace(/\*$/, '').replace(/\W/g, '\\$&')})`;

      return {
        alias,
        matcher: new RegExp(`^${group}${alias.endsWith('*') ? '(.*)' : ''}$`),
        replacer: (locations as string[])[0]?.replace(/\/\*$/, '') ?? '',
      };
    });
  }

  /** Resolves received path joining tsconfigPath's dirname and the baseUrl. */
  private resolvePath(path: string): string {
    return join(this.baseUrl, path).replace(/\\/g,"/")
  }

  /** Checks if received path contains an alias from jsconfig/tsconfig.json. */
  hasAlias(path: string): boolean {
    return this.aliases.some((alias) => alias.matcher.test(path));
  }

  /** Replaces the alias from jsconfig/tsconfig.json with the correct path. */
  apply(path: string) {
    for (const { matcher, replacer } of this.aliases) {
      const result = matcher.exec(path);

      if (!result) continue;

      const pathWithoutAlias = result[1] ?? '';

      return this.resolvePath(join(replacer, pathWithoutAlias));
    }

    return path;
  }

  /**
   * Gets an object with the aliases as properties and paths as values.
   *
   * @example
   * ```js
   * // webpack.config.js
   *
   * const aliasesFromTSConfig = new AliasesFromTSConfig('./tsconfig.json');
   *
   * module.exports = {
   *   resolve: {
   *     alias: aliasesFromTSConfig.getAliasesForWebpack(),
   *     // ...
   *   },
   *   // ...
   * };
   * ```
   */
//   getAliasesForWebpack(): AliasesForWebpack {
//     const aliases: AliasesForWebpack = {};

//     for (const { alias, replacer } of this.aliases) {
//       const aliasForFolder = alias.endsWith('/*');

//       const property = aliasForFolder ? alias.slice(0, -2) : alias;

//       if (property in aliases && !aliasForFolder) continue;

//       aliases[property] = this.resolvePath(replacer);
//     }

//     return aliases;
//   }
}

export default AliasesFromTSConfig;

// let a=new AliasesFromTSConfig(`{
//     "compilerOptions": {
//         "target": "ESNext",
//         "module": "commonjs",
//         "strict": true,
//         "esModuleInterop": true,
//         "skipLibCheck": true,
//         "forceConsistentCasingInFileNames": true,
//         "experimentalDecorators": true,
//         "moduleResolution": "node",
//         "baseUrl": "./",
//         "rootDir": "./",
//         "outDir": "dist", // do not change this
//         "lib": [],
//         "paths": {
//             "component": [
//                 "./src/Component/Definition"
//             ],
//             "@":["./src"]
//         },
        
//     },
//     "include": [
//         "./**/*.ts",
//         "./**/*.d.ts",
//         "./types"
//     ],
//     "exclude": [
//         "node_modules",
//         "dist"
//     ]
// }`);
// console.log(a.apply("@"));