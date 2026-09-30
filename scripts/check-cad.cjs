// Functional smoke check with minimal DOM; no browser layout assertions.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const els=new Map();
class El{constructor(){this.value='';this.style={};this.classList={add(){},remove(){}};this.children=[];this.hidden=false;this.parentElement={getBoundingClientRect:()=>({width:1000,height:600})};}append(...x){this.children.push(...x);}replaceChildren(){this.children=[];}setAttribute(k,v){this[k]=v;}getContext(){return new Proxy({},{get:()=>()=>{}});}getBoundingClientRect(){return{left:0,top:0,width:1000,height:600};}focus(){}setPointerCapture(){}click(){}}
const el=id=>{if(!els.has(id))els.set(id,new El());return els.get(id);};let exported;
const env={document:{createElement:()=>new El(),getElementById:el,querySelector:el},window:{devicePixelRatio:1,dispatchEvent(){}},Event:class{},CustomEvent:class{},ResizeObserver:class{constructor(cb){this.cb=cb;}observe(){this.cb();}},fetch:async p=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('dist/'+p))}),Blob,URL:{createObjectURL:b=>{exported=b;return'blob:test';},revokeObjectURL(){}},setTimeout};
env.Path2D=class{moveTo(){}lineTo(){}};env.requestAnimationFrame=cb=>setTimeout(cb,0);
vm.runInNewContext(fs.readFileSync('dist/cad.js','utf8'),env);
setImmediate(async()=>{try{
 assert.equal(el('cadExport').disabled,undefined); // no preloaded drawing
 const sample=JSON.parse(fs.readFileSync('dist/data/example.json'));
 const upload=async d=>{el('datasetFile').onchange({target:{files:[{name:'test.json',size:100,text:async()=>JSON.stringify(d)}],value:'file'}});await new Promise(r=>setImmediate(r));};
 await upload(sample);assert.equal(el('datasetName').textContent,sample.name);
 el('cadExport').onclick();assert.deepEqual(JSON.parse(await exported.text()),sample);
 await upload({...sample,objects:[sample.objects[0],sample.objects[0]]});assert.match(el('cadStatus').textContent,/ID único/);
 await upload(sample);
 const c=el('cadCanvas');c.onpointerdown({button:0,pointerId:1,clientX:410,clientY:390});c.onpointerup({clientX:410,clientY:390});assert.match(el('cadProps').textContent,/ID:/);
 el('hideLayers').onclick();assert.match(el('cadProps').textContent,/Selecciona/);el('showLayers').onclick();
 el('pdfTab').onclick();assert.equal(el('.workspace').hidden,false);el('cadTab').onclick();assert.equal(el('.workspace').hidden,true);
 console.log('PASS: CAD, import, duplicate rejection, selection, layers, tabs, JSON round trip');
 }catch(e){console.error(e);process.exitCode=1;}});
