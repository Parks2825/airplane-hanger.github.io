const hangar = document.getElementById('hangar-frame');
const planes = [
    {
        el: document.getElementById('airplane1'),
        visual: document.querySelector('#airplane1 .plane-visual'),
        x: 300,
        y: 280,
        angle: 0,
        id: 'DA40-1'
    },
    {
        el: document.getElementById('airplane2'),
        visual: document.querySelector('#airplane2 .plane-visual'),
        x: 650,
        y: 320,
        angle: 45,
        id: 'DA40-2'
    }
];

let selectedPlane = planes[0];
const rotDisplay = document.getElementById('telemetry-rot');
const xDisplay = document.getElementById('telemetry-x');
const yDisplay = document.getElementById('telemetry-y');
const selectedDisplay = document.getElementById('selected-plane');

const parkingSpots = [
    {x: 240, y: 250},
    {x: 440, y: 250},
    {x: 680, y: 250},
    {x: 500, y: 440}
];

const snapThreshold = 85;

function updateTelemetry() {
    selectedDisplay.textContent = selectedPlane.id;
    rotDisplay.textContent = Math.round(selectedPlane.angle) + '°';
    xDisplay.textContent = Math.round(selectedPlane.x) + 'px';
    yDisplay.textContent = Math.round(selectedPlane.y) + 'px';
}

function updatePlane(plane) {
    plane.el.style.left = (plane.x - 80) + 'px';
    plane.el.style.top = (plane.y - 65) + 'px';
    plane.visual.style.setProperty('--plane-angle', plane.angle + 'deg');
}

// Initialize
planes.forEach(plane => {
    updatePlane(plane);

    plane.el.addEventListener('mousedown', (e) => {
        if (e.detail === 1) {
            selectedPlane = plane;
            planes.forEach(p => p.el.classList.remove('active'));
            plane.el.classList.add('active');
            updateTelemetry();
        }
    });
});

updateTelemetry();

// Drag & Snap logic (same as before)
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

    currentDragPlane.x = Math.max(80, Math.min(currentDragPlane.x, rect.width - 80));
    currentDragPlane.y = Math.max(60, Math.min(currentDragPlane.y, rect.height - 100));

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
        currentDragPlane.el.style.transition = 'all 0.35s ease-out';
    } else {
        currentDragPlane.el.style.transition = 'transform 0.15s ease-out';
    }

    updatePlane(currentDragPlane);
    if (currentDragPlane === selectedPlane) updateTelemetry();
});

// Rotation
function rotate(degrees) {
    selectedPlane.angle = (selectedPlane.angle + degrees + 360) % 360;
    updatePlane(selectedPlane);
    updateTelemetry();
}

document.getElementById('rotate-left').addEventListener('click', () => rotate(-15));
document.getElementById('rotate-right').addEventListener('click', () => rotate(15));

document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'a' || e.key === 'ArrowLeft') rotate(-15);
    if (e.key.toLowerCase() === 'd' || e.key === 'ArrowRight') rotate(15);
});