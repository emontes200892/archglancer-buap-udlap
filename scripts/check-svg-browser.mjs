import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve('dist');
const server=http.createServer((req,res)=>{const name=req.url.split('?')[0];const file=path.join(root,name==='/'?'index.html':name);try{res.setHeader('Content-Type',({'js':'text/javascript','mjs':'text/javascript','html':'text/html','css':'text/css','wasm':'application/wasm'})[file.split('.').pop()]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-gpu'],headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.waitForSelector('#floorList',{state:'attached'});
 const result=await page.evaluate(async()=>{
  const {importSvg}=await import('./svg-import.js');
  const d=await importSvg('<svg xmlns="http://www.w3.org/2000/svg"><script>window.svgExecuted=true</script><image href="https://example.invalid/a.png"/><g transform="translate(10 20) scale(2)" semantic-id="Door"><path id="p" d="M0 0 L5 0 M100 0 L105 0"/><polygon points="0,0 10,0 10,10"/><rect x="1" y="2" width="7" height="9"/></g></svg>');
  let rejected=false;try{await importSvg('<svg><broken>');}catch{rejected=true;}
  return {d,rejected,executed:!!window.svgExecuted};
 });
 assert.equal(result.executed,false);assert.equal(result.rejected,true);assert.equal(result.d.objects.length,4);
 assert.deepEqual(result.d.objects[0].points,[[10,-20],[20,-20]]);
 assert.deepEqual(result.d.objects[1].points,[[210,-20],[220,-20]]);
 assert.equal(result.d.objects[0].category,'Door');assert.equal(result.d.source.omitted.script,1);assert.equal(result.d.source.omitted.image,1);
 assert.deepEqual(result.d.objects[2].points,[[10,-20],[30,-20],[30,-40],[10,-20]]);
 assert.equal(result.d.objects[3].points.length,5);
 await page.locator('#generatePlan').click();
 await page.waitForFunction(()=>window.archCad.snapshot().data?.objects.length===12);
 const first=await page.evaluate(()=>window.archCad.snapshot().data.objects);
 await page.locator('#generatePlan').click();await page.waitForFunction(()=>document.querySelector('#cancelCad').hidden);
 assert.deepEqual(await page.evaluate(()=>window.archCad.snapshot().data.objects),first);
 await page.locator('#componentSearch').fill('door-2');assert.equal(await page.locator('#componentList option').count(),1);
 await page.locator('#componentList').selectOption('svg-4');
 await page.locator('#componentCategory').fill('Puerta revisada');await page.locator('#componentNote').fill('Verificar ancho');await page.locator('#componentReviewed').check();await page.locator('#componentSave').click();
 assert.equal(await page.evaluate(()=>window.archCad.snapshot().data.objects[4].reviewed),true);
 let downloading=page.waitForEvent('download');await page.locator('#componentCsv').click();let dl=await downloading;
 assert.match(fs.readFileSync(await dl.path(),'utf8'),/Puerta revisada/);
 downloading=page.waitForEvent('download');await page.locator('#saveProject').click();dl=await downloading;
 await page.locator('#projectFile').setInputFiles(await dl.path());
 await page.waitForFunction(()=>document.querySelector('#projectStatus').textContent.includes('restaurado'));
 assert.equal(await page.evaluate(()=>window.archCad.snapshot().data.objects[4].reviewNote),'Verificar ancho');
 await page.locator('#floorAll').click();await page.locator('#makePdf').click();
 await page.waitForFunction(()=>/PDF generado|No se|Error/.test(document.querySelector('#projectStatus').textContent));
 console.log('SVG PDF status:',await page.locator('#projectStatus').textContent());
 assert.equal(await page.locator('#pdfCount').textContent(),'/ 2');
 const before=Number((await page.locator('#pdfScale').textContent()).replace(/[^0-9]/g,''));await page.locator('.pdf-scroll').hover();await page.mouse.wheel(0,-150);await page.waitForFunction(b=>parseInt(document.querySelector('#pdfScale').textContent)>b,before);await page.mouse.wheel(0,150);await page.waitForFunction(b=>Math.abs(parseInt(document.querySelector('#pdfScale').textContent)-b)<=1,before);
 await page.locator('#cadTab').click();
 await page.locator('#datasetFile').setInputFiles({name:'invalid.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg><bad>')});
 await page.waitForFunction(()=>document.querySelector('#cadStatus').textContent.includes('No se cargó'));
 assert.equal(await page.evaluate(()=>window.archCad.snapshot().data.objects.length),12);
 fs.mkdirSync('test-output',{recursive:true});await page.screenshot({path:'test-output/components.png',fullPage:true});
 if(process.env.SVG_SMOKE_FILE){await page.locator('#datasetFile').setInputFiles(process.env.SVG_SMOKE_FILE);await page.waitForFunction(()=>document.querySelector('#cadStatus').textContent.includes('trazos'));console.log('External SVG smoke:',await page.evaluate(()=>window.archCad.snapshot().data.objects.length),'contours');}
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
 assert.deepEqual(errors,[]);
 console.log('PASS SVG: transforms, exact corners, disjoint paths, scripts/images excluded, malformed rollback, reproducible generator, source ID search, labels, CSV, ZIP restoration, PDF, mobile width.');
}finally{if(browser)await browser.close();server.close();}
