import {zipSync,unzipSync,strToU8,strFromU8} from 'fflate';
const MB=1024**2;
export function validateSettings(m){
 if(!m||m.schema!=='archglancer-stack/1'||!Array.isArray(m.files)||m.files.length<2||m.files.length>128)throw Error('No es un proyecto XYZ compatible.');
 if(!Array.isArray(m.spacing)||m.spacing.length!==3||m.spacing.some(v=>!Number.isFinite(v)||v<=0))throw Error('Separaciones XYZ inválidas.');
 if(!['sin calibrar','unidades de ejemplo','nm','µm','mm'].includes(m.unit))throw Error('Unidad XYZ desconocida.');
 if(!Number.isFinite(m.ex)||m.ex<1||m.ex>100||!Array.isArray(m.pos)||m.pos.length!==3||m.pos.some(n=>!Number.isInteger(n)||n<0))throw Error('Posición o exageración inválida.');
 const paths=new Set();for(const f of m.files){if(!f||typeof f.path!=='string'||paths.has(f.path)||typeof f.name!=='string'||!/\.(png|jpe?g|webp)$/i.test(f.name))throw Error('Lista de imágenes inválida.');paths.add(f.path);}
 if(m.panels&&(!Array.isArray(m.panels)||m.panels.length!==4||m.panels.some(p=>!p||!Number.isFinite(p.zoom)||p.zoom<.1||p.zoom>20||!Array.isArray(p.pan)||p.pan.length!==2||p.pan.some(x=>!Number.isFinite(x)||Math.abs(x)>1e6)||!Number.isFinite(p.yaw)||!Number.isFinite(p.pitch))))throw Error('Estado de vistas inválido.');
 return m;
}
export async function packStack(files,settings){
 const manifest={...settings,schema:'archglancer-stack/1',files:files.map((f,i)=>({name:f.name,path:'slices/'+i+'.'+f.name.split('.').pop().toLowerCase()}))};validateSettings(manifest);
 const data={};let total=0;for(let i=0;i<files.length;i++){total+=files[i].size;if(files[i].size>32*MB||total>256*MB)throw Error('Stack demasiado grande.');data[manifest.files[i].path]=new Uint8Array(await files[i].arrayBuffer());}
 data['stack.json']=strToU8(JSON.stringify(manifest));return zipSync(data,{level:0});
}
export function unpackStack(bytes){
 if(bytes.length>258*MB)throw Error('ZIP XYZ mayor de 258 MB.');let total=0,count=0;
 const data=unzipSync(bytes,{filter:e=>{total+=e.originalSize;count++;if(total>257*MB||count>129||e.originalSize>32*MB)throw Error('ZIP XYZ supera los límites.');return true;}});
 if(!data['stack.json']||data['stack.json'].length>MB)throw Error('Falta stack.json; usa un ZIP guardado desde XYZ.');
 const settings=validateSettings(JSON.parse(strFromU8(data['stack.json'])));
 const files=settings.files.map(f=>{if(!data[f.path])throw Error('Falta la imagen '+f.name);return new File([data[f.path]],f.name);});return {settings,files};
}
