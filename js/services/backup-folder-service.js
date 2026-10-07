/**
 * Nexa ERP - Respaldo automático en una carpeta del computador
 *
 * Usa la File System Access API (Chrome, Edge; en Brave hay que activarla en
 * brave://flags/#file-system-access-api). El usuario elige UNA carpeta una sola vez;
 * el permiso queda guardado en el navegador (IndexedDB aparte: NexaAdmin_Config).
 *
 * Archivos que escribe (nunca toca otros archivos de la carpeta):
 *   NexaAdmin_ultimo.json                       → siempre el estado más reciente
 *   NexaAdmin_AAAA-MM-DD.json                   → una copia por día (la última del día)
 *   NexaAdmin_AAAA-MM-DD_HHMM_<Evento>.json     → cierres de caja, antes de restaurar, etc.
 * Las copias diarias y de eventos más antiguas que `keepDays` se eliminan solas.
 *
 * Si el navegador no soporta la API, se descarga un respaldo diario a "Descargas".
 */

import { DB } from './db-service.js';
import { EventBus } from '../utils/event-bus.js';

const CFG_DB = 'NexaAdmin_Config';
const CFG_STORE = 'kv';
const FILE_LATEST = 'NexaAdmin_ultimo.json';
const FILE_RX = /^NexaAdmin_(\d{4})-(\d{2})-(\d{2})(?:_.*)?\.json$/;
const DEFAULTS = { enabled: true, intervalMin: 5, keepDays: 30, downloadFallback: true };
/** Si la base actual tiene menos de esta fracción de los registros del último respaldo, no se sobrescribe. */
const SHRINK_GUARD = 0.5;
const SHRINK_MIN_RECORDS = 50;

// ------------------------------------------------------------------ almacenamiento de configuración
let cfgDbPromise = null;
function cfgDb() {
  if (!cfgDbPromise) {
    cfgDbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(CFG_DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(CFG_STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return cfgDbPromise;
}
async function kvGet(key, def = null) {
  const db = await cfgDb();
  return new Promise((resolve, reject) => {
    const r = db.transaction(CFG_STORE).objectStore(CFG_STORE).get(key);
    r.onsuccess = () => resolve(r.result === undefined ? def : r.result);
    r.onerror = () => reject(r.error);
  });
}
async function kvSet(key, value) {
  const db = await cfgDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CFG_STORE, 'readwrite');
    if (value === null || value === undefined) tx.objectStore(CFG_STORE).delete(key);
    else tx.objectStore(CFG_STORE).put(value, key);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

// ------------------------------------------------------------------ utilidades
const pad = (n) => String(n).padStart(2, '0');
function localDay(d = new Date()) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function localHHMM(d = new Date()) { return `${pad(d.getHours())}${pad(d.getMinutes())}`; }
function countRecords(backup) {
  return Object.values(backup.stores || {}).reduce((n, rows) => n + (Array.isArray(rows) ? rows.length : 0), 0);
}
function safeEvent(name) { return String(name || 'Evento').replace(/[^A-Za-z0-9-]/g, '').slice(0, 30) || 'Evento'; }

async function writeFile(dir, name, text) {
  const fh = await dir.getFileHandle(name, { create: true });
  const w = await fh.createWritable(); // escribe en un temporal y reemplaza al cerrar (no deja archivos a medias)
  await w.write(text);
  await w.close();
}

class BackupFolderServiceClass {
  constructor() {
    this.handle = null;
    this.settings = { ...DEFAULTS };
    this.lastOk = null;        // ISO de la última copia correcta
    this.lastError = null;     // texto del último error
    this.lastCount = 0;        // registros en la última copia
    this.savedSeq = -1;        // DB.changeSeq ya respaldado
    this.lastRunAt = 0;
    this.busy = null;
    this.timer = null;
    this.permission = 'none';  // none | granted | prompt | denied
    this.loaded = false;
  }

  isSupported() { return typeof window.showDirectoryPicker === 'function'; }
  isBrave() { return !!(navigator.brave && typeof navigator.brave.isBrave === 'function'); }
  folderName() { return this.handle ? (this.handle.name || 'carpeta seleccionada') : null; }

  /** Estado resumido para la interfaz. */
  get state() {
    if (!this.settings.enabled) return 'disabled';
    if (!this.handle) return this.isSupported() ? 'no-folder' : 'unsupported';
    if (this.permission !== 'granted') return 'needs-permission';
    if (this.lastError) return 'error';
    return 'ok';
  }

  async load() {
    if (this.loaded) return;
    try {
      this.settings = { ...DEFAULTS, ...(await kvGet('settings', {})) };
      this.handle = await kvGet('dirHandle', null);
      const st = await kvGet('status', {});
      this.lastOk = st.lastOk || null;
      this.lastCount = st.lastCount || 0;
      this.lastError = null;
      await this.checkPermission(false);
    } catch (e) {
      console.warn('[Respaldo] No se pudo leer la configuración:', e);
    }
    this.loaded = true;
  }

  async saveSettings(patch) {
    this.settings = { ...this.settings, ...patch };
    await kvSet('settings', this.settings);
    this.emit();
  }

  emit() { EventBus.emit('backup:status', this); }

  /**
   * Consulta (y opcionalmente solicita) permiso de escritura sobre la carpeta.
   * Solicitarlo exige un gesto del usuario (clic o tecla).
   */
  async checkPermission(request = false) {
    if (!this.handle) { this.permission = 'none'; return this.permission; }
    try {
      let p = typeof this.handle.queryPermission === 'function'
        ? await this.handle.queryPermission({ mode: 'readwrite' }) : 'granted';
      if (p !== 'granted' && request && typeof this.handle.requestPermission === 'function') {
        p = await this.handle.requestPermission({ mode: 'readwrite' });
      }
      this.permission = p;
    } catch (e) {
      this.permission = 'denied';
    }
    this.emit();
    return this.permission;
  }

  /** Abre el selector de carpeta del sistema. Devuelve información del respaldo existente en ella, si lo hay. */
  async chooseFolder() {
    if (!this.isSupported()) throw new Error('Este navegador no permite elegir carpetas. Active la función o use Chrome/Edge.');
    const dir = await window.showDirectoryPicker({ id: 'nexa-respaldos', mode: 'readwrite', startIn: 'documents' });
    return this.useHandle(dir);
  }

  /** Usa una carpeta ya obtenida (también lo usan las pruebas automáticas). */
  async useHandle(dir) {
    this.handle = dir;
    this.lastError = null;
    this.lastCount = 0;
    await kvSet('dirHandle', dir);
    await this.saveStatus();
    await this.checkPermission(true);
    return this.inspectFolder();
  }

  async forgetFolder() {
    this.handle = null;
    this.permission = 'none';
    this.lastError = null;
    await kvSet('dirHandle', null);
    this.emit();
  }

  /** Lee NexaAdmin_ultimo.json de la carpeta (si existe) para comparar con la base actual. */
  async inspectFolder() {
    if (!this.handle || this.permission !== 'granted') return null;
    try {
      const fh = await this.handle.getFileHandle(FILE_LATEST);
      const data = JSON.parse(await (await fh.getFile()).text());
      const current = countRecords(await DB.exportBackup());
      return { timestamp: data.timestamp || null, records: countRecords(data), currentRecords: current, data };
    } catch (e) {
      return null; // no existe o no se puede leer
    }
  }

  /** Lista los respaldos de la carpeta, del más reciente al más antiguo. */
  async listFiles() {
    if (!this.handle || this.permission !== 'granted') return [];
    const out = [];
    for await (const [name, h] of this.handle.entries()) {
      if (h.kind !== 'file' || !(name === FILE_LATEST || FILE_RX.test(name))) continue;
      const f = await h.getFile();
      out.push({ name, size: f.size, modified: f.lastModified });
    }
    return out.sort((a, b) => b.modified - a.modified);
  }

  async readFile(name) {
    const fh = await this.handle.getFileHandle(name);
    return JSON.parse(await (await fh.getFile()).text());
  }

  async saveStatus() {
    await kvSet('status', { lastOk: this.lastOk, lastCount: this.lastCount });
  }

  /** Tras restaurar un respaldo, la base puede quedar más pequeña a propósito. */
  async resetShrinkGuard() {
    this.lastCount = 0;
    await this.saveStatus();
  }

  /**
   * Escribe el respaldo en la carpeta.
   * @param {string|null} eventName - si se indica, además deja un archivo con nombre de evento.
   * @param {{force?: boolean}} opts - force: ignora la protección contra sobrescribir con menos datos.
   * @returns {Promise<boolean>}
   */
  async backupNow(eventName = null, opts = {}) {
    if (this.busy) return this.busy;
    this.busy = (async () => {
      try {
        if (!this.handle) throw new Error('No hay carpeta de respaldo configurada.');
        if ((await this.checkPermission(false)) !== 'granted') throw new Error('Falta dar permiso a la carpeta de respaldo.');

        const seq = DB.changeSeq;
        const backup = await DB.exportBackup();
        const records = countRecords(backup);
        if (!opts.force && this.lastCount >= SHRINK_MIN_RECORDS && records < this.lastCount * SHRINK_GUARD) {
          throw new Error(`La base actual tiene ${records} registros y el último respaldo ${this.lastCount}. ` +
            'No se sobrescribió para no perder información. Si borró los datos del navegador, restaure desde la carpeta.');
        }

        const text = JSON.stringify(backup);
        const now = new Date();
        await writeFile(this.handle, FILE_LATEST, text);
        await writeFile(this.handle, `NexaAdmin_${localDay(now)}.json`, text);
        if (eventName) await writeFile(this.handle, `NexaAdmin_${localDay(now)}_${localHHMM(now)}_${safeEvent(eventName)}.json`, text);
        await this.rotate(now);

        this.savedSeq = seq;
        this.lastOk = now.toISOString();
        this.lastCount = records;
        this.lastError = null;
        await this.saveStatus();
        return true;
      } catch (e) {
        this.lastError = e.message || String(e);
        console.warn('[Respaldo] ' + this.lastError);
        return false;
      } finally {
        this.lastRunAt = Date.now();
        this.busy = null;
        this.emit();
      }
    })();
    return this.busy;
  }

  /** Borra copias diarias y de eventos más antiguas que keepDays. Nunca borra otros archivos. */
  async rotate(now = new Date()) {
    const keep = Math.max(1, Number(this.settings.keepDays) || DEFAULTS.keepDays);
    const limit = new Date(now.getFullYear(), now.getMonth(), now.getDate() - keep);
    const old = [];
    for await (const [name, h] of this.handle.entries()) {
      const m = h.kind === 'file' && name.match(FILE_RX);
      if (m && new Date(+m[1], +m[2] - 1, +m[3]) < limit) old.push(name);
    }
    for (const name of old) {
      try { await this.handle.removeEntry(name); } catch (e) { /* archivo en uso: se intenta la próxima vez */ }
    }
    return old;
  }

  /** Respalda si hubo cambios desde la última copia. */
  async runIfDirty() {
    if (this.state === 'disabled' || !this.handle || this.permission !== 'granted') return false;
    if (DB.changeSeq === this.savedSeq) return false;
    return this.backupNow();
  }

  /**
   * Respaldo por evento (cierre de caja, antes de restaurar).
   * Con carpeta activa escribe ahí; si no, descarga el archivo como antes.
   */
  async backupEvent(eventName) {
    if (this.settings.enabled && this.handle && this.permission === 'granted') {
      if (await this.backupNow(eventName, { force: eventName === 'AntesDeRestaurar' })) return true;
    }
    return DB.downloadAutoBackup(eventName);
  }

  /** Arranca el ciclo automático (después de iniciar sesión). */
  async start() {
    await this.load();
    if (this.timer) return;
    this.savedSeq = -1; // primera vuelta: siempre deja una copia al entrar

    this.timer = setInterval(() => {
      const due = Date.now() - this.lastRunAt >= (Number(this.settings.intervalMin) || 5) * 60000;
      if (due) this.runIfDirty();
    }, 30000);

    // Al ocultar o cerrar la pestaña se guarda lo pendiente.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.runIfDirty();
    });

    // El permiso de carpeta se vuelve a pedir con el primer clic del usuario en la sesión.
    if (this.handle && this.permission === 'prompt') {
      const ask = async () => {
        document.removeEventListener('click', ask, true);
        if ((await this.checkPermission(true)) === 'granted') this.backupNow();
      };
      document.addEventListener('click', ask, true);
    }

    if (this.state === 'ok') setTimeout(() => this.runIfDirty(), 3000);
    if (this.state === 'unsupported' && this.settings.enabled && this.settings.downloadFallback) {
      const today = localDay();
      if ((await kvGet('lastDownloadDay', null)) !== today) {
        setTimeout(async () => {
          if (await DB.downloadAutoBackup('Diario')) await kvSet('lastDownloadDay', today);
        }, 5000);
      }
    }
    this.emit();
  }
}

export const BackupFolderService = new BackupFolderServiceClass();
export const BACKUP_FILE_LATEST = FILE_LATEST;
// Acceso para diagnóstico y pruebas automáticas
window.NexaBackup = BackupFolderService;
