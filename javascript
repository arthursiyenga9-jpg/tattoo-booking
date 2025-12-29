// --- INITIALIZATION ---
const canvas = document.getElementById('tattoo-canvas');
const ctx = canvas?.getContext('2d');
const appointmentForm = document.getElementById('appointment-form');
const appointmentsList = document.getElementById('appointments');
const uploadInput = document.getElementById('customer-design-upload');
const previewGallery = document.getElementById('customer-preview-gallery');
let isDrawing = false;

// --- 1. MOBILE UPLOAD FEATURE ---
if (uploadInput) {
    uploadInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = document.createElement('img');
                img.src = event.target.result;
                img.className = 'preview-img';
                previewGallery.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
}

// --- 2. DRAWING TOOL LOGIC ---
if (canvas) {
    canvas.addEventListener('mousedown', () => isDrawing = true);
    canvas.addEventListener('mouseup', () => { isDrawing = false; ctx.beginPath(); });
    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.strokeStyle = document.getElementById('color-picker').value;
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    });
    document.getElementById('clear').onclick = () => ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById('save').onclick = () => {
        const link = document.createElement('a');
        link.download = 'blackink-sketch.png';
        link.href = canvas.toDataURL();
        link.click();
    };
}

// --- 3. BOOKING LOGIC WITH CONFLICT PROTECTION ---
appointmentForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const apptData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        description: document.getElementById('tattoo-description').value,
        id: Date.now() // Unique ID for management
    };

    const localAppts = JSON.parse(localStorage.getItem('appointments')) || [];

    // PROTECTION: CHECK IF ALREADY BOOKED
    const isTaken = localAppts.some(a => a.date === apptData.date && a.time === apptData.time);

    if (isTaken) {
        alert("🚨 Stop! This date and time is already booked by another client. Please choose a different slot.");
        return;
    }

    // EmailJS Notification
    emailjs.send("service_bmhafjm", "template_oztapjd", apptData)
    .then(() => {
        localAppts.push(apptData);
        localStorage.setItem('appointments', JSON.stringify(localAppts));
        alert("✅ Booking Success! We have sent a request to the artist.");
        appointmentForm.reset();
        loadAppointments();
    });
});

// --- 4. MANAGE & DELETE BOOKINGS ---
function deleteBooking(id) {
    if (confirm("Are you sure you want to cancel this appointment?")) {
        let appts = JSON.parse(localStorage.getItem('appointments')) || [];
        appts = appts.filter(a => a.id !== id);
        localStorage.setItem('appointments', JSON.stringify(appts));
        loadAppointments();
        alert("Booking cancelled.");
    }
}

function loadAppointments() {
    const userEmail = document.getElementById('manage-email').value.toLowerCase();
    const appts = JSON.parse(localStorage.getItem('appointments')) || [];
    
    if (!userEmail) {
        appointmentsList.innerHTML = '<li style="list-style:none;">Enter email above to view your bookings.</li>';
        return;
    }

    const filtered = appts.filter(a => a.email.toLowerCase() === userEmail);

    if (filtered.length === 0) {
        appointmentsList.innerHTML = '<li style="list-style:none;">No bookings found for this email.</li>';
    } else {
        appointmentsList.innerHTML = filtered.map(a => `
            <li class="appointment-card">
                <div>
                    <strong>${a.date} @ ${a.time}</strong><br>
                    <small>${a.description.substring(0, 30)}...</small>
                </div>
                <button onclick="deleteBooking(${a.id})" class="delete-btn">Cancel</button>
            </li>
        `).join('');
    }
}
        
