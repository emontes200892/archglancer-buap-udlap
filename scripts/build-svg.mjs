import {build} from 'esbuild';
await build({entryPoints:['src/svg-import.mjs'],outfile:'dist/svg-import.js',bundle:true,format:'esm',minify:true});
import {copyFile} from 'node:fs/promises';
await copyFile('node_modules/svgpath/LICENSE','dist/licenses/svgpath-MIT.txt');
