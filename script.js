const hangar = document.getElementById('hangar-frame');

// =====================
// SCALE + AIRCRAFT DATA
// =====================
const SCALE = 3.5;

const AIRCRAFT_SPECS = {
    DA40: { width: 36, length: 26 }
};

function getPlaneDimensions(plane) {
    const spec = AIRCRAFT_SPECS[plane.type];
    return {
        width: spec.width * SCALE,
        height: spec.length * SCALE
    };
}

// =====================
// CONSTANTS
// =====================
const CLEARANCE_X = 25;
const CLEARANCE_Y = 25;
const snapThreshold = 90;

const rampZone = { yStart: 750 };

// =====================
// HANGARS
// =====================
const hangars = {
    FL9: {
        name: "FL9",
        spots: [
            {x: 200, y: 200}, {x: 340, y: 200}, {x: 480, y: 200},
            {x: 620, y: 200}, {x: 760, y: 200},

            {x: 260, y: 380}, {x: 420, y: 380},
            {x: 580, y: 380}, {x: 740, y: 380},

            {x: 350, y: 560}, {x: 650, y: 560}
        ]
    },
    FL10: {
        name: "FL10",
        spots: [
            {x: 250, y: 220},
            {x: 450, y: 220},
            {x: 650, y: 220}
        ]
    }
};

let currentHangar = hangars.FL9;

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
        y: 800,
        angle: 0,
        id: 'DA40-1',
        type: 'DA40',
        assignedSpot: null
    },
    {
        el: document.getElementById('airplane2'),
        visual: document.querySelector('#airplane2 .plane-visual'),
        x: 550,
        y: 820,
        angle: 180,
        id: 'DA40-2',
        type: 'DA40',
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
// CORE
// =====================
function updatePlane(plane) {
    const { width, height } = getPlaneDimensions(plane);

    plane.el.style.width = width + 'px';
    plane.el.style.height = height + 'px';

    plane.el.style.left = (plane.x - width / 2) + 'px';
    plane.el.style.top = (plane.y - height / 2) + 'px';

    plane.visual.style.setProperty('--plane-angle', plane.angle + 'deg');
}

function isInRamp(plane) {
    return plane.y > rampZone.yStart;
}

function isOverlapping(p1, p2) {
    const d1 = getPlaneDimensions(p1);
    const d2 = getPlaneDimensions(p2);

    const dx = Math.abs(p1.x - p2.x);
    const dy = Math.abs(p1.y - p2.y);

    return dx < (d1.width/2 + d2.width/2 + CLEARANCE_X) &&
           dy < (d1.height/2 + d2.height/2 + CLEARANCE_Y);
}

// =====================
// INIT
// =====================
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
    const dims = getPlaneDimensions(currentDragPlane);

    let newX = e.clientX - rect.left - offsetX + dims.width / 2;
    let newY = e.clientY - rect.top - offsetY + dims.height / 2;

    newX = Math.max(dims.width / 2, Math.min(newX, rect.width - dims.width / 2));
    newY = Math.max(dims.height / 2, Math.min(newY, rect.height - dims.height / 2));

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

        if (closest.occupiedBy && closest.occupiedBy !== currentDragPlane.id) {
            updatePlane(currentDragPlane);
            return;
        }

        parkingSpots.forEach(s => {
            if (s.occupiedBy === currentDragPlane.id) s.occupiedBy = null;
        });

        closest.occupiedBy = currentDragPlane.id;
        currentDragPlane.assignedSpot = closest;

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

// =====================
// DROPDOWN
// =====================
const spotDropdown = document.getElementById('spot-assign');

spotDropdown.addEventListener('change', () => {
    if (!spotDropdown.value) return;

    const spotIndex = parseInt(spotDropdown.value);
    const targetSpot = parkingSpots[spotIndex];

    if (!targetSpot || targetSpot.occupiedBy) {
        alert("Spot already occupied");
        return;
    }

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
// HANGAR SWITCH
