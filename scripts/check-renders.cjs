// Gallery behavior with a simulated DOM; not a browser layout test.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const els=new Map(),pending=[],revoked=[];let serial=0;
class El {
 constructor(){this.children=[];this.style={};this.clientWidth=1000;this.clientHeight=600;this.classList={add(){},remove(){}};}
 append(...items){this.children.push(...items.flatMap(x=>x.fragment?x.children:[x]));}
 replaceChildren(...items){this.children=[];this.append(...items);}
 setAttribute(k,v){this[k]=v;}removeAttribute(k){delete this[k];}addEventListener(){}focus(){}setPointerCapture(){}
}
const el=id=>{if(!els.has(id))els.set(id,new El());return els.get(id);};
el('cadTab').onclick=()=>{el('cadWorkspace').hidden=false;};el('pdfTab').onclick=()=>{el('.workspace').hidden=false;};
const env={Event,document:{createElement:()=>new El(),createDocumentFragment:()=>Object.assign(new El(),{fragment:true}),querySelector:el,getElementById:el},window:{dispatchEvent(){},addEventListener(){}},ResizeObserver:class{observe(){}},URL:{createObjectURL:()=>`blob:${++serial}`,revokeObjectURL:u=>revoked.push(u)},Image:class{set src(v){this.url=v;this.naturalWidth=2048;this.naturalHeight=1152;pending.push(this);}}};
const finish=()=>{while(pending.length)pending.shift().onload();};
vm.runInNewContext(fs.readFileSync('dist/renders.js','utf8'),env);finish();
assert.equal(el('renderThumbs').children.length,0);el('renderRestore').onclick();finish();assert.equal(el('renderThumbs').children.length,51);assert.equal(el('renderCounter').textContent,'1 / 51');
el('renderThumbs').children[24].onclick();finish();assert.equal(el('renderTitle').textContent,'51.jpg');
el('renderThumbs').children[50].onclick();finish();assert.equal(el('renderTitle').textContent,'88.jpg');assert.equal(el('renderNext').disabled,true);
el('renderPrevious').onclick();el('renderPrevious').onclick();finish();assert.equal(el('renderImage').src,'assets/renders/86.jpg');
el('renderActual').onclick();assert.equal(el('renderZoom').textContent,'100 %');el('renderPlus').onclick();assert.equal(el('renderZoom').textContent,'125 %');
const upload=files=>el('renderFiles').onchange({target:{files,value:'x'}});
upload([{name:'10.png',size:12},{name:'2.jpg',size:12},{name:'bad.dwg',size:12}]);finish();
assert.equal(el('renderTitle').textContent,'2.jpg');assert.equal(el('renderCounter').textContent,'1 / 2');assert.match(el('renderNotice').textContent,/bad.dwg/);
upload([{name:'huge.jpg',size:33*1024*1024}]);assert.equal(el('renderCounter').textContent,'1 / 2');
el('renderRestore').onclick();finish();assert.equal(revoked.length,2);assert.equal(el('renderCounter').textContent,'1 / 51');
el('renderNext').onclick();pending.shift().onerror();assert.match(el('renderMessage').textContent,/No se pudo abrir/);
el('cadTab').onclick();assert.equal(el('cadWorkspace').hidden,false);el('rendersTab').onclick();assert.equal(el('cadWorkspace').hidden,true);
console.log('PASS: 51 images, filenames, navigation, stale loads, zoom, local selection, limits, restore, errors and tabs');
