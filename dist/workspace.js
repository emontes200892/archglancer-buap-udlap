import './production.js';
const $=id=>document.getElementById(id),shell=document.querySelector('.shell');
const nav=document.createElement('nav');nav.className='workspace-nav';nav.setAttribute('aria-label','Secciones del proyecto');
nav.innerHTML=['home:Inicio','cad:Plano CAD','pdf:PDF','renders:Renders','xyz:XYZ / 3D','bim:Edificio 3D','manual:Manual'].map(s=>{const[k,label]=s.split(':');return `<button type="button" data-mode="${k}" aria-pressed="false">${label}</button>`;}).join('')+'<span id="sessionState">Sesión abierta · guarda tus ZIP antes de cerrar</span>';
document.querySelector('.topbar').after(nav);
const home=document.createElement('main');home.id='homeWorkspace';home.className='home-workspace';
home.innerHTML=`<p class="eyebrow">ARCHGLANCER BUAP-UDLAP</p><h1>Tu proyecto</h1><p>Carga tu plano y revísalo por capas. Desde Edificio 3D puedes dar altura a los perfiles cerrados y generar sus cortes XYZ. Usa el menú para cambiar de sección sin perder lo que tienes abierto. Los IFC y los ejemplos se cargan por separado.</p><section class="session-card"><h2>Tu sesión actual</h2><p id="homeCad">Sin plano cargado.</p><p id="homeStack">Sin volumen cargado.</p><p id="homeBim">Abre Edificio 3D para cargar un modelo o recuperar el último que guardaste aquí.</p><button data-mode="cad">Continuar con el plano</button><button data-mode="xyz">Continuar en XYZ</button><button data-mode="bim">Continuar en Edificio 3D</button><p>Antes de cerrar, guarda el ZIP de cada sección que hayas usado. Edificio 3D también puede recordar el último modelo en este navegador.</p></section><h2>Prueba con un ejemplo</h2><div class="demo-grid"><article><span class="demo-tag">EDIFICIO IFC</span><h3>Edificio de dos niveles</h3><p>19 componentes: muros, losas y puertas. Selección por ID, planta y secciones vinculadas. Modelo sintético en metros.</p><button id="homeDemoBim">Abrir edificio 3D</button><a href="?demo=bim">Enlace de carga automática BIM</a></article><article><span class="demo-tag">PLANO 2D</span><h3>Habitaciones y componentes</h3><p>12 entidades etiquetadas: cuatro contornos de habitación, cuatro puertas y cuatro ventanas. Semilla 42. Unidades sin calibrar.</p><button id="homeDemoCad">Abrir plano sintético</button><a href="?demo=cad">Enlace de carga automática</a></article><article><span class="demo-tag">VOLUMEN XYZ</span><h3>Esfera y conducto</h3><p>64 × 64 × 32 vóxeles generados matemáticamente. Cortes alineados de un mismo volumen, con separación 1:1:2 en unidades de ejemplo.</p><button id="homeDemoVolume">Abrir volumen sintético</button><a href="?demo=volume">Enlace de carga automática</a></article><article><span class="demo-tag">ARCHIVO DXF</span><h3>Prueba de importación CAD</h3><p>Ejemplo incluido para explorar capas, revisar las vistas y exportar geometría a PDF.</p><button id="homeDemoDxf">Cargar DXF incluido</button><a href="data/prueba-cad.dxf" download>Descargar DXF</a></article></div><p id="homeStatus" role="status"></p><h2>Usar tus datos</h2><p><b>CAD:</b> DWG, DXF, SVG o JSON; añade imágenes JPG/PNG/WebP como renders. <b>XYZ:</b> imágenes de cortes XY del mismo tamaño, alineadas y ordenadas por Z. Necesitas conocer la separación física para interpretar dimensiones.</p><p>Los ejemplos sirven para probar los controles; no representan un edificio o una muestra real. Puedes encontrar otros archivos en la <a href="datasets.html" target="_blank" rel="noopener">guía de datasets</a>.</p>`;
shell.append(home);
for(const [id,title]of [['xyzWorkspace','Explorador XYZ'],['bimWorkspace','Edificio 3D IFC'],['manualWorkspace','Manual de ArchGlancer']]){const box=document.createElement('main');box.id=id;box.hidden=true;box.className='embedded-workspace';const f=document.createElement('iframe');f.title=title;f.id=({xyzWorkspace:'xyzFrame',bimWorkspace:'bimFrame',manualWorkspace:'manualFrame'})[id];box.append(f);shell.append(box);}
let mode='home';
function refresh(){const d=window.archCad.snapshot().data;const n=window.archRenders.snapshot().length;$('homeCad').textContent=d?`${d.name}: ${d.objects.length} entidades, ${n} imágenes cargadas.`:'Sin plano cargado.';}
function selectMode(next){if(!['home','cad','pdf','renders','xyz','bim','manual'].includes(next))next='home';mode=next;const visible={home:'homeWorkspace',cad:'cadWorkspace',pdf:'documentWorkspace',renders:'renderWorkspace',xyz:'xyzWorkspace',bim:'bimWorkspace',manual:'manualWorkspace'};
 for(const id of Object.values(visible))if($(id))$(id).hidden=id!==visible[next];
 document.querySelector('.project-bar').hidden=!['cad','pdf','renders'].includes(next);
 document.querySelector('.workspace').hidden=true;document.querySelector('.rail').hidden=true;
 nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===next));
 for(const[id,m]of [['cadTab','cad'],['pdfTab','pdf'],['rendersTab','renders']])$(id).setAttribute('aria-pressed',next===m);
 if(next==='xyz'&&!$('xyzFrame').hasAttribute('src'))$('xyzFrame').src='stack.html?embedded=1';
 if(next==='bim'&&!$('bimFrame').hasAttribute('src'))$('bimFrame').src='bim.html?embedded=1';
 if(next==='manual'&&!$('manualFrame').hasAttribute('src'))$('manualFrame').src='manual.html?embedded=1';
 history.replaceState(null,'','#'+next);refresh();window.dispatchEvent(new Event('resize'));
}
function show(next){selectMode(next);if(next==='cad')$('cadTab').onclick();if(next==='pdf')$('pdfTab').onclick();if(next==='renders')$('rendersTab').onclick();}
window.archWorkspace={show,selectMode,get mode(){return mode;},stackSummary:s=>{$('homeStack').textContent=s;},bimSummary:s=>{$('homeBim').textContent=s;}};
for(const host of [nav,home])host.addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(b)show(b.dataset.mode);});
$('stackTab').onclick=()=>show('xyz');$('manualTab').onclick=()=>show('manual');document.querySelector('.brand').onclick=e=>{e.preventDefault();show('home');};
window.addEventListener('hashchange',()=>show(location.hash.slice(1)));for(const event of ['cad-loaded','render-selected'])window.addEventListener(event,refresh);
const replaceCad=()=>!window.archCad.snapshot().data||confirm('Este ejemplo reemplazará el plano, los renders y el PDF de la sesión. Guarda primero tu proyecto ZIP. ¿Continuar?');
$('homeDemoCad').onclick=async()=>{if(!replaceCad())return;show('cad');$('planSeed').value='42';await $('generatePlan').onclick();};
$('homeDemoDxf').onclick=async()=>{if(!replaceCad())return;try{const r=await fetch('data/prueba-cad.dxf');if(!r.ok)throw Error('No se encontró el DXF incluido.');const file=new File([await r.blob()],'prueba-cad.dxf');show('cad');await window.archCad.openFile(file);}catch(e){$('homeStatus').textContent=e.message;}};
async function volumeDemo(){show('xyz');const f=$('xyzFrame');if(!f.contentWindow?.archStack)await new Promise(resolve=>f.addEventListener('load',resolve,{once:true}));await f.contentWindow.archStack?.demo();}
$('homeDemoVolume').onclick=volumeDemo;
async function bimDemo(){show('bim');const f=$('bimFrame');if(!f.contentWindow?.archBim)await new Promise(resolve=>f.addEventListener('load',resolve,{once:true}));await f.contentWindow.archBim?.demo();}
$('homeDemoBim').onclick=bimDemo;
const initial=location.hash.slice(1);show(initial||'home');
const demo=new URLSearchParams(location.search).get('demo');
if(demo==='cad')await $('homeDemoCad').onclick();if(demo==='volume')await volumeDemo();if(demo==='dxf')await $('homeDemoDxf').onclick();

if(demo==='bim'&&!window.archCad.snapshot().data)await bimDemo();

const reconstructButton=document.createElement('button');reconstructButton.className='tool-button';reconstructButton.textContent='Reconstruir esta vista en 3D';reconstructButton.id='reconstructCad';document.querySelector('#cadWorkspace .cad-actions').append(reconstructButton);reconstructButton.onclick=async()=>{if(!window.archCad.snapshot().data){document.getElementById('cadStatus').textContent='Primero abre un plano.';return;}show('bim');const f=$('bimFrame');if(!f.contentWindow?.archBim)await new Promise(resolve=>f.addEventListener('load',resolve,{once:true}));await f.contentWindow.archBim.fromCad();};
