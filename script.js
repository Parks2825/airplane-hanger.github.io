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

// Re-mapped spots A-J to mirror the whiteboard grid configuration and layout angles
const parkingSpots = [
    // Spots A - J (Configured to match the uploaded physical layout board)
    { name: "A", x: 865, y: 195, targetAngle: 150 },  
    { name: "B", x: 225, y: 245, targetAngle: 180 },  
    { name: "C", x: 485, y: 295, targetAngle: 180 },  
    { name: "D", x: 675, y: 355, targetAngle: 150 },  
    { name: "E", x: 915, y: 515, targetAngle: 150 },  
    { name: "F", x: 255, y: 525, targetAngle: 215 },  
    { name: "G", x: 485, y: 595, targetAngle: 180 },  
    { name: "H", x: 745, y: 735, targetAngle: 105 },  
    { name: "I", x: 265, y: 805, targetAngle: 215 },  
    { name: "J", x: 485, y: 885, targetAngle: 180 },  

    // Ramp Apron Spots 1 - 15 (Lower tier remaining placeholders)
    { name: "Ramp 1", x: 160, y: 1020, targetAngle: 180 }, { name: "Ramp 2", x: 235, y: 1020, targetAngle: 180 },
    { name: "Ramp 3", x: 310, y: 1020, targetAngle: 180 }, { name: "Ramp 4", x: 385, y: 1020, targetAngle: 180 },
    { name: "Ramp 5", x: 460, y: 1020, targetAngle: 180 }, { name: "Ramp 6", x: 535, y: 1020, targetAngle: 180 },
    { name: "Ramp 7", x: 610, y: 1020, targetAngle: 180 }, { name: "Ramp 8", x: 685, y: 1020, targetAngle: 180 },
    { name: "Ramp 9", x: 760, y: 1020, targetAngle: 180 }, { name: "Ramp 10", x: 835, y: 1020, targetAngle: 180 },
    { name: "Ramp 11", x: 910, y: 1020, targetAngle: 180 }, { name: "Ramp 12", x: 985, y: 1020, targetAngle: 180 },
    { name: "Ramp 13", x: 235, y: 1100, targetAngle: 180 }, { name: "Ramp 14", x: 310, y: 1100, targetAngle: 180 },
    { name: "Ramp 15", x: 385, y: 1100, targetAngle: 180 }
];

const snapThreshold = 50;

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
    
    currentDragPlane.x = Math.max(85, Math.min(currentDragPlane.x, rect.width - 85));
    currentDragPlane.y = Math.max(72.5, Math.min(currentDragPlane.y, rect.height - 72.5));
    
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
        currentDragPlane.angle = closest.targetAngle; // Snaps to custom layout orientation rules!
        
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

// Automated Dropdown Selection Snapping Pipeline
const spotDropdown = document.getElementById('spot-assign');
spotDropdown.addEventListener('change', () => {
    if (!spotDropdown.value) return;
    const idx = parseInt(spotDropdown.value);
    const target = parkingSpots[idx];
    
    if (target) {
        selectedPlane.x = target.x;
        selectedPlane.y = target.y;
        selectedPlane.angle = target.targetAngle; // Synchronizes rotation dynamically
        
        selectedPlane.el.style.transition = 'left 0.65s ease-out, top 0.65s ease-out';
        
        updatePlane(selectedPlane);
        updateTelemetry();
        
        setTimeout(() => spotDropdown.value = '', 700);
    }
});