export class Toast {
    static container = null;

    static init() {
        if (!document.querySelector('.toast-container')) {
            const el = document.createElement('div');
            el.className = 'toast-container';
            document.body.appendChild(el);
            this.container = el;
        } else {
            this.container = document.querySelector('.toast-container');
        }
    }

    static show(message, type = 'info') {
        if (!this.container) this.init();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let icon = '';
        if (type === 'success') icon = '<i data-lucide="check-circle" style="color: hsl(var(--color-success))"></i>';
        if (type === 'error') icon = '<i data-lucide="alert-circle" style="color: hsl(var(--color-danger))"></i>';
        if (type === 'info') icon = '<i data-lucide="info" style="color: hsl(var(--color-primary))"></i>';

        toast.innerHTML = `
            ${icon}
            <span style="font-size: 0.9rem; font-weight: 500;">${message}</span>
            <div class="toast-progress"></div>
        `;

        this.container.appendChild(toast);
        lucide.createIcons();

        // Auto remove
        setTimeout(() => {
            toast.classList.add('hiding');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 3000);
    }

    static success(msg) {
        this.show(msg, 'success');
    }

    static error(msg) {
        this.show(msg, 'error');
    }

    static info(msg) {
        this.show(msg, 'info');
    }
}
