const hangar = document.getElementById('hangar-frame');

const planes = [
    {
        el: document.getElementById('airplane1'),
        visual: document.querySelector('#airplane1 .plane-visual'),
        x: 420,
        y: 320,
        angle: 180,
        id: 'DA40-1'
    },
    {
        el: document.getElementById('airplane2'),
        visual: document.querySelector('#airplane2 .plane-visual'),
        x: 720,
        y: 380,
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
    {x: 207, y: 225}, {x: 342, y: 225}, {x: 477, y: 225},
    {x: 612, y: 225}, {x: 747, y: 225},
    {x: 252, y: 400}, {x: 392, y: 400}, {x: 532, y: 400}, {x: 672, y: 400},
    {x: 317, y: 575}, {x: 677, y: 575}
];

const snapThreshold = 70;   // Reduced collision / snap distance as requested

function updateTelemetry() {
    selectedDisplay.textContent = selectedPlane.id;
    rotDisplay.textContent = Math.round(selectedPlane.angle) + '°';
    xDisplay.textContent = Math.round(selectedPlane.x) + 'px';
    yDisplay.textContent = Math.round(selectedPlane.y) + 'px';
}

function updatePlane(plane) {
    plane.el.style.left = (plane.x - 85) + 'px';
    plane.el.style.top = (plane.y - 70) + 'px';
    plane.visual.style.setProperty('--plane-angle', plane.angle + 'deg');
}

// Initialize planes
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

// Drag System
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

    // Keep planes inside hangar bounds
    currentDragPlane.x = Math.max(80, Math.min(currentDragPlane.x, rect.width - 80));
    currentDragPlane.y = Math.max(80, Math.min(currentDragPlane.y, rect.height - 100));

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
        currentDragPlane.angle = 180;           // Nose toward door
        currentDragPlane.el.style.transition = 'all 0.4s ease-out';
    } else {
        currentDragPlane.el.style.transition = 'transform 0.15s';
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

// Auto-assign spot
const spotDropdown = document.getElementById('spot-assign');

spotDropdown.addEventListener('change', () => {
    if (!spotDropdown.value) return;

    const spotIndex = parseInt(spotDropdown.value);
    const target = parkingSpots[spotIndex];

    if (target) {
        selectedPlane.x = target.x;
        selectedPlane.y = target.y;
        selectedPlane.angle = 180;   // Nose toward door

        updatePlane(selectedPlane);
        updateTelemetry();

        selectedPlane.el.style.transition = 'all 0.65s cubic-bezier(0.34, 1.56, 0.64, 1)';

        setTimeout(() => { spotDropdown.value = ''; }, 700);
    }
});