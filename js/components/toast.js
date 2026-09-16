/**
 * Nexa ERP - Componente Toast de Notificaciones
 */

class ToastManager {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    if (!this.container || !document.body.contains(this.container)) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  show({ title, message, type = 'info', duration = 3500 }) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconMap = {
      success: '✓',
      danger: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    toast.innerHTML = `
      <div style="font-weight: bold; font-size: 16px; line-height: 1;">${iconMap[type] || 'ℹ'}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div class="toast-message">${message}</div>
      </div>
      <button style="background: none; border: none; font-size: 16px; color: #94a3b8; cursor: pointer;">&times;</button>
    `;

    toast.querySelector('button').addEventListener('click', () => {
      this.remove(toast);
    });

    this.container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(toast);
      }, duration);
    }
  }

  remove(toast) {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.2s ease-out';
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 200);
  }

  success(message, title = 'Operación Exitosa') {
    this.show({ title, message, type: 'success' });
  }

  error(message, title = 'Error') {
    this.show({ title, message, type: 'danger', duration: 5000 });
  }

  warning(message, title = 'Atención') {
    this.show({ title, message, type: 'warning' });
  }

  info(message, title = 'Información') {
    this.show({ title, message, type: 'info' });
  }
}

export const Toast = new ToastManager();
