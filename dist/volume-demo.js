// Phantom matemático determinista. No representa una adquisición ni una segmentación experimental.
export async function makeVolume(){
 const files=[],size=64,depth=32,c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d');
 for(let z=0;z<depth;z++){const image=ctx.createImageData(size,size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const X=(x+.5)/size,Y=(y+.5)/size,Z=(z+.5)/depth;
   const sphere=(X-.34)**2+(Y-.46)**2+(Z-.46)**2<.23**2;
   const tube=(X-(.72+.08*Math.sin(Z*Math.PI*2)))**2+(Y-.55)**2<.075**2;
   const color=sphere?[238,149,55]:tube?[72,198,208]:[17,29,42],i=(y*size+x)*4;
   image.data.set([...color,255],i);
  }
  ctx.putImageData(image,0,0);const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));
  files.push(new File([blob],`slice-${String(z).padStart(3,'0')}.png`,{type:'image/png'}));
 }
 return files;
}
