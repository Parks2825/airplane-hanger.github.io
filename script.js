const hangar = document.getElementById('hangar-frame');

const planes = [
    { el: document.getElementById('airplane1'), visual: document.querySelector('#airplane1 .plane-visual'), x: 160, y: 765, angle: 180, id: 'DA40-1' },
    { el: document.getElementById('airplane2'), visual: document.querySelector('#airplane2 .plane-visual'), x: 235, y: 765, angle: 180, id: 'DA40-2' }
];

let selectedPlane = planes[0];

const rotDisplay = document.getElementById('telemetry-rot');
const xDisplay = document.getElementById('telemetry-x');
const yDisplay = document.getElementById('telemetry-y');
const selectedDisplay = document.getElementById('selected-plane');

const parkingSpots = [
    // A-J
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

// Drag & Drop
let isDragging = false;
let currentDragPlane = null;

document.addEventListener('mousedown', (e) => {
    const planeEl = e.target.closest('.airplane-container');
    if (planeEl) {
        currentDragPlane = planes.find(p => p.el === planeEl);
        isDragging = true;
        currentDragPlane.el.style.transition = 'none';
    }
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging || !currentDragPlane) return;
    const rect = hangar.getBoundingClientRect();
    currentDragPlane.x = e.clientX - rect.left;
    currentDragPlane.y = e.clientY - rect.top;
    currentDragPlane.x = Math.max(100, Math.min(currentDragPlane.x, rect.width - 100));
    currentDragPlane.y = Math.max(100, Math.min(currentDragPlane.y, rect.height - 150));
    updatePlane(currentDragPlane);
    if (currentDragPlane === selectedPlane) updateTelemetry();
});

document.addEventListener('mouseup', () => {
    if (!isDragging || !currentDragPlane) return;
    isDragging = false;

    let closest = null;
    let minDist = Infinity;
    for (let spot of parkingSpots) {
        const dx = currentDragPlane.x - spot.x;
        const dy = currentDragPlane.y - spot.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < minDist) {
            minDist = dist;
            closest = spot;
        }
    }

    if (closest && minDist < snapThreshold) {
        currentDragPlane.x = closest.x;
        currentDragPlane.y = closest.y;
        currentDragPlane.angle = 180;
        currentDragPlane.el.style.transition = 'all 0.45s ease-out';
    } else {
        currentDragPlane.el.style.transition = 'transform 0.15s';
    }

    updatePlane(currentDragPlane);
    if (currentDragPlane === selectedPlane) updateTelemetry();
});

// Keyboard Rotation
function rotate(degrees) {
    selectedPlane.angle = (selectedPlane.angle + degrees + 360) % 360;
    updatePlane(selectedPlane);
    updateTelemetry();
}

document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'a' || e.key === 'ArrowLeft') rotate(-15);
    if (e.key.toLowerCase() === 'd' || e.key === 'ArrowRight') rotate(15);
});

// Dropdown
const spotDropdown = document.getElementById('spot-assign');
spotDropdown.addEventListener('change', () => {
    if (!spotDropdown.value) return;
    const idx = parseInt(spotDropdown.value);
    const target = parkingSpots[idx];
    if (target) {
        selectedPlane.x = target.x;
        selectedPlane.y = target.y;
        selectedPlane.angle = 180;
        updatePlane(selectedPlane);
        updateTelemetry();
        selectedPlane.el.style.transition = 'all 0.65s ease-out';
        setTimeout(() => spotDropdown.value = '', 700);
    }
});