import assert from 'node:assert/strict';import {setupPdfWheel} from '../src/pdf-navigation.mjs';
let listener,z=1,loaded=false,prevented=0,draws=0,pending;
const surface={clientHeight:600,addEventListener(t,f,o){assert.equal(o.passive,false);listener=f;},removeEventListener(){}};
setupPdfWheel(surface,{hasDocument:()=>loaded,getZoom:()=>z,setZoom:v=>z=v,redraw:()=>draws++,schedule:fn=>(pending=fn,1),cancel:()=>{pending=null;}});
const wheel=(deltaY,deltaMode=0)=>listener({deltaY,deltaMode,preventDefault(){prevented++;}});
wheel(-100);assert.equal(z,1);assert.equal(prevented,0);loaded=true;wheel(-100);assert.ok(z>1);wheel(100);assert.ok(Math.abs(z-1)<1e-10);for(let i=0;i<100;i++)wheel(-300);assert.equal(z,8);pending();assert.equal(draws,1);for(let i=0;i<100;i++)wheel(300,1);assert.equal(z,.05);wheel(-1,2);assert.ok(z>.05);console.log('PASS: no PDF, zoom in/out, wheel modes, limits, debounce');
