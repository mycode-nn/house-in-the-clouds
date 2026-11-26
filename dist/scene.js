import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { translations } from './i18n.js';

const app = document.getElementById('app');
const mount = document.getElementById('canvas');
const loading = document.getElementById('loading');
const errorPanel = document.getElementById('error');
const detail = document.getElementById('detail');
const $ = (id) => document.getElementById(id);
let seed = 2409;
function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
function pick(a) { return a[Math.floor(random() * a.length)]; }

for (let i = 0; i < 175; i++) {
  const s = document.createElement('i');
  s.className = 'star';
  s.style.left = (random() * 100).toFixed(2) + '%';
  s.style.top = (random() * 75).toFixed(2) + '%';
  s.style.opacity = (.3 + random() * .6).toFixed(2);
  s.style.setProperty('--size',(random()>.89?2.7:random()>.6?1.6:1)+'px');
  s.style.animationDelay = (-random() * 5).toFixed(2) + 's';
  $('stars').appendChild(s);
}

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  mount.appendChild(renderer.domElement);
} catch (e) {
  loading.remove();
  $('error').classList.add('show');
  throw e;
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, mount.clientWidth / mount.clientHeight, .1, 150);
const smallScreen = mount.clientWidth < 600;
camera.position.set(...(smallScreen?[45,28,74]:[28,20,53]));
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0,13.5,0);
controls.enableDamping = true;
controls.dampingFactor = .075;
controls.enablePan = true;
controls.panSpeed = .55;
controls.minDistance = 2.2;
controls.maxDistance = smallScreen?125:90;
controls.minPolarAngle = .16;
controls.maxPolarAngle = Math.PI * .82;
controls.rotateSpeed = .65;
controls.zoomSpeed = .8;
controls.update();

const hemi = new THREE.HemisphereLight(0xdceaff, 0x4c527a, 1.65);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe4d7, 2.85);
sun.position.set(-7, 13, 9);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -13;
sun.shadow.camera.right = 13;
sun.shadow.camera.top = 16;
sun.shadow.camera.bottom = -11;
sun.shadow.normalBias = .025;
sun.shadow.bias = -.00015;
scene.add(sun);
const rim = new THREE.DirectionalLight(0xb8a6ef, 1.75);
rim.position.set(7, 7, -9);
scene.add(rim);
const porchLight = new THREE.PointLight(0xffbd73, 15, 6, 2);
porchLight.position.set(-1.6, 2.6, 2.9);
scene.add(porchLight);
const hazeCanvas=document.createElement('canvas');hazeCanvas.width=hazeCanvas.height=256;
const hazeCtx=hazeCanvas.getContext('2d'),hazeGradient=hazeCtx.createRadialGradient(128,128,5,128,128,128);
hazeGradient.addColorStop(0,'rgba(255,255,255,.65)');hazeGradient.addColorStop(.36,'rgba(255,255,255,.32)');hazeGradient.addColorStop(1,'rgba(255,255,255,0)');
hazeCtx.fillStyle=hazeGradient;hazeCtx.fillRect(0,0,256,256);
const hazeTexture=new THREE.CanvasTexture(hazeCanvas);
const atmosphere=new THREE.Group();scene.add(atmosphere);
const atmosphereSprites=[];
for(let i=0;i<16;i++){
  const material=new THREE.SpriteMaterial({map:hazeTexture,color:0xffffff,transparent:true,opacity:0,depthWrite:false,fog:false});
  const sprite=new THREE.Sprite(material);sprite.position.set((i%4-1.5)*16+(random()-.5)*7,-7+Math.floor(i/4)*6,-25-(i%3)*12);
  const size=15+random()*13;sprite.scale.set(size,size*.52,1);atmosphere.add(sprite);atmosphereSprites.push(sprite);
}
// Tiny translucent motes drift through the air without reading as snow or seeds.
const moteCount=170,motePositions=new Float32Array(moteCount*3),moteSpeeds=[];
for(let i=0;i<moteCount;i++){
  motePositions[i*3]=(random()-.5)*75;motePositions[i*3+1]=random()*49-4;motePositions[i*3+2]=(random()-.5)*35-8;
  moteSpeeds.push(.12+random()*.24);
}
const moteGeometry=new THREE.BufferGeometry();moteGeometry.setAttribute('position',new THREE.BufferAttribute(motePositions,3));
const motes=new THREE.Points(moteGeometry,new THREE.PointsMaterial({color:'#fff7e8',size:.28,map:hazeTexture,transparent:true,opacity:.24,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true}));
scene.add(motes);

function mat(color, opts={}) { return new THREE.MeshStandardMaterial({ color, roughness:.85, metalness:0, ...opts }); }
const cream = mat('#e9d8ae');
const white = mat('#e7dfcb');
const paleTrim = mat('#f0e3d0');
const blue = mat('#78b9ca');
const blueDark = mat('#4d8da8');
const green = mat('#acd595');
const greenDark = mat('#679974');
const yellow = mat('#f0d491');
const lavender = mat('#b494c4');
const darkRoof = mat('#344e7c', {roughness:.91});
const darkEdge = mat('#2b426e');
const wood = mat('#8e6d72');
const soil = mat('#7c6858');
const glassNight = mat('#ffcf81', {emissive:'#e18c48', emissiveIntensity:1.3, roughness:.28, metalness:.13});
const glassDay = new THREE.Color('#77b7c4');
const glassEvening = new THREE.Color('#ffcf81');
const windows = [];
const clearWindows = [];

function addMesh(parent, geo, material, x=0, y=0, z=0, cast=true, receive=true) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x,y,z);
  m.castShadow = cast;
  m.receiveShadow = receive;
  parent.add(m);
  return m;
}
function box(parent,w,h,d,material,x,y,z) { return addMesh(parent,new THREE.BoxGeometry(w,h,d),material,x,y,z); }
function sphere(parent,r,material,x,y,z,segments=12) { return addMesh(parent,new THREE.SphereGeometry(r,segments,8),material,x,y,z); }
function cyl(parent,rt,rb,h,material,x,y,z,segments=10) { return addMesh(parent,new THREE.CylinderGeometry(rt,rb,h,segments),material,x,y,z); }
function line(parent, points, color='#d8c7ad', opacity=1) {
  const g = new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));
  const l = new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity}));
  parent.add(l); return l;
}
function texture(kind, base, lineColor) {
  const c=document.createElement('canvas'); c.width=512;c.height=512;
  const ctx=c.getContext('2d'); ctx.fillStyle=base;ctx.fillRect(0,0,512,512);
  if(kind==='siding') {
    ctx.strokeStyle=lineColor;ctx.lineWidth=5;
    for(let y=10;y<512;y+=34){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(512,y);ctx.stroke();}
    for(let i=0;i<1600;i++){let x=random()*512,y=random()*512;ctx.fillStyle=random()>.5?'#ffffff12':'#1d26300c';ctx.fillRect(x,y,2+random()*6,1);}
  } else {
    for(let y=0;y<512;y+=43){
      ctx.strokeStyle=lineColor;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(512,y);ctx.stroke();
      for(let x=-30+(Math.floor(y/43)%2)*28;x<540;x+=57){
        ctx.strokeStyle=lineColor;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+28,y+43,x+57,y);ctx.stroke();
        ctx.fillStyle='#ffffff0b';ctx.fillRect(x+6,y+8,23,3);
      }
    }
  }
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;
}
function paintedTexture(width,height,paint){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');paint(ctx,width,height);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;
  return map;
}
const grassMap=paintedTexture(1024,1024,(ctx,w,h)=>{
  ctx.fillStyle='#779965';ctx.fillRect(0,0,w,h);
  for(let i=0;i<34000;i++){
    const x=random()*w,y=random()*h,s=1+random()*3;
    ctx.strokeStyle=pick(['#476c42','#5d834d','#8aac73','#b2c48b','#6d9056']);
    ctx.globalAlpha=.18+random()*.34;ctx.lineWidth=.7+random()*.8;
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(random()-.5)*s,y-s*(.7+random()));ctx.stroke();
  }
  ctx.globalAlpha=1;
});
const fenceMap=paintedTexture(256,512,(ctx,w,h)=>{
  ctx.fillStyle='#e7dfcb';ctx.fillRect(0,0,w,h);
  for(let i=0;i<220;i++){
    const x=random()*w,y=random()*h;
    ctx.strokeStyle=pick(['#9d9b83','#f8efdc','#bab49e']);ctx.globalAlpha=.1+random()*.3;
    ctx.lineWidth=.5+random()*2;ctx.beginPath();ctx.moveTo(x,y);
    ctx.bezierCurveTo(x+random()*7,y+35,x-random()*6,y+75,x+(random()-.5)*5,y+90+random()*100);ctx.stroke();
  }
  for(let i=0;i<35;i++){
    const x=random()*w,y=random()*h;
    ctx.strokeStyle='#7d766469';ctx.lineWidth=.7+random();ctx.beginPath();ctx.ellipse(x,y,1.5+random()*5,5+random()*10,random()*.3,0,Math.PI*2);ctx.stroke();
  }
  for(let i=0;i<95;i++){
    const x=random()*w,y=random()*h;ctx.fillStyle=pick(['#a99d8570','#f7f0de8a','#6c726440']);
    ctx.fillRect(x,y,1+random()*5,1+random()*12);
  }
  ctx.globalAlpha=1;
});
const fenceWood=mat('#ffffff',{map:fenceMap,roughness:.96});
const chairMap=paintedTexture(256,512,(ctx,w,h)=>{
  ctx.fillStyle='#a07b5e';ctx.fillRect(0,0,w,h);
  for(let i=0;i<350;i++){
    const x=random()*w,y=random()*h;ctx.globalAlpha=.08+random()*.18;
    ctx.strokeStyle=pick(['#3f2d24','#f1c693','#704c37']);ctx.lineWidth=.5+random()*2;
    ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+8,y+35,x-8,y+70,x+random()*8,y+140);ctx.stroke();
  }
  for(let i=0;i<22;i++){
    const x=random()*w,y=random()*h;ctx.strokeStyle='#5a3c2d99';ctx.lineWidth=1;
    ctx.beginPath();ctx.ellipse(x,y,2+random()*5,5+random()*12,0,0,Math.PI*2);ctx.stroke();
  }
  for(let i=0;i<115;i++){
    const x=random()*w,y=random()*h;ctx.fillStyle=pick(['#d7b38a66','#60483255','#e4c5a16b']);ctx.fillRect(x,y,1+random()*7,1+random()*4);
  }
  ctx.globalAlpha=1;
});
const coatMap=paintedTexture(512,512,(ctx,w,h)=>{
  ctx.fillStyle='#66554d';ctx.fillRect(0,0,w,h);
  for(let y=0;y<h;y+=8){ctx.strokeStyle='#30292366';ctx.lineWidth=2;for(let x=0;x<w;x+=12){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+6,y+5);ctx.lineTo(x+12,y);ctx.stroke();}}
});
const blueSiding = mat('#ffffff',{map:texture('siding','#78a5af','#517f8d')});
const greenSiding = mat('#ffffff',{map:texture('siding','#a9bd88','#718d6d')});
const lilacSiding = mat('#ffffff',{map:texture('siding','#a58ba8','#826e96')});
const roofTiles = mat('#ffffff',{map:texture('shingle','#3b4d69','#263751'),roughness:.98});
const fishScales = mat('#ffffff',{map:texture('shingle','#d5c78e','#a99d70')});

// A cutaway lawn makes the house feel like a miniature that can be examined from every angle.
const base = new THREE.Group(); scene.add(base);
const earth = cyl(base,6.2,5.75,.8,soil,0,-.48,0,48); earth.scale.z=1.16;
const turf = cyl(base,6.22,6.2,.16,mat('#779b73'),0,-.02,0,48); turf.scale.z=1.16;
const lawn = cyl(base,6.05,6.1,.025,mat('#ffffff',{map:grassMap,roughness:1}),0,.075,0,48); lawn.scale.z=1.18;
const rockColors=[mat('#827a6d'),mat('#6c7771'),mat('#a38e78')];
for(let i=0;i<88;i++){
  const a=random()*Math.PI*2,r=5.65+random()*.55;
  const s=sphere(base,.07+random()*.12,pick(rockColors),Math.cos(a)*r,-.68+random()*.42,Math.sin(a)*r*1.16,7);
  s.scale.set(1.3,.65,.85);
}
const rootBark=mat('#5a4d3d',{map:paintedTexture(256,256,(ctx,w,h)=>{
  ctx.fillStyle='#69543d';ctx.fillRect(0,0,w,h);
  for(let i=0;i<850;i++){ctx.strokeStyle=pick(['#3d342a','#a38863','#886d4e']);ctx.globalAlpha=.1+random()*.25;ctx.lineWidth=.5+random()*1.6;const x=random()*w,y=random()*h;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(random()-.5)*8,y+12+random()*42);ctx.stroke();}
  ctx.globalAlpha=1;
}),roughness:1});
function rootPiece(a,b,top,bottom){
  const mid=a.clone().add(b).multiplyScalar(.5),part=cyl(base,top,bottom,a.distanceTo(b),rootBark,mid.x,mid.y,mid.z,7);
  part.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),a.clone().sub(b).normalize());
}
for(let i=0;i<27;i++){
  const a=i/27*Math.PI*2+random()*.13,r=2.5+random()*2.65,depth=.8+random()*1.45;
  const start=new THREE.Vector3(Math.cos(a)*r,-.85,Math.sin(a)*r*1.1);
  let prev=start;
  for(let j=1;j<=4;j++){
    const t=j/4,next=new THREE.Vector3(start.x+Math.cos(a)*(.13+.36*t)+Math.sin(i*2+j)*.10,-.85-depth*t,start.z+Math.sin(a)*(.14+.3*t)+Math.cos(i*3+j)*.08);
    rootPiece(prev,next,.052*(1-t)+.011,.07*(1-t)+.01);prev=next;
  }
  if(i%2===0){const tip=prev.clone().add(new THREE.Vector3((random()-.5)*.4,-.24,(random()-.5)*.4));rootPiece(prev,tip,.008,.018);}
}
for(let i=0;i<72;i++){
  const a=random()*Math.PI*2,r=2+random()*3.7;
  const moss=sphere(base,.055+random()*.11,mat(pick(['#66805a','#829366','#526b52'])),Math.cos(a)*r,-.87,Math.sin(a)*r*1.12,7);
  moss.scale.set(1.4,.38,1);
}

const flight = new THREE.Group(); flight.position.y=.12; scene.add(flight);
const house = new THREE.Group(); flight.add(house);
// Base walls: blue clapboard front, lilac side and warm rear.
box(house,4.45,2.95,3.72,blueSiding,0,1.6,0);
box(house,.06,2.95,3.73,lilacSiding,2.25,1.6,0);
box(house,4.48,2.95,.07,mat('#d0b79f'),0,1.6,-1.9);
box(house,4.55,.13,3.82,darkEdge,0,.16,0);
for(let y=.55;y<3.08;y+=.38){box(house,4.48,.018,.045,blueDark,0,y,1.895);}
for(let y=.55;y<3.08;y+=.38){box(house,.045,.018,3.73,wood,2.29,y,0);}

function roofAlongX(parent,w,d,eave,peak,x,z,material=roofTiles){
  const rise=peak-eave, slope=Math.hypot(d/2,rise), angle=Math.atan2(rise,d/2);
  for(const side of [-1,1]){
    const p=box(parent,w+.16,.11,slope+.2,material,x,eave+rise/2,z+side*d/4);
    p.rotation.x=side*angle;
    const edge=box(parent,w+.24,.13,.1,darkEdge,x,eave-.01,z+side*d/2);
    edge.rotation.x=side*angle;
  }
  box(parent,w+.25,.15,.17,paleTrim,x,peak+.025,z);
}
function roofAlongZ(parent,w,d,eave,peak,x,z,material=roofTiles){
  const rise=peak-eave,slope=Math.hypot(w/2,rise),angle=Math.atan2(rise,w/2);
  for(const side of [-1,1]){
    const p=box(parent,slope+.18,.11,d+.18,material,x+side*w/4,eave+rise/2,z);
    p.rotation.z=-side*angle;
    const trim=box(parent,.1,.13,d+.24,paleTrim,x+side*w/2,eave-.03,z);
    trim.rotation.z=-side*angle;
  }
  box(parent,.16,.15,d+.25,paleTrim,x,peak+.015,z);
}
roofAlongX(house,4.72,4.14,3.03,4.15,0,0);
for(const side of [-1,1]){
  const endShape=new THREE.Shape();endShape.moveTo(-2.02,3.04);endShape.lineTo(2.02,3.04);endShape.lineTo(0,4.12);endShape.closePath();
  const end=addMesh(house,new THREE.ExtrudeGeometry(endShape,{depth:.045,bevelEnabled:false}),fishScales,side*2.3,0,0);
  end.rotation.y=side*Math.PI/2;
  for(let j=0;j<4;j++){
    const y=3.12+j*.2,span=1.85-j*.36;
    const slat=box(house,.035,.018,span*2,mat('#bcae83'),side*2.38,y,0);slat.rotation.y=.03;
  }
}

// The tall, fish-scale gable and the projecting green bay window define the film silhouette.
// The bay window opens onto a furnished room instead of an opaque front wall.
box(house,.3,2.75,1.14,greenSiding,-.21,1.72,2.15);
box(house,.3,2.75,1.14,greenSiding,1.65,1.72,2.15);
box(house,1.57,1.04,1.14,greenSiding,.72,.87,2.15);
box(house,1.57,.44,1.14,greenSiding,.72,2.87,2.15);
box(house,2.24,.15,1.28,paleTrim,.72,.32,2.15);
const gableShape=new THREE.Shape();
gableShape.moveTo(-1.15,3.04);gableShape.lineTo(1.15,3.04);gableShape.lineTo(0,4.66);gableShape.closePath();
const gable=addMesh(house,new THREE.ExtrudeGeometry(gableShape,{depth:.12,bevelEnabled:false}),fishScales,.72,0,2.77);
gable.castShadow=true;
roofAlongZ(house,2.56,1.52,3.03,4.69,.72,2.08);
box(house,2.28,.11,.13,paleTrim,.72,3.07,2.87);
box(house,2.2,.12,.13,paleTrim,.72,2.62,2.87);
for(let y=.56;y<2.55;y+=.34)box(house,2.2,.025,.065,greenDark,.72,y,2.76);

// A little room with memories is visible through the front bay window.
const roomWall=mat('#d6bb9b'),roomWood=mat('#795a4d'),pictureWood=mat('#6d493c');
box(house,1.55,1.26,.035,roomWall,.72,2.02,1.98);
for(let y=1.48;y<2.62;y+=.12)box(house,1.55,.008,.016,mat('#b99d81'),.72,y,2.007);
box(house,1.55,.055,.78,roomWood,.72,1.42,2.34);
for(let z=2.04;z<2.72;z+=.12)box(house,1.55,.008,.012,roomWood,.72,1.451,z);
box(house,1.28,.07,.42,roomWood,.72,1.75,2.27);
for(const x of [.16,1.28])box(house,.055,.38,.37,roomWood,x,1.57,2.26);
box(house,1.3,.025,.04,mat('#c4976b'),.72,1.78,2.49);
const curtain=mat('#efe0c4',{side:THREE.DoubleSide,roughness:1});
box(house,1.44,.026,.028,mat('#b9946e'),.72,2.56,2.61);
for(const side of [-1,1])for(let i=0;i<3;i++){
  const fold=box(house,.075,1.08,.025,curtain,.72+side*(.64-i*.045),2.01,2.625+i*.009);
  fold.rotation.z=side*(i-1)*.035;
}
const portraitLoader=new THREE.TextureLoader();
const portraitPhotos={
  ellie:portraitLoader.load('./assets/ellie-memory.png'),
  both:portraitLoader.load('./assets/carl-ellie-memory.png')
};
for(const photo of Object.values(portraitPhotos)){photo.colorSpace=THREE.SRGBColorSpace;photo.anisotropy=8;}
function portraitTexture(which){
  if(portraitPhotos[which])return portraitPhotos[which];
  return paintedTexture(256,256,(ctx,w,h)=>{
    const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#d9c8aa');bg.addColorStop(1,'#899bad');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    if(which==='ellie'){
      ctx.fillStyle='#593b34';ctx.beginPath();ctx.ellipse(128,82,55,62,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#d3a28d';ctx.beginPath();ctx.ellipse(128,99,43,53,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#a05e66';ctx.beginPath();ctx.ellipse(128,220,85,75,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#5a4d47';ctx.fillRect(95,89,13,6);ctx.fillRect(145,89,13,6);
      ctx.strokeStyle='#8f5f5b';ctx.lineWidth=4;ctx.beginPath();ctx.arc(128,113,19,.2,Math.PI-.2);ctx.stroke();
    } else {
      for(const [x,hair,coat] of [[83,'#9e6654','#d9b776'],[174,'#dedbd0','#6f605a']]){
        ctx.fillStyle=coat;ctx.beginPath();ctx.ellipse(x,210,53,73,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#dab09c';ctx.beginPath();ctx.ellipse(x,95,36,48,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=hair;ctx.beginPath();ctx.ellipse(x,57,37,20,0,Math.PI,Math.PI*2);ctx.fill();
      }
      ctx.strokeStyle='#3d3733';ctx.lineWidth=7;
      for(const x of [174]){ctx.strokeRect(x-31,83,25,20);ctx.strokeRect(x+6,83,25,20);}
    }
  });
}
function portrait(x,y,w,h,which){
  box(house,w+.09,h+.09,.035,pictureWood,x,y,2.09);
  addMesh(house,new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:portraitTexture(which)}),x,y,2.115,false,false);
  box(house,w+.12,.025,.07,mat('#b78961'),x,y-h/2-.04,2.12);
}
portrait(.36,2.33,.31,.38,'ellie');portrait(1.02,2.28,.38,.43,'both');
// Red toy bird, binoculars, adventure ticket and books on the shelf.
const toyBody=sphere(house,1,mat('#bd5252'),.27,1.88,2.39,14);toyBody.scale.set(.085,.105,.075);
const toyWing=sphere(house,1,mat('#d38774'),.245,1.9,2.445,12);toyWing.scale.set(.045,.06,.018);
const toyBeak=addMesh(house,new THREE.ConeGeometry(.027,.08,5),mat('#e4b063'),.36,1.91,2.4);toyBeak.rotation.z=-Math.PI/2;
box(house,.13,.024,.07,mat('#644c39'),.27,1.79,2.4);
for(const [x,y,c] of [[.57,1.89,'#656d85'],[.61,1.92,'#819376'],[.65,1.9,'#ba8c6d']]){
  const book=box(house,.045,.23,.14,mat(c),x,y,2.36);book.rotation.z=(x-.61)*.8;
}
for(const x of [.86,.98]){
  const lens=cyl(house,.065,.065,.12,mat('#3d454c'),x,1.87,2.37,12);lens.rotation.x=Math.PI/2;
  cyl(house,.044,.044,.014,mat('#b5b8aa'),x,1.87,2.44,12).rotation.x=Math.PI/2;
}
box(house,.34,.18,.015,mat('#d7b980'),1.20,1.86,2.46);
const ticketText=paintedTexture(256,128,(ctx,w,h)=>{ctx.fillStyle='#d7b980';ctx.fillRect(0,0,w,h);ctx.fillStyle='#514635';ctx.font='bold 24px Georgia';ctx.fillText('VENEZUELA',17,52);ctx.font='18px Georgia';ctx.fillText('ADVENTURE',17,88);});
addMesh(house,new THREE.PlaneGeometry(.31,.155),new THREE.MeshBasicMaterial({map:ticketText}),1.2,1.86,2.472,false,false);
const interiorLamp=new THREE.PointLight(0xffb870,3.8,3,2);interiorLamp.position.set(.72,2.35,2.45);house.add(interiorLamp);
// Keepsakes are modeled behind the glass, so moving the camera reveals actual depth.
const memoryLight=new THREE.PointLight(0xffd9a3,0,1.7,2);memoryLight.position.set(.4,2.1,2.46);house.add(memoryLight);
const bookCover=paintedTexture(512,512,(ctx,w,h)=>{
  ctx.fillStyle='#876247';ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='#e4c596';ctx.lineWidth=18;ctx.strokeRect(27,27,w-54,h-54);
  ctx.fillStyle='#f0d8a6';ctx.font='bold 56px Georgia';ctx.textAlign='center';ctx.fillText('MY ADVENTURE',w/2,105);
  ctx.fillText('BOOK',w/2,176);
  ctx.fillStyle='#5e8867';ctx.beginPath();ctx.moveTo(95,410);ctx.lineTo(255,235);ctx.lineTo(415,410);ctx.fill();
  ctx.fillStyle='#e9c9a1';ctx.beginPath();ctx.arc(255,240,23,0,Math.PI*2);ctx.fill();
});
const memoryBook=new THREE.Group();memoryBook.position.set(1.22,1.85,2.42);house.add(memoryBook);
box(memoryBook,.34,.27,.035,mat('#6e4a39'),0,0,0);
addMesh(memoryBook,new THREE.PlaneGeometry(.32,.25),new THREE.MeshBasicMaterial({map:bookCover}),0,0,.026,false,false);
for(let i=0;i<5;i++)box(memoryBook,.027,.012,.018,mat('#dec598'),-.175,-.1+i*.045,.005);
const memoryClock=new THREE.Group();memoryClock.position.set(.7,2.47,2.08);house.add(memoryClock);
cyl(memoryClock,.105,.105,.045,mat('#73584c'),0,0,0,24).rotation.x=Math.PI/2;
cyl(memoryClock,.08,.08,.049,mat('#e9d7b6'),0,0,.026,24).rotation.x=Math.PI/2;
for(let i=0;i<12;i++){const a=i/12*Math.PI*2;sphere(memoryClock,.006,mat('#594a3e'),Math.sin(a)*.066,Math.cos(a)*.066,.055,5);}
line(memoryClock,[[0,0,.058],[.035,.04,.058],[0,0,.058],[-.015,.055,.058]],'#594a3e');
const plantPot=cyl(house,.07,.05,.13,mat('#c08e72'),.11,1.85,2.37,12);
for(let i=0;i<5;i++){
  const leaf=oval(house,mat(i%2?'#779a65':'#91ae73'),.11+Math.sin(i*2.4)*.06,1.97+random()*.12,2.37+Math.cos(i*2.4)*.04,.027,.085,.018);
  leaf.rotation.z=Math.sin(i*2.4)*.55;
}
const photoGlint=addMesh(house,new THREE.PlaneGeometry(.31,.38),new THREE.MeshBasicMaterial({color:'#fff5db',transparent:true,opacity:.035,depthWrite:false}),.36,2.33,2.15,false,false);

// Porch wing, landing and its delicate white railings.
box(house,2.13,.2,1.36,mat('#aa7c75'),-1.32,.3,2.52);
box(house,2.25,.11,1.4,paleTrim,-1.32,.45,2.52);
box(house,2.1,.14,1.58,roofTiles,-1.34,2.63,2.53);
for(const x of [-2.25,-.41]){
  box(house,.11,2.12,.11,paleTrim,x,1.5,3.14);
  box(house,.18,.1,.18,paleTrim,x,2.49,3.14);
  box(house,.18,.1,.18,paleTrim,x,.62,3.14);
}
for(let x=-2.19;x<-.45;x+=.24)box(house,.055,.62,.055,white,x,.83,3.19);
box(house,1.83,.065,.08,white,-1.34,1.15,3.19);
box(house,1.83,.07,.08,white,-1.34,.53,3.19);
for(let i=0;i<4;i++)box(house,1.05,.11,.29,mat(i%2?'#ae9288':'#c8ab96'),-1.4,.24-i*.06,3.32+i*.24);
// Front door and porch number.
box(house,.83,1.75,.1,wood,-1.35,1.26,1.94);
box(house,.69,1.59,.03,mat('#715560'),-1.35,1.27,2.01);
box(house,.39,.43,.035,glassNight,-1.35,1.8,2.04);windows.push(glassNight);
box(house,.1,1.83,.15,paleTrim,-1.81,1.27,2.04);
box(house,.1,1.83,.15,paleTrim,-.89,1.27,2.04);
box(house,1.04,.12,.17,paleTrim,-1.35,2.22,2.04);
sphere(house,.045,mat('#d9bd78'),-1.08,1.2,2.09,10);

const windowNiches=[];
function window3D(parent,x,y,z,w,h,side=false,lit=true,seeThrough=false,back=false,theme='study') {
  const g=new THREE.Group();g.position.set(x,y,z);if(side)g.rotation.y=Math.PI/2;if(back)g.rotation.y=Math.PI;parent.add(g);
  const m=new THREE.MeshPhysicalMaterial({color:lit?'#adc7c5':'#c0d7d4',transparent:true,opacity:.16,depthWrite:false,roughness:.1,metalness:.03,clearcoat:1,clearcoatRoughness:.08,side:THREE.DoubleSide});
  clearWindows.push(m);
  if(!seeThrough){
    const wall=mat(theme==='attic'?'#a98d71':theme==='kitchen'?'#cbb89b':'#b9a592');
    box(g,w*.95,h*.94,.018,wall,0,0,-.105);
    box(g,w*.94,.035,.19,roomWood,0,-h*.42,-.028);
    box(g,w*.75,.025,.09,roomWood,0,-h*.12,-.035);
    if(theme==='attic'){
      box(g,w*.36,h*.23,.075,mat('#765945'),-w*.21,-h*.28,-.013);
      box(g,w*.38,.025,.09,mat('#c5a26d'),-w*.21,-h*.16,.017);
      for(let i=0;i<3;i++){const b=box(g,w*.1,h*.24,.045,mat(['#766b70','#9c795b','#668477'][i]),w*(.06+i*.13),-h*.25,-.007);b.rotation.z=(i-1)*.11;}
      const roll=cyl(g,.035,.035,w*.24,mat('#d6c2a1'),w*.17,h*.16,-.005,8);roll.rotation.z=Math.PI/2;
    }else if(theme==='kitchen'){
      for(let i=0;i<3;i++){const pot=cyl(g,w*.09,w*.07,h*.13,mat(['#d2a882','#86a27f','#c48674'][i]),-w*.25+i*w*.25,-h*.23,.005,9);pot.rotation.y=.2;}
      const plant=sphere(g,w*.1,green,-w*.22,h*.09,-.017,7);plant.scale.y=1.5;
    }else if(theme==='bedroom'){
      box(g,w*.59,h*.16,.07,mat('#8d735e'),0,-h*.25,.002);
      box(g,w*.49,h*.12,.02,mat('#d7b6a4'),0,-h*.18,.049);
      box(g,w*.15,h*.18,.025,pictureWood,w*.26,h*.23,-.052);
      sphere(g,w*.045,mat('#f2d3a4'),w*.26,h*.23,-.032,8);
    }else{
      for(let i=0;i<5;i++)box(g,w*.085,h*(.15+(i%3)*.04),.04,mat(['#715d5e','#738473','#ad8770'][i%3]),-w*.28+i*w*.14,-h*.21,-.003);
      const lamp=sphere(g,w*.09,mat('#e7c28d',{emissive:'#bd824e',emissiveIntensity:.3}),w*.25,h*.12,-.017,9);lamp.scale.y=.6;
    }
  }
  box(g,w,h,.008,m,0,0,.017);
  box(g,w+.21,.09,.14,paleTrim,0,h/2+.04,.08);
  box(g,w+.21,.09,.14,paleTrim,0,-h/2-.04,.08);
  box(g,.09,h+.17,.14,paleTrim,-w/2-.045,0,.08);
  box(g,.09,h+.17,.14,paleTrim,w/2+.045,0,.08);
  box(g,.055,h,.09,paleTrim,0,0,.09);
  box(g,w,.055,.09,paleTrim,0,0,.09);
  box(g,w+.29,.08,.29,wood,0,-h/2-.14,.13);
  windowNiches.push(g);
  return g;
}
const livingWindow=window3D(house,.72,2.02,2.81,1.56,1.26,false,true,true);
window3D(house,.72,3.59,3.02,.48,.7,false,false,false,false,'attic');
window3D(house,-2.02,2.16,2.08,.6,.8,false,true,false,false,'study');
window3D(house,2.45,2.05,.73,.92,1.05,true,true,false,false,'kitchen');
window3D(house,2.45,2.04,-.92,.83,1,true,true,false,false,'study');
window3D(house,-.7,1.85,-2.08,.9,1,false,true,false,true,'bedroom');
window3D(house,1.15,1.85,-2.08,.9,1,false,true,false,true,'kitchen');
window3D(house,2.52,3.51,0,.62,.45,true,true,false,false,'attic');
const leftAtticWindow=window3D(house,-2.52,3.51,0,.62,.45,true,true,false,false,'attic');leftAtticWindow.rotation.y=-Math.PI/2;

// Small dormer, brick chimney and rooster weather vane.
box(house,.75,.68,.7,yellow,-1.38,3.7,1.05);
roofAlongZ(house,1,.92,4.01,4.55,-1.38,1.05);
window3D(house,-1.38,3.73,1.44,.4,.47,false,false);
box(house,.48,1.45,.46,mat('#8d6861'),-1.52,4.43,-.65);
for(let y=3.85;y<5.1;y+=.18)box(house,.49,.022,.48,mat('#74544f'),-1.52,y,-.65);
box(house,.61,.12,.6,mat('#5c5353'),-1.52,5.16,-.65);
const chimneySmoke=[];
for(let i=0;i<12;i++){
  const puff=new THREE.Sprite(new THREE.SpriteMaterial({map:hazeTexture,color:'#e9e2d8',transparent:true,opacity:.12,depthWrite:false,fog:false}));
  house.add(puff);chimneySmoke.push(puff);
}
const vane=new THREE.Group();vane.position.set(.72,4.8,2.08);house.add(vane);
cyl(vane,.018,.018,.64,mat('#d3b375',{metalness:.7,roughness:.3}),0,.32,0,8);
const shaft=box(vane,.76,.035,.04,mat('#d3b375',{metalness:.7}),0,.56,0);
const arrow=addMesh(vane,new THREE.ConeGeometry(.12,.23,3),mat('#d3b375',{metalness:.7}),.45,.56,0);
arrow.rotation.z=-Math.PI/2;
const birdMat=mat('#b79352',{metalness:.6,roughness:.35});
const bird=sphere(vane,.14,birdMat,0,.78,0,10);bird.scale.set(1.6,.65,.7);
sphere(vane,.07,birdMat,.18,.87,0,8);
const beak=addMesh(vane,new THREE.ConeGeometry(.05,.14,4),birdMat,.28,.86,0);beak.rotation.z=-Math.PI/2;
for(let i=0;i<4;i++){const tail=addMesh(vane,new THREE.ConeGeometry(.04,.27,5),birdMat,-.22-i*.035,.9+i*.055,0);tail.rotation.z=.6+i*.2;}

// A hose, a mailbox with two handprints, and a tiny rocker make the close-up rewarding.
const hoseMat=mat('#477f83',{roughness:.55});
for(let i=0;i<4;i++){const h=addMesh(house,new THREE.TorusGeometry(.17+i*.025,.025,7,18),hoseMat,-.33,.77,2.48+i*.015);h.rotation.y=Math.PI/2;}
box(house,.36,.42,.16,mat('#527481'),-.33,.75,2.36);
const mailbox=new THREE.Group();mailbox.position.set(-3.08,0,3.42);base.add(mailbox);
box(mailbox,.09,1.12,.09,white,0,.65,0);
box(mailbox,.62,.3,.37,white,0,1.29,0);
const cap=addMesh(mailbox,new THREE.CylinderGeometry(.19,.19,.62,12,1,false,0,Math.PI),white,0,1.44,0);cap.rotation.z=Math.PI/2;
const flag=box(mailbox,.035,.2,.035,mat('#c95653'),.33,1.36,0);
box(mailbox,.15,.06,.04,mat('#c95653'),.33,1.47,0);
const mailCanvas=document.createElement('canvas');mailCanvas.width=512;mailCanvas.height=256;
const mc=mailCanvas.getContext('2d');mc.fillStyle='#eee8d7';mc.fillRect(0,0,512,256);
mc.font='bold 47px Georgia';mc.fillStyle='#557a71';mc.fillText('Carl & Ellie',46,212);
for(const [x,y,c] of [[135,85,'#6b70a5'],[255,72,'#c76377']]){
  mc.fillStyle=c;mc.beginPath();mc.ellipse(x,y,35,43,-.2,0,Math.PI*2);mc.fill();
  for(let j=0;j<4;j++){mc.beginPath();mc.ellipse(x-33+j*18,y-45+(j%2)*-7,10,20,-.3+j*.15,0,Math.PI*2);mc.fill();}
}
const mailTex=new THREE.CanvasTexture(mailCanvas);mailTex.colorSpace=THREE.SRGBColorSpace;
const mailFace=addMesh(mailbox,new THREE.PlaneGeometry(.55,.27),new THREE.MeshBasicMaterial({map:mailTex}),0,1.29,.195,false,false);
mailFace.rotation.y=0;
// Stone path and white picket fence.
for(let i=0;i<9;i++){
  const slab=box(base,.67,.07,.32,mat(i%2?'#c7b3a0':'#d8c5ab'),-1.45,.12,3.18+i*.13);
  slab.rotation.y=(random()-.5)*.09;
}
function fenceRun(x1,z1,x2,z2,n){
  for(let i=0;i<=n;i++){
    const t=i/n,x=x1+(x2-x1)*t,z=z1+(z2-z1)*t;
    box(base,.085,.6,.085,fenceWood,x,.41,z);
    const tip=addMesh(base,new THREE.ConeGeometry(.07,.18,4),fenceWood,x,.8,z);tip.rotation.y=Math.PI/4;
    if(i%2===0){sphere(base,.015,mat('#9d917c'),x,.59,z+.049,6);sphere(base,.015,mat('#9d917c'),x,.35,z+.049,6);}
  }
  const dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz),a=Math.atan2(dx,dz);
  for(const y of [.34,.58]){const rail=box(base,.07,.055,len,fenceWood,(x1+x2)/2,y,(z1+z2)/2);rail.rotation.y=a;}
}
fenceRun(-4.42,-3.85,-4.42,4.58,26);
fenceRun(4.42,-3.85,4.42,4.58,26);
fenceRun(-4.42,-3.85,4.42,-3.85,27);
fenceRun(-4.35,4.58,-2.4,4.58,7);
fenceRun(-.4,4.58,4.35,4.58,15);

// Layered lawn: painted turf plus thousands of small blades for close inspection.
const bladeGeo=new THREE.BufferGeometry();
bladeGeo.setAttribute('position',new THREE.Float32BufferAttribute([
  -.018,0,0, .015,0,0, .002,.14,.014,
  -.012,0,0, .02,0,0, .006,.11,-.025,
  -.018,0,0, .015,0,0, -.01,.09,.022
],3));bladeGeo.computeVertexNormals();
const grassCount=11000;
const grass=new THREE.InstancedMesh(bladeGeo,new THREE.MeshLambertMaterial({color:'#ffffff',side:THREE.DoubleSide}),grassCount);
grass.castShadow=false;grass.receiveShadow=false;grass.instanceMatrix.setUsage(THREE.StaticDrawUsage);base.add(grass);
const grassDummy=new THREE.Object3D();
for(let i=0;i<grassCount;i++){
  let x,z;do{x=(random()*2-1)*5.9;z=(random()*2-1)*6.8;}while(x*x/(5.9*5.9)+z*z/(6.8*6.8)>1||Math.abs(x)<2.5&&Math.abs(z)<3.15||x>-2.2&&x<-.7&&z>3.12&&z<4.58);
  grassDummy.position.set(x,.09,z);grassDummy.rotation.set(0,random()*Math.PI*2,0);
  const patchiness=Math.sin(x*1.8+z*.45)*Math.sin(z*1.15-x*.3);
  const scale=(patchiness>.28?.9:patchiness<-.35?.38:.62)+random()*(patchiness>.28?1.0:.48);
  grassDummy.scale.set(scale*(.8+random()*.35),scale,scale*(.8+random()*.35));grassDummy.updateMatrix();grass.setMatrixAt(i,grassDummy.matrix);
  grass.setColorAt(i,new THREE.Color(pick(patchiness>.28?['#456f3f','#5b8148','#749458']:['#668b4d','#88a567','#a8b878','#618b51'])));
}
grass.instanceMatrix.needsUpdate=true;if(grass.instanceColor)grass.instanceColor.needsUpdate=true;

// Flowering trees have branches, layered leaves and clusters of pink blossom.
const barkMap=paintedTexture(256,512,(ctx,w,h)=>{ctx.fillStyle='#695846';ctx.fillRect(0,0,w,h);for(let i=0;i<400;i++){const x=random()*w,y=random()*h;ctx.strokeStyle=pick(['#3d342d88','#bba88855']);ctx.lineWidth=1+random()*2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(random()-.5)*8,y+15+random()*65);ctx.stroke();}});
const trunkMat=mat('#ffffff',{map:barkMap});
const foliageGeo=new THREE.SphereGeometry(1,7,5),blossomGeo=new THREE.SphereGeometry(1,6,5);
const foliageMat=mat('#ffffff',{side:THREE.DoubleSide}),blossomMat=mat('#ffffff');
for(const [x,z,s] of [[-3.55,-1.35,1],[-3.75,1.4,.7],[3.6,-1.45,.9],[3.55,1.5,.6]]){
  const tree=new THREE.Group();tree.position.set(x,.1,z);base.add(tree);
  cyl(tree,.095*s,.16*s,1.42*s,trunkMat,0,.71*s,0,10);
  for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2+.2,from=new THREE.Vector3(0,1.05*s,0),to=new THREE.Vector3(Math.cos(a)*(.45+random()*.25)*s,(1.6+random()*.37)*s,Math.sin(a)*(.45+random()*.25)*s);
    const branch=cyl(tree,.025*s,.06*s,from.distanceTo(to),trunkMat,(from.x+to.x)/2,(from.y+to.y)/2,(from.z+to.z)/2,7);
    branch.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),to.clone().sub(from).normalize());
  }
  const leaves=new THREE.InstancedMesh(foliageGeo,foliageMat,230),buds=new THREE.InstancedMesh(blossomGeo,blossomMat,115);
  leaves.castShadow=false;buds.castShadow=false;tree.add(leaves,buds);
  for(let i=0;i<230;i++){
    const a=random()*Math.PI*2,r=Math.sqrt(random())*.74*s,y=(1.5+random()*.78)*s;
    grassDummy.position.set(Math.cos(a)*r,y,Math.sin(a)*r);grassDummy.rotation.set(random()*.5,random()*Math.PI*2,random()*.5);
    const size=(.11+random()*.1)*s;grassDummy.scale.set(size,size*.5,size*.72);grassDummy.updateMatrix();leaves.setMatrixAt(i,grassDummy.matrix);
    leaves.setColorAt(i,new THREE.Color(pick(['#537348','#638550','#7c995f','#9da66b','#a6b679'])));
  }
  for(let i=0;i<115;i++){
    const a=random()*Math.PI*2,r=(.35+random()*.42)*s,y=(1.62+random()*.68)*s;
    grassDummy.position.set(Math.cos(a)*r,y,Math.sin(a)*r);grassDummy.rotation.set(0,0,0);
    const size=(.018+random()*.04)*s;grassDummy.scale.set(size,size*.7,size);grassDummy.updateMatrix();buds.setMatrixAt(i,grassDummy.matrix);
    buds.setColorAt(i,new THREE.Color(pick(['#f2d3d2','#e7b6c8','#e8c0dd','#e8d9b6'])));
  }
  leaves.instanceMatrix.needsUpdate=true;buds.instanceMatrix.needsUpdate=true;
  if(leaves.instanceColor)leaves.instanceColor.needsUpdate=true;if(buds.instanceColor)buds.instanceColor.needsUpdate=true;
}
const mulch=mat('#5b6049');
box(base,8.3,.025,.55,mulch,0,.112,-3.35);
for(const x of [-4.03,4.03])box(base,.48,.025,7.8,mulch,x,.112,.18);
const flowerCount=3200,stems=new THREE.InstancedMesh(new THREE.CylinderGeometry(.008,.009,1,5),greenDark,flowerCount),blooms=new THREE.InstancedMesh(new THREE.SphereGeometry(1,7,5),mat('#ffffff'),flowerCount);
stems.castShadow=false;blooms.castShadow=false;base.add(stems,blooms);
for(let i=0;i<flowerCount;i++){
  let x,z;
  if(i<1900){const edge=Math.floor(random()*3);x=edge===0?(random()*7.9-3.95):edge===1?-4.03+(random()-.5)*.38:4.03+(random()-.5)*.38;z=edge===0?-3.35+(random()-.5)*.46:(random()*7.6-3.6);}
  else{const a=random()*Math.PI*2,r=Math.sqrt(random());x=Math.cos(a)*r*5.5;z=Math.sin(a)*r*6.2;}
  if(Math.abs(x)<2.5&&Math.abs(z)<3.1){x=3.7+(random()-.5)*.3;z=(random()-.5)*6.8;}
  const h=.08+random()*.18;grassDummy.position.set(x,.11+h/2,z);grassDummy.rotation.set(0,0,0);grassDummy.scale.set(1,h,1);grassDummy.updateMatrix();stems.setMatrixAt(i,grassDummy.matrix);
  grassDummy.position.y=.11+h+.025;const size=.025+random()*.043;grassDummy.scale.set(size,size*(.7+random()*.45),size);grassDummy.updateMatrix();blooms.setMatrixAt(i,grassDummy.matrix);
  blooms.setColorAt(i,new THREE.Color(pick(['#f0c3d2','#da9cbb','#d6b5db','#a991cf','#a9bee1','#f3dfbb','#f6e5d1'])));
}
stems.instanceMatrix.needsUpdate=true;blooms.instanceMatrix.needsUpdate=true;if(blooms.instanceColor)blooms.instanceColor.needsUpdate=true;
// A few distinct flower heads break up the dotted groundcover when the garden is magnified.
const showFlowerCount=160;
const petalMesh=new THREE.InstancedMesh(new THREE.SphereGeometry(1,10,7),mat('#ffffff',{side:THREE.DoubleSide}),showFlowerCount*5);
const heartMesh=new THREE.InstancedMesh(new THREE.SphereGeometry(1,10,7),mat('#ffffff'),showFlowerCount);
petalMesh.castShadow=false;heartMesh.castShadow=false;base.add(petalMesh,heartMesh);
const petalPalette=[['#d8a5c4','#a36c9b'],['#ead3a1','#c69458'],['#b6c3e6','#7f92c5'],['#edb9ae','#c88686']];
for(let i=0;i<showFlowerCount;i++){
  const bed=i<88?0:i<128?1:2;
  const x=bed===0?-3.75+random()*7.5:bed===1?-4.02+(random()-.5)*.36:4.02+(random()-.5)*.36;
  const z=bed===0?-3.35+(random()-.5)*.46:(random()-.5)*6.9;
  const y=.28+random()*.17,scale=.055+random()*.038,palette=pick(petalPalette);
  for(let j=0;j<5;j++){
    const a=j*Math.PI*2/5+random()*.09;
    grassDummy.position.set(x+Math.cos(a)*scale*.58,y+Math.sin(a)*scale*.24,z+Math.sin(a)*scale*.58);
    grassDummy.rotation.set(Math.sin(a)*.5,a,Math.cos(a)*.32);
    grassDummy.scale.set(scale*.62,scale*.88,scale*.35);grassDummy.updateMatrix();
    const k=i*5+j;petalMesh.setMatrixAt(k,grassDummy.matrix);
    petalMesh.setColorAt(k,new THREE.Color(j%3===0?palette[1]:palette[0]));
  }
  grassDummy.position.set(x,y,z);grassDummy.rotation.set(0,0,0);grassDummy.scale.set(scale*.34,scale*.34,scale*.34);grassDummy.updateMatrix();
  heartMesh.setMatrixAt(i,grassDummy.matrix);heartMesh.setColorAt(i,new THREE.Color(i%3===0?'#d8a868':'#f0dcac'));
  const flowerStem=cyl(base,.008,.011,y-.1,greenDark,x,.1+(y-.1)/2,z,6);flowerStem.castShadow=false;
}
petalMesh.instanceMatrix.needsUpdate=true;heartMesh.instanceMatrix.needsUpdate=true;
if(petalMesh.instanceColor)petalMesh.instanceColor.needsUpdate=true;if(heartMesh.instanceColor)heartMesh.instanceColor.needsUpdate=true;

// Three recognizable flower silhouettes sit among the smaller groundcover.
const daisyPetal=mat('#f4eddb',{side:THREE.DoubleSide}),daisyHeart=mat('#d5a84f'),tulipColors=[mat('#d989a0'),mat('#e7ad83'),mat('#b79ec7')],lavenderBud=mat('#9f86bd');
function gardenFlowerSpot(i){
  if(i%3===0)return [-3.8+random()*7.6,-3.33+(random()-.5)*.55];
  return [i%3===1?-4.02+(random()-.5)*.45:4.02+(random()-.5)*.45,-3.2+random()*6.8];
}
for(let i=0;i<78;i++){
  const [x,z]=gardenFlowerSpot(i),type=i%3,h=type===2?.33+random()*.21:.21+random()*.18;
  cyl(base,.008,.012,h,greenDark,x,.11+h/2,z,6).castShadow=false;
  for(const side of [-1,1]){
    const leaf=sphere(base,.05,green,x+side*.045,.16+h*.18,z,7);leaf.scale.set(.72,.2,1.6);leaf.rotation.y=side*.6;
  }
  if(type===0){
    for(let j=0;j<8;j++){
      const a=j*Math.PI/4,p=sphere(base,.055,daisyPetal,x+Math.cos(a)*.062,.11+h,z+Math.sin(a)*.062,8);
      p.scale.set(.55,.26,1.15);p.rotation.y=a+Math.PI/2;
    }
    sphere(base,.034,daisyHeart,x,.112+h,z,10).scale.y=.55;
  }else if(type===1){
    const color=tulipColors[Math.floor(i/3)%tulipColors.length];
    for(let j=0;j<5;j++){
      const a=j*Math.PI*2/5,petal=sphere(base,.065,color,x+Math.cos(a)*.032,.11+h+.025,z+Math.sin(a)*.032,8);
      petal.scale.set(.47,1,.42);petal.rotation.z=-Math.cos(a)*.24;
    }
  }else{
    for(let j=0;j<8;j++){
      const a=j*2.4,y=.11+h-.015-j*.027;
      const bud=sphere(base,.026,lavenderBud,x+Math.cos(a)*.023,y,z+Math.sin(a)*.023,6);bud.scale.set(.8,1.25,.75);
    }
  }
}
// Carl's small kitchen garden fills the quiet strip behind the house.
const gardenSoil=mat('#625045'),gardenBedWood=mat('#ffffff',{map:chairMap,roughness:.96}),vegetableLeaf=mat('#62945d'),cabbageLeaf=mat('#8db573'),tomatoRed=mat('#c96b58');
for(const cx of [-1.12,1.13]){
  box(base,1.55,.15,.71,gardenBedWood,cx,.18,-2.75);
  box(base,1.43,.035,.59,gardenSoil,cx,.27,-2.75);
  for(const edge of [-1,1])box(base,1.57,.08,.06,gardenBedWood,cx,.3,-2.75+edge*.34);
  for(let j=0;j<6;j++){
    const x=cx-.58+(j%3)*.56,z=-2.97+Math.floor(j/3)*.42;
    if(cx<0){
      const carrot=sphere(base,.06,mat('#d69255'),x,.32,z,8);carrot.scale.set(.7,1.15,.7);
      for(let k=0;k<4;k++){const leaf=sphere(base,.07,vegetableLeaf,x+(k-1.5)*.018,.42,z+(k%2?-.03:.03),7);leaf.scale.set(.28,1.5,.42);leaf.rotation.z=(k-1.5)*.36;}
    }else if(j%2===0){
      for(let k=0;k<5;k++){const a=k*Math.PI*2/5,leaf=sphere(base,.11,cabbageLeaf,x+Math.cos(a)*.055,.35,z+Math.sin(a)*.055,8);leaf.scale.set(.9,.53,1.15);leaf.rotation.y=a;}
      sphere(base,.065,vegetableLeaf,x,.39,z,8);
    }else{
      cyl(base,.008,.008,.34,greenDark,x,.46,z,5);
      for(let k=0;k<3;k++){const a=k*Math.PI*2/3;sphere(base,.048,tomatoRed,x+Math.cos(a)*.09,.48+(k%2)*.055,z+Math.sin(a)*.09,8);}
    }
  }
}

// The paired chairs are a small memory tucked into the right-hand garden.
const chairWood=mat('#ffffff',{map:chairMap,roughness:.93}),chairEdge=mat('#a5836b',{map:chairMap,roughness:.94}),hatFelt=mat('#51443b');
const caneWeave=paintedTexture(256,256,(ctx,w,h)=>{
  ctx.fillStyle='#a38a6b';ctx.fillRect(0,0,w,h);
  for(let i=0;i<256;i+=12){ctx.strokeStyle='#5e4a36';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,h);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(w,i);ctx.stroke();}
  for(let i=6;i<256;i+=12){ctx.strokeStyle='#c9ae86';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,h);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(w,i);ctx.stroke();}
});
function makeChair(x,z){
  const g=new THREE.Group();g.position.set(x,.08,z);base.add(g);
  for(const px of [-.25,.25])for(const pz of [-.21,.21])box(g,.065,.58,.065,chairEdge,px,.29,pz);
  box(g,.65,.075,.54,chairWood,0,.58,0);
  for(let i=-2;i<=2;i++)box(g,.09,.018,.5,chairEdge,i*.115,.625,0);
  for(const px of [-.25,.25]){
    box(g,.075,.78,.07,chairEdge,px,1.02,-.23);
    box(g,.09,.055,.52,chairWood,px,.91,.015);
  }
  for(let i=-2;i<=2;i++)box(g,.09,.49,.045,chairWood,i*.11,1.06,-.23);
  box(g,.66,.085,.075,chairEdge,0,1.35,-.23);
  addMesh(g,new THREE.PlaneGeometry(.39,.39),new THREE.MeshStandardMaterial({map:caneWeave,side:THREE.DoubleSide,roughness:.96}),0,1.07,-.195,false,false);
  for(const px of [-.25,.25])for(const py of [.65,1.31])sphere(g,.015,mat('#a88a67',{metalness:.3}),px,py,.065,7);
  for(let i=0;i<4;i++)box(g,.58,.008,.012,chairEdge,0,.631,.17-i*.105);
  return g;
}
const firstChair=makeChair(2.03,3.82),secondChair=makeChair(2.94,3.82);
const brim=addMesh(firstChair,new THREE.CylinderGeometry(.24,.22,.035,24),hatFelt,-.03,.69,.02);
brim.rotation.z=.13;
const crown=addMesh(firstChair,new THREE.CylinderGeometry(.13,.16,.2,20),hatFelt,-.03,.79,.02);
crown.rotation.z=.13;
const hatBand=addMesh(firstChair,new THREE.CylinderGeometry(.165,.17,.04,20),chairEdge,-.03,.73,.02);
hatBand.rotation.z=.13;
for(const px of [.12,.22]){
  const lens=addMesh(firstChair,new THREE.TorusGeometry(.052,.008,6,16),mat('#3b3532'),px,.67,.1);
  lens.rotation.x=Math.PI/2;
}
box(firstChair,.1,.008,.008,mat('#3b3532'),.17,.67,.1);

// Carl, Russell and Dug are small articulated sculptures, made to reward a close look.
const skin=mat('#e8bba5',{roughness:.74}), blush=mat('#d9978e'), ink=mat('#24232a'), silver=mat('#e7e8e4');
const poreCanvas=document.createElement('canvas');poreCanvas.width=poreCanvas.height=256;
const poreCtx=poreCanvas.getContext('2d');poreCtx.fillStyle='rgb(128,128,255)';poreCtx.fillRect(0,0,256,256);
for(let i=0;i<12500;i++){const c=121+Math.floor(random()*15);poreCtx.fillStyle=`rgb(${c},${c},${246+Math.floor(random()*10)})`;poreCtx.fillRect(random()*256,random()*256,1,1);}
const poreMap=new THREE.CanvasTexture(poreCanvas);poreMap.wrapS=poreMap.wrapT=THREE.RepeatWrapping;
skin.normalMap=poreMap;skin.normalScale.set(.16,.16);
const scoutMap=paintedTexture(256,256,(ctx,w,h)=>{
  ctx.fillStyle='#e5c87e';ctx.fillRect(0,0,w,h);
  for(let i=0;i<5000;i++){ctx.fillStyle=pick(['#fff3c516','#8d6a3a12','#d4af6018']);ctx.fillRect(random()*w,random()*h,1+random()*3,1+random()*3);}
});
const furMap=paintedTexture(512,512,(ctx,w,h)=>{
  ctx.fillStyle='#c99a61';ctx.fillRect(0,0,w,h);
  for(let i=0;i<9500;i++){const x=random()*w,y=random()*h;ctx.strokeStyle=pick(['#f4d0a133','#8e633633','#e9ba823a']);ctx.lineWidth=.5+random();ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+random()*6,y+3+random()*9);ctx.stroke();}
});
const carlCoat=mat('#ffffff',{map:coatMap,roughness:.95}), carlTrouser=mat('#62544c'), shirt=mat('#eee7d8');
const scout=mat('#ffffff',{map:scoutMap,roughness:.93}), scarf=mat('#c96d40'), sash=mat('#604435');
const dogFur=mat('#ffffff',{map:furMap,roughness:1}), dogLight=mat('#e5bd86',{roughness:1}), dogDark=mat('#754e3b');
function oval(parent,material,x,y,z,sx,sy,sz){
  const m=sphere(parent,1,material,x,y,z,24);m.scale.set(sx,sy,sz);return m;
}
function softBox(parent,w,h,d,r,material,x,y,z){
  const s=new THREE.Shape(),a=w/2-r,b=h/2-r;
  s.moveTo(-a,-h/2);s.lineTo(a,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-b);
  s.lineTo(w/2,b);s.quadraticCurveTo(w/2,h/2,a,h/2);
  s.lineTo(-a,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,b);
  s.lineTo(-w/2,-b);s.quadraticCurveTo(-w/2,-h/2,-a,-h/2);
  const m=addMesh(parent,new THREE.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelSegments:5,bevelSize:r,bevelThickness:r,steps:1,curveSegments:16}),material,x,y,z-d/2+r);
  return m;
}
function limb(parent,x,y,z,material,length,width,tilt=0){
  const joint=new THREE.Group();joint.position.set(x,y,z);parent.add(joint);
  const m=cyl(joint,width*.82,width,length,material,0,-length/2,0,10);m.rotation.z=tilt;
  return joint;
}
function smile(parent,x,y,z,w,material=ink){
  const curve=new THREE.EllipseCurve(0,0,w,.045,Math.PI*1.08,Math.PI*1.93,false,0);
  const pts=curve.getPoints(14).map(p=>new THREE.Vector3(x+p.x,y+p.y,z));
  line(parent,pts,material.color.getHex(),1);
}
const carl=new THREE.Group();carl.position.set(-1.96,.32,3.48);house.add(carl);
const carlBody=new THREE.Group();carl.add(carlBody);
softBox(carlBody,.48,.61,.34,.055,carlCoat,0,.69,0);
softBox(carlBody,.29,.45,.035,.016,shirt,0,.72,.18);
for(const x of [-.13,.13]){const lapel=box(carlBody,.105,.33,.032,mat('#69564b'),x,.84,.19);lapel.rotation.z=x<0?-.23:.23;}
box(carlBody,.17,.1,.03,ink,0,.91,.207);
softBox(carlBody,.57,.43,.36,.08,skin,0,1.115,.02);
oval(carlBody,skin,-.295,1.10,.015,.07,.095,.05);
oval(carlBody,skin,.295,1.10,.015,.07,.095,.05);
oval(carlBody,blush,0,1.045,.235,.115,.08,.1);
for(const x of [-.1,.1]){
  oval(carlBody,shirt,x*1.35,1.12,.219,.073,.059,.023);
  oval(carlBody,mat('#7294a4'),x*1.35,1.12,.242,.035,.04,.014);
  oval(carlBody,ink,x*1.35,1.12,.255,.017,.026,.008);
  sphere(carlBody,.009,shirt,x*1.35-.01,1.135,.263,8);
  box(carlBody,.205,.027,.025,ink,x*1.35,1.194,.263);
  box(carlBody,.205,.027,.025,ink,x*1.35,1.045,.263);
  box(carlBody,.027,.149,.025,ink,x*1.35-.1,1.12,.263);
  box(carlBody,.027,.149,.025,ink,x*1.35+.1,1.12,.263);
  const eyebrow=oval(carlBody,silver,x*1.35,1.222,.25,.11,.035,.025);eyebrow.rotation.z=x<0?-.12:.12;
}
box(carlBody,.07,.028,.03,ink,0,1.125,.267);
const hairCap=oval(carlBody,silver,0,1.32,-.035,.285,.115,.185);
for(let i=0;i<6;i++){const lock=oval(carlBody,silver,-.19+i*.075,1.35+(i%2)*.013,.08,.09,.055,.08);lock.rotation.z=-.2;}
oval(carlBody,silver,-.255,1.19,-.02,.058,.11,.075);
oval(carlBody,silver,.255,1.19,-.02,.058,.11,.075);
smile(carlBody,0,.994,.214,.105,dogDark);
for(const x of [-.16,.16]){line(carlBody,[[x,.98,.226],[x*1.1,1.01,.23]],'#a5776d',.8);}
for(const side of [-1,1]){
  oval(carlBody,mat('#c88f86'),side*.302,1.1,.063,.026,.051,.012);
  line(carlBody,[[side*.19,1.17,.23],[side*.235,1.18,.205],[side*.26,1.16,.185]],'#a87c73',.7);
  line(carlBody,[[side*.19,1.045,.23],[side*.23,1.015,.203],[side*.26,1.005,.18]],'#ae8275',.65);
  line(carlBody,[[side*.16,.96,.202],[side*.21,.94,.17]],'#a98077',.55);
  box(carlBody,.075,.019,.022,ink,side*.292,1.136,.145);
}
for(let i=0;i<11;i++){
  const x=-.24+i*.047;
  line(carlBody,[[x,1.365,.115],[x+.028,1.397,.11],[x+.055,1.403,.065]],i%3===0?'#bfc2c0':'#f7f7f2',.65);
}
oval(carlBody,mat('#b27870'),-.045,1.036,.326,.012,.009,.005);
oval(carlBody,mat('#b27870'),.045,1.036,.326,.012,.009,.005);
oval(carlBody,mat('#d8aaa0'),0,.967,.18,.11,.022,.025);
const carlSash=box(carlBody,.15,.53,.027,mat('#5a3e32'),.02,.68,.215);carlSash.rotation.z=.48;
for(const side of [-1,1]){
  line(carlBody,[[side*.24,.87,.205],[side*.13,.65,.217],[side*.18,.47,.19]],'#b5a397',.67);
  line(carlBody,[[side*.18,.40,.16],[side*.17,.23,.12]],'#a09186',.58);
  for(let j=0;j<4;j++)sphere(carlBody,.0045,mat('#b9a395'),side*(.14+j*.013),.57-j*.04,.217,5);
}
for(let i=0;i<17;i++){
  const y=.43+(i%9)*.052,x=-.09+Math.floor(i/9)*.065+(i%9)*.023;
  const badge=sphere(carlBody,.021,mat(['#bf6e55','#6b90a1','#c5ad64','#668d6b','#92759c'][i%5]),x,y,.24,10);
  badge.scale.z=.35;
  sphere(carlBody,.008,mat('#e5d7aa'),x,y,.252,7);
}
for(const y of [.58,.72])sphere(carlBody,.015,mat('#493a34'),0,y,.205,8);
box(carlBody,.13,.012,.012,mat('#382d29'),-.16,.59,.19);
box(carlBody,.13,.012,.012,mat('#382d29'),.16,.59,.19);
for(const x of [-.11,.11])line(carlBody,[[x,.46,.095],[x,.16,.095]],'#352f2c',.45);
const carlLeft=limb(carlBody,-.26,.84,0,carlCoat,.45,.09);
oval(carlLeft,skin,0,-.46,0,.073,.09,.07);
box(carlLeft,.16,.07,.16,shirt,0,-.41,0);
const carlRight=limb(carlBody,.26,.84,0,carlCoat,.43,.09);
oval(carlRight,skin,0,-.44,0,.073,.09,.07);
box(carlRight,.16,.07,.16,shirt,0,-.39,0);
for(let i=-1;i<=2;i++)oval(carlRight,skin,i*.035,-.49,.01,.02,.07,.025);
for(const x of [-.11,.11]){
  box(carlBody,.14,.38,.16,carlTrouser,x,.28,0);
  oval(carlBody,dogDark,x,.08,.065,.102,.075,.16);
}
const cane=cyl(carl,.018,.018,.64,mat('#383238'),-.33,.33,.13,9);
const caneHandle=addMesh(carl,new THREE.TorusGeometry(.065,.018,7,14,Math.PI),mat('#383238'),-.33,.65,.13);
caneHandle.rotation.z=Math.PI/2;

const russell=new THREE.Group();russell.position.set(-.68,.25,3.55);house.add(russell);
const russellBody=new THREE.Group();russell.add(russellBody);
oval(russellBody,scout,0,.61,0,.265,.29,.19);
softBox(russellBody,.39,.35,.04,.02,scout,0,.67,.19);
oval(russellBody,skin,0,1.045,.015,.275,.25,.215);
oval(russellBody,skin,-.26,1.01,.01,.065,.09,.055);
oval(russellBody,skin,.26,1.01,.01,.065,.09,.055);
oval(russellBody,blush,-.185,.995,.15,.086,.067,.047);
oval(russellBody,blush,.185,.995,.15,.086,.067,.047);
for(const x of [-.085,.085]){
  oval(russellBody,shirt,x,1.08,.211,.057,.06,.027);
  oval(russellBody,ink,x,1.08,.235,.019,.033,.01);
  sphere(russellBody,.009,shirt,x-.009,1.1,.244,8);
  const brow=oval(russellBody,ink,x,1.17,.216,.07,.016,.015);brow.rotation.z=x<0?.18:-.18;
}
for(const x of [-.175,.175])for(const y of [.96,1.015])sphere(russellBody,.009,mat('#bd8277'),x,y,.191,6);
for(const side of [-1,1]){
  line(russellBody,[[side*.16,.92,.17],[side*.21,.94,.13]],'#aa746c',.55);
  oval(russellBody,mat('#d5968c'),side*.263,1.005,.06,.023,.046,.009);
}
oval(russellBody,skin,0,1.005,.238,.069,.055,.058);
oval(russellBody,dogDark,0,.943,.208,.115,.055,.022);
oval(russellBody,shirt,0,.955,.223,.08,.022,.01);
for(let i=0;i<12;i++){
  const a=i/12*Math.PI*2;
  const tuft=oval(russellBody,ink,Math.cos(a)*.17,1.28+Math.sin(a)*.02,-.02,.055,.075,.055);
  tuft.rotation.z=(i-6)*.08;
}
const capTop=oval(russellBody,scout,0,1.305,-.015,.235,.105,.18);
const capBrim=oval(russellBody,mat('#d9b772'),0,1.245,.168,.225,.028,.142);
const capBand=box(russellBody,.2,.027,.02,mat('#b39868'),0,1.29,.147);
for(let i=-4;i<=4;i++){
  const tuft=oval(russellBody,ink,i*.041,1.24,.17,.018,.049,.018);
  tuft.rotation.z=i*.13;
}
for(let i=-4;i<=4;i++)line(russellBody,[[i*.047,1.314,.192],[i*.047+.017,1.318,.19]],'#a98552',.65);
const sashBar=box(russellBody,.16,.59,.028,sash,-.018,.65,.206);sashBar.rotation.z=.33;
for(let i=0;i<21;i++){
  const row=i%10,band=Math.floor(i/10),y=.37+row*.056,x=-.085+row*.02+band*.055;
  const badge=sphere(russellBody,.022,mat(['#569a9c','#d66e61','#d2b66d','#6a75a9','#7d9f60'][i%5]),x,y,.235,9);
  badge.scale.z=.4;
  sphere(russellBody,.008,mat('#f4e2b4'),x,y,.246,7);
}
const scarfKnot=oval(russellBody,scarf,0,.81,.18,.07,.075,.055);
const scarfTail=box(russellBody,.08,.22,.035,scarf,0,.7,.205);scarfTail.rotation.z=.18;
const russellLeft=limb(russellBody,-.23,.75,0,scout,.33,.078);
oval(russellLeft,skin,0,-.35,0,.066,.07,.06);
box(russellLeft,.13,.055,.13,shirt,0,-.32,0);
const russellRight=limb(russellBody,.23,.75,0,scout,.33,.078);
oval(russellRight,skin,0,-.35,0,.066,.07,.06);
box(russellRight,.13,.055,.13,shirt,0,-.32,0);
for(let i=-1;i<=2;i++)oval(russellRight,skin,i*.03,-.39,.015,.018,.055,.025);
const russellLegs=[];
for(const x of [-.115,.115]){
  const leg=limb(russellBody,x,.36,0,skin,.24,.07);russellLegs.push(leg);
  box(russellBody,.16,.17,.17,mat('#6d5143'),x,.31,0);
  oval(leg,dogDark,0,-.24,.055,.09,.055,.13);
}
const pack=oval(russellBody,mat('#8c6544'),0,.63,-.21,.21,.25,.105);
box(russellBody,.37,.04,.06,mat('#624b36'),0,.48,.19);
sphere(russellBody,.035,mat('#c6a45a',{metalness:.25}),0,.48,.226,10);
for(const x of [-.11,.11])for(let i=0;i<3;i++)box(russellBody,.13,.006,.008,mat('#e9d6ae'),x,.145+i*.026,.14);
for(const y of [.68,.58,.5])sphere(russellBody,.014,mat('#c5a160'),.1,y,.196,7);

// Keep the recognizable portraits, but give their finish the same soft, handmade
// surface language as the miniature house and garden around them.
const carlPortrait=portraitLoader.load('./assets/carl-portrait-hd.png');
const russellPortrait=portraitLoader.load('./assets/russell-portrait-hd.png');
for(const tex of [carlPortrait,russellPortrait]){tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=renderer.capabilities.getMaxAnisotropy();}
const carlPortraitMat=new THREE.SpriteMaterial({map:carlPortrait,transparent:true,depthWrite:false,alphaTest:.018});
const russellPortraitMat=new THREE.SpriteMaterial({map:russellPortrait,transparent:true,depthWrite:false,alphaTest:.018});
function softenPortraitFinish(material){
  material.onBeforeCompile=(shader)=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      vec3 portraitTone = diffuseColor.rgb;
      float portraitLuma = dot(portraitTone, vec3(0.299, 0.587, 0.114));
      portraitTone = mix(portraitTone, vec3(portraitLuma), 0.10);
      portraitTone = mix(vec3(0.48), portraitTone, 0.92);
      portraitTone = mix(portraitTone, floor(portraitTone * 24.0 + 0.5) / 24.0, 0.26);
      float portraitGrain = fract(sin(dot(floor(vMapUv * vec2(440.0, 540.0)), vec2(12.9898, 78.233))) * 43758.5453);
      portraitTone += (portraitGrain - 0.5) * 0.023;
      diffuseColor.rgb = clamp(portraitTone, 0.0, 1.0);`);
  };
  material.customProgramCacheKey=()=> 'soft-miniature-portrait-v1';
}
softenPortraitFinish(carlPortraitMat);
softenPortraitFinish(russellPortraitMat);
const carlPortraitSprite=new THREE.Sprite(carlPortraitMat);carlPortraitSprite.position.set(0,.75,.32);carlPortraitSprite.scale.set(1.23,1.5,1);carl.add(carlPortraitSprite);
const russellPortraitSprite=new THREE.Sprite(russellPortraitMat);russellPortraitSprite.position.set(0,.72,.33);russellPortraitSprite.scale.set(.98,1.44,1);russell.add(russellPortraitSprite);
carlBody.visible=false;russellBody.visible=false;cane.visible=false;caneHandle.visible=false;
for(const root of [carl,russell]){
  const shadow=addMesh(root,new THREE.CircleGeometry(.26,24),new THREE.MeshBasicMaterial({color:'#302a22',transparent:true,opacity:.20,depthWrite:false}),0,.012,.015);
  shadow.rotation.x=-Math.PI/2;shadow.scale.set(1.3,.65,1);
}

const dug=new THREE.Group();dug.position.set(2.65,.14,3.24);base.add(dug);
const dugBody=new THREE.Group();dug.add(dugBody);
oval(dugBody,dogFur,0,.36,0,.38,.25,.19);
oval(dugBody,dogLight,0,.29,.15,.23,.16,.07);
oval(dugBody,dogFur,0,.49,.27,.23,.21,.21);
oval(dugBody,dogLight,0,.39,.43,.20,.145,.17);
oval(dugBody,dogDark,0,.445,.597,.12,.08,.07);
for(const x of [-.105,.105])oval(dugBody,dogLight,x,.38,.49,.095,.072,.095);
for(const x of [-.12,.12]){
  oval(dugBody,shirt,x,.555,.432,.067,.068,.03);
  oval(dugBody,mat('#705643'),x,.555,.459,.028,.036,.013);
  oval(dugBody,ink,x,.555,.471,.014,.023,.008);
  sphere(dugBody,.008,shirt,x-.01,.57,.479,7);
  const ear=oval(dugBody,dogDark,x*1.85,.46,.18,.1,.19,.11);ear.rotation.z=x>0?-.4:.4;
  oval(dugBody,dogFur,x*1.8,.44,.188,.058,.14,.065);
}
oval(dugBody,mat('#df7382'),0,.31,.54,.065,.12,.018);
for(const x of [-.075,-.045,.045,.075])sphere(dugBody,.008,dogDark,x,.485,.579,6);
for(const x of [-.11,.11]){
  oval(dugBody,dogFur,x,.625,.39,.085,.035,.035);
  line(dugBody,[[x,.38,.55],[x*1.3,.37,.53]],'#97704c',.5);
}
const collar=cyl(dugBody,.18,.19,.075,mat('#6b6c71'),0,.36,.24,16);collar.rotation.x=Math.PI/2;
sphere(dugBody,.055,mat('#c8b77c',{metalness:.3}),0,.23,.43,10);
for(let i=0;i<26;i++){
  const a=i/26*Math.PI*2,x=Math.cos(a)*.34,z=Math.sin(a)*.17;
  const tuft=oval(dugBody,i%3===0?dogLight:dogFur,x,.39+(i%4)*.035,z,.055,.09,.055);
  tuft.rotation.z=-Math.cos(a)*.55;
}
for(let i=0;i<45;i++){
  const a=random()*Math.PI*2,x=Math.cos(a)*(.27+random()*.1),z=-.01+Math.sin(a)*(.14+random()*.045);
  const tuft=oval(dugBody,i%4===0?dogLight:dogFur,x,.36+random()*.16,z,.015+random()*.015,.07+random()*.055,.012+random()*.012);
  tuft.rotation.z=-Math.cos(a)*(.25+random()*.45);
}
for(let i=0;i<7;i++){
  const x=(i-3)*.095;
  const tuft=oval(dugBody,dogLight,x,.56,-.08,.06,.07,.07);tuft.rotation.z=(i-3)*.15;
}
const dogLegs=[];
for(const x of [-.22,.22])for(const z of [-.11,.11]){
  const leg=limb(dugBody,x,.24,z,dogFur,.25,.07);dogLegs.push(leg);
  oval(leg,dogLight,0,-.23,.045,.082,.052,.1);
}
const tail=limb(dugBody,0,.48,-.37,dogFur,.28,.07);
tail.rotation.x=-.85;
function dogPoint(a){
  const x=3.48*Math.cos(a);
  let z=.35+3.45*Math.sin(a);
  const front=Math.max(0,(z-2.75)/1.05);
  z+=.55*Math.exp(-Math.pow((x+1.38)/.82,4))*front;
  return new THREE.Vector3(x,.16,z);
}

// Thousands of individually placed 3D balloons, with batched strings converging on the roof.
const balloonRig=new THREE.Group();flight.add(balloonRig);
const balloonGeo=new THREE.SphereGeometry(1,9,7);
const balloonMat=new THREE.MeshPhysicalMaterial({color:'#ffffff',roughness:.31,metalness:0,clearcoat:.58,clearcoatRoughness:.23,vertexColors:false});
const balloonCount=14000;
const balloons=new THREE.InstancedMesh(balloonGeo,balloonMat,balloonCount);
balloons.castShadow=false;
balloons.receiveShadow=false;
balloons.instanceMatrix.setUsage(THREE.StaticDrawUsage);
balloonRig.add(balloons);
const balloonColors=['#d96672','#e98d67','#eebc71','#e9d789','#82bb84','#68b7a7','#79c1d0','#639dc9','#6380ba','#927cba','#b77caa','#d98da8','#a9d3d7','#bba9ce','#d9b581'];
const dummy=new THREE.Object3D(),balloonPositions=[];
for(let i=0;i<balloonCount;i++){
  const u=random()*Math.PI*2, q=2*random()-1, radius=Math.cbrt(random());
  const ring=Math.sqrt(1-q*q), fullness=.66+.35*q;
  const x=Math.cos(u)*ring*radius*16.2*fullness+(random()-.5)*.22;
  const y=18+q*radius*12;
  const z=Math.sin(u)*ring*radius*12.1*fullness;
  const s=.27+random()*.11;
  dummy.position.set(x,y,z);
  dummy.scale.set(s*(.88+random()*.2),s*(1.24+random()*.26),s*(.89+random()*.12));
  dummy.rotation.set((random()-.5)*.18,(random()-.5)*.4,(random()-.5)*.22);
  dummy.updateMatrix();
  balloons.setMatrixAt(i,dummy.matrix);
  const balloonColor=new THREE.Color(pick(balloonColors));
  balloonColor.offsetHSL(0,.075,-.012);
  balloons.setColorAt(i,balloonColor);
  balloonPositions.push([x,y,z]);
}
balloons.instanceMatrix.needsUpdate=true;
if(balloons.instanceColor)balloons.instanceColor.needsUpdate=true;
const ropeVertices=[];
for(let i=0;i<balloonCount;i+=18){
  const [x,y,z]=balloonPositions[i];
  const a=[x,y-.2,z],b=[x*.7,y-1.25,z*.68],c=[x*.16,5.55,z*.16],d=[0,4.42,0];
  ropeVertices.push(...a,...b,...b,...c,...c,...d);
}
const ropeGeometry=new THREE.BufferGeometry();
ropeGeometry.setAttribute('position',new THREE.Float32BufferAttribute(ropeVertices,3));
balloonRig.add(new THREE.LineSegments(ropeGeometry,new THREE.LineBasicMaterial({color:'#e5e4db',transparent:true,opacity:.26,depthWrite:false})));
const knots=box(house,.27,.18,.25,wood,0,4.3,0);
knots.rotation.z=.22;

// Camera views are designed for actual inspection rather than an illusion of zooming.
const views={
  overview:{p:[28,20,53],t:[0,13.5,0]},
  house:{p:[8.6,6.3,11.9],t:[0,2.5,0]},
  window:{p:[1.45,2.4,4.9],t:[.72,2.02,2.30]},
  people:{p:[1.1,3.1,9.8],t:[-.55,1.05,3.1]},
  chairs:{p:[6.9,3.1,9.4],t:[2.45,.76,3.6]},
  porch:{p:[-6.8,3.35,9.3],t:[-1.65,1.25,2.4]},
  mailbox:{p:[-4.8,2.4,6.3],t:[-3.08,1.3,3.42]},
  roof:{p:[7.0,8.8,8.8],t:[.52,4.55,1.3]},
  lifted:{p:[29,21,55],t:[0,14,0]}
};
const mobileViews={
  overview:{p:[45,28,74],t:[0,13.5,0]},
  house:{p:[14,8,21],t:[0,2.5,0]},
  window:{p:[1.14,2.53,6.38],t:[.72,2.02,2.30]},
  people:{p:[-1.3,2.75,9.72],t:[-1.3,1.05,3.15]},
  chairs:{p:[8.8,4.7,17],t:[2.45,.76,3.6]},
  porch:{p:[-15.7,7,20.5],t:[-1.5,2.2,1.8]},
  mailbox:{p:[-5.4,2.8,7],t:[-3.08,1.32,3.42]},
  roof:{p:[9,8.8,11.5],t:[.52,4.6,1.3]},
  lifted:{p:[46,29,76],t:[0,14,0]}
};
let language='en';
const tr=()=>translations[language];
let tween=null,day=true,sceneMode='falls',flightState='idle',flightStart=0,flightElapsed=0,returnStart=0,returnDuration=0,currentView='overview',currentIsSmall=smallScreen;
let greetingUntil=0;
function updateLiftLabel(){ $('lift').textContent=tr().lift[flightState]; }
function updateDetailCopy(){
  const info=tr().details[detail.dataset.view];if(!info)return;
  $('detailTag').textContent=info.tag;$('detailTitle').textContent=info.title;$('detailText').textContent=info.text;
  $('mailZoom').textContent=tr().zoomDetail[detail.dataset.view]||tr().zoomDetail.default;
}
function applyLanguage(code){
  if(!translations[code])return;
  language=code;const t=tr();
  document.documentElement.lang=code==='zh'?'zh-CN':code;
  document.title=t.pageTitle;
  document.querySelector('meta[name="description"]').content=t.description;
  mount.setAttribute('aria-label',t.canvas);
  document.querySelector('.top-right').textContent=t.chapter;
  document.querySelector('.kicker').textContent=t.kicker;
  $('heroLine1').textContent=t.hero[0];$('heroLine2').textContent=t.hero[1];
  document.querySelector('.guide-title').textContent=t.guideTitle;
  document.querySelector('.guide').setAttribute('aria-label',t.guideAria);
  document.querySelectorAll('[data-view].point').forEach(b=>{b.querySelector('span').textContent=t.nav[b.dataset.view];});
  $('exploreToggle').textContent=t.explore;$('storyToggle').textContent=t.story;
  $('storyToggle').setAttribute('aria-label',t.storyAria);
  $('closeDetail').setAttribute('aria-label',t.closeDetail);
  document.querySelectorAll('[data-memory]').forEach(b=>{b.textContent=t.memories[b.dataset.memory];});
  const activeMemory=document.querySelector('[data-memory].active');
  if(activeMemory)$('memoryCaption').textContent=t.memoryCopy[activeMemory.dataset.memory];
  updateDetailCopy();updateLiftLabel();
  $('time').textContent=t.sceneShort[sceneMode];$('time').setAttribute('aria-label',t.sceneAria);
  $('sceneTagline').textContent=t.taglines[sceneMode];
  document.querySelectorAll('.scene-option').forEach(b=>{b.textContent=t.sceneLong[b.dataset.scene];});
  $('zoomIn').setAttribute('aria-label',t.zoomIn);$('zoomOut').setAttribute('aria-label',t.zoomOut);
  $('photo').setAttribute('aria-label',t.save);$('photo').title=t.save;
  $('home').textContent=t.reset;
  document.querySelector('.instructions strong').textContent=t.instruction1;
  document.querySelector('.instructions').lastChild.textContent=t.instruction2;
  loading.textContent=t.loading;errorPanel.querySelector('p').textContent=t.error;
  const k=t.keepsake;
  $('keepsakeClose').setAttribute('aria-label',k.close);
  $('keepsakeTitle').textContent=k.bookTitle;$('coupleCaption').textContent=k.coupleCaption;
  $('travelCaption').textContent=k.travelCaption;$('bookText').textContent=k.bookText;$('bookScrap').textContent=k.bookScrap;
  document.querySelector('.couple-photo img').alt=k.photoAlt;document.querySelector('.travel-photo img').alt=k.travelAlt;
  $('ticketTitle').textContent=k.ticketTitle;$('ticketPassengersLabel').textContent=k.passengers;
  $('ticketDestinationLabel').textContent=k.destination;$('ticketNote').textContent=k.ticketNote;
  $('languageToggle').textContent=code==='zh'?'中文 ▾':code.toUpperCase()+' ▾';
  $('languageToggle').setAttribute('aria-label',t.languageAria);
  document.querySelectorAll('[data-language]').forEach(b=>b.setAttribute('aria-current',String(b.dataset.language===code)));
  $('languageMenu').hidden=true;$('languageToggle').setAttribute('aria-expanded','false');
}
$('languageToggle').addEventListener('click',()=>{
  const menu=$('languageMenu');menu.hidden=!menu.hidden;
  $('languageToggle').setAttribute('aria-expanded',String(!menu.hidden));
});
document.querySelectorAll('[data-language]').forEach(b=>b.addEventListener('click',()=>{
  applyLanguage(b.dataset.language);
  try{localStorage.setItem('house-language',language);}catch{}
}));
document.addEventListener('pointerdown',e=>{
  if(!e.target.closest('.language')){$('languageMenu').hidden=true;$('languageToggle').setAttribute('aria-expanded','false');}
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){$('languageMenu').hidden=true;$('languageToggle').setAttribute('aria-expanded','false');}
});
let preferredLanguage='en';
try{preferredLanguage=localStorage.getItem('house-language')||'en';}catch{}
applyLanguage(preferredLanguage);
const memoryTargets={photo:{p:[.13,2.57,6.02],t:[.36,2.29,2.11]},book:{p:[.95,2.34,6.03],t:[1.22,1.85,2.43]},ticket:{p:[1.03,2.18,6.03],t:[1.20,1.86,2.46]}};
function selectMemory(key){
  const item=memoryTargets[key];if(!item)return;
  $('memoryCaption').textContent=tr().memoryCopy[key];$('memoryCaption').hidden=false;
  document.querySelectorAll('[data-memory]').forEach(b=>b.classList.toggle('active',b.dataset.memory===key));
  tween={fromP:camera.position.clone(),fromT:controls.target.clone(),toP:new THREE.Vector3(...item.p),toT:new THREE.Vector3(...item.t),start:performance.now(),duration:850};
  memoryLight.position.set(...item.t);memoryLight.intensity=3.2;
  if(key==='book'||key==='ticket')openKeepsake(key);
}
function openKeepsake(key){
  $('bookPage').hidden=key!=='book';$('ticketPage').hidden=key!=='ticket';
  $('keepsake').setAttribute('aria-labelledby',key==='book'?'keepsakeTitle':'ticketTitle');
  $('keepsakeBackdrop').hidden=false;$('keepsakeClose').focus();
}
function closeKeepsake(){$('keepsakeBackdrop').hidden=true;}
$('keepsakeClose').addEventListener('click',closeKeepsake);
$('keepsakeBackdrop').addEventListener('click',e=>{if(e.target===$('keepsakeBackdrop'))closeKeepsake();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeKeepsake();});
document.querySelectorAll('[data-memory]').forEach(b=>b.addEventListener('click',()=>selectMemory(b.dataset.memory)));
function view(name){
  const v=(mount.clientWidth<600?mobileViews:views)[name];if(!v)return;
  if(name!=='overview'&&(flightState==='flying'||flightState==='gone'))startReturn();
  currentView=name;
  tween={fromP:camera.position.clone(),fromT:controls.target.clone(),toP:new THREE.Vector3(...v.p),toT:new THREE.Vector3(...v.t),start:performance.now(),duration:950};
  document.querySelectorAll('.point').forEach(b=>b.classList.toggle('active',b.dataset.view===(name==='mailbox'?'porch':name)));
  if(name==='people')greetingUntil=performance.now()+5000;
  $('memoryTrail').hidden=name!=='window';$('memoryCaption').hidden=true;memoryLight.intensity=0;
  document.querySelectorAll('[data-memory]').forEach(b=>b.classList.remove('active'));
  if(mount.clientWidth<600 && name!=='overview'){
    document.querySelector('.guide').classList.add('is-collapsed');
    $('exploreToggle').setAttribute('aria-expanded','false');
  }
  const info=tr().details[name];
  app.classList.toggle('focus',!!info);
  if(info){detail.dataset.view=name;updateDetailCopy();}
  detail.classList.remove('show');
}
document.querySelectorAll('.point').forEach(b=>b.addEventListener('click',()=>view(b.dataset.view)));
$('closeDetail').addEventListener('click',()=>detail.classList.remove('show'));
$('storyToggle').addEventListener('click',()=>detail.classList.toggle('show'));
$('exploreToggle').addEventListener('click',()=>{
  const collapsed=document.querySelector('.guide').classList.toggle('is-collapsed');
  $('exploreToggle').setAttribute('aria-expanded',String(!collapsed));
});
$('mailZoom').addEventListener('click',()=>view(detail.dataset.view==='house'?'window':detail.dataset.view==='window'?'porch':detail.dataset.view==='people'?'chairs':detail.dataset.view==='mailbox'?'porch':'mailbox'));
$('lift').addEventListener('click',()=>{
  if(flightState==='flying'||flightState==='gone'){startReturn();return;}
  if(flightState==='returning')return;
  flightState='flying';flightStart=performance.now();flightElapsed=0;flight.visible=true;
  updateLiftLabel();view('overview');
});
function flightPath(seconds){
  flight.position.y=.12+3.1*seconds+.2*seconds*seconds;
  flight.position.x=Math.sin(seconds*.53)*Math.min(seconds*.12,1.2);
  flight.rotation.z=Math.sin(seconds*.8)*.018;
}
function startReturn(){
  if(flightState!=='flying'&&flightState!=='gone')return;
  if(flightState==='flying')flightElapsed=Math.min(17,(performance.now()-flightStart)/1000);
  else flightElapsed=17;
  flightState='returning';returnStart=performance.now();returnDuration=Math.max(5000,flightElapsed*900);
  flight.visible=true;updateLiftLabel();
}
function setScene(name){
  if(!tr().sceneShort[name])return;
  sceneMode=name;day=name!=='night';
  app.dataset.scene=name;app.classList.toggle('day',day);
  $('time').textContent=tr().sceneShort[name];
  $('sceneTagline').textContent=tr().taglines[name];
  document.querySelectorAll('.scene-option').forEach(b=>b.classList.toggle('active',b.dataset.scene===name));
  hemi.color.set(name==='night'?'#a9c3ee':name==='meeting'?'#e7f6ff':'#e9eeeb');
  hemi.groundColor.set(name==='night'?'#344762':'#788d78');
  sun.color.set(name==='night'?'#c6ccff':name==='cloud'?'#ffd3a4':name==='meeting'?'#fff0ce':'#ffe0b3');
  rim.color.set(name==='night'?'#9090e0':'#d4bfed');
  rim.intensity=name==='night'?1.85:1.25;
  renderer.toneMappingExposure=name==='night'?1.14:1.16;
  atmosphereSprites.forEach((sprite,i)=>{
    sprite.material.color.set(name==='night'?'#88a9d2':name==='falls'?'#d9f0eb':name==='meeting'?'#fff5d1':'#ffe7dd');
    sprite.material.opacity=name==='night'?.065:name==='falls'?.16:name==='meeting'?.10:.13;
    sprite.position.y=(name==='falls'?-8:name==='night'?-5:-7)+Math.floor(i/4)*6;
  });
}
$('time').addEventListener('click',()=>{
  const menu=$('sceneMenu');menu.hidden=!menu.hidden;
  $('time').setAttribute('aria-expanded',String(!menu.hidden));
});
document.querySelectorAll('.scene-option').forEach(b=>b.addEventListener('click',()=>{
  setScene(b.dataset.scene);$('sceneMenu').hidden=true;$('time').setAttribute('aria-expanded','false');
}));
document.addEventListener('pointerdown',e=>{
  if(!e.target.closest('#sceneMenu')&&!e.target.closest('#time')){
    $('sceneMenu').hidden=true;$('time').setAttribute('aria-expanded','false');
  }
});
setScene('falls');
$('home').addEventListener('click',()=>{
  resetFlight();
  view('overview');
});
function resetFlight(){
  flightState='idle';flightElapsed=0;flight.position.set(0,.12,0);flight.rotation.z=0;flight.visible=true;
  updateLiftLabel();
}
function dolly(factor){
  tween=null;
  const offset=camera.position.clone().sub(controls.target).multiplyScalar(factor);
  const d=offset.length();offset.setLength(THREE.MathUtils.clamp(d,controls.minDistance,controls.maxDistance));
  camera.position.copy(controls.target).add(offset);controls.update();
}
$('zoomIn').addEventListener('click',()=>dolly(.78));
$('zoomOut').addEventListener('click',()=>dolly(1.28));
$('photo').addEventListener('click',async()=>{
  const photoButton=$('photo');photoButton.disabled=true;
  const poster=document.createElement('canvas');poster.width=900;poster.height=1200;
  const ctx=poster.getContext('2d');
  const paths={cloud:'cloud-dawn.png',night:'milky-way.png',falls:'paradise-cliffs.png',meeting:'meeting-hill-v2.png'};
  try{
    const backdrop=new Image();backdrop.src='./assets/'+paths[sceneMode];await backdrop.decode();
    const cover=Math.max(poster.width/backdrop.width,poster.height/backdrop.height);
    const w=backdrop.width*cover,h=backdrop.height*cover;
    ctx.drawImage(backdrop,(poster.width-w)/2,(poster.height-h)/2,w,h);
    const oldRatio=renderer.getPixelRatio(),oldAspect=camera.aspect;
    try{
      renderer.setPixelRatio(1);renderer.setSize(poster.width,poster.height,false);
      camera.aspect=poster.width/poster.height;camera.updateProjectionMatrix();
      renderer.render(scene,camera);
      ctx.drawImage(renderer.domElement,0,0,poster.width,poster.height);
    }finally{
      renderer.setPixelRatio(oldRatio);renderer.setSize(mount.clientWidth,mount.clientHeight,false);
      camera.aspect=oldAspect;camera.updateProjectionMatrix();renderer.render(scene,camera);
    }
    const shade=ctx.createLinearGradient(0,0,0,poster.height);
    shade.addColorStop(0,'rgba(9,23,42,.34)');shade.addColorStop(.28,'rgba(9,23,42,0)');shade.addColorStop(.75,'rgba(9,23,42,0)');shade.addColorStop(1,'rgba(9,23,42,.46)');
    ctx.fillStyle=shade;ctx.fillRect(0,0,poster.width,poster.height);
    ctx.fillStyle='#fff6e9';ctx.shadowColor='#142238';ctx.shadowBlur=16;
    ctx.font='62px Georgia,"Songti SC",serif';ctx.fillText(tr().posterTitle,56,105);
    ctx.font='27px "PingFang SC",sans-serif';ctx.fillText(tr().sceneLong[sceneMode],59,poster.height-68);
    const link=document.createElement('a');link.download=tr().posterFile+'-'+sceneMode+'.png';link.href=poster.toDataURL('image/png');link.click();
  }catch(error){console.error('Could not save image',error);photoButton.title=tr().saveFailed;}
  finally{photoButton.disabled=false;}
});
controls.addEventListener('start',()=>{tween=null;});
let down=null;
const balloonBursts=[];
let carlPose=0,russellPose=0,carlPoseUntil=0,russellPoseUntil=0;
function popBalloon(hit){
  const index=hit.instanceId;if(index==null)return;
  const original=new THREE.Matrix4();balloons.getMatrixAt(index,original);
  if(original.determinant()===0)return;
  const color=new THREE.Color();balloons.getColorAt(index,color);
  balloons.setMatrixAt(index,new THREE.Matrix4().makeScale(0,0,0));balloons.instanceMatrix.needsUpdate=true;
  const count=22,positions=new Float32Array(count*3),velocities=[];
  for(let i=0;i<count;i++){
    const a=random()*Math.PI*2,b=(random()-.5)*1.7,speed=1.3+random()*2.2;
    velocities.push(new THREE.Vector3(Math.cos(a)*Math.cos(b),Math.sin(b),Math.sin(a)*Math.cos(b)).multiplyScalar(speed));
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const material=new THREE.PointsMaterial({color:color.clone().lerp(new THREE.Color('#fff5df'),.36),size:.52,map:hazeTexture,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending});
  const burst=new THREE.Points(geometry,material);burst.position.copy(hit.point);scene.add(burst);
  balloonBursts.push({burst,velocities,start:performance.now()});
}
function focusWindow(windowGroup){
  view('window');
  windowGroup.updateWorldMatrix(true,false);
  const center=new THREE.Vector3(),normal=new THREE.Vector3(0,0,1);
  windowGroup.getWorldPosition(center);normal.applyQuaternion(windowGroup.getWorldQuaternion(new THREE.Quaternion()));
  const distance=mount.clientWidth<600?2.6:1.95;
  tween={fromP:camera.position.clone(),fromT:controls.target.clone(),toP:center.clone().addScaledVector(normal,distance).add(new THREE.Vector3(0,.18,0)),toT:center.clone().addScaledVector(normal,-.06),start:performance.now(),duration:950};
}
renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});
renderer.domElement.addEventListener('pointerup',e=>{
  if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5){down=null;return;}down=null;
  const rect=renderer.domElement.getBoundingClientRect();
  const mouse=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
  const caster=new THREE.Raycaster();caster.setFromCamera(mouse,camera);
  const hits=caster.intersectObjects([balloons,mailbox,vane,carl,russell,firstChair,secondChair,...windowNiches,house],true);
  if(hits.length){
    if(hits[0].object===balloons){popBalloon(hits[0]);return;}
    let node=hits[0].object;
    while(node && ![mailbox,vane,carl,russell,firstChair,secondChair,...windowNiches,house].includes(node))node=node.parent;
    if(windowNiches.includes(node)){focusWindow(node);return;}
    if(node===carl){carlPose=(carlPose+1)%3;carlPoseUntil=performance.now()+5200;}
    if(node===russell){russellPose=(russellPose+1)%3;russellPoseUntil=performance.now()+5200;}
    view(node===mailbox?'mailbox':node===vane?'roof':node===carl||node===russell?'people':node===firstChair||node===secondChair?'chairs':'house');
  }
});
window.addEventListener('resize',()=>{
  camera.aspect=mount.clientWidth/mount.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(mount.clientWidth,mount.clientHeight);
  const isSmall=mount.clientWidth<600;
  if(isSmall!==currentIsSmall){
    currentIsSmall=isSmall;tween=null;
    const v=(isSmall?mobileViews:views)[currentView];
    camera.position.set(...v.p);controls.target.set(...v.t);
    controls.maxDistance=isSmall?125:90;controls.update();
  }
});
let last=performance.now();
function animate(now){
  requestAnimationFrame(animate);
  const dt=Math.min((now-last)/1000,.05);last=now;
  if(tween){
    const t=Math.min(1,(now-tween.start)/tween.duration),e=1-Math.pow(1-t,3);
    camera.position.copy(tween.fromP).lerp(tween.toP,e);
    controls.target.copy(tween.fromT).lerp(tween.toT,e);
    if(t>=1)tween=null;
  }
  if(flightState==='flying'){
    const seconds=Math.max(0,(now-flightStart)/1000);
    flightElapsed=Math.min(seconds,17);flightPath(flightElapsed);
    if(seconds>17){flightState='gone';flight.visible=false;updateLiftLabel();}
  }else if(flightState==='returning'){
    const progress=Math.min(1,(now-returnStart)/returnDuration);
    flightPath(flightElapsed*(1-progress));
    if(progress>=1)resetFlight();
  }
  for(let i=balloonBursts.length-1;i>=0;i--){
    const item=balloonBursts[i],age=(now-item.start)/1000;
    if(age>1.05){scene.remove(item.burst);item.burst.geometry.dispose();item.burst.material.dispose();balloonBursts.splice(i,1);continue;}
    const pos=item.burst.geometry.attributes.position;
    for(let j=0;j<item.velocities.length;j++){
      const v=item.velocities[j];pos.setXYZ(j,v.x*age,v.y*age-.8*age*age,v.z*age);
    }
    pos.needsUpdate=true;item.burst.material.opacity=.9*(1-age/1.05);
  }
  balloonRig.rotation.z=Math.sin(now*.00062)*.016;
  balloonRig.rotation.x=Math.sin(now*.00046)*.011;
  atmosphereSprites.forEach((sprite,i)=>{sprite.position.x+=Math.sin(now*.0001+i)*dt*.028;});
  const moteAttr=moteGeometry.attributes.position;
  for(let i=0;i<moteCount;i++){
    const k=i*3;
    motePositions[k]+=Math.sin(now*.00022+i*1.7)*dt*.13;
    motePositions[k+1]+=moteSpeeds[i]*dt;
    if(motePositions[k+1]>46)motePositions[k+1]=-3;
  }
  moteAttr.needsUpdate=true;
  app.style.setProperty('--sky-x',THREE.MathUtils.clamp((camera.position.x-controls.target.x)*-.26,-22,22).toFixed(1)+'px');
  app.style.setProperty('--sky-y',THREE.MathUtils.clamp((camera.position.y-controls.target.y)*-.18,-14,14).toFixed(1)+'px');
  vane.rotation.y+=dt*.38;
  const t=now*.001;
  chimneySmoke.forEach((puff,i)=>{
    const phase=((t*.15+i/12)%1),drift=phase*1.7;
    puff.position.set(-1.52+Math.sin(t*.55+i)*.1+phase*.22,5.2+drift,-.65+Math.cos(t*.35+i)*.08);
    const size=.25+phase*.66;puff.scale.set(size,size*.72,1);
    puff.material.opacity=.16*Math.sin(Math.PI*phase)*(sceneMode==='night'?.8:1);
  });
  const wave=now<greetingUntil?1:.55;
  const carlAction=now<carlPoseUntil?carlPose:0,russellAction=now<russellPoseUntil?russellPose:0;
  carlRight.rotation.z=carlAction===1?2.45+Math.sin(t*5)*.12:carlAction===2?1.8+.48*Math.sin(t*9):1.85+wave*(.42+.17*Math.sin(t*6.5));
  carlRight.rotation.x=carlAction===1?-.85:carlAction===2?-.35+Math.sin(t*8)*.24:-.23+Math.sin(t*6.5)*.12;
  carlLeft.rotation.z=carlAction===2?-.45:0;
  carlBody.rotation.z=carlAction===2?.08+Math.sin(t*2)*.03:Math.sin(t*1.2)*.018;
  russellRight.rotation.z=russellAction===1?2.7+Math.sin(t*9)*.2:russellAction===2?1.1+Math.sin(t*4)*.12:1.8+wave*(.5+.25*Math.sin(t*8));
  russellLeft.rotation.z=russellAction===1?-2.3:russellAction===2?-.75:0;
  russellLeft.rotation.x=Math.sin(t*3)*.3;
  russellBody.position.y=russellAction===1?Math.max(0,Math.sin(t*7))*.16:Math.max(0,Math.sin(t*3.3))*.035;
  russellBody.rotation.z=russellAction===2?-.11:Math.sin(t*1.9)*.045;
  russellLegs[0].rotation.x=Math.sin(t*3.3)*.18;
  russellLegs[1].rotation.x=-Math.sin(t*3.3)*.18;
  carlPortraitSprite.material.color.set(sceneMode==='night'?'#ced8e3':'#ffffff');
  russellPortraitSprite.material.color.set(sceneMode==='night'?'#d6dce5':'#ffffff');
  carlPortraitSprite.material.rotation=carlAction===1?-.06+Math.sin(t*5)*.045:carlAction===2?.09+Math.sin(t*2)*.025:Math.sin(t*1.2)*.012;
  carlPortraitSprite.position.y=.75+(carlAction===2?.025*Math.sin(t*4):0);
  russellPortraitSprite.material.rotation=russellAction===1?-.11+Math.sin(t*8)*.065:russellAction===2?.11+Math.sin(t*3)*.025:Math.sin(t*1.8)*.018;
  russellPortraitSprite.position.y=.72+(russellAction===1?Math.max(0,Math.sin(t*7))*.12:russellAction===2?.025*Math.sin(t*5):Math.max(0,Math.sin(t*3.3))*.025);
  const run=t*.82;
  const here=dogPoint(run),ahead=dogPoint(run+.012);
  dug.position.copy(here);
  dug.rotation.y=Math.atan2(ahead.x-here.x,ahead.z-here.z);
  dugBody.position.y=Math.abs(Math.sin(t*9))*.055;
  dogLegs.forEach((leg,i)=>{leg.rotation.x=Math.sin(t*13+(i%3)*Math.PI)*.55;});
  tail.rotation.z=Math.sin(t*12)*.48;
  const desiredSun=sceneMode==='night'?2.35:sceneMode==='meeting'?3.65:sceneMode==='falls'?3.1:3.25;
  const desiredHemi=sceneMode==='night'?1.45:sceneMode==='meeting'?2.05:1.82;
  sun.intensity=THREE.MathUtils.damp(sun.intensity,desiredSun,1.8,dt);
  hemi.intensity=THREE.MathUtils.damp(hemi.intensity,desiredHemi,1.8,dt);
  porchLight.intensity=THREE.MathUtils.damp(porchLight.intensity,day?2:15,2,dt);
  const targetGlass=day?glassDay:glassEvening;
  for(const w of windows){w.color.lerp(targetGlass,Math.min(1,dt*2));w.emissiveIntensity=THREE.MathUtils.damp(w.emissiveIntensity,day?.08:1.3,2,dt);}
  for(const w of clearWindows){w.opacity=THREE.MathUtils.damp(w.opacity,day?.16:.11,2,dt);w.color.lerp(day?new THREE.Color('#adc7c5'):new THREE.Color('#f2c985'),Math.min(1,dt*2));}
  interiorLamp.intensity=THREE.MathUtils.damp(interiorLamp.intensity,day?3.8:6,2,dt);
  controls.update();
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);
setTimeout(()=>loading.classList.add('hide'),300);
setTimeout(()=>loading.remove(),1000);
