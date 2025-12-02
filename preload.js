const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Reminder
    setReminder: (title, date, time) => ipcRenderer.send('set-reminder', { title, date, time }),
    deleteReminder: (id) => ipcRenderer.send('delete-reminder', id),
    onLoadReminders: (callback) => ipcRenderer.on('load-reminders', (event, data) => callback(data)),
    
// ... kode lama ...
    timerDone: (message) => ipcRenderer.send('timer-done', message), // Jangan hapus yg ini
    
    // [BARU] Statistik
    getStats: () => ipcRenderer.invoke('get-stats'),
    saveStats: (minutes) => ipcRenderer.send('save-stats', minutes)
});