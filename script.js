const hangar = document.getElementById('hangar-frame');

// =====================
// CONSTANTS
// =====================
const PLANE_WIDTH = 160;
const PLANE_HEIGHT = 130;

const CLEARANCE_X = 40;
const CLEARANCE_Y = 40;

const snapThreshold = 90;

const rampZone = {
    yStart: 750
};

// =====================
// HANGAR DEFINITIONS
// =====================
const hangars = {
    FL9: {
        name: "FL9",
        spots: [
            {x: 207, y: 225}, {x: 342, y: 225}, {x: 477, y: 225},
            {x: 612, y: 225}, {x: 747, y: 225},
            {x: 252, y: 400}, {x: 392, y: 400}, {x: 532, y: 400}, {x: 672, y: 400},
            {x: 317, y: 575}, {x: 677, y: 575}
        ]
    },
    FL10: {
        name: "FL10",
        spots: [
            {x: 250, y: 250},
            {x: 450, y: 250},
            {x: 650, y: 250}
        ]
    }
};

let currentHangar = hangars.FL9;

// add occupancy tracking
function cloneSpots(spots) {
    return spots.map(s => ({...s, occupiedBy: null}));
}

let parkingSpots = cloneSpots(currentHangar.spots);

// =====================
// PLANES
// =====================
const planes = [
    {
        el: document.getElementById('airplane1'),
        visual: document.querySelector('#airplane1 .plane-visual'),
        x: 300,
        y: 280,
        angle: 0,
        id: 'DA40-1',
        assignedSpot: null
    },
    {
        el: document.getElementById('airplane2'),
        visual: document.querySelector('#airplane2 .plane-visual'),
        x: 750,
        y: 420,
        angle: 180,
        id: 'DA40-2',
        assignedSpot: null
    }
];

let selectedPlane = planes[0];

// =====================
// TELEMETRY
// =====================
const rotDisplay = document.getElementById('telemetry-rot');
const xDisplay = document.getElementById('telemetry-x');
const yDisplay = document.getElementById('telemetry-y');
const selectedDisplay = document.getElementById('selected-plane');

function updateTelemetry() {
    selectedDisplay.textContent = selectedPlane.id;
    rotDisplay.textContent = Math.round(selectedPlane.angle) + '°';
    xDisplay.textContent = Math.round(selectedPlane.x) + 'px';
    yDisplay.textContent = Math.round(selectedPlane.y) + 'px';
}

// =====================
// CORE FUNCTIONS
// =====================
function updatePlane(plane) {
    plane.el.style.left = (plane.x - PLANE_WIDTH / 2) + 'px';
    plane.el.style.top = (plane.y - PLANE_HEIGHT / 2) + 'px';
    plane.visual.style.setProperty('--plane-angle', plane.angle + 'deg');
}

function isInRamp(plane) {
    return plane.y > rampZone.yStart;
}

function isOverlapping(p1, p2) {
    const dx = Math.abs(p1.x - p2.x);
    const dy = Math.abs(p1.y - p2.y);

    return dx < (PLANE_WIDTH + CLEARANCE_X) &&
           dy < (PLANE_HEIGHT + CLEARANCE_Y);
}

// =====================
// INITIALIZE
// =====================
planes.forEach(plane => {
    updatePlane(plane);

    plane.el.addEventListener('mousedown', (e) => {
        selectedPlane = plane;
        planes.forEach(p => p.el.classList.remove('active'));
        plane.el.classList.add('active');
        updateTelemetry();
    });
});

updateTelemetry();

// =====================
// DRAG SYSTEM
// =====================
let isDragging = false;
let currentDragPlane = null;

let offsetX = 0;
let offsetY = 0;

document.addEventListener('mousedown', (e) => {
    const planeEl = e.target.closest('.airplane-container');
    if (!planeEl) return;

    currentDragPlane = planes.find(p => p.el === planeEl);
    isDragging = true;

    const rect = planeEl.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    currentDragPlane.el.classList.add('dragging');
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging || !currentDragPlane) return;

    const rect = hangar.getBoundingClientRect();

    let newX = e.clientX - rect.left - offsetX + PLANE_WIDTH / 2;
    let newY = e.clientY - rect.top - offsetY + PLANE_HEIGHT / 2;

    // bounds
    newX = Math.max(80, Math.min(newX, rect.width - 80));
    newY = Math.max(60, Math.min(newY, rect.height - 80));

    const testPlane = { ...currentDragPlane, x: newX, y: newY };

    const collision = planes.some(p =>
        p !== currentDragPlane &&
        !isInRamp(testPlane) &&
        isOverlapping(testPlane, p)
    );

    if (collision) {
        currentDragPlane.el.classList.add('collision');
    } else {
        currentDragPlane.el.classList.remove('collision');
        currentDragPlane.x = newX;
        currentDragPlane.y = newY;
        updatePlane(currentDragPlane);
    }

    if (currentDragPlane === selectedPlane) updateTelemetry();
});

document.addEventListener('mouseup', () => {
    if (!isDragging || !currentDragPlane) return;

    isDragging = false;
    currentDragPlane.el.classList.remove('dragging');

    let closest = null;
    let minDist = Infinity;

    for (let spot of parkingSpots) {
        if (spot.occupiedBy && spot.occupiedBy !== currentDragPlane.id) continue;

        const dx = currentDragPlane.x - spot.x;
        const dy = currentDragPlane.y - spot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDist) {
            minDist = dist;
            closest = spot;
        }
    }

    if (closest && minDist < snapThreshold && !isInRamp(currentDragPlane)) {

        parkingSpots.forEach(s => {
            if (s.occupiedBy === currentDragPlane.id) s.occupiedBy = null;
        });

        closest.occupiedBy = currentDragPlane.id;

        currentDragPlane.x = closest.x;
        currentDragPlane.y = closest.y;
        currentDragPlane.angle = 180;

        currentDragPlane.el.style.transition = 'all 0.35s ease-out';
    }

    updatePlane(currentDragPlane);
    if (currentDragPlane === selectedPlane) updateTelemetry();
});

// =====================
// ROTATION
// =====================
function rotate(deg) {
    selectedPlane.angle = (selectedPlane.angle + deg + 360) % 360;
    updatePlane(selectedPlane);
    updateTelemetry();
}

document.getElementById('rotate-left').addEventListener('click', () => rotate(-15));
document.getElementById('rotate-right').addEventListener('click', () => rotate(15));

document.addEventListener('keydown', (e) => {
    if (e.key === 'a' || e.key === 'ArrowLeft') rotate(-15);
    if (e.key === 'd' || e.key === 'ArrowRight') rotate(15);
});

// =====================
// DROPDOWN ASSIGNMENT
// =====================
const spotDropdown = document.getElementById('spot-assign');

spotDropdown.addEventListener('change', () => {
    if (!spotDropdown.value) return;

    const spotIndex = parseInt(spotDropdown.value);
    const targetSpot = parkingSpots[spotIndex];

    if (!targetSpot || targetSpot.occupiedBy) return;

    parkingSpots.forEach(s => {
        if (s.occupiedBy === selectedPlane.id) s.occupiedBy = null;
    });

    targetSpot.occupiedBy = selectedPlane.id;

    selectedPlane.x = targetSpot.x;
    selectedPlane.y = targetSpot.y;
    selectedPlane.angle = 180;

    updatePlane(selectedPlane);
    updateTelemetry();

    setTimeout(() => spotDropdown.value = '', 600);
});

// =====================
// HANGAR SWITCHING
// =====================
document.getElementById('hangar-select').addEventListener('change', (e) => {
    const selected = e.target.value;

    currentHangar = hangars[selected];
    parkingSpots = cloneSpots(currentHangar.spots);

    // move planes to ramp on switch
    planes.forEach((plane, i) => {
        plane.x = 200 + i * 180;
        plane.y = 820;
        plane.assignedSpot = null;
        updatePlane(plane);
    });
});