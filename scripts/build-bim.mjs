import {build} from 'esbuild';
import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist/bim',{recursive:true});
await build({entryPoints:['src/bim.mjs'],outfile:'dist/bim.js',bundle:true,minify:true,format:'esm',platform:'browser'});
await build({entryPoints:['src/bim-worker.mjs'],outfile:'dist/bim-worker.js',bundle:true,minify:true,format:'esm',platform:'browser'});
await copyFile('node_modules/web-ifc/web-ifc.wasm','dist/bim/web-ifc.wasm');
await copyFile('node_modules/web-ifc/LICENSE.md','dist/licenses/web-ifc-MPL-2.0.txt');
await copyFile('node_modules/three/LICENSE','dist/licenses/three-MIT.txt');
