// Extracción común para el worker del navegador y las pruebas Node.
const value = x => x && typeof x === 'object' && 'value' in x ? x.value : x;
export function extractIfc(api, bytes, progress=()=>{}) {
  if(bytes.byteLength>50*1024**2)throw Error('IFC mayor de 50 MB. Divide el modelo antes de abrirlo.');
  const header=new TextDecoder().decode(bytes.subarray(0,512));
  if(!header.includes('ISO-10303-21'))throw Error('No es un IFC STEP. IFCZIP, IFCXML y archivos renombrados no se admiten.');
  const model=api.OpenModel(bytes,{COORDINATE_TO_ORIGIN:false,CIRCLE_SEGMENTS:24});
  if(model<0)throw Error('El motor no pudo abrir este IFC.');
  try {
    const schema=api.GetModelSchema(model),floors=new Map(),byFloor=new Map(),materials=new Map();
    const lines=(type,fn)=>{const ids=api.GetLineIDsWithType(model,api.GetTypeCodeFromName(type));for(let i=0;i<ids.size();i++)fn(api.GetLine(model,ids.get(i)));};
    lines('IFCBUILDINGSTOREY',r=>floors.set(r.expressID,{id:r.expressID,name:String(value(r.Name)||'Nivel '+r.expressID),elevation:Number(value(r.Elevation)||0)}));
    lines('IFCRELCONTAINEDINSPATIALSTRUCTURE',r=>{for(const h of r.RelatedElements||[])byFloor.set(value(h),value(r.RelatingStructure));});
    lines('IFCRELASSOCIATESMATERIAL',r=>{const m=api.GetLine(model,value(r.RelatingMaterial));if(m?.Name)for(const h of r.RelatedObjects||[])materials.set(value(h),String(value(m.Name)));});
    const meshes=[],elements=new Map();let triangles=0;
    api.StreamAllMeshes(model,(mesh,index,total)=>{
      if(index%50===0)progress({index,total});
      const id=mesh.expressID,line=api.GetLine(model,id),type=api.GetNameFromTypeCode(line.type).toUpperCase();
      // Espacios y huecos no son superficies físicas seleccionables de este visor.
      if(['IFCSPACE','IFCOPENINGELEMENT'].includes(type))return;
      const props={};for(const [k,v]of Object.entries(line)){const x=value(v);if(['Name','Description','ObjectType','Tag','OverallWidth','OverallHeight','PredefinedType'].includes(k)&&['string','number','boolean'].includes(typeof x))props[k]=x;}
      const item={id,guid:String(value(line.GlobalId)||''),name:String(value(line.Name)||type+' #'+id),type,storeyId:byFloor.get(id)??null,storey:floors.get(byFloor.get(id))?.name||'Sin nivel asignado',material:materials.get(id)||'No disponible en relación simple',props,bounds:[Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity]};
      for(let j=0;j<mesh.geometries.size();j++){
        const placed=mesh.geometries.get(j),g=api.GetGeometry(model,placed.geometryExpressID);
        try{
          const raw=api.GetVertexArray(g.GetVertexData(),g.GetVertexDataSize()),indices=api.GetIndexArray(g.GetIndexData(),g.GetIndexDataSize()).slice(),matrix=placed.flatTransformation;
          if(!raw.length||!indices.length)continue;
          triangles+=indices.length/3;if(triangles>2000000||meshes.length>=20000)throw Error('Modelo supera 2 millones de triángulos o 20 000 mallas.');
          const positions=new Float32Array(raw.length/2);
          for(let k=0,o=0;k<raw.length;k+=6,o+=3){const x=raw[k],y=raw[k+1],z=raw[k+2];
            // web-ifc entrega Y arriba; restituimos el convenio arquitectónico Z arriba.
            const p=[matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12],-(matrix[2]*x+matrix[6]*y+matrix[10]*z+matrix[14]),matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13]];
            for(let axis=0;axis<3;axis++){if(!Number.isFinite(p[axis])||Math.abs(p[axis])>1e6)throw Error('Coordenadas fuera del rango local admitido. Reubica el IFC cerca de su origen.');positions[o+axis]=p[axis];item.bounds[axis]=Math.min(item.bounds[axis],p[axis]);item.bounds[axis+3]=Math.max(item.bounds[axis+3],p[axis]);}
          }
          meshes.push({id,positions,indices,color:[placed.color.x,placed.color.y,placed.color.z]});
        }finally{g.delete();}
      }
      if(Number.isFinite(item.bounds[0]))elements.set(id,item);
    },true);
    if(!meshes.length)throw Error('No se recuperó geometría física visible. El archivo anterior se conserva.');
    return {schema,units:'m',meshes,elements:[...elements.values()],floors:[...floors.values()],triangles};
  }finally{api.CloseModel(model);}
}
