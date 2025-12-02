const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Reminder
    setReminder: (title, date, time) => ipcRenderer.send('set-reminder', { title, date, time }),
    deleteReminder: (id) => ipcRenderer.send('delete-reminder', id),
    onLoadReminders: (callback) => ipcRenderer.on('load-reminders', (event, data) => callback(data)),
    
    // Timer (BARU)
    timerDone: (message) => ipcRenderer.send('timer-done', message)
});