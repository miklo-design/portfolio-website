function showNotification(message, type = 'info') {
    const existing = document.getElementById('notification');
    if (existing) existing.remove();

    const notif = document.createElement('div');
    notif.id = 'notification';
    notif.classList.add('notification', `notification-${type}`);
    notif.textContent = message;

    document.body.appendChild(notif);

    setTimeout(() => {
        notif.classList.add('notification-hide');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}
/*
function showLoader() {
    document.getElementById('loader').hidden = false;
}

function hideLoader() {
    document.getElementById('loader').hidden = true;
} */