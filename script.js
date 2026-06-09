const hangar = document.getElementById('hangar-frame');

const planes = [
    { el: document.getElementById('airplane1'), visual: document.querySelector('#airplane1 .plane-visual'), x: 160, y: 850, angle: 180, id: 'DA40-1' },
    { el: document.getElementById('airplane2'), visual: document.querySelector('#airplane2 .plane-visual'), x: 300, y: 850, angle: 180, id: 'DA40-2' }
];

let selectedPlane = planes[0];

const rotDisplay = document.getElementById('telemetry-rot');
const xDisplay = document.getElementById('telemetry-x');
const yDisplay = document.getElementById('telemetry-y');
const selectedDisplay = document.getElementById('selected-plane');

// All coordinates have been scaled down and shifted inward to ensure 100% containment
const parkingSpots = [
    // --- INNER HIGH-DENSITY WHITEBOARD CLUSTER (Spots A - J) ---
    { name: "A", x: 920, y: 200, targetAngle: 150 },  
    { name: "B", x: 240, y: 220, targetAngle: 180 },  
    { name: "C", x: 500, y: 250, targetAngle: 180 },  
    { name: "D", x: 730, y: 310, targetAngle: 150 },  
    { name: "E", x: 940, y: 460, targetAngle: 150 },  
    { name: "F", x: 260, y: 460, targetAngle: 215 },  
    { name: "G", x: 500, y: 520, targetAngle: 180 },  
    { name: "H", x: 760, y: 640, targetAngle: 105 },  
    { name: "I", x: 280, y: 700, targetAngle: 215 },  
    { name: "J", x: 500, y: 760, targetAngle: 180 },  

    // --- COMPACT APPRON STAGING LANES (15 Ramp Slots) ---
    // Row 1 (8 Spots lined up left-to-right near the bottom border)
    { name: "Ramp 1", x: 130, y: 940, targetAngle: 180 },  { name: "Ramp 2", x: 255, y: 940, targetAngle: 180 },
    { name: "Ramp 3", x: 380, y: 940, targetAngle: 180 },  { name: "Ramp 4", x: 505, y: 940, targetAngle: 180 },
    { name: "Ramp 5", x: 630, y: 940, targetAngle: 180 },  { name: "Ramp 6", x: 755, y: 940, targetAngle: 180 },
    { name: "Ramp 7", x: 880, y: 940, targetAngle: 180 },  { name: "Ramp 8", x: 1005, y: 940, targetAngle: 180 },
    
    // Row 2 (7 Spots lined up directly below Row 1)
    { name: "Ramp 9",  x: 190, y: 1060, targetAngle: 180 }, { name: "Ramp 10", x: 315, y: 1060, targetAngle: 180 },
    { name: "Ramp 11", x: 440, y: 1060, targetAngle: 180 }, { name: "Ramp 12", x: 565, y: 1060, targetAngle: 180 },
    { name: "Ramp 13", x: 690, y: 1060, targetAngle: 180 }, { name: "Ramp 14", x: 815, y: 1060, targetAngle: 180 },
    { name: "Ramp 15", x: 940, y: 1060, targetAngle: 180 }
];

const snapThreshold = 45;

function updateTelemetry() {
    selectedDisplay.textContent = selectedPlane.id;
    rotDisplay.textContent = Math.round(selectedPlane.angle) + '°';
    if (xDisplay) xDisplay.textContent = Math.round(selectedPlane.x) + 'px';
    if (yDisplay) yDisplay.textContent = Math.round(selectedPlane.y) + 'px';
}

function updatePlane(plane) {
    plane.el.style.left = (plane.x - 85) + 'px';
    plane.el.style.top = (plane.y - 72.5) + 'px';   
    plane.visual.style.setProperty('--plane-angle', plane.angle + 'deg');
}

// Initial Bootstrap Layout Setup
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

// Drag Interaction Engine Logic
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
    
    // Bounds restricted to container padding zones to prevent scrolling artifacts
    currentDragPlane.x = Math.max(90, Math.min(currentDragPlane.x, rect.width - 90));
    currentDragPlane.y = Math.max(80, Math.min(currentDragPlane.y, rect.height - 80));
    
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
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
            minDist = dist;
            closest = spot;
        }
    }

    if (closest && minDist < snapThreshold) {
        currentDragPlane.x = closest.x;
        currentDragPlane.y = closest.y;
        currentDragPlane.angle = closest.targetAngle; 
        
        currentDragPlane.el.style.transition = 'left 0.45s ease-out, top 0.45s ease-out';
    } else {
        currentDragPlane.el.style.transition = 'none';
    }

    updatePlane(currentDragPlane);
    if (currentDragPlane === selectedPlane) updateTelemetry();
});

// Keyboard Navigational Heading System
function rotate(degrees) {
    selectedPlane.angle = (selectedPlane.angle + degrees + 360) % 360;
    updatePlane(selectedPlane);
    updateTelemetry();
}

document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'a' || e.key === 'ArrowLeft') rotate(-15);
    if (e.key.toLowerCase() === 'd' || e.key === 'ArrowRight') rotate(15);
});

// Dropdown Interface Integration
const spotDropdown = document.getElementById('spot-assign');
spotDropdown.addEventListener('change', () => {
    if (!spotDropdown.value) return;
    const idx = parseInt(spotDropdown.value);
    const target = parkingSpots[idx];
    
    if (target) {
        selectedPlane.x = target.x;
        selectedPlane.y = target.y;
        selectedPlane.angle = target.targetAngle;
        
        selectedPlane.el.style.transition = 'left 0.65s ease-out, top 0.65s ease-out';
        
        updatePlane(selectedPlane);
        updateTelemetry();
        
        setTimeout(() => spotDropdown.value = '', 700);
    }
});