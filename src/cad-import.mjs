import DxfParser from 'dxf-parser';

const TAU=Math.PI*2, ID=[1,0,0,1,0,0];
const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const xy=p=>[p.x,p.y];
function arc(cx,cy,rx,ry,start,end,rotation=0){while(end<=start)end+=TAU;const n=Math.max(8,Math.ceil((end-start)*24));return Array.from({length:n+1},(_,i)=>{const t=start+(end-start)*i/n,x=rx*Math.cos(t),y=ry*Math.sin(t);return[cx+x*Math.cos(rotation)-y*Math.sin(rotation),cy+x*Math.sin(rotation)+y*Math.cos(rotation)];});}
function poly(vertices,closed){const out=[];for(let i=0;i<vertices.length;i++){const a=vertices[i],b=vertices[(i+1)%vertices.length];out.push(xy(a));if((i<vertices.length-1||closed)&&a.bulge){const theta=4*Math.atan(a.bulge),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),offset=len*(1-a.bulge*a.bulge)/(4*a.bulge),cx=(a.x+b.x)/2-dy/len*offset,cy=(a.y+b.y)/2+dx/len*offset,r=Math.hypot(a.x-cx,a.y-cy),start=Math.atan2(a.y-cy,a.x-cx),n=Math.max(4,Math.ceil(Math.abs(theta)*24));for(let j=1;j<n;j++){const t=start+theta*j/n;out.push([cx+r*Math.cos(t),cy+r*Math.sin(t)]);}}}if(closed&&out.length)out.push(out[0]);return out;}
function spline(e){const p=e.controlPoints,k=e.knotValues,d=e.degreeOfSplineCurve;if(!p?.length||!k?.length||d<1||d>=p.length)throw Error('SPLINE no compatible');const out=[];for(let i=0;i<=80;i++){const u=k[d]+(k[p.length]-k[d])*Math.min(i/80,1-1e-12);let s=d;while(s<p.length-1&&u>=k[s+1])s++;const v=Array.from({length:d+1},(_,j)=>{const n=s-d+j,w=e.weights?.[n]??1;return[p[n].x*w,p[n].y*w,w];});for(let r=1;r<=d;r++)for(let j=d;j>=r;j--){const a=(u-k[s-d+j])/(k[s+1+j-r]-k[s-d+j]||1);v[j]=v[j].map((n,c)=>v[j-1][c]*(1-a)+n*a);}out.push([v[d][0]/v[d][2],v[d][1]/v[d][2]]);}return out;}
function rawHandler(type){return {parseEntity(scanner,curr){const e={type,raw:[]};curr=scanner.next();while(!scanner.isEOF()&&curr.code!==0){e.raw.push(curr);if(curr.code===5)e.handle=String(curr.value);if(curr.code===330)e.ownerHandle=String(curr.value);if(curr.code===8)e.layer=String(curr.value);if(curr.code===67)e.inPaperSpace=!!curr.value;if(curr.code===410)e.layout=String(curr.value);curr=scanner.next();}return e;}};}
function hatch(e){const g=e.raw;let i=g.findIndex(v=>v.code===91)+1;if(!i)throw Error('HATCH sin contorno');const out=[];const get=code=>{if(g[i]?.code!==code)throw Error('HATCH complejo');return g[i++].value;};while(i<g.length&&g[i].code===92){const flags=get(92);if(flags&2){get(72);const closed=get(73),count=get(93),p=[];for(let n=0;n<count;n++){const v={x:get(10),y:get(20)};if(g[i]?.code===42)v.bulge=get(42);p.push(v);}out.push(poly(p,closed));}else{const count=get(93);for(let n=0;n<count;n++){const type=get(72);if(type===1)out.push([[get(10),get(20)],[get(11),get(21)]]);else if(type===2){const x=get(10),y=get(20),r=get(40),a=get(50)*Math.PI/180,b=get(51)*Math.PI/180,ccw=get(73);out.push(ccw?arc(x,y,r,r,a,b):arc(x,y,r,r,b,a).reverse());}else throw Error('HATCH con borde no compatible');}}if(g[i]?.code===97){const n=get(97);i+=n;}}return out;}

export function importDxf(text,name='drawing.dxf',progress=()=>{}){
 if(text.startsWith('AutoCAD Binary DXF'))throw Error('DXF binario no compatible. Guarda como DXF ASCII.');
 if(!/\bSECTION\b/.test(text)||!text.trimEnd().endsWith('EOF'))throw Error('El archivo no es un DXF ASCII completo.');
 progress('Leyendo entidades, bloques y capas…');
 const parser=new DxfParser(),handlers=parser._entityHandlers;
 // Preserve layout metadata that the upstream parser does not expose.
 handlers.ATTRIB=Object.create(handlers.TEXT);
 for(const handler of Object.values(handlers)){const original=handler.parseEntity;handler.parseEntity=function(scanner,curr){const next=scanner.next,meta={},weights=[];scanner.next=function(){const g=next.call(this);if(g.code===410)meta.layout=String(g.value);if(curr.value==='SPLINE'&&g.code===41)weights.push(g.value);return g;};try{const e=Object.assign(original.call(this,scanner,curr),meta);if(weights.length)e.weights=weights;return e;}finally{scanner.next=next;}};}
 parser._entityHandlers=new Proxy(handlers,{get:(target,key)=>target[key]||rawHandler(key)});
 const doc=parser.parseSync(text);if(!doc?.entities)throw Error('No se encontró la sección ENTITIES.');
 return renderDocument(doc,name,progress,text);
}
export function renderDocument(doc,name,progress=()=>{},text=''){
 progress('Construyendo geometría y referencias de bloques…');
 const objects=[],omitted={},warnings=new Set(),views=[],types={},layers=doc.tables?.layer?.layers||{},seen=new Set();let vertices=0;
 const omit=t=>{omitted[t]=(omitted[t]||0)+1;};
 function add(e,points,m,id,layer,space,extra={}){if(!points.length||points.some(p=>p.some(n=>!Number.isFinite(n)))){omit(e.type+' inválido');return;}vertices+=points.length;if(vertices>5000000||objects.length>=250000)throw Error('El dibujo supera el límite de 250 000 trazos o 5 millones de vértices.');let ident=id;while(seen.has(ident))ident+='~';seen.add(ident);const p=points.map(([x,y])=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]]);objects.push({id:ident,sourceHandle:e.handle||null,type:e.type,layer,space,points:p,color:e.colorIndex===0?undefined:e.color, ...extra});}
 function visit(e,m=ID,path='',inherited='0',space='Modelo',chain=[]){const id=path+(e.handle||'entity-'+objects.length),layer=e.layer&&e.layer!=='0'?e.layer:inherited;
  space=e.layout&&e.layout!=='Model'?e.layout:space;
  if(e.visible===false)return;
  if(e.type==='INSERT'||e.type==='DIMENSION'){
   const blockName=e.name||e.block,b=doc.blocks?.[blockName];if(!b?.entities?.length){omit(e.type+' / bloque ausente');return;}if(chain.includes(blockName)||chain.length>=24){omit('bloque recursivo');return;}
   if(e.type==='DIMENSION'){b.entities.forEach((c,i)=>visit(c,m,id+'/'+i+'/',layer,space,[...chain,blockName]));return;}
   const pos=e.position||{x:0,y:0},base=b.position||{x:0,y:0},r=(e.rotation||0)*Math.PI/180,c=Math.cos(r),s=Math.sin(r),sx=e.xScale??1,sy=e.yScale??1;
   const ex=e.extrusionDirection;if(ex&&(Math.abs(ex.x)>1e-8||Math.abs(ex.y)>1e-8)){omit('INSERT OCS inclinado');return;}
   const parent=ex?.z<0?mul(m,[-1,0,0,1,0,0]):m;
   for(let row=0;row<(e.rowCount||1);row++)for(let col=0;col<(e.columnCount||1);col++){if(row* (e.columnCount||1)+col>10000)throw Error('Matriz de bloques demasiado grande.');const local=[c*sx,s*sx,-s*sy,c*sy,pos.x+c*col*(e.columnSpacing||0)-s*row*(e.rowSpacing||0),pos.y+s*col*(e.columnSpacing||0)+c*row*(e.rowSpacing||0)];local[4]-=local[0]*base.x+local[2]*base.y;local[5]-=local[1]*base.x+local[3]*base.y;b.entities.forEach((child,i)=>visit(child,mul(parent,local),id+'/'+row+','+col+'/'+i+'/',layer,space,[...chain,blockName]));}return;
  }
  const ex=e.extrusionDirection;if(ex&&(Math.abs(ex.x)>1e-8||Math.abs(ex.y)>1e-8)){omit(e.type+' OCS inclinado');return;}
  if(ex?.z<0&&!['LINE','POINT','SPLINE'].includes(e.type))m=mul(m,[-1,0,0,1,0,0]);
  let paths=[],extra={};try{switch(e.type){
   case 'LINE':paths=[e.vertices.map(xy)];break;
   case 'LWPOLYLINE':case 'POLYLINE':if(e.is3dPolygonMesh||e.isPolyfaceMesh)throw Error('mesh');paths=[poly(e.vertices,e.shape)];break;
   case 'CIRCLE':case 'ARC':paths=[arc(e.center.x,e.center.y,e.radius,e.radius,e.type==='CIRCLE'?0:e.startAngle,e.type==='CIRCLE'?TAU:e.endAngle)];break;
   case 'ELLIPSE':{const a=e.majorAxisEndPoint;paths=[arc(e.center.x,e.center.y,Math.hypot(a.x,a.y),Math.hypot(a.x,a.y)*e.axisRatio,e.startAngle,e.endAngle,Math.atan2(a.y,a.x))];break;}
   case 'SPLINE':paths=[spline(e)];break;
   case 'SOLID':case '3DFACE':{let p=e.points||e.vertices;if(e.type==='SOLID'&&p.length===4)p=[p[0],p[1],p[3],p[2]];paths=[[...p.map(xy),xy(p[0])]];break;}
   case 'TEXT':case 'MTEXT':case 'ATTDEF':case 'ATTRIB':{const p=e.startPoint||e.position;if(!p)throw Error('text');paths=[[xy(p)]];extra={label:String(e.text||'').replace(/\\P/g,'\n').replace(/\\[A-Za-z][^;]*;/g,'').replace(/[{}]/g,''),textHeight:(e.textHeight||e.height||1)*Math.hypot(m[0],m[1]),rotation:(e.rotation||0)+Math.atan2(m[1],m[0])*180/Math.PI};break;}
   case 'POINT':paths=[[xy(e.position)]];break;
   case 'HATCH':paths=e.boundaries||hatch(e);warnings.add('Sombreados mostrados como contornos, sin patrón de relleno.');break;
   case 'VIEWPORT':{const raw=e.raw,g=(code,def=0)=>raw.find(x=>x.code===code)?.value??def;if(g(69)>1&&g(41)>0&&g(45)>0&&g(51)===0&&g(16)===0&&g(26)===0){const cx=g(12)+g(17),cy=g(22)+g(27),h=g(45),w=h*g(40)/g(41);views.push({name:space+' · ventana '+g(69),space:'Modelo',bounds:[cx-w/2,cy-h/2,cx+w/2,cy+h/2]});}else warnings.add('Algunas ventanas de presentación no se reconstruyeron.');return;}
   case 'SEQEND':return;
   default:omit(e.type);return;
  }}catch{omit(e.type);return;}
  paths.forEach((p,i)=>add(e,p,m,id+(paths.length>1?'/contour-'+i:''),layer,space,extra));
 }
 const layoutNames=new Map();
 for(const match of text.matchAll(/(?:^|\n)[ \t]*0\r?\nLAYOUT\r?\n([\s\S]*?)(?=\r?\n[ \t]*0\r?\n[A-Z_][A-Z0-9_]*\r?\n)/g)){const values=match[1].trim().split(/\r?\n/);let name,owner;for(let i=0;i+1<values.length;i+=2){if(Number(values[i])===1)name=values[i+1].trim();if(Number(values[i])===330)owner=values[i+1].trim();}if(name&&owner)layoutNames.set(owner,name);}
 const topHandles=new Set(doc.entities.map(e=>e.handle));
 for(const e of doc.entities){types[e.type]=(types[e.type]||0)+1;visit(e,ID,'','0',e.inPaperSpace?(layoutNames.get(e.ownerHandle)||'Papel'):'Modelo');}
 for(const b of Object.values(doc.blocks||{})){if(!/^\*Paper_Space/i.test(b.name))continue;const name=layoutNames.get(b.ownerHandle)||b.name;for(const e of b.entities||[]){if(!topHandles.has(e.handle)){types[e.type]=(types[e.type]||0)+1;visit(e,ID,'','0',name);}}}
 if(!objects.length)throw Error('No se encontró geometría 2D compatible.');
 const units={0:'sin unidad',1:'in',2:'ft',4:'mm',5:'cm',6:'m',7:'km',12:'nm',13:'µm'};
 return {schema:'archglancer/1',name,units:units[doc.header?.$INSUNITS]||'unidades no especificadas',description:'Archivo local · proyección XY del modelo y presentaciones. Curvas aproximadas y tipografía de sustitución. Consulta el informe de importación.',objects,layers:Object.fromEntries(Object.entries(layers).map(([k,v])=>[k,{color:v.color,visible:v.visible!==false&&!v.frozen}])),views,source:{file:name,format:'DXF',version:doc.header?.$ACADVER,inputEntities:Object.values(types).reduce((a,b)=>a+b,0),types,omitted,warnings:[...warnings],vertices}};
}
export {arc,poly,spline};
