const { app, BrowserWindow, ipcMain, Notification, Tray, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();
let win;
let tray;
let isQuitting = false;

// --- LOGIKA ALARM REMINDER ---
function setupAlarm(id, title, targetDateTimeString) {
    const now = new Date();
    const targetDate = new Date(targetDateTimeString);

    const timeout = targetDate.getTime() - now.getTime();

    if (timeout < 0) return; // Waktu sudah lewat

    console.log(`Alarm diset untuk: ${title} pada ${targetDate}`);

    setTimeout(() => {
        // Notifikasi Bunyi
        new Notification({ title: "📅 Reminder Event", body: title }).show();

        // Hapus dari database otomatis
        const currentList = store.get('reminders') || [];
        const newList = currentList.filter(item => item.id !== id);
        store.set('reminders', newList);
        
        if (win && !win.isDestroyed()) win.webContents.send('load-reminders', newList);
    }, timeout);
}

function createWindow() {
    win = new BrowserWindow({
        width: 850, // Lebih lebar karena ada sidebar
        height: 600,
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile('index.html');

    // Load data reminder saat buka
    win.webContents.on('did-finish-load', () => {
        const savedReminders = store.get('reminders') || [];
        win.webContents.send('load-reminders', savedReminders);
    });

    win.on('close', (e) => {
        if (!isQuitting) { e.preventDefault(); win.hide(); return false; }
    });
}

// ... (Bagian Tray & App Ready sama seperti sebelumnya, dipersingkat di sini) ...
// (Pastikan kode createTray dan app.whenReady ada di sini seperti kode sebelumnya)
function createTray() {
    tray = new Tray(path.join(__dirname, 'icon.png'));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Buka', click: () => win.show() },
        { label: 'Keluar', click: () => { isQuitting = true; app.quit(); } }
    ]);
    tray.setToolTip('Productivity App');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => win.show());
}

app.whenReady().then(() => {
    createWindow();
    createTray();

    // Re-schedule saat restart
    const savedReminders = store.get('reminders') || [];
    savedReminders.forEach(item => {
        // item.fullDate formatnya "2023-12-01T14:30"
        setupAlarm(item.id, item.title, item.fullDate);
    });
});

// --- IPC HANDLERS ---
ipcMain.on('set-reminder', (event, data) => {
    // data: { title, date, time }
    // Kita gabung date & time jadi satu string ISO: "YYYY-MM-DDTHH:MM"
    const fullDate = `${data.date}T${data.time}`; 
    const id = Date.now(); // Buat ID unik pakai timestamp

    const newItem = { id, title: data.title, fullDate }; // Simpan format baru

    const currentReminders = store.get('reminders') || [];
    currentReminders.push(newItem);
    store.set('reminders', currentReminders);

    setupAlarm(id, data.title, fullDate);
    
    // Kirim balik list terbaru
    event.sender.send('load-reminders', currentReminders);
});

ipcMain.on('delete-reminder', (event, id) => {
    const currentList = store.get('reminders') || [];
    const newList = currentList.filter(item => item.id !== id); // Hapus by ID
    store.set('reminders', newList);
    event.sender.send('load-reminders', newList);
});

// --- FITUR TIMER (Notifikasi Saja) ---
ipcMain.on('timer-done', (event, message) => {
    new Notification({ 
        title: "⏱️ Timer Selesai!", 
        body: message,
        silent: true // Tambahkan ini agar tidak bunyi "Ting" Windows
    }).show();
});


// --- FITUR STATISTIK (BARU) ---

// 1. Ambil Data Statistik (Request dari Frontend)
ipcMain.handle('get-stats', () => {
    // Default: 0 sesi, 0 menit
    const defaultStats = { sessions: 0, minutes: 0 };
    return store.get('stats') || defaultStats;
});

// 2. Simpan Data Statistik (Dikirim saat timer habis)
ipcMain.on('save-stats', (event, minutesWorked) => {
    const currentStats = store.get('stats') || { sessions: 0, minutes: 0 };
    
    // Update data
    currentStats.sessions += 1;
    currentStats.minutes += parseInt(minutesWorked);
    
    store.set('stats', currentStats);
});