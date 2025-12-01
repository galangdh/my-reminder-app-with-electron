const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 400,
        height: 500,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Load jembatan kita
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    // Di Mac, notifikasi butuh izin user (opsional tapi bagus ada)
    if (process.platform === 'darwin') {
        app.setAppUserModelId('com.electron.reminder'); 
    }
});

// LOGIKA UTAMA: Menerima request reminder dari UI
ipcMain.on('set-reminder', (event, data) => {
    const { title, seconds } = data;
    
    // Ubah detik ke milidetik
    const timeInMs = seconds * 1000;

    // Tunggu sesuai waktu yang diset, lalu munculkan notifikasi
    setTimeout(() => {
        new Notification({
            title: "⏰ Waktunya Habis!",
            body: `Pengingat: ${title}`
        }).show();
    }, timeInMs);
});