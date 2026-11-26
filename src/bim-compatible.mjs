// Proyección por CPU de las mismas mallas IFC. Respaldo para equipos sin WebGL2.
// Ordenación por profundidad aproximada; no reemplaza un búfer Z de GPU.
import {Vector3,Color} from 'three';
export function clipPolygon(polygon,planes){for(const plane of planes){const out=[];for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],da=plane.distanceToPoint(a),db=plane.distanceToPoint(b);if(da>=0)out.push(a);if((da>=0)!==(db>=0))out.push(a.clone().lerp(b,da/(da-db)));}polygon=out;if(!polygon.length)break;}return polygon;}
export class CompatibleRenderer{
 constructor({canvas}){this.canvas=canvas;this.ctx=canvas.getContext('2d');if(!this.ctx)throw Error('No hay contexto gráfico disponible.');this.clippingPlanes=[];}
 setPixelRatio(){} setSize(w,h){if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}}dispose(){}
 render(scene,camera){const ctx=this.ctx,w=this.canvas.width,h=this.canvas.height;ctx.fillStyle='#edf3f7';ctx.fillRect(0,0,w,h);scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);camera.updateProjectionMatrix();const polygons=[],lines=[];
 scene.traverseVisible(object=>{if(object.isLine){const a=object.geometry.attributes.position;const pts=[];for(let i=0;i<a.count;i++)pts.push(new Vector3().fromBufferAttribute(a,i).applyMatrix4(object.matrixWorld).project(camera));lines.push(pts);return;}if(!object.isMesh)return;
 const g=object.geometry,pos=g.attributes.position,index=g.index,mat=object.material,count=index?index.count:pos.count;
 for(let i=0;i<count;i+=3){let p=[0,1,2].map(k=>new Vector3().fromBufferAttribute(pos,index?index.getX(i+k):i+k).applyMatrix4(object.matrixWorld));p=clipPolygon(p,this.clippingPlanes);if(p.length<3)continue;const normal=p[1].clone().sub(p[0]).cross(p[2].clone().sub(p[0])).normalize(),shade=.65+.35*Math.abs(normal.dot(new Vector3(.3,-.4,.85).normalize())),color=mat.color.clone().multiplyScalar(shade);const projected=p.map(v=>v.clone().project(camera));if(projected.some(v=>!Number.isFinite(v.x)||v.z < -1||v.z>1))continue;
 polygons.push({p:projected,z:projected.reduce((s,v)=>s+v.z,0)/projected.length,color:'#'+color.getHexString(),alpha:mat.transparent?mat.opacity:1});}
 });
 polygons.sort((a,b)=>b.z-a.z);for(const poly of polygons){ctx.beginPath();poly.p.forEach((p,i)=>{const x=(p.x+1)*w/2,y=(1-p.y)*h/2;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();ctx.globalAlpha=poly.alpha;ctx.fillStyle=poly.color;ctx.fill();ctx.globalAlpha=1;}
 ctx.strokeStyle='#099b99';ctx.lineWidth=1;for(const pts of lines){ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo((p.x+1)*w/2,(1-p.y)*h/2):ctx.moveTo((p.x+1)*w/2,(1-p.y)*h/2));ctx.stroke();}
 }
}
