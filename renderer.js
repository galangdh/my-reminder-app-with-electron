// ==========================================
// 1. SETUP & VARIABEL GLOBAL
// ==========================================

// --- Bagian Reminder & Kalender ---
let globalReminders = [];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

const btnSave = document.getElementById('btnSaveReminder');
const titleInput = document.getElementById('taskTitle');
const dateInput = document.getElementById('taskDate');
const timeInput = document.getElementById('taskTime');
const listContainer = document.getElementById('reminderList');

// Elemen Kalender
const calendarGrid = document.getElementById('calendarGrid');
const monthDisplay = document.getElementById('monthYearDisplay');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');

// --- Bagian Timer ---
let timerInterval;
let timeLeft;
let endTime; // Variabel baru untuk target waktu (agar akurat)
let isWorking = true; // true = kerja, false = istirahat

const timerDisplay = document.getElementById('timerDisplay');
const timerBadge = document.getElementById('timerMode');
const btnStart = document.getElementById('btnStartTimer');
const btnReset = document.getElementById('btnResetTimer');
const workInput = document.getElementById('workInput');
const breakInput = document.getElementById('breakInput');


// ==========================================
// 2. LOGIKA REMINDER & KALENDER
// ==========================================

// Listener Navigasi Kalender
if(prevMonthBtn) prevMonthBtn.addEventListener('click', () => changeMonth(-1));
if(nextMonthBtn) nextMonthBtn.addEventListener('click', () => changeMonth(1));

window.api.onLoadReminders((reminders) => {
    globalReminders = reminders;
    renderList(reminders);
    renderCalendar();
});

function renderList(reminders) {
    if (!listContainer) return;
    listContainer.innerHTML = '';
    reminders.sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));

    reminders.forEach(item => {
        const dateObj = new Date(item.fullDate);
        const dateStr = dateObj.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
        const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        const div = document.createElement('div');
        div.className = 'reminder-item';
        div.innerHTML = `
            <div>
                <div style="font-size:0.8rem; color:#6c5ce7; font-weight:bold;">${dateStr} • ${timeStr}</div>
                <div style="font-weight:500;">${item.title}</div>
            </div>
            <button class="btn btn-sm btn-danger rounded-circle delete-btn" data-id="${item.id}">&times;</button>
        `;
        div.querySelector('.delete-btn').addEventListener('click', () => {
            window.api.deleteReminder(item.id);
        });
        listContainer.appendChild(div);
    });
}

function renderCalendar() {
    if (!calendarGrid) return;
    calendarGrid.innerHTML = ''; 
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    days.forEach(day => {
        const div = document.createElement('div');
        div.className = 'day-name';
        div.innerText = day;
        calendarGrid.appendChild(div);
    });

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    if(monthDisplay) monthDisplay.innerText = `${monthNames[currentMonth]} ${currentYear}`;

    for (let i = 0; i < firstDay; i++) {
        calendarGrid.appendChild(document.createElement('div'));
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        dayDiv.innerText = i;
        const today = new Date();
        if (i === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            dayDiv.classList.add('today');
        }
        const checkDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const hasEvent = globalReminders.some(item => item.fullDate.substring(0, 10) === checkDate);
        if (hasEvent) dayDiv.classList.add('has-event');
        dayDiv.addEventListener('click', () => {
            if(dateInput) dateInput.value = checkDate;
            if(titleInput) titleInput.focus();
        });
        calendarGrid.appendChild(dayDiv);
    }
}

function changeMonth(step) {
    currentMonth += step;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

if(btnSave) {
    btnSave.addEventListener('click', () => {
        if (titleInput.value && dateInput.value && timeInput.value) {
            window.api.setReminder(titleInput.value, dateInput.value, timeInput.value);
            titleInput.value = '';
        } else {
            alert("Lengkapi data!");
        }
    });
}


// ==========================================
// 3. LOGIKA TIMER (FOCUS TIMER - AUTO LOOP)
// ==========================================

// Helper: Update Badge Warna
function updateBadgeUI() {
    if (isWorking) {
        timerBadge.innerText = "🔥 FOKUS KERJA";
        timerBadge.style.background = "#ffeaa7";
        timerBadge.style.color = "#d63031";
    } else {
        timerBadge.innerText = "☕ ISTIRAHAT";
        timerBadge.style.background = "#55efc4";
        timerBadge.style.color = "#00b894";
    }
}

// Helper: Update Layar Angka
function updateScreen(seconds) {
    if(!timerDisplay) return;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    timerDisplay.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Helper: Reset timer ke durasi awal (tanpa start)
function resetTimerToInput() {
    if(!workInput || !breakInput) return;
    const mins = isWorking ? workInput.value : breakInput.value;
    timeLeft = mins * 60; 
    updateScreen(timeLeft);
}

// TOMBOL START / PAUSE
if(btnStart) {
    btnStart.addEventListener('click', () => {
        if (timerInterval) { 
            // --- KLIK PAUSE ---
            clearInterval(timerInterval);
            timerInterval = null;
            btnStart.innerHTML = '<i class="bi bi-play-fill"></i>'; 
        } else { 
            // --- KLIK START ---
            
            // 1. Ambil durasi jika belum ada
            if (!timeLeft || timeLeft <= 0) resetTimerToInput();
            
            // 2. Set Target Waktu (Ini kuncinya biar gak telat pas minimize)
            // Target = Waktu Sekarang + Sisa Detik
            endTime = Date.now() + (timeLeft * 1000);

            // 3. Update UI
            updateBadgeUI();
            btnStart.innerHTML = '<i class="bi bi-pause-fill"></i>';

            // 4. Jalankan Interval
            timerInterval = setInterval(() => {
                // Hitung selisih waktu sistem (Lebih akurat daripada timeLeft--)
                const now = Date.now();
                const secondsRemaining = Math.ceil((endTime - now) / 1000);
                
                // Update variabel global
                timeLeft = secondsRemaining;
                updateScreen(timeLeft);

                // --- JIKA WAKTU HABIS (00:00) ---
                if (timeLeft <= 0) {
                    // A. Bunyikan Notifikasi
                    const msg = isWorking ? "Kerja selesai! Istirahat dulu." : "Istirahat selesai! Ayo kerja.";
                    if(window.api && window.api.timerDone) window.api.timerDone(msg);

                    // B. Tukar Mode
                    isWorking = !isWorking; 
                    
                    // C. Ambil Durasi Baru
                    const mins = isWorking ? workInput.value : breakInput.value;
                    const nextSeconds = mins * 60;
                    
                    // D. SET ULANG Target Waktu (AUTO START / LOOP)
                    // Jangan clearInterval, kita langsung tembak target baru
                    endTime = Date.now() + (nextSeconds * 1000);
                    
                    // E. Update UI Badge
                    updateBadgeUI();
                    
                    // Timer akan terus lanjut menghitung mundur dari durasi baru...
                }
            }, 1000);
        }
    });
}

// TOMBOL RESET (RESTART)
if(btnReset) {
    btnReset.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerInterval = null;
        
        isWorking = true; // Kembali ke kerja
        resetTimerToInput(); // Reset angka
        
        // Reset UI
        timerBadge.innerText = "Siap Mulai";
        timerBadge.style.background = "#dfe6e9";
        timerBadge.style.color = "#2d3436";
        btnStart.innerHTML = '<i class="bi bi-play-fill"></i>';
    });
}

// Input Listener
if(workInput) workInput.addEventListener('change', () => { if(isWorking && !timerInterval) resetTimerToInput() });
if(breakInput) breakInput.addEventListener('change', () => { if(!isWorking && !timerInterval) resetTimerToInput() });

// Inisialisasi
renderCalendar();
resetTimerToInput();