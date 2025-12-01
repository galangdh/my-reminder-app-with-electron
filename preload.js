const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Fungsi untuk mengirim data reminder ke main process
    setReminder: (title, seconds) => ipcRenderer.send('set-reminder', { title, seconds })
});