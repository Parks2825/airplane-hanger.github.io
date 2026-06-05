const hangar = document.getElementById('hangar-frame');

// ======================
// ZOOM SYSTEM
// ======================
let zoom = 1;

hangar.addEventListener('wheel', (e) => {
    e.preventDefault();

    const rect = hangar.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    zoom = Math.min(2.5, Math.max(0.6, zoom + delta));

    hangar.style.transform = `scale(${zoom})`;
});

// ======================
// SCALE + AIRCRAFT
// ======================
const SCALE = 3.5;
const CLEARANCE = 25;

const AIRCRAFT = {
    DA40: { w: 36, h: 26 }
};

function dims(p){
    const s = AIRCRAFT[p.type];
    return { w: s.w*SCALE, h: s.h*SCALE };
}

// ======================
// ZONES
// ======================
const rampY = 750;
const taxi = { x1:1040, x2:1215 };

const inRamp = p => p.y > rampY;
const inTaxi = p => p.x > taxi.x1 && p.x < taxi.x2;

// ======================
// PARKING SPOTS
// ======================
const spots = [
    {x:207,y:225},{x:342,y:225},{x:477,y:225},
    {x:612,y:225},{x:747,y:225},
    {x:252,y:400},{x:392,y:400},{x:532,y:400},{x:672,y:400},
    {x:317,y:575},{x:677,y:575},

    {x:1320,y:300},{x:1500,y:300},{x:1680,y:300},
    {x:1400,y:450},{x:1600,y:450}
].map(s => ({...s, occupied:null}));

// ======================
// PLANES (START ON RAMP)
// ======================
const planes = [
{
    el: airplane1,
    visual: airplane1.querySelector('.plane-visual'),
    x:350, y:820,
    angle:0,
    id:"P1",
    type:"DA40"
},
{
    el: airplane2,
    visual: airplane2.querySelector('.plane-visual'),
    x:650, y:820,
    angle:180,
    id:"P2",
    type:"DA40"
}
];

let selected = planes[0];

// ======================
// DRAW
// ======================
function draw(p){
    const d = dims(p);

    p.el.style.width = d.w+"px";
    p.el.style.height = d.h+"px";
    p.el.style.left = (p.x-d.w/2)+"px";
    p.el.style.top = (p.y-d.h/2)+"px";

    p.visual.style.setProperty('--angle', p.angle+"deg");
}

// ======================
// COLLISION
// ======================
function overlap(a,b){
    const d1=dims(a), d2=dims(b);
    const factor = (inTaxi(a)||inTaxi(b)) ? 0.7 : 1;

    return Math.abs(a.x-b.x) < (d1.w/2+d2.w/2+CLEARANCE*factor)
        && Math.abs(a.y-b.y) < (d1.h/2+d2.h/2+CLEARANCE*factor);
}

// ======================
// INIT
// ======================
planes.forEach(p=>{
    draw(p);
    p.el.onclick=()=>{
        selected=p;
        planes.forEach(x=>x.el.classList.remove('active'));
        p.el.classList.add('active');
    };
});

// ======================
// DRAG
// ======================
let dragging=false, cur, ox, oy;

document.addEventListener('mousedown',e=>{
    const el=e.target.closest('.airplane-container');
    if(!el)return;

    cur=planes.find(p=>p.el===el);
    dragging=true;

    const r=el.getBoundingClientRect();
    ox=e.clientX-r.left;
    oy=e.clientY-r.top;

    cur.el.classList.add('dragging');
});

document.addEventListener('mousemove',e=>{
    if(!dragging)return;

    const rect=hangar.getBoundingClientRect();
    const d=dims(cur);

    let x=e.clientX/zoom - rect.left/zoom - ox/zoom + d.w/2;
    let y=e.clientY/zoom - rect.top/zoom - oy/zoom + d.h/2;

    x=Math.max(d.w/2,Math.min(x,2000-d.w/2));
    y=Math.max(d.h/2,Math.min(y,1000-d.h/2));

    const test={...cur,x,y};

    const hit=planes.some(p=>p!==cur && !inRamp(test) && overlap(test,p));

    if(hit){
        cur.el.classList.add('collision');
    } else {
        cur.el.classList.remove('collision');
        cur.x=x;
        cur.y=y;
        draw(cur);
    }

    cur.el.classList.toggle('taxiway',inTaxi(cur));
});

document.addEventListener('mouseup',()=>{
    if(!dragging)return;
    dragging=false;

    cur.el.classList.remove('dragging');

    let closest=null, min=9999;

    for(let s of spots){
        if(s.occupied && s.occupied!==cur.id) continue;

        const d=Math.hypot(cur.x-s.x,cur.y-s.y);
        if(d<min){min=d;closest=s;}
    }

    if(closest && min<90 && !inRamp(cur) && !inTaxi(cur)){
        if(closest.occupied) return;

        spots.forEach(s=>{
            if(s.occupied===cur.id) s.occupied=null;
        });

        closest.occupied = cur.id;
        cur.x = closest.x;
        cur.y = closest.y;

        cur.angle = (cur.x < 1000) ? 180 : 270;
    }

    draw(cur);
});

// ======================
// ROTATION
// ======================
document.addEventListener('keydown',e=>{
    if(e.key==='a'||e.key==='ArrowLeft') selected.angle-=15;
    if(e.key==='d'||e.key==='ArrowRight') selected.angle+=15;
    draw(selected);
});