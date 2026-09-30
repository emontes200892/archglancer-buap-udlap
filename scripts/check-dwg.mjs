import fs from 'node:fs';
import createModule from '../node_modules/@mlightcad/libredwg-web/wasm/libredwg-web.js';
import {LibreDwg} from '@mlightcad/libredwg-web';
import {importDwgDatabase} from '../src/dwg-adapter.mjs';
const m=await createModule({wasmBinary:fs.readFileSync('node_modules/@mlightcad/libredwg-web/wasm/libredwg-web.wasm'),print:()=>{},printErr:()=>{}});
m.FS.writeFile('input.dwg',fs.readFileSync(process.argv[2]));console.log('Reading DWG');const r=m.dwg_read_file('input.dwg');console.log('Read result',r.error);
const lib=LibreDwg.createByWasmInstance(m);const db=lib.convert(r.data);lib.dwg_free(r.data);console.log('Converted database',db.entities.length,Object.keys(db.header).slice(0,10));
const d=importDwgDatabase(db,process.argv[2],console.log);console.log(JSON.stringify({objects:d.objects.length,layers:Object.keys(d.layers).length,source:d.source}));if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(d));
