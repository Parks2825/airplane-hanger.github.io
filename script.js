const hangar = document.getElementById('hangar-frame');

const planes = [
    { 
        el: document.getElementById('airplane1'), 
        visual: document.querySelector('#airplane1 .plane-visual'), 
        x: 160,   // Ramp Spot 1
        y: 765, 
        angle: 180, 
        id: 'DA40-1' 
    },
    { 
        el: document.getElementById('airplane2'), 
        visual: document.querySelector('#airplane2 .plane-visual'), 
        x: 235,   // Ramp Spot 2
        y: 765, 
        angle: 180, 
        id: 'DA40-2' 
    }
];

let selectedPlane = planes[0];

const rotDisplay = document.getElementById('telemetry-rot');
const xDisplay = document.getElementById('telemetry-x');
const yDisplay = document.getElementById('telemetry-y');
const selectedDisplay = document.getElementById('selected-plane');

const parkingSpots = [
    // A-J inside hangar
    {x: 225, y: 195}, {x: 385, y: 195}, {x: 545, y: 195}, {x: 705, y: 195}, {x: 865, y: 195},
    {x: 285, y: 355}, {x: 565, y: 355}, {x: 845, y: 355},
    {x: 285, y: 515}, {x: 565, y: 515},
    // 15 Ramp Spots
    {x: 160, y: 765}, {x: 235, y: 765}, {x: 310, y: 765}, {x: 385, y: 765},
    {x: 460, y: 765}, {x: 535, y: 765}, {x: 610, y: 765}, {x: 685, y: 765},
    {x: 235, y: 945}, {x: 310, y: 945}, {x: 385, y: 945}, {x: 460, y: 945},
    {x: 535, y: 945}, {x: 610, y: 945}, {x: 685, y: 945}
];

const snapThreshold = 80;

function updateTelemetry() {
    selectedDisplay.textContent = selectedPlane.id;
    rotDisplay.textContent = Math.round(selectedPlane.angle) + '°';
    if (xDisplay) xDisplay.textContent = Math.round(selectedPlane.x) + 'px';
    if (yDisplay) yDisplay.textContent = Math.round(selectedPlane.y) + 'px';
}

function updatePlane(plane) {
    plane.el.style.left = (plane.x - 85) + 'px';
    plane.el.style.top = (plane.y - 70) + 'px';
    plane.visual.style.setProperty('--plane-angle', plane.angle + 'deg');
}

// Initialize planes on ramp
planes.forEach(plane => {
    updatePlane(plane);
    plane.el.addEventListener('mousedown', () => {
        selectedPlane = plane;
        planes.forEach(p => p.el.classList.remove('active'));
        plane.el.classList.add('active');
        updateTelemetry();
    });
});

updateTelemetry();

// Drag System
let isDragging = false;
let currentDragPlane = null;

document.addEventListener('mousedown', (e) => {
    const planeEl = e.target.closest('.airplane-container');
    if (planeEl) {
        currentDragPlane = planes.find(p => p.el === planeEl);
        isDragging = true;
        currentDragPlane.el.style.transition = 'none