/**
 * Nexa ERP - EventBus Desacoplado
 * Permite comunicación reactiva entre módulos sin acoplamiento directo
 */

class EventBusService {
  constructor() {
    this.events = {};
  }

  /**
   * Suscribirse a un evento
   */
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    return () => this.off(event, callback);
  }

  /**
   * Desuscribirse
   */
  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  /**
   * Emitir un evento con datos
   */
  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error(`Error en listener de evento "${event}":`, err);
      }
    });
  }
}

export const EventBus = new EventBusService();
