(() => {
'use strict';
const root=document.createElement('main');root.id='cadWorkspace';root.className='cad-workspace';
root.innerHTML='<section class="cad-main"><header class="cad-head"><div><p class="eyebrow">ARCHGLANCER / ARCHIVOS CAD</p><h1 id="datasetName">Carga tu DWG o DXF</h1><p class="cad-status" id="cadStatus" role="status"></p></div><div class="cad-actions"><button class="tool-button primary" id="openCad">Abrir DXF / DWG / JSON</button><input hidden id="datasetFile" type="file" accept=".dxf,.dwg,.json"><button class="tool-button" id="cancelCad" hidden>Cancelar carga</button><button class="tool-button" id="cadFit">Ajustar</button><button class="tool-button" id="cadExport" disabled>Exportar JSON</button></div></header><div class="cad-viewbar"><label>Espacio / vista <select id="spaceSelect" aria-label="Espacio o vista"></select></label><label><input type="checkbox" id="cadText" checked> Textos</label><span id="cadCoords">Arrastra aquí tu archivo CAD</span></div><div class="cad-surface"><canvas id="cadCanvas" tabindex="0" aria-label="Visor CAD. Rueda para zoom, arrastrar para desplazar, clic para seleccionar, 0 para ajustar."></canvas></div><footer class="cad-note"><span id="datasetNote"></span><br>Rueda: zoom · Arrastrar: desplazar · Clic: seleccionar · 0: ajustar</footer></section><aside class="cad-side"><section class="panel"><h2>Fuente del dibujo</h2><select id="datasetSelect" aria-label="Dataset"><option value="">Archivo local</option></select><p class="cad-status">Abre tu archivo para leer el modelo completo. DXF ASCII hasta 300 MB · DWG hasta 100 MB · JSON hasta 300 MB. Procesamiento local, sin subir el plano. Guarda tu proyecto ZIP antes de cargar otro dibujo.</p><p class="cad-status">DWG experimental: puede requerir bastante memoria. No se garantiza fidelidad AutoCAD.</p><a href="data/example.json" download>Ejemplo JSON</a></section><section class="panel"><h2 id="layerTitle">Capas</h2><input type="search" id="layerSearch" placeholder="Buscar capa…" aria-label="Buscar capa"><div class="cad-actions" style="margin-top:10px"><button class="tool-button" id="showLayers">Todas</button><button class="tool-button" id="hideLayers">Ninguna</button></div><div class="cad-layers" id="cadLayers"></div></section><section class="panel"><h2>Entidad seleccionada</h2><pre class="cad-props" id="cadProps">Selecciona una entidad del dibujo.</pre></section><section class="panel"><details open><summary>Informe de importación</summary><pre class="cad-props" id="cadReport">Sin archivo cargado.</pre></details></section></aside>';
document.querySelector('.shell').append(root);
const $=id=>document.getElementById(id),canvas=$('cadCanvas'),ctx=canvas.getContext('2d');
let data=null,originalFile=null,visible=new Set(),selected=null,scale=1,tx=0,ty=0,w=1,h=1,drag=null,request=0,worker=null,frame=0;
let cached=[],current=[],spaces=[],viewBounds=null,currentBounds=null,layerMeta={};
const palette=['#62daca','#b0d6f0','#e8bd77','#b7a6f4','#ee93a4','#7bc9ed'];
let colors=new Map();
function validate(d){
 if(!d||d.schema!=='archglancer/1'||!Array.isArray(d.objects)||!d.objects.length||d.objects.length>250000)throw Error('Se requieren entre 1 y 250 000 objetos archglancer/1.');
 let count=0;const ids=new Set();
 for(const o of d.objects){if(!o||typeof o.id!=='string'||!o.id||ids.has(o.id)||typeof o.layer!=='string'||!Array.isArray(o.points)||!o.points.length)throw Error('Cada objeto necesita un ID único, layer y points.');ids.add(o.id);count+=o.points.length;if(count>5000000||o.points.some(p=>!Array.isArray(p)||p.length!==2||p.some(n=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>1e9)))throw Error('Coordenadas inválidas o más de cinco millones de vértices.');}
 const validBounds=b=>Array.isArray(b)&&b.length===4&&b.every(n=>typeof n==='number'&&Number.isFinite(n))&&b[2]>b[0]&&b[3]>b[1];
 if(d.bounds&&!validBounds(d.bounds))throw Error('bounds inválido.');
 if(d.views&&(!Array.isArray(d.views)||d.views.some(v=>!v||typeof v.space!=='string'||!validBounds(v.bounds))))throw Error('Vistas inválidas.');
 return d;
}
function extent(items){const b=[Infinity,Infinity,-Infinity,-Infinity];for(const o of items){b[0]=Math.min(b[0],o.box[0]);b[1]=Math.min(b[1],o.box[1]);b[2]=Math.max(b[2],o.box[2]);b[3]=Math.max(b[3],o.box[3]);}return b[0]===Infinity?[0,0,1,1]:b;}
function fit(){if(!data)return;const[a,b,c,d]=viewBounds||currentBounds;scale=Math.min(w/Math.max(c-a,.01),h/Math.max(d-b,.01))*.9;tx=w/2-(a+c)/2*scale;ty=h/2+(b+d)/2*scale;draw();}
function color(n,fallback){return Number.isInteger(n)&&n>=0&&n<=0xffffff?(n<0x181818?'#d2dee7':'#'+n.toString(16).padStart(6,'0')):fallback;}
function draw(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;paint();});}
function paint(){
 ctx.clearRect(0,0,w,h);if(!data)return;
 const left=-tx/scale,right=(w-tx)/scale,top=ty/scale,bottom=(ty-h)/scale;
 ctx.save();
 if(viewBounds){ctx.beginPath();ctx.rect(viewBounds[0]*scale+tx,-viewBounds[3]*scale+ty,(viewBounds[2]-viewBounds[0])*scale,(viewBounds[3]-viewBounds[1])*scale);ctx.clip();}
 ctx.save();ctx.translate(tx,ty);ctx.scale(scale,-scale);
 for(const item of current){const o=item.o,b=item.box;if(!visible.has(o.layer)||b[2]<left||b[0]>right||b[3]<bottom||b[1]>top)continue;
 ctx.strokeStyle=o===selected?'#ffffff':color(o.color,colors.get(o.layer));ctx.lineWidth=(o===selected?3:1)/scale;
 if(o.points.length>1)ctx.stroke(item.path);
 else if(!o.label){ctx.beginPath();ctx.arc(o.points[0][0],o.points[0][1],2/scale,0,Math.PI*2);ctx.fillStyle=ctx.strokeStyle;ctx.fill();}
 }ctx.restore();
 if($('cadText').checked)for(const item of current){const o=item.o;if(!o.label||!visible.has(o.layer))continue;const[x,y]=o.points[0],X=x*scale+tx,Y=-y*scale+ty,size=(Number(o.textHeight)||.12)*scale;if(X < -200||X>w+200||Y < -200||Y>h+200||size<5)continue;ctx.save();ctx.translate(X,Y);ctx.rotate(-(Number(o.rotation)||0)*Math.PI/180);ctx.fillStyle=o===selected?'#fff':color(o.color,colors.get(o.layer));ctx.font=Math.min(100,size)+'px sans-serif';String(o.label).split('\n').slice(0,30).forEach((line,i)=>ctx.fillText(line.slice(0,500),0,i*size*1.2));ctx.restore();}
 ctx.restore();
}
function layers(){
 const counts=new Map(Object.keys(layerMeta).map(k=>[k,0]));for(const {o} of current)counts.set(o.layer,(counts.get(o.layer)||0)+1);
 $('layerTitle').textContent='Capas · '+counts.size;$('cadLayers').replaceChildren();
 let i=0;for(const[name,count]of [...counts].sort((a,b)=>a[0].localeCompare(b[0]))){colors.set(name,color(layerMeta[name]?.color,palette[i++%palette.length]));if(!name.toLowerCase().includes($('layerSearch').value.toLowerCase()))continue;
 const label=document.createElement('label'),input=document.createElement('input'),text=document.createElement('span'),n=document.createElement('small');input.type='checkbox';input.checked=visible.has(name);input.onchange=()=>{input.checked?visible.add(name):visible.delete(name);if(selected&&!visible.has(selected.layer)){selected=null;inspect();}draw();};text.textContent=name;text.style.color=colors.get(name);n.textContent=count;label.append(input,text,n);$('cadLayers').append(label);}
}
function inspect(){$('cadProps').textContent=selected?'ID: '+selected.id+'\nHandle: '+(selected.sourceHandle||selected.id)+'\nCapa: '+selected.layer+'\nTipo: '+(selected.type||'polilínea')+'\nEspacio: '+(selected.space||'Modelo')+'\nVértices: '+selected.points.length+(selected.label?'\nTexto: '+selected.label:''):'Selecciona una entidad del dibujo.';}
function chooseSpace(){const v=spaces[Number($('spaceSelect').value)||0];current=cached.filter(item=>(item.o.space||'Modelo')===v.space);viewBounds=v.bounds||null;currentBounds=extent(current);selected=null;inspect();layers();fit();}
function install(d,restoring=false){
 validate(d);const next=d.objects.map(o=>{const path=new Path2D(),box=[Infinity,Infinity,-Infinity,-Infinity];o.points.forEach(([x,y],i)=>{i?path.lineTo(x,y):path.moveTo(x,y);box[0]=Math.min(box[0],x);box[1]=Math.min(box[1],y);box[2]=Math.max(box[2],x);box[3]=Math.max(box[3],y);});return{o,path,box};});
 data=d;originalFile=null;cached=next;layerMeta=d.layers&&typeof d.layers==='object'?d.layers:{};
 visible=new Set([...Object.keys(layerMeta),...data.objects.map(o=>o.layer)].filter(name=>layerMeta[name]?.visible!==false));
 spaces=[...new Set(data.objects.map(o=>o.space||'Modelo'))].map(space=>({name:space,space,bounds:d.bounds}));
 spaces.push(...(d.views||[]));$('spaceSelect').replaceChildren();spaces.forEach((v,i)=>{const opt=document.createElement('option');opt.value=i;opt.textContent=v.name||v.space;$('spaceSelect').append(opt);});$('spaceSelect').value='0';
 $('datasetName').textContent=String(data.name||'Dataset local');$('datasetNote').textContent=String(data.description||'Coordenadas del dataset, sin registro con los PDF.');$('cadStatus').textContent=data.objects.length.toLocaleString('es')+' trazos · '+String(data.units||'unidades no especificadas');$('cadExport').disabled=false;$('layerSearch').value='';
 const s=d.source||{},om=s.omitted||s.unsupported||{},lines=Object.entries(om).map(([type,n])=>type+': '+n);
 $('cadReport').textContent='Fuente: '+(s.file||d.name||'JSON')+'\nFormato: '+(s.format||'JSON preconvertido')+'\nVersión CAD: '+(s.version||'no declarada')+'\nUnidades: '+(d.units||'no declaradas')+'\nEntidades de entrada: '+(s.inputEntities??'no registrado')+'\nTrazos mostrables: '+d.objects.length+'\n\nOmitidos / no compatibles:\n'+(lines.length?lines.join('\n'):'No registrados por el importador.')+'\n\n'+(s.warnings||[]).join('\n')+'\nVista 2D; no reproduce objetos 3D, fuentes SHX ni referencias externas. El recuento de omisiones incluye bloques expandidos.';
 if(Object.keys(om).length||(s.warnings||[]).length){$('cadStatus').textContent+=' · Lectura con limitaciones: revisa el informe';$('cadStatus').style.color='#ffe0a1';}else $('cadStatus').style.color='';
 chooseSpace();window.dispatchEvent(new CustomEvent('cad-loaded',{detail:{restoring}}));
}
function stopWorker(){if(worker){worker.terminate();worker=null;}$('cancelCad').hidden=true;root.classList.remove('importing');}
async function load(name){const ticket=++request;stopWorker();try{const r=await fetch('data/'+name+'.json');if(!r.ok)throw Error('No se pudo leer la referencia.');const d=await r.json();if(ticket===request)install(d);}catch(e){if(ticket===request)$('cadStatus').textContent=e.message;}}
async function openFile(file){
 if(!file)return;const ticket=++request;stopWorker();const ext=file.name.split('.').pop().toLowerCase();
 try{
 const limit={dxf:300,dwg:100,json:300}[ext];if(!limit)throw Error('Selecciona un archivo DXF, DWG o JSON.');if(file.size>limit*1024*1024)throw Error('El archivo supera '+limit+' MB.');
 $('cadStatus').textContent='Abriendo '+file.name+'…';$('cancelCad').hidden=false;root.classList.add('importing');
 if(ext==='json'){const d=JSON.parse(await file.text());if(ticket===request){install(d);originalFile=file;$('datasetSelect').selectedIndex=-1;stopWorker();}return;}
 worker=new Worker('cad-engine/cad-worker.js',{type:'module'});
 worker.onmessage=({data:message})=>{if(ticket!==request)return;if(message.progress){$('cadStatus').textContent=message.progress;return;}try{if(message.error)throw Error(message.error);install(message.dataset);originalFile=file;$('datasetSelect').selectedIndex=-1;}catch(e){$('cadStatus').textContent='No se cargó: '+e.message;}stopWorker();};
 worker.onerror=()=>{if(ticket===request){$('cadStatus').textContent='No se pudo completar la carga. El archivo puede superar la memoria disponible o contener datos no compatibles.';stopWorker();}};
 worker.postMessage({file});
 }catch(e){if(ticket===request){$('cadStatus').textContent='No se cargó: '+e.message;stopWorker();}}
}
$('openCad').onclick=()=>$('datasetFile').click();$('datasetFile').onchange=e=>{openFile(e.target.files[0]);e.target.value='';};
$('loadDwg').onclick=()=>$('dwgFile').click();
$('dwgFile').onchange=e=>{const file=e.target.files[0];e.target.value='';if(!file)return;$('cadTab').onclick();openFile(file);};
$('cancelCad').onclick=()=>{request++;stopWorker();$('cadStatus').textContent='Carga cancelada. Se conserva el dibujo anterior.';};
root.ondragover=e=>{e.preventDefault();root.classList.add('drop-active');};root.ondragleave=()=>root.classList.remove('drop-active');root.ondrop=e=>{e.preventDefault();root.classList.remove('drop-active');openFile(e.dataTransfer.files[0]);};
$('datasetSelect').onchange=e=>load(e.target.value);$('spaceSelect').onchange=chooseSpace;$('cadText').onchange=draw;
$('cadExport').onclick=()=>{if(!data)return;const blob=new Blob([JSON.stringify(data)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='archglancer-dataset.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('cadFit').onclick=fit;$('layerSearch').oninput=()=>data&&layers();
$('showLayers').onclick=()=>{if(data){visible=new Set([...Object.keys(layerMeta),...data.objects.map(o=>o.layer)]);layers();draw();}};
$('hideLayers').onclick=()=>{visible.clear();selected=null;inspect();if(data)layers();draw();};
function pos(e){const r=canvas.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top];}
canvas.onwheel=e=>{e.preventDefault();const[x,y]=pos(e),next=Math.max(.000001,Math.min(1000000,scale*Math.exp(-e.deltaY*.001)));tx=x-(x-tx)*next/scale;ty=y-(y-ty)*next/scale;scale=next;draw();};
canvas.onpointerdown=e=>{if(e.button!==0)return;canvas.focus();canvas.setPointerCapture(e.pointerId);const[x,y]=pos(e);drag={x,y,tx,ty,moved:false};};
canvas.onpointermove=e=>{const[x,y]=pos(e);$('cadCoords').textContent='X '+((x-tx)/scale).toFixed(3)+' · Y '+((ty-y)/scale).toFixed(3);if(!drag)return;if(Math.hypot(x-drag.x,y-drag.y)>4)drag.moved=true;if(drag.moved){tx=drag.tx+x-drag.x;ty=drag.ty+y-drag.y;draw();}};
canvas.onpointerup=e=>{if(!drag)return;if(!drag.moved&&data){const[x,y]=pos(e),wx=(x-tx)/scale,wy=(ty-y)/scale,tol=7/scale;let best=7,hit=null;
 if(!viewBounds||(wx>=viewBounds[0]&&wx<=viewBounds[2]&&wy>=viewBounds[1]&&wy<=viewBounds[3]))for(const item of current){const o=item.o,b=item.box;if(!visible.has(o.layer)||wx<b[0]-tol||wx>b[2]+tol||wy<b[1]-tol||wy>b[3]+tol)continue;for(let i=0;i<o.points.length;i++){const a=o.points[Math.max(0,i-1)],b=o.points[i],ax=a[0]*scale+tx,ay=-a[1]*scale+ty,bx=b[0]*scale+tx,by=-b[1]*scale+ty,dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1))),d=Math.hypot(x-ax-t*dx,y-ay-t*dy);if(d<best){best=d;hit=o;}}}selected=hit;inspect();draw();}drag=null;};
canvas.onpointercancel=()=>{drag=null;};canvas.onkeydown=e=>{if(e.key==='0'){e.stopPropagation();fit();}};
new ResizeObserver(()=>{const r=canvas.parentElement.getBoundingClientRect();if(!r.width||!r.height)return;w=r.width;h=r.height;const dpr=window.devicePixelRatio||1;canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);fit();}).observe(canvas.parentElement);
function tab(cad){root.hidden=!cad;document.querySelector('.workspace').hidden=cad;document.querySelector('.rail').hidden=cad;$('cadTab').setAttribute('aria-pressed',cad);$('pdfTab').setAttribute('aria-pressed',!cad);window.dispatchEvent(new Event('resize'));}
window.archCad={validate,restoreState:state=>{if(!data||!state)return;if(Array.isArray(state.visible)){const allowed=new Set(data.objects.map(o=>o.layer));visible=new Set(state.visible.filter(n=>allowed.has(n)));}if(typeof state.showText==='boolean')$('cadText').checked=state.showText;if(state.view&&typeof state.view.space==='string'&&spaces.some(v=>v.space===state.view.space)){const v=state.view;if(!v.bounds||(Array.isArray(v.bounds)&&v.bounds.length===4&&v.bounds.every(Number.isFinite)&&v.bounds[2]>v.bounds[0]&&v.bounds[3]>v.bounds[1])){spaces.push(v);const opt=document.createElement('option');opt.value=spaces.length-1;opt.textContent=v.name||v.space;$('spaceSelect').append(opt);$('spaceSelect').value=String(spaces.length-1);chooseSpace();}}layers();draw();},worldPoint:p=>[(p[0]-tx)/scale,(ty-p[1])/scale],focusView:v=>{if(!data)return;let i=spaces.findIndex(s=>s===v);if(i<0){i=spaces.length;spaces.push(v);const opt=document.createElement('option');opt.value=i;opt.textContent=v.name;$('spaceSelect').append(opt);}$('spaceSelect').value=String(i);chooseSpace();},snapshot:()=>({data,originalFile,visible:[...visible],view:spaces[Number($('spaceSelect').value)||0],spaces,showText:$('cadText').checked,report:$('cadReport').textContent}),restore:(d,file)=>{request++;stopWorker();install(d,true);originalFile=file||null;$('datasetSelect').selectedIndex=-1;}};
$('cadTab').onclick=()=>tab(true);$('pdfTab').onclick=()=>{};
})();
