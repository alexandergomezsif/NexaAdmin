/**
 * Nexa ERP - Utilidades DOM
 */

/**
 * Registra un listener en un contenedor persistente reemplazando el anterior del mismo `key`.
 * Evita que los listeners se acumulen cada vez que un módulo se vuelve a renderizar
 * (antes un clic podía ejecutar la acción 2, 3... N veces).
 */
export function bindOnce(el, key, eventName, handler) {
  if (!el) return;
  el.__nexaHandlers = el.__nexaHandlers || {};
  const prev = el.__nexaHandlers[key];
  if (prev) el.removeEventListener(prev.eventName, prev.handler);
  el.__nexaHandlers[key] = { eventName, handler };
  el.addEventListener(eventName, handler);
}
