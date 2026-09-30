import {build} from 'esbuild';
import {mkdir,cp,copyFile} from 'node:fs/promises';
await build({entryPoints:['src/production.mjs'],bundle:true,format:'esm',platform:'browser',outfile:'dist/production.js',minify:true});
await mkdir('dist/pdf-engine',{recursive:true});
await copyFile('node_modules/pdfjs-dist/build/pdf.worker.mjs','dist/pdf-engine/pdf.worker.mjs');
for(const name of ['cmaps','standard_fonts','wasm'])await cp('node_modules/pdfjs-dist/'+name,'dist/pdf-engine/'+name,{recursive:true});
for(const [name,file] of [['pdfjs-dist','LICENSE'],['pdf-lib','LICENSE.md'],['fflate','LICENSE']])await copyFile('node_modules/'+name+'/'+file,'dist/licenses/'+name+'-LICENSE.txt');
