import fs from 'node:fs';
import {importDxf} from '../src/cad-import.mjs';
const file=process.argv[2];
const start=Date.now();
const bytes=fs.readFileSync(file),utf=new TextDecoder().decode(bytes);
const d=importDxf(/\$ACADVER\s+1\s+AC10(?:0|1)[0-9]/.test(utf)?new TextDecoder('windows-1252').decode(bytes):utf,file,console.log);
console.log(JSON.stringify({objects:d.objects.length,layers:Object.keys(d.layers).length,views:d.views.length,spaces:[...new Set(d.objects.map(o=>o.space))],source:d.source,seconds:(Date.now()-start)/1000}));
if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(d));
