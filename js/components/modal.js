/**
 * Nexa ERP - Componente Modal Dinámico y Accesible
 */

import { esc } from '../utils/formatters.js';

export const Modal = {
  activeModal: null,

  /**
   * Abre un diálogo modal configurable
   */
  show({ title, content, footerButtons = [], size = 'md', onClose = null }) {
    this.close(); // Cierra anterior si existiera

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    const dialog = document.createElement('div');
    dialog.className = `modal-dialog modal-${size}`;

    dialog.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">${esc(title)}</h3>
        <button class="modal-close" aria-label="Cerrar">&times;</button>
      </div>
      <div class="modal-body">${content}</div>
      <div class="modal-footer"></div>
    `;

    const footer = dialog.querySelector('.modal-footer');
    if (footerButtons && footerButtons.length > 0) {
      footerButtons.forEach(btnConfig => {
        const btn = document.createElement('button');
        btn.className = `btn ${btnConfig.class || 'btn-secondary'}`;
        btn.textContent = btnConfig.label;
        if (btnConfig.id) btn.id = btnConfig.id;
        btn.addEventListener('click', (e) => {
          if (btnConfig.onClick) {
            btnConfig.onClick(dialog, e);
          } else {
            this.close();
          }
        });
        footer.appendChild(btn);
      });
    } else {
      footer.style.display = 'none';
    }

    dialog.querySelector('.modal-close').addEventListener('click', () => {
      this.close();
      if (onClose) onClose();
    });

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        this.close();
        if (onClose) onClose();
      }
    });

    backdrop.appendChild(dialog);
    document.body.appendChild(backdrop);

    // Atajo ESC para cerrar (el listener se elimina siempre al cerrar, sin acumularse)
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        this.close();
        if (onClose) onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    this.activeModal = { backdrop, dialog, onClose, handleEsc };

    return dialog;
  },

  /**
   * Cierra el modal activo
   */
  close() {
    if (this.activeModal) {
      if (this.activeModal.handleEsc) document.removeEventListener('keydown', this.activeModal.handleEsc);
      if (this.activeModal.backdrop && this.activeModal.backdrop.parentElement) {
        this.activeModal.backdrop.parentElement.removeChild(this.activeModal.backdrop);
      }
      this.activeModal = null;
    }
  },

  /**
   * Diálogo de confirmación estándar seguro
   */
  confirm({ title = '¿Está seguro?', message, confirmText = 'Confirmar', cancelText = 'Cancelar', isDanger = false, onConfirm }) {
    this.show({
      title,
      content: `<p style="font-size: 14px; color: var(--text-secondary);">${message}</p>`,
      size: 'sm',
      footerButtons: [
        { label: cancelText, class: 'btn-secondary', onClick: () => this.close() },
        {
          label: confirmText,
          class: isDanger ? 'btn-danger' : 'btn-primary',
          onClick: () => {
            this.close();
            if (onConfirm) onConfirm();
          }
        }
      ]
    });
  }
};
