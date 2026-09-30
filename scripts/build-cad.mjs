import {build} from 'esbuild';
import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist/cad-engine',{recursive:true});
await build({entryPoints:['src/cad-worker.mjs'],bundle:true,format:'esm',platform:'browser',external:['module'],outfile:'dist/cad-engine/cad-worker.js',minify:true});
await copyFile('node_modules/@mlightcad/libredwg-web/wasm/libredwg-web.wasm','dist/cad-engine/libredwg-web.wasm');
