import {zipSync,unzipSync,strToU8,strFromU8} from 'fflate';
export function validateBimState(s){
 if(!s||s.schema!=='archglancer-bim/1'||!Array.isArray(s.cursor)||s.cursor.length!==3||s.cursor.some(x=>!Number.isFinite(x)||Math.abs(x)>1e6))throw Error('Configuración BIM inválida.');
 if(!Array.isArray(s.views)||s.views.length!==4||s.views.some(v=>!v||!Number.isFinite(v.zoom)||v.zoom<.01||v.zoom>1000||['position','target'].some(k=>!Array.isArray(v[k])||v[k].length!==3||v[k].some(x=>!Number.isFinite(x)||Math.abs(x)>1e8))))throw Error('Cámaras BIM inválidas.');
 if(typeof s.floor!=='string'||typeof s.category!=='string'||typeof s.search!=='string'||s.search.length>500||s.selected!==null&&!Number.isInteger(s.selected))throw Error('Filtros BIM inválidos.');
 return s;
}
export function packBim(bytes,state){validateBimState(state);if(bytes.length>50*1024**2)throw Error('IFC mayor de 50 MB.');return zipSync({'model.ifc':bytes,'bim.json':strToU8(JSON.stringify(state))},{level:0});}
export function unpackBim(bytes){
 if(bytes.length>51*1024**2)throw Error('ZIP BIM mayor de 51 MB.');let total=0,n=0;
 const files=unzipSync(bytes,{filter:e=>{total+=e.originalSize;if(++n>2||total>51*1024**2||e.originalSize>50*1024**2)throw Error('ZIP BIM supera los límites.');return true;}});
 if(!files['model.ifc']||!files['bim.json']||files['bim.json'].length>100000)throw Error('Usa un ZIP guardado desde Edificio 3D.');
 return {bytes:files['model.ifc'],state:validateBimState(JSON.parse(strFromU8(files['bim.json'])))};
}
