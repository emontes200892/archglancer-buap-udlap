import {PDFDocument,StandardFonts,rgb,degrees,pushGraphicsState,popGraphicsState,rectangle,clip,endPath,moveTo,lineTo,stroke,setLineWidth,setStrokingColor} from 'pdf-lib';
export function clipSegment(a,c,b){
 const dx=c[0]-a[0],dy=c[1]-a[1];let lo=0,hi=1;
 const ps=[-dx,dx,-dy,dy],qs=[a[0]-b[0],b[2]-a[0],a[1]-b[1],b[3]-a[1]];
 for(let i=0;i<4;i++){if(ps[i]===0){if(qs[i]<0)return null;continue;}const t=qs[i]/ps[i];if(ps[i]<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(lo>hi)return null;}
 return [[a[0]+lo*dx,a[1]+lo*dy],[a[0]+hi*dx,a[1]+hi*dy]];
}
export async function exportCadPDF(snapshot,{all=false,paper='A3',progress=()=>{},selectedViews=null,includeReport=true,orientation='landscape',unitMM=null,scaleDenominator=null,lineWidth=.4,signal}={}){
 const check=()=>{if(signal?.aborted)throw Error('Exportación cancelada.');};check();
 const {data,visible,showText}=snapshot;if(!data)throw Error('Primero carga un dibujo.');
 const views=selectedViews||(all?snapshot.spaces:[snapshot.view]);if(!views.length||views.length>100)throw Error('Selecciona entre 1 y 100 pisos/vistas del CAD.');
 const doc=await PDFDocument.create(),font=await doc.embedFont(StandardFonts.Helvetica),allowed=new Set(visible);
 if(!allowed.size)throw Error('No hay capas visibles. Activa las capas que quieras exportar.');
 let substitutions=0,segments=0;const safe=s=>[...String(s)].map(c=>{try{font.encodeText(c);return c;}catch{substitutions++;return '?';}}).join('');
 const sizes={A4:[841.89,595.28],A3:[1190.55,841.89],A2:[1683.78,1190.55],A1:[2383.94,1683.78]};let [W,H]=sizes[paper]||sizes.A3;if(orientation==='portrait')[W,H]=[H,W];if(scaleDenominator&&(!unitMM||unitMM<=0))throw Error('Define las unidades CAD antes de usar una escala numérica.');const scaleLabel=scaleDenominator?'Escala solicitada 1:'+scaleDenominator+'; verificar unidades y medir antes de imprimir':'Ajustado al papel; sin escala fija';
 for(let vi=0;vi<views.length;vi++){
  const v=views[vi],objects=data.objects.filter(o=>{if((o.space||'Modelo')!==v.space||!allowed.has(o.layer))return false;if(!v.bounds)return true;let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const [x,y]of o.points){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}const pad=o.label?Math.max(1,(Number(o.textHeight)||1)*String(o.label).length):0;return x1+pad>=v.bounds[0]&&x0-pad<=v.bounds[2]&&y1+pad>=v.bounds[1]&&y0-pad<=v.bounds[3];});
  if(!objects.length)throw Error('La vista '+(v.name||v.space)+' no contiene objetos en las capas visibles. Revisa su espacio y límites.');
  let b=v.bounds?.slice();if(!b){b=[Infinity,Infinity,-Infinity,-Infinity];for(const o of objects)for(const [x,y]of o.points){b[0]=Math.min(b[0],x);b[1]=Math.min(b[1],y);b[2]=Math.max(b[2],x);b[3]=Math.max(b[3],y);}if(!Number.isFinite(b[0]))b=[0,0,1,1];}
  const fitScale=Math.min((W-72)/Math.max(b[2]-b[0],.01),(H-100)/Math.max(b[3]-b[1],.01)),s=scaleDenominator?unitMM*72/25.4/scaleDenominator:fitScale;
  if(s>fitScale*1.001)throw Error("La vista "+v.name+" no cabe a escala 1:"+scaleDenominator+". Usa una hoja mayor o un denominador mayor.");
  const ox=36+(W-72-(b[2]-b[0])*s)/2,oy=48+(H-100-(b[3]-b[1])*s)/2;
  const xy=([x,y])=>[ox+(x-b[0])*s,oy+(y-b[1])*s],page=doc.addPage([W,H]);
  let heading=safe(String(data.name||'CAD').slice(0,75)+' / '+String(v.name||v.space).slice(0,40));while(font.widthOfTextAtSize(heading,11)>W-72)heading=heading.slice(0,-1);page.drawText(heading,{x:36,y:H-27,size:11,font});
  page.drawText(safe('ArchGlancer BUAP-UDLAP | '+(scaleDenominator?'1:'+scaleDenominator+' · verificar unidades y medidas':'Ajustado a hoja · sin escala fija')+' | Geometría recuperada'),{x:36,y:22,size:8,font});
  page.pushOperators(pushGraphicsState(),rectangle(36,48,W-72,H-100),clip(),endPath(),setLineWidth(lineWidth),setStrokingColor(rgb(0,0,0)));
  for(let i=0;i<objects.length;i++){
   const o=objects[i];if(o.points.length>1){let ops=[];for(let j=1;j<o.points.length;j++){const seg=clipSegment(o.points[j-1],o.points[j],b);if(!seg)continue;if(++segments>2000000)throw Error('La exportación supera 2 millones de segmentos visibles; exporta una vista por separado.');const a=xy(seg[0]),c=xy(seg[1]);ops.push(moveTo(...a),lineTo(...c));if(ops.length>=2000){page.pushOperators(...ops,stroke());ops=[];}}if(ops.length)page.pushOperators(...ops,stroke());}
   else if(!o.label){const[x,y]=xy(o.points[0]);page.drawCircle({x,y,size:.7,color:rgb(0,0,0)});}
   if(showText&&o.label){const[x,y]=xy(o.points[0]),size=Math.max(.1,Math.min(100,(Number(o.textHeight)||.12)*s));page.drawText(safe(String(o.label).slice(0,15000)),{x,y,size,font,rotate:degrees(Number(o.rotation)||0),lineHeight:size*1.2});}
   if(i%500===0){progress(`Generando vista ${vi+1}/${views.length} · ${i}/${objects.length} objetos`);await new Promise(r=>setTimeout(r,0));check();}
  }
  page.pushOperators(popGraphicsState());
 }
 const report=safe(snapshot.report+'\n\nVistas exportadas:\n'+views.map((v,i)=>(i+1)+'. '+v.name+' ['+(v.kind||'vista')+'] '+(v.notes||'')).join('\n')+'\n\n'+scaleLabel+'\nPapel: '+paper+' / '+orientation+'\nUnidades CAD (mm/unidad): '+(unitMM||'sin definir')+'\nTrazo (pt): '+lineWidth+'\n\nPDF: líneas negras, fuente Helvetica. No conserva estilos originales de impresión ni objetos omitidos.\nCaracteres sustituidos por fuente: '+substitutions);
 const lines=report.split('\n').flatMap(l=>l.match(/.{1,110}/g)||['']);
 if(includeReport)for(let i=0;i<lines.length;i+=55){const p=doc.addPage([595.28,841.89]);p.drawText('Informe de conversión',{x:36,y:805,size:16,font});p.drawText(lines.slice(i,i+55).join('\n'),{x:36,y:780,size:9,lineHeight:13,font});}
 doc.setTitle(String(data.name||'ArchGlancer'));doc.setProducer('ArchGlancer BUAP-UDLAP / pdf-lib');return doc.save();
}
