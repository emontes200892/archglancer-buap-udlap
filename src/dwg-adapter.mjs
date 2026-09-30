import {renderDocument,arc,poly,spline} from './cad-import.mjs';
export function importDwgDatabase(db,name,progress){
 const layouts=new Map((db.objects?.LAYOUT||[]).map(l=>[l.handle,l.layoutName]));
 const ownerLayouts=new Map((db.objects?.LAYOUT||[]).map(l=>[l.paperSpaceTableId,l.layoutName]));
 const firstViewport=new Map();for(const e of db.entities||[])if(e.type==='VIEWPORT'){const k=e.ownerBlockRecordSoftId;firstViewport.set(k,Math.min(firstViewport.get(k)??Infinity,e.viewportId));}
 const blocks={};
 function entity(e){const o={...e,visible:e.isVisible!==false,inPaperSpace:e.isInPaperSpace,ownerHandle:e.ownerBlockRecordSoftId};
  const layout=ownerLayouts.get(e.ownerBlockRecordSoftId);if(layout&&layout!=='Model'){o.layout=layout;o.inPaperSpace=true;}
  if(e.type==='LINE')o.vertices=[e.startPoint,e.endPoint];
  if(e.type==='INSERT'){o.position=e.insertionPoint;o.rotation=e.rotation*180/Math.PI;}
  if(e.type==='POLYLINE2D'||e.type==='POLYLINE3D'){o.type='POLYLINE';o.vertices=e.vertices;o.shape=!!(e.flag&1);o.isPolyfaceMesh=!!(e.flag&64);o.is3dPolygonMesh=!!(e.flag&16);}
  if(e.type==='LWPOLYLINE')o.shape=!!(e.flag&1);
  if(e.type==='ATTRIB'||e.type==='ATTDEF')Object.assign(o,e.text);
  if(e.type==='TEXT'||e.type==='ATTRIB'||e.type==='ATTDEF')o.rotation=(o.rotation||0)*180/Math.PI;
  if(e.type==='SOLID')o.points=[e.corner1,e.corner2,e.corner3,e.corner4||e.corner3];
  if(e.type==='MTEXT'){o.position=e.insertionPoint;o.rotation=e.rotation*180/Math.PI;}
  if(e.type==='SPLINE'){o.degreeOfSplineCurve=e.degree;o.knotValues=e.knots;}
  if(e.type==='VIEWPORT'){o.layout=layout||e.sheetName||undefined;o.raw=Object.entries({69:e.viewportId===firstViewport.get(e.ownerBlockRecordSoftId)?1:e.viewportId,40:e.width,41:e.height,45:e.viewHeight,51:e.viewTwistAngle,12:e.displayCenter?.x,22:e.displayCenter?.y,17:e.targetPoint?.x,27:e.targetPoint?.y,16:e.viewDirection?.x,26:e.viewDirection?.y}).map(([code,value])=>({code:Number(code),value:value??0}));}
  if(e.type==='HATCH'){o.boundaries=[];try{for(const b of e.boundaryPaths||[]){if(b.vertices)o.boundaries.push(poly(b.vertices,b.isClosed));else for(const edge of b.edges||[]){if(edge.type===1)o.boundaries.push([[edge.start.x,edge.start.y],[edge.end.x,edge.end.y]]);else if(edge.type===2){const p=edge.isCCW===false?arc(edge.center.x,edge.center.y,edge.radius,edge.radius,edge.endAngle,edge.startAngle).reverse():arc(edge.center.x,edge.center.y,edge.radius,edge.radius,edge.startAngle,edge.endAngle);o.boundaries.push(p);}else if(edge.type===4)o.boundaries.push(spline({controlPoints:edge.controlPoints,knotValues:edge.knots,degreeOfSplineCurve:edge.degree,weights:edge.controlPoints.map(p=>p.weight??1)}));else throw Error('hatch');}}}catch{delete o.boundaries;}}
  return o;
 }
 for(const b of db.tables.BLOCK_RECORD.entries)blocks[b.name]={name:b.name,ownerHandle:b.handle,position:b.basePoint,entities:(b.entities||[]).map(e=>{const o=entity(e);if(/^\*Paper_Space/i.test(b.name))o.layout=layouts.get(b.layout)||b.name;return o;})};
 const doc={entities:db.entities.map(entity),blocks,header:{$INSUNITS:db.header?.INSUNITS,$ACADVER:db.header?.ACADVER},tables:{layer:{layers:Object.fromEntries(db.tables.LAYER.entries.map(l=>[l.name,{...l,visible:!l.off}]))}}};
 const result=renderDocument(doc,name,progress);result.source.format='DWG / LibreDWG';result.source.warnings.push('DWG experimental: el motor puede omitir objetos antes de la conversión. Fuentes SHX, imágenes, referencias externas y objetos personalizados no están incluidos.');return result;
}
