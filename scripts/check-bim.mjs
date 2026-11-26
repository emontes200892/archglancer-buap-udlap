import assert from 'node:assert/strict';
import fs from 'node:fs';
import {IfcAPI} from 'web-ifc';
import {extractIfc} from '../src/ifc-core.mjs';
import {packBim,unpackBim} from '../src/bim-project.mjs';
const bytes=new Uint8Array(fs.readFileSync('dist/data/edificio-demo.ifc'));
const expected=JSON.parse(fs.readFileSync('dist/data/edificio-demo.expected.json'));
const api=new IfcAPI();await api.Init();
try{
 const data=extractIfc(api,bytes);assert.equal(data.schema,'IFC4');assert.equal(data.elements.length,19);assert.equal(data.floors.length,2);
 for(const ref of expected.elements){const e=data.elements.find(e=>e.guid===ref.guid);assert.ok(e,ref.name);assert.equal(e.type,ref.type);assert.equal(e.storey,ref.storey);e.bounds.forEach((v,i)=>assert.ok(Math.abs(v-ref.bounds[i])<1e-4,ref.name+' coordinates'));}
 assert.equal(data.elements.filter(e=>e.type==='IFCDOOR').length,2);assert.match(data.elements.find(e=>e.type==='IFCDOOR').material,/Madera/);
 const original=new TextDecoder().decode(bytes),mm=original.replace("IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.)","IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.)");assert.notEqual(mm,original);
 const small=extractIfc(api,new TextEncoder().encode(mm));for(const ref of expected.elements){const e=small.elements.find(e=>e.guid===ref.guid);e.bounds.forEach((v,i)=>assert.ok(Math.abs(v-ref.bounds[i]/1000)<1e-6,'mm conversion'));}
 assert.throws(()=>extractIfc(api,new Uint8Array([1,2,3])),/IFC STEP/);
 const state={schema:'archglancer-bim/1',name:'Prueba',cursor:[2.6,.09,1.3],selected:data.elements.find(e=>e.type==='IFCDOOR').id,floor:'all',category:'all',search:'Puerta',views:Array.from({length:4},()=>({position:[20,-20,20],target:[2.6,.09,1.3],zoom:1})),planes:true,clip3d:false};
 const restored=unpackBim(packBim(bytes,state));assert.deepEqual(restored.bytes,bytes);assert.deepEqual(restored.state,state);
 assert.throws(()=>unpackBim(new Uint8Array([1,2,3])));assert.throws(()=>packBim(bytes,{...state,cursor:[NaN,0,0]}),/inválida/);
 console.log('PASS BIM: IFC4 real parser, 19 objects, 2 storeys, stable GUIDs, doors/materials, XYZ bounds, metre/mm conversion, invalid input, ZIP/state roundtrip.');
}finally{api.Dispose();}
