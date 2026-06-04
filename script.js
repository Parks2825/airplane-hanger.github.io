const airplane = document.getElementById('airplane');
const hangar = document.getElementById('hangar-frame');
const planeLabel = document.getElementById('plane-label');

const rotDisplay = document.getElementById('telemetry-rot');
const xDisplay = document.getElementById('telemetry-x');
const yDisplay = document.getElementById('telemetry-y');

let isDragging = false;
let currentAngle = 0;
let posX = 500;
let posY = 280;

// Parking spots: [centerX, centerY]
const parkingSpots = [
    {x: 280, y: 260},   // Spot 1
    {x: 500, y: 260},   // Spot 2
    {x: 720, y: 260},   // Spot 3
    {x: 500, y: 440}    // Spot 4
];

const snapThreshold = 85;

function updateTelemetry() {
    rotDisplay.textContent = Math.round(currentAngle) + '°';
    xDisplay.textContent = Math.round(posX) + 'px';
    yDisplay.textContent = Math.round(posY) + 'px';
}

function updatePlane() {
    airplane.style.left = (posX - 80) + 'px';   // offset for plane center
    airplane.style.top = (posY - 65) + 'px';
    airplane.style.setProperty('--plane-angle', currentAngle + 'deg');
    updateTelemetry();
}

updatePlane();

// Drag
airplane.addEventListener('mousedown', () => {
    isDragging = true;
    airplane.style.transition = 'none';
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const rect = hangar.getBoundingClientRect();
    posX = e.clientX - rect.left;
    posY = e.clientY - rect.top;

    // Keep in bounds
    posX = Math.max(80, Math.min(posX, rect.width - 80));
    posY = Math.max(60, Math.min(posY, rect.height - 100));

    updatePlane();
});

document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;

    // Snap to nearest parking spot
    let closest = null;
    let minDist = Infinity;

    for (let spot of parkingSpots) {
        const dx = posX - spot.x;
        const dy = posY - spot.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < minDist) {
            minDist = dist;
            closest = spot;
        }
    }

    if (closest && minDist < snapThreshold) {
        posX = closest.x;
        posY = closest.y;
        airplane.style.transition = 'all 0.35s ease-out';
    } else {
        airplane.style.transition = 'transform 0.1s';
    }

    updatePlane();
});

// Rotation (unchanged)
function rotate(degrees) {
    currentAngle = (currentAngle + degrees + 360) % 360;
    updatePlane();
}

document.getElementById('rotate-left').addEventListener('click', () => rotate(-15));
document.getElementById('rotate-right').addEventListener('click', () => rotate(15));

document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'a' || e.key === 'ArrowLeft') rotate(-15);
    if (e.key.toLowerCase() === 'd' || e.key === 'ArrowRight') rotate(15);
});