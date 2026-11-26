import {build} from 'esbuild';
await build({entryPoints:['src/stack-archive.mjs'],outfile:'dist/stack-archive.js',bundle:true,format:'esm',minify:true});
