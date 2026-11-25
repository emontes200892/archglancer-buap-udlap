import svgpath from 'svgpath';
const NS='http://www.w3.org/2000/svg';
const shapes={path:['d'],line:['x1','y1','x2','y2'],polyline:['points'],polygon:['points'],rect:['x','y','width','height','rx','ry'],circle:['cx','cy','r'],ellipse:['cx','cy','rx','ry']};
export async function importSvg(text,name='plano.svg'){
 if(text.length>20*1024*1024)throw Error('SVG: máximo 20 MB.');
 if(/<!DOCTYPE|<!ENTITY/i.test(text))throw Error('SVG con DTD o entidades externas no admitido.');
 const doc=new DOMParser().parseFromString(text,'image/svg+xml'),root=doc.documentElement;
 if(root.localName!=='svg'||doc.querySelector('parsererror'))throw Error('SVG inválido.');
 const objects=[],omitted={},warnings=new Set(['Contornos 2D. Curvas aproximadas; sin rellenos, grosores ni estilos de impresión.','Unidades SVG sin calibrar: confirma una medida conocida antes de imprimir a escala.','CSS y estilos heredados no se interpretan; se importan contornos geométricos.']),host=document.createElementNS(NS,'svg');
 host.setAttribute('width','1000');host.setAttribute('height','1000');host.style.cssText='position:fixed;left:-10000px;top:0;visibility:hidden;pointer-events:none';document.body.append(host);
 let nodes=0,vertices=0;const omit=k=>omitted[k]=(omitted[k]||0)+1;
 const attrs=node=>{const a={};for(const k of ['id','class','data-name','data-label','semantic-id','instance-id','data-semantic-id','data-instance-id'])if(node.hasAttribute(k))a[k]=node.getAttribute(k).slice(0,300);return a;};
 async function walk(node,transforms=[],metadata={}){
  if(++nodes>30000)throw Error('SVG demasiado complejo: máximo 30 000 nodos.');
  if(nodes%250===0)await new Promise(r=>setTimeout(r,0));
  const tag=node.localName,meta={...metadata,...attrs(node)},ts=[...transforms,node.getAttribute('transform')||''];
  if(node.getAttribute('display')==='none'||/display\s*:\s*none/.test(node.getAttribute('style')||'')){omit('elementos ocultos');return;}
  for(const a of ['clip-path','mask','filter'])if(node.hasAttribute(a))warnings.add('No se reproducen recortes, máscaras ni filtros SVG.');
  if(tag==='svg'||tag==='g'){if(tag==='svg'&&node!==root){omit('svg anidado');return;}for(const child of node.children)await walk(child,ts,meta);return;}
  if(!shapes[tag]){omit(tag);return;}
  const sourceId=node.getAttribute('id')||'svg-'+nodes,cls=meta['semantic-id']||meta['data-semantic-id']||meta['data-label']||meta.class||meta['data-name']||'SVG';
  let paths=[null];
  if(tag==='path'){
   const parsed=svgpath(node.getAttribute('d')||'').abs().unshort();if(parsed.err){omit('path inválido');return;}
   paths=[];let segments=[];for(const seg of parsed.segments){if(seg[0]==='M'&&segments.length){paths.push(segments.map(s=>s.join(' ')).join(' '));segments=[];}segments.push(seg);}if(segments.length)paths.push(segments.map(s=>s.join(' ')).join(' '));
  }
  for(const d of paths){
   let parent=host;for(const tr of ts){const g=document.createElementNS(NS,'g');g.setAttribute('transform',tr);parent.append(g);parent=g;}
   const el=document.createElementNS(NS,tag);for(const a of shapes[tag]){const v=node.getAttribute(a);if(v!==null){if(/url\(|%/i.test(v)){warnings.add('Longitudes porcentuales o referencias omitidas.');continue;}el.setAttribute(a,v);}}if(d!==null)el.setAttribute('d',d);parent.append(el);
   try{const len=el.getTotalLength(),ctm=el.getCTM();if(!Number.isFinite(len)||!ctm){omit('geometría inválida');continue;}
    let pts;
    if(tag==='path'&&!/[CQAST]/i.test(d)){const segs=svgpath(d).abs().unshort().segments;pts=[];let x=0,y=0,start;for(const s of segs){if(s[0]==='M'||s[0]==='L'){x=s[1];y=s[2];}else if(s[0]==='H')x=s[1];else if(s[0]==='V')y=s[1];else if(s[0]==='Z'){[x,y]=start;}if(s[0]==='M')start=[x,y];pts.push({x,y});}}
    else if(tag==='polyline'||tag==='polygon'){pts=Array.from(el.points,p=>({x:p.x,y:p.y}));if(tag==='polygon'&&pts.length)pts.push({...pts[0]});}
    else if(tag==='rect'&&!el.rx.baseVal.value&&!el.ry.baseVal.value){const x=el.x.baseVal.value,y=el.y.baseVal.value,w=el.width.baseVal.value,h=el.height.baseVal.value;pts=[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h},{x,y}];}
    else{const count=tag==='line'?1:Math.min(2048,Math.max(32,Math.ceil(len/2)));pts=Array.from({length:count+1},(_,i)=>el.getPointAtLength(len*i/count));}
    const points=pts.map(p=>{const q=new DOMPoint(p.x,p.y).matrixTransform(ctm);return[q.x,-q.y];});vertices+=points.length;if(vertices>2000000||objects.length>=100000)throw Error('SVG excede el límite de geometría.');
    if(points.length&&points.every(p=>p.every(Number.isFinite)))objects.push({id:'svg-'+objects.length,sourceHandle:sourceId,layer:String(cls),space:'Modelo',type:'SVG_'+tag,points,metadata:meta,category:String(cls),reviewed:false});
   }finally{host.replaceChildren();}
  }
 }
 try{await walk(root);}finally{host.remove();}
 if(!objects.length)throw Error('No se encontraron contornos compatibles.');
 return {schema:'archglancer/1',name,units:'',description:'SVG importado. Etiquetas procedentes del archivo; no son predicciones automáticas.',objects,source:{file:name,format:'SVG',inputEntities:nodes,omitted,warnings:[...warnings]}};
}