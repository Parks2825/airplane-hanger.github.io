const hangar = document.getElementById('hangar-frame');

// ======================
// SCALE + AIRCRAFT
// ======================
const SCALE = 3.5;

const AIRCRAFT_SPECS = {
    DA40: { width: 36, length: 26 }
};

function getPlaneDimensions(p) {
    const s = AIRCRAFT_SPECS[p.type];
    return { width: s.width * SCALE, height: s.length * SCALE };
}

// ======================
// ZONES
// ======================
const rampZone = { yStart: 750 };

const taxiwayZone = {
    xStart: 1040,
    xEnd: 1215
};

function isInRamp(p) {
    return p.y > rampZone.yStart;
}

function isInTaxiway(p) {
    return p.x > taxiwayZone.xStart && p.x < taxiwayZone.xEnd;
}

// ======================
// PARKING SPOTS
// ======================
const parkingSpots = [
    // FL9
    {x:200,y:200},{x:340,y:200},{x:480,y:200},{x:620,y:200},{x:760,y:200},
    {x:260,y:380},{x:420,y:380},{x:580,y:380},{x:740,y:380},
    {x:350,y:560},{x:650,y:560},

    // FL8
    {x:1300,y:300},{x:1500,y:300},{x:1700,y:300},
    {x:1400,y:450},{x:1600,y:450}
].map(s => ({...s, occupiedBy:null}));

// ======================
// PLANES
// ======================
const planes = [
    {
        el: airplane1,
        visual: airplane1.querySelector('.plane-visual'),
        x:300,y:800,angle:0,id:'DA40-1',type:'DA40'
    },
    {
        el: airplane2,
        visual: airplane2.querySelector('.plane-visual'),
        x:600,y:820,angle:180,id:'DA40-2',type:'DA40'
    }
];

let selectedPlane = planes[0];

// ======================
// UPDATE
// ======================
function updatePlane(p){
    const d = getPlaneDimensions(p);

    p.el.style.width = d.width+'px';
    p.el.style.height = d.height+'px';
    p.el.style.left = (p.x-d.width/2)+'px';
    p.el.style.top = (p.y-d.height/2)+'px';

    p.visual.style.setProperty('--plane-angle', p.angle+'deg');
}

// ======================
// COLLISION
// ======================
const CLEARANCE = 25;

function isOverlapping(p1,p2){
    const d1 = getPlaneDimensions(p1);
    const d2 = getPlaneDimensions(p2);

    let factor = 1;
    if (isInTaxiway(p1)||isInTaxiway(p2)) factor=0.7;

    return Math.abs(p1.x-p2.x) < (d1.width/2+d2.width/2+CLEARANCE*factor) &&
           Math.abs(p1.y-p2.y) < (d1.height/2+d2.height/2+CLEARANCE*factor);
}

// ======================
// INIT
// ======================
planes.forEach(p=>{
    updatePlane(p);

    p.el.addEventListener('mousedown',()=>{
        selectedPlane=p;
        planes.forEach(x=>x.el.classList.remove('active'));
        p.el.classList.add('active');
    });
});

// ======================
// DRAG
// ======================
let dragging=false,dragPlane,offX,offY;

document.addEventListener('mousedown',e=>{
    const el=e.target.closest('.airplane-container');
    if(!el)return;

    dragPlane=planes.find(p=>p.el===el);
    dragging=true;

    const r=el.getBoundingClientRect();
    offX=e.clientX-r.left;
    offY=e.clientY-r.top;

    el.classList.add('dragging');
});

document.addEventListener('mousemove',e=>{
    if(!dragging)return;

    const rect=hangar.getBoundingClientRect();
    const d=getPlaneDimensions(dragPlane);

    let nx=e.clientX-rect.left-offX+d.width/2;
    let ny=e.clientY-rect.top-offY+d.height/2;

    nx=Math.max(d.width/2,Math.min(nx,rect.width-d.width/2));
    ny=Math.max(d.height/2,Math.min(ny,rect.height-d.height/2));

    const test={...dragPlane,x:nx,y:ny};

    const collision=planes.some(p=>p!==dragPlane &&
        !isInRamp(test)&& isOverlapping(test,p));

    if(collision){
        dragPlane.el.classList.add('collision');
    }else{
        dragPlane.el.classList.remove('collision');
        dragPlane.x=nx; dragPlane.y=ny;
        updatePlane(dragPlane);
    }

    dragPlane.el.classList.toggle('taxiway',isInTaxiway(dragPlane));
});

document.addEventListener('mouseup',()=>{
    if(!dragging)return;
    dragging=false;

    dragPlane.el.classList.remove('dragging');

    let closest=null,min=Infinity;

    for(let s of parkingSpots){
        if(s.occupiedBy && s.occupiedBy!==dragPlane.id)continue;

        const d=Math.hypot(dragPlane.x-s.x,dragPlane.y-s.y);
        if(d<min){min=d;closest=s;}
    }

    if(closest && min<90 && !isInRamp(dragPlane) && !isInTaxiway(dragPlane)){

        if(closest.occupiedBy)return;

        parkingSpots.forEach(s=>{
            if(s.occupiedBy===dragPlane.id)s.occupiedBy=null;
        });

        closest.occupiedBy=dragPlane.id;

        dragPlane.x=closest.x;
        dragPlane.y=closest.y;

        // orientation logic
        if(closest.x < 1000){
            dragPlane.angle=180;
        } else {
            dragPlane.angle=270;
        }
    }

    updatePlane(dragPlane);
});

// ======================
// ROTATION
// ======================
document.addEventListener('keydown',e=>{
    if(e.key==='a') selectedPlane.angle-=15;
    if(e.key==='d') selectedPlane.angle+=15;
    updatePlane(selectedPlane);
});