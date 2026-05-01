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
function showFieldError(fieldId, message) {
    // remove existing error for this field
    const existing = document.getElementById(`error-${fieldId}`);
    if (existing) existing.remove();

    const field = document.getElementById(fieldId);
    if (!field) return;

    const error = document.createElement('div');
    error.id = `error-${fieldId}`;
    error.classList.add('field-error');
    error.textContent = message;

    field.insertAdjacentElement('afterend', error);
}

function clearFieldError(fieldId) {
    const existing = document.getElementById(`error-${fieldId}`);
    if (existing) existing.remove();
}

function showToast(message, autoDismiss = false, type = 'error') {
    const existing = document.getElementById('toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.classList.add('toast', `toast-${type}`);
    toast.textContent = message;

    document.body.appendChild(toast);

    if (autoDismiss) {
        setTimeout(() => {
            toast.classList.add('toast-hide');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
}

function hideToast() {
    const existing = document.getElementById('toast');
    if (existing) existing.remove();
}

function highlightField(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.classList.add('input-error');
}

function clearHighlight(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.classList.remove('input-error');
    // also hide toast when user starts correcting
    hideToast();
}