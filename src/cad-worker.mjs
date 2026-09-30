import {importDxf} from './cad-import.mjs';
import createModule from '../node_modules/@mlightcad/libredwg-web/wasm/libredwg-web.js';
import {LibreDwg} from '@mlightcad/libredwg-web';
import {importDwgDatabase} from './dwg-adapter.mjs';
self.onmessage=async({data:{file}})=>{const progress=message=>self.postMessage({progress:message});try{
 progress('Leyendo '+file.name+'…');let text;
 if(/\.dwg$/i.test(file.name)){
  const bytes=await file.arrayBuffer();const magic=new TextDecoder().decode(bytes.slice(0,6));if(!/^AC10\d\d$/.test(magic))throw Error('La cabecera no corresponde a un DWG compatible.');
  progress('Abriendo motor DWG… Puede tardar con archivos grandes.');
  const response=await fetch(new URL('libredwg-web.wasm',self.location.href));if(!response.ok)throw Error('No se pudo cargar el motor DWG.');
  const lib=await createModule({wasmBinary:await response.arrayBuffer(),print:()=>{},printErr:()=>{}});
  progress('Leyendo la base de entidades DWG…');
  lib.FS.writeFile('input.dwg',new Uint8Array(bytes));const result=lib.dwg_read_file('input.dwg');lib.FS.unlink('input.dwg');if(!result.data||result.error>=128)throw Error('El motor no pudo leer este DWG (código '+result.error+').');
  progress('Preparando bloques y geometría DWG…');const wrapper=LibreDwg.createByWasmInstance(lib);let db;try{db=wrapper.convert(result.data);}finally{wrapper.dwg_free(result.data);}
  const dataset=importDwgDatabase(db,file.name,progress);if(result.error)dataset.source.warnings.push('El lector DWG notificó incidencias: código '+result.error+'. La lectura puede ser incompleta.');self.postMessage({dataset});return;
 }else{const bytes=await file.arrayBuffer();const utf=new TextDecoder().decode(bytes);text=/\$ACADVER\s+1\s+AC10(?:0|1)[0-9]/.test(utf)?new TextDecoder('windows-1252').decode(bytes):utf;}
 const dataset=importDxf(text,file.name,progress);
 self.postMessage({dataset});
 }catch(e){self.postMessage({error:e.message||'Error al abrir el archivo CAD.'});}};
