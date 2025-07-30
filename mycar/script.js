document.addEventListener('DOMContentLoaded', () => {
    // Ensure external links open in new tabs
    document.querySelectorAll('a[target="_blank"]').forEach(link => {
        link.addEventListener('click', () => {
            window.open(link.href, '_blank');
        });
    });
});