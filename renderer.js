const btnSet = document.getElementById('btnSet');
const taskInput = document.getElementById('taskInput');
const timeInput = document.getElementById('timeInput');

btnSet.addEventListener('click', () => {
    const title = taskInput.value;
    const seconds = parseInt(timeInput.value);

    if (title && seconds) {
        // Kirim data ke Main Process lewat jembatan 'api'
        window.api.setReminder(title, seconds);
        
        alert(`Reminder diset untuk ${seconds} detik lagi!`);
        
        // Reset form
        taskInput.value = '';
        timeInput.value = '';
    } else {
        alert('Isi judul dan waktu dulu ya!');
    }
});