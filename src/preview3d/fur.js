import * as THREE from '../../vendor/three/three.module.js';

// Small, repeatable short-fibre textures. No downloaded assets or extra geometry.
let maps;
function furMaps() {
  if (maps) return maps;
  const size=256, heights=new Float32Array(size*size);
  let seed=731;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  heights.fill(.45);
  for(let strand=0;strand<6500;strand++) {
    const x=random()*size,y=random()*size,length=3+random()*9;
    const lean=(random()-.5)*2.5,strength=.1+random()*.25;
    for(let step=0;step<=length;step++) {
      const t=step/length,px=x+lean*t,py=y+step;
      const profile=Math.sin(t*Math.PI)*strength;
      for(let dx=-1;dx<=1;dx++) {
        const ix=((Math.floor(px)+dx)%size+size)%size,iy=Math.floor(py)%size;
        heights[iy*size+ix]+=profile*(dx===0?1:.22);
      }
    }
  }
  const color=new Uint8Array(size*size*4),bump=new Uint8Array(size*size*4);
  heights.forEach((height,i)=>{
    const h=Math.min(1,height),tone=Math.round(220+h*35);
    color.set([tone,tone,tone,255],i*4);
    const v=Math.round(h*255);bump.set([v,v,v,255],i*4);
  });
  function texture(data,colorSpace) {
    const tex=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);
    tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(2,1.5);
    tex.magFilter=THREE.LinearFilter;tex.minFilter=THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps=true;tex.anisotropy=4;tex.colorSpace=colorSpace;tex.needsUpdate=true;return tex;
  }
  maps={map:texture(color,THREE.SRGBColorSpace),bumpMap:texture(bump,THREE.NoColorSpace)};
  return maps;
}
export function shortFur(color) {
  return new THREE.MeshPhysicalMaterial({
    color,...furMaps(),bumpScale:.028,roughness:.96,
    sheen:.65,sheenColor:'#fff0d5',sheenRoughness:.95,
  });
}
