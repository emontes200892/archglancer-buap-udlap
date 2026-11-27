import assert from 'node:assert/strict';
import {createReconstruction,reconstruct,validateReconstruction} from '../src/reconstruction.mjs';
import {packBim,unpackBim} from '../src/bim-project.mjs';
const square=(id,p)=>({id,layer:'Muros',type:'LWPOLYLINE',space:'Modelo',points:p});
const cad={schema:'archglancer/1',name:'Test',units:'mm',bounds:[-1,-1,5000,5000],objects:[square('outer',[[0,0],[4000,0],[4000,4000],[0,4000],[0,0]]),square('inner',[[1000,1000],[3000,1000],[3000,3000],[1000,3000],[1000,1000]]),square('duplicate',[[0,0],[4000,0],[4000,4000],[0,4000],[0,0]]),square('open',[[0,0],[200,0]])]};
const r=createReconstruction(cad,{name:'Planta',space:'Modelo',bounds:cad.bounds},{layers:['Muros'],unitScale:.001,origin:[0,0],height:3.2});
const g=reconstruct(r);assert.equal(g.elements.length,1);assert.deepEqual(g.elements[0].bounds.map(x=>+x.toFixed(4)),[0,0,0,4,4,3.2]);assert.equal(g.report.nested,1);assert.equal(g.report.duplicate,1);assert.equal(g.report.open,1);
// Verify the enclosed mesh volume, including the hole, not merely its vertex count.
function volume(mesh){let total=0;const p=mesh.positions;for(let i=0;i<mesh.indices.length;i+=3){const a=mesh.indices[i]*3,b=mesh.indices[i+1]*3,c=mesh.indices[i+2]*3;total+=(p[a]*(p[b+1]*p[c+2]-p[b+2]*p[c+1])+p[a+1]*(p[b+2]*p[c]-p[b]*p[c+2])+p[a+2]*(p[b]*p[c+1]-p[b+1]*p[c]))/6;}return Math.abs(total);}
assert.ok(Math.abs(volume(g.meshes[0])-38.4)<.0001,'hole must remain empty');
r.settings.overrides.outer={height:2,baseZ:1};const edited=reconstruct(r);assert.equal(edited.elements[0].bounds[2],1);assert.equal(edited.elements[0].bounds[5],3);
const saved={schema:'archglancer-bim/1',name:'Test',cursor:[2,2,2],selected:1,floor:'all',category:'all',search:'',views:Array.from({length:4},()=>({position:[10,10,10],target:[2,2,2],zoom:1}))};
const bytes=new TextEncoder().encode(JSON.stringify(r));const restored=unpackBim(packBim(bytes,saved));assert.deepEqual(restored.bytes,bytes);assert.equal(reconstruct(JSON.parse(new TextDecoder().decode(restored.bytes))).elements[0].bounds[5],3);
assert.throws(()=>validateReconstruction({...r,settings:{...r.settings,height:NaN}}));
r.settings.excluded=['outer'];assert.throws(()=>reconstruct(r),/No hay perfiles/);
console.log('PASS reconstruction: mm/m units, closed profiles, hollow mesh volume, duplicate/open rejection, editable height/base, ZIP roundtrip, invalid height and exclusions.');
