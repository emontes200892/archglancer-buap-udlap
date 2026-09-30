import {proposeViews} from './project-analysis.mjs';
// Sheets are sourced only from the loaded CAD. Viewports are candidates, not inferred floors.
export function cadSheets(data){
 if(!data)return [];
 const source=data.floorSheets||proposeViews(data);
 return source.filter(v=>typeof v.name==='string'&&typeof v.space==='string'&&Array.isArray(v.bounds)&&v.bounds.length===4&&v.bounds.every(Number.isFinite)&&v.bounds[2]>v.bounds[0]&&v.bounds[3]>v.bounds[1]).slice(0,100).map(v=>({...v,bounds:[...v.bounds]}));
}
export function setupFloorSheets(){
 const $=id=>document.getElementById(id),panel=document.createElement('section');panel.className='floor-panel';panel.innerHTML=`<h2>Pisos y vistas del CAD</h2><p id="floorExplanation">Carga un DWG o DXF para extraer sus vistas.</p><div class="pdf-controls"><button class="tool-button" id="floorAll">Seleccionar todas</button><button class="tool-button" id="floorNone">Ninguna</button><button class="tool-button" id="floorCrop">Delimitar un piso en el dibujo</button></div><p id="cropStatus" role="status"></p><div id="floorList"></div>`;
 $('cadWorkspace').querySelector('.cad-main').prepend(panel);let rows=[],last=null,cropping=false,start=null;
 function persist(){const d=window.archCad.snapshot().data;if(d)d.floorSheets=rows.map(r=>({...r.view,name:r.name.value.trim()||r.view.name,kind:r.kind.value,notes:r.notes.value,selected:r.check.checked}));window.dispatchEvent(new Event('floors-changed'));}
 function refresh(){const d=window.archCad.snapshot().data;if(d===last)return;last=d;rows=[];$('floorList').replaceChildren();const sheets=cadSheets(d);$('floorExplanation').textContent=!d?'Carga tu archivo CAD.':sheets.length?`${sheets.length} vistas candidatas. Revisa cada una y marca las que quieras exportar. Pueden ser ventanas o espacios completos, no necesariamente pisos.`:'El CAD no contiene ventanas 2D compatibles. Delimita cada piso dentro del modelo; no se inventan pisos ni se usan imágenes de referencia.';for(const v of sheets)addRow(v);persist();}
 function addRow(v){
 v.id=v.id||crypto.randomUUID();v.kind=v.kind||'vista';
 const row=document.createElement('div');row.className='floor-row';
 const check=document.createElement('input');check.type='checkbox';check.checked=v.selected!==false;check.setAttribute('aria-label','Incluir '+v.name);
 const name=document.createElement('input');name.value=v.name;name.maxLength=100;name.setAttribute('aria-label','Nombre del piso o vista');
 const kind=document.createElement('select');kind.setAttribute('aria-label','Tipo de vista');for(const [value,label] of [['vista','Vista sin clasificar'],['piso','Piso'],['corte','Corte'],['detalle','Detalle'],['fachada','Fachada']])kind.add(new Option(label,value));kind.value=v.kind;
 const notes=document.createElement('input');notes.value=v.notes||'';notes.placeholder='Notas de revisión';notes.maxLength=500;notes.setAttribute('aria-label','Notas de la vista');
 const button=(label,fn)=>{const b=document.createElement('button');b.className='tool-button';b.textContent=label;b.onclick=fn;return b;};
 const see=button('Ver en CAD',()=>window.archCad.focusView({...v,name:name.value}));
 const r={view:v,check,name,kind,notes,row};
 const reorder=delta=>{const i=rows.indexOf(r),j=i+delta;if(j<0||j>=rows.length)return;[rows[i],rows[j]]=[rows[j],rows[i]];for(const x of rows)$('floorList').append(x.row);persist();};
 const remove=button('Quitar',()=>{rows=rows.filter(x=>x!==r);row.remove();persist();});
 check.onchange=name.onchange=kind.onchange=notes.onchange=persist;
 row.append(check,name,see,kind,button('↑',()=>reorder(-1)),button('↓',()=>reorder(1)),remove,notes);$('floorList').append(row);rows.push(r);
 }
 $('floorAll').onclick=()=>{rows.forEach(r=>r.check.checked=true);persist();};$('floorNone').onclick=()=>{rows.forEach(r=>r.check.checked=false);persist();};
 const canvas=$('cadCanvas'),surface=canvas.parentElement,box=document.createElement('div');box.className='crop-box';box.hidden=true;surface.append(box);
 const down=canvas.onpointerdown,move=canvas.onpointermove,up=canvas.onpointerup,cancel=canvas.onpointercancel,key=canvas.onkeydown;
 const point=e=>{const r=canvas.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top];};
 function finish(){cropping=false;start=null;box.hidden=true;$('floorCrop').textContent='Delimitar un piso en el dibujo';}
 $('floorCrop').onclick=()=>{if(!window.archCad.snapshot().data){$('cropStatus').textContent='Primero carga un DWG o DXF.';return;}if(cropping){finish();return;}cropping=true;$('floorCrop').textContent='Cancelar delimitación';$('cropStatus').textContent='Arrastra un rectángulo alrededor del piso en la vista CAD. Esc cancela.';canvas.focus();};
 canvas.onpointerdown=e=>{if(!cropping)return down(e);if(e.button!==0)return;start=point(e);canvas.setPointerCapture(e.pointerId);box.hidden=false;box.style.left=start[0]+'px';box.style.top=start[1]+'px';box.style.width='0';box.style.height='0';};
 canvas.onpointermove=e=>{if(!cropping)return move(e);if(!start)return;const p=point(e);Object.assign(box.style,{left:Math.min(p[0],start[0])+'px',top:Math.min(p[1],start[1])+'px',width:Math.abs(p[0]-start[0])+'px',height:Math.abs(p[1]-start[1])+'px'});};
 canvas.onpointerup=e=>{if(!cropping)return up(e);if(!start)return;const end=point(e);if(Math.abs(end[0]-start[0])<10||Math.abs(end[1]-start[1])<10){finish();$('cropStatus').textContent='El recorte es demasiado pequeño.';return;}const a=window.archCad.worldPoint(start),b=window.archCad.worldPoint(end),view={name:'Piso '+(rows.length+1)+' · recorte manual',space:window.archCad.snapshot().view.space,bounds:[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])],manual:true};addRow(view);persist();finish();$('cropStatus').textContent='Piso añadido. Edita su nombre y genera los PDF seleccionados.';};
 canvas.onpointercancel=()=>{if(cropping)finish();else cancel();};canvas.onkeydown=e=>{if(e.key==='Escape')finish();else key(e);};
 window.addEventListener('cad-loaded',()=>{finish();refresh();});refresh();
 return ()=>{persist();return rows.filter(r=>r.check.checked).map(r=>({...r.view,name:r.name.value.trim()||r.view.name,kind:r.kind.value,notes:r.notes.value}));};
}
