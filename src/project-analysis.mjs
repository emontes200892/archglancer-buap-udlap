// File-independent analysis. Suggestions are evidence-based labels, never semantic certainty.
export const UNIT_MM={mm:1,cm:10,m:1000,in:25.4,ft:304.8,km:1e6,nm:1e-6,'µm':.001};
export function classifyView(name){
 const s=String(name).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 for(const [kind,re]of [['corte',/\b(corte|seccion|section)\b/],['fachada',/\b(fachada|elevation)\b/],['detalle',/\b(detalle|detail)\b/],['piso',/\b(planta|piso|nivel|floor|ground|basement)\b/]])if(re.test(s))return kind;
 return 'vista';
}
export function spaceBounds(data){
 const groups=new Map();for(const o of data.objects||[]){const k=o.space||'Modelo';if(!groups.has(k))groups.set(k,[Infinity,Infinity,-Infinity,-Infinity]);const b=groups.get(k);for(const [x,y]of o.points){b[0]=Math.min(b[0],x);b[1]=Math.min(b[1],y);b[2]=Math.max(b[2],x);b[3]=Math.max(b[3],y);}}
 return [...groups].map(([space,bounds])=>{for(const [a,b]of [[0,2],[1,3]])if(bounds[b]===bounds[a]){bounds[a]-=.5;bounds[b]+=.5;}return {name:space,space,bounds};});
}
export function proposeViews(data){
 const existing=Array.isArray(data.views)?data.views:[];
 if(existing.length)return existing.map((v,i)=>({...v,name:v.name||v.space+' · vista '+(i+1),kind:classifyView(v.name),selected:false,origin:'viewport',notes:'Propuesta del archivo. Revisa contenido y límites antes de exportar.'}));
 return spaceBounds(data).map(v=>({...v,kind:classifyView(v.name),selected:false,origin:'space',notes:'Espacio completo. Puede contener varios pisos; delimita vistas si hace falta.'}));
}
export function compatibility(data){
 const s=data.source||{},omitted=s.omitted||s.unsupported||{},warnings=Array.isArray(s.warnings)?s.warnings:[];
 return {file:s.file||data.name||'Dataset',format:s.format||'JSON archglancer/1',version:s.version||'No declarada',units:data.units||'Sin declarar',unitMM:UNIT_MM[data.units]||null,objects:data.objects.length,layers:new Set(data.objects.map(o=>o.layer)).size,spaces:spaceBounds(data).map(v=>v.space),viewports:data.views?.length||0,omitted,warnings,status:Object.keys(omitted).length||warnings.length?'Lectura con limitaciones':'Sin omisiones registradas; requiere revisión visual',scope:'Geometría 2D recuperada. No certifica integridad ni fidelidad de trazado.'};
}
