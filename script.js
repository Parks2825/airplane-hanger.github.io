const airplane = document.getElementById('airplane');
const hangar = document.getElementById('hangar-frame');

const rotDisplay = document.getElementById('telemetry-rot');
const xDisplay = document.getElementById('telemetry-x');
const yDisplay = document.getElementById('telemetry-y');

let isDragging = false;
let currentAngle = 0;
let posX = 420;
let posY = 380;

function updateTelemetry() {
    rotDisplay.textContent = Math.round(currentAngle) + '°';
    xDisplay.textContent = Math.round(posX) + 'px';
    yDisplay.textContent = Math.round(posY) + 'px';
}

// Set initial position
airplane.style.left = posX + 'px';
airplane.style.top = posY + 'px';
airplane.style.transform = `rotate(${currentAngle}deg)`;
updateTelemetry();

// Mouse Drag
airplane.addEventListener('mousedown', (e) => {
    isDragging = true;
    airplane.style.transition = 'none';
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const rect = hangar.getBoundingClientRect();
    posX = e.clientX - rect.left - airplane.offsetWidth / 2;
    posY = e.clientY - rect.top - airplane.offsetHeight / 2;

    // Keep inside bounds
    posX = Math.max(0, Math.min(posX, rect.width - airplane.offsetWidth));
    posY = Math.max(0, Math.min(posY, rect.height - airplane.offsetHeight));

    airplane.style.left = posX + 'px';
    airplane.style.top = posY + 'px';
    updateTelemetry();
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    airplane.style.transition = 'transform 0.1s';
});

// Rotation
function rotate(degrees) {
    currentAngle = (currentAngle + degrees + 360) % 360;
    airplane.style.transform = `rotate(${currentAngle}deg)`;
    updateTelemetry();
}

document.getElementById('rotate-left').addEventListener('click', () => rotate(-15));
document.getElementById('rotate-right').addEventListener('click', () => rotate(15));

document.addEventListener('keydown', (e) => {
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') rotate(-15);
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') rotate(15);
});