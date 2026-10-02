export function setupPdfWheel(surface,{hasDocument,getZoom,setZoom,redraw,schedule=setTimeout,cancel=clearTimeout}){
 let timer;
 const handler=e=>{if(!hasDocument()||!e.deltaY)return;e.preventDefault();const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?surface.clientHeight:1);setZoom(Math.max(.05,Math.min(8,getZoom()*Math.exp(-Math.max(-200,Math.min(200,delta))*.002))));cancel(timer);timer=schedule(()=>redraw(),100);};
 surface.addEventListener('wheel',handler,{passive:false});return ()=>{cancel(timer);surface.removeEventListener('wheel',handler);};
}
