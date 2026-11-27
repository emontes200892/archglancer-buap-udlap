// Reconstrucción geométrica revisable: perfiles CAD cerrados -> prismas.
// No usa aprendizaje automático ni deduce huecos verticales o materiales.
import {Shape,Path,ExtrudeGeometry} from 'three';
export const RECON_SCHEMA='archglancer-reconstruction/1';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const area=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-a[1]*b[0];},0)/2;
const inRing=(p,r)=>{let inside=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;};
const intersects=(a,b,c,d)=>{const u=cross(a,b,c),v=cross(a,b,d),w=cross(c,d,a),z=cross(c,d,b);return u*v < -1e-16 && w*z < -1e-16;};
function clean(points){const p=[];for(const a of points)if(!p.length||Math.hypot(a[0]-p.at(-1)[0],a[1]-p.at(-1)[1])>1e-7)p.push(a);if(p.length>1&&Math.hypot(p[0][0]-p.at(-1)[0],p[0][1]-p.at(-1)[1])<1e-5)p.pop();for(let i=p.length-1;i>=0&&p.length>3;i--)if(Math.abs(cross(p[(i+p.length-1)%p.length],p[i],p[(i+1)%p.length]))<1e-10)p.splice(i,1);return p;}
function key(p){return p.map(a=>a.map(v=>Math.round(v*1e5)).join(',')).sort().join(';');}
export function validateReconstruction(r){
 if(r?.schema!==RECON_SCHEMA||r.cad?.schema!=='archglancer/1'||!Array.isArray(r.cad.objects)||r.cad.objects.length>250000)throw Error('Proyecto de reconstrucción inválido.');
 const s=r.settings;if(!s||!finite(s.unitScale)||s.unitScale<=0||s.unitScale>1000||!finite(s.height)||s.height<.1||s.height>100||!finite(s.baseZ)||Math.abs(s.baseZ)>10000||!Array.isArray(s.origin)||s.origin.length!==2||s.origin.some(x=>!finite(x)||Math.abs(x)>1e9)||!Array.isArray(s.layers)||!s.layers.length||s.layers.length>200||s.layers.some(x=>typeof x!=='string'))throw Error('Revisa escala, capas y alturas de reconstrucción.');
 if(!s.view||typeof s.view.space!=='string'||!Array.isArray(s.view.bounds)||s.view.bounds.length!==4||s.view.bounds.some(x=>!finite(x))||s.view.bounds[2]<=s.view.bounds[0]||s.view.bounds[3]<=s.view.bounds[1])throw Error('Delimita primero una vista CAD válida.');
 if(!s.overrides||typeof s.overrides!=='object'||Array.isArray(s.overrides)||!Array.isArray(s.excluded)||s.excluded.some(x=>typeof x!=='string'))throw Error('Ediciones de reconstrucción inválidas.');
 for(const o of Object.values(s.overrides)){if(!o||!finite(o.height)||o.height<.1||o.height>100||!finite(o.baseZ)||Math.abs(o.baseZ)>10000)throw Error('Altura de componente inválida.');}
 let n=0;const ids=new Set();for(const o of r.cad.objects){if(typeof o?.id!=='string'||ids.has(o.id)||typeof o.layer!=='string'||!Array.isArray(o.points)||!o.points.length)throw Error('Entidad CAD inválida.');ids.add(o.id);n+=o.points.length;if(n>5000000||o.points.some(p=>!Array.isArray(p)||p.length!==2||p.some(x=>!finite(x)||Math.abs(x)>1e9)))throw Error('Coordenadas CAD inválidas o demasiado grandes.');}
 return r;
}
export function createReconstruction(cad,view,settings={}){
 const b=view.bounds||cad.bounds;if(!b)throw Error('Delimita primero la planta en CAD.');
 // Guardar solo el espacio y recorte elegidos, conservando los IDs fuente.
 const objects=cad.objects.filter(o=>(o.space||'Modelo')===view.space&&o.points.some(p=>p[0]>=b[0]&&p[0]<=b[2]&&p[1]>=b[1]&&p[1]<=b[3]));
 const r={schema:RECON_SCHEMA,name:cad.name+' · reconstrucción preliminar',cad:{...cad,objects,bounds:b,views:[{...view,bounds:b}]},settings:{unitScale:1,height:3.2,baseZ:0,origin:[b[0],b[1]],view:{...view,bounds:b},layers:[],overrides:{},excluded:[],...settings}};return validateReconstruction(r);
}
export function reconstruct(r){validateReconstruction(r);const s=r.settings,report={open:0,unsupported:0,degenerate:0,selfIntersecting:0,duplicate:0,outside:0,nested:0,excluded:0},rings=[],seen=new Set(),b=s.view.bounds,scale=s.unitScale;
 for(const o of r.cad.objects){if(!s.layers.includes(o.layer)||(o.space||'Modelo')!==s.view.space)continue;
  if(!['LWPOLYLINE','POLYLINE'].includes(o.type)){report.unsupported++;continue;}
  if(Math.hypot(o.points[0][0]-o.points.at(-1)[0],o.points[0][1]-o.points.at(-1)[1])>1e-5){report.open++;continue;}
  if(o.points.some(p=>p[0]<b[0]-1e-6||p[0]>b[2]+1e-6||p[1]<b[1]-1e-6||p[1]>b[3]+1e-6)){report.outside++;continue;}
  const p=clean(o.points.map(p=>[(p[0]-s.origin[0])*scale,(p[1]-s.origin[1])*scale]));
  if(p.length<3||p.length>512||Math.abs(area(p))<.0001||p.some(a=>a.some(x=>Math.abs(x)>1e5))){report.degenerate++;continue;}
  let invalid=false;for(let i=0;i<p.length&&!invalid;i++)for(let j=i+2;j<p.length;j++)if(!(i===0&&j===p.length-1)&&intersects(p[i],p[(i+1)%p.length],p[j],p[(j+1)%p.length])){invalid=true;break;}
  if(invalid){report.selfIntersecting++;continue;}const k=key(p);if(seen.has(k)){report.duplicate++;continue;}seen.add(k);rings.push({o,p,area:Math.abs(area(p)),parent:null,depth:0});if(rings.length>2000)throw Error('Más de 2 000 perfiles. Reduce el recorte o las capas.');
 }
 // Los anillos totalmente contenidos de la misma capa son huecos del perfil.
 const sorted=[...rings].sort((a,b)=>b.area-a.area);
 for(let i=0;i<sorted.length;i++){const a=sorted[i];for(let j=i-1;j>=0;j--){const candidate=sorted[j];if(candidate.o.layer===a.o.layer&&a.p.every(p=>inRing(p,candidate.p))){let crossing=false;for(let x=0;x<a.p.length&&!crossing;x++)for(let y=0;y<candidate.p.length;y++)if(intersects(a.p[x],a.p[(x+1)%a.p.length],candidate.p[y],candidate.p[(y+1)%candidate.p.length])){crossing=true;break;}if(!crossing){a.parent=candidate;a.depth=candidate.depth+1;break;}}}}
 const meshes=[],elements=[],profiles=[];let triangles=0;
 for(let i=0;i<rings.length;i++){const ring=rings[i],o=ring.o;if(ring.depth%2){report.nested++;continue;}if(s.excluded.includes(o.id)){report.excluded++;continue;}
  const cfg=s.overrides[o.id]||{height:s.height,baseZ:s.baseZ},shape=new Shape();ring.p.forEach((p,j)=>j?shape.lineTo(...p):shape.moveTo(...p));shape.closePath();const holes=rings.filter(a=>a.parent===ring&&a.depth%2);
  for(const h of holes){const path=new Path();h.p.forEach((p,j)=>j?path.lineTo(...p):path.moveTo(...p));path.closePath();shape.holes.push(path);}
  const g=new ExtrudeGeometry(shape,{depth:cfg.height,bevelEnabled:false,steps:1,curveSegments:1});g.translate(0,0,cfg.baseZ);g.computeBoundingBox();const positions=g.attributes.position.array.slice(),indices=Uint32Array.from({length:positions.length/3},(_,i)=>i),id=i+1,box=[...g.boundingBox.min.toArray(),...g.boundingBox.max.toArray()];triangles+=indices.length/3;
  const el={id,guid:'CAD:'+o.id,name:o.layer+' / '+o.id,type:'MURO_PROPUESTO',storeyId:1,storey:s.view.name||'Planta CAD',material:'Sin verificar',bounds:box,sourceCadId:o.id,sourceCadIds:[o.id,...holes.map(h=>h.o.id)],props:{'Origen':'Extrusión de perfil CAD; no IA','Capa CAD':o.layer,'ID CAD':o.id,'Altura (m)':cfg.height,'Base Z (m)':cfg.baseZ,'Estado':'Provisional / requiere revisión','Huecos del perfil':holes.length}};
  profiles.push({id,points:ring.p,holes:holes.map(h=>h.p),height:cfg.height,baseZ:cfg.baseZ});elements.push(el);meshes.push({id,positions,indices});g.dispose();
 }
 if(!elements.length)throw Error('No hay perfiles cerrados válidos. Selecciona capas de muros o delimita otra vista. Los trazos abiertos no se convierten en muros automáticamente.');
 if(triangles>50000)throw Error('Más de 50 000 triángulos; reduce capas o perfiles.');
 return {schema:'CAD 2.5D · alturas provisionales',floors:[{id:1,name:s.view.name||'Planta CAD'}],elements,meshes,profiles,triangles,report};
}
