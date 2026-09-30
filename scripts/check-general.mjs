import assert from 'node:assert/strict';
import {renderDocument} from '../src/cad-import.mjs';
import {proposeViews,compatibility,UNIT_MM} from '../src/project-analysis.mjs';
const line=(layer,x=0)=>({type:'LINE',layer,vertices:[{x,y:0},{x:x+10,y:10}]});
const cases=[
 {name:'Casa métrica',unit:6,entities:[line('MUROS-ALFA')]},
 {name:'Oficina imperial',unit:2,entities:[{...line('Wall-custom'),layout:'Level Two'}]},
 {name:'Instalación en milímetros',unit:4,entities:[line('PIPE_A'),line('POWER-Z',20)]},
 {name:'Corte con bloque rotado',unit:5,entities:[{type:'INSERT',name:'B',layer:'X',position:{x:5,y:7},rotation:90,xScale:2,yScale:2}],blocks:{B:{position:{x:0,y:0},entities:[line('0')]}}},
 {name:'Objeto omitido',unit:0,entities:[line('ANY'),{type:'CUSTOM_PROXY',layer:'OTHER'}]}
];
for(const c of cases){const d=renderDocument({header:{$INSUNITS:c.unit},entities:c.entities,blocks:c.blocks||{},tables:{}},c.name);const v=proposeViews(d),report=compatibility(d);assert.ok(v.length);assert.ok(v.every(x=>x.selected===false&&x.bounds.every(Number.isFinite)));assert.equal(report.file,c.name);if(c.unit===2)assert.equal(UNIT_MM[d.units],304.8);if(c.unit===0)assert.equal(report.omitted.CUSTOM_PROXY,1);console.log('PASS',c.name,report.units,report.spaces.join(','));}
const custom={objects:[{layer:'a',points:[[0,0],[1,1]]}],views:[{name:'SECCIÓN A',space:'Modelo',bounds:[0,0,1,1]},{name:'PLANTA ALTA',space:'Modelo',bounds:[0,0,1,1]},{name:'Alpha',space:'Modelo',bounds:[0,0,1,1]}]};assert.deepEqual(proposeViews(custom).map(v=>v.kind),['corte','piso','vista']);
console.log('PASS: independent names, units, spaces, omission report and review-required suggestions. Synthetic fixtures; not universal DWG certification.');
