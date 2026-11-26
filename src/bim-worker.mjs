import {IfcAPI} from 'web-ifc';
import {extractIfc} from './ifc-core.mjs';
self.onmessage=async e=>{try{
 const api=new IfcAPI();api.SetWasmPath(new URL('./bim/',self.location.href).href,true);await api.Init(undefined,true);
 const data=extractIfc(api,new Uint8Array(e.data),p=>self.postMessage({progress:p}));
 self.postMessage({data},data.meshes.flatMap(m=>[m.positions.buffer,m.indices.buffer]));
 api.Dispose();
}catch(e){self.postMessage({error:e.message||String(e)});}};
