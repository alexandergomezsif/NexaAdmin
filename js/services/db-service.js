/**
 * Nexa ERP - Servicio de Persistencia IndexedDB
 * Capa de abstracción de datos relacional/asíncrona para almacenamiento local
 * Preparada para reemplazo transparente por REST/GraphQL API
 */

const DB_NAME = 'NexaERP_DB';
const DB_VERSION = 3;

export const STORES = {
  TENANTS: 'tenants',
  USERS: 'users',
  PRICE_LISTS: 'price_lists',
  WAREHOUSES: 'warehouses',
  PRODUCTS: 'products',
  KARDEX: 'kardex',
  RECIPES_BOM: 'recipes_bom',
  PRODUCTION_ORDERS: 'production_orders',
  CUSTOMERS: 'customers',
  SUPPLIERS: 'suppliers',
  SALES: 'sales',
  PURCHASES: 'purchases',
  ORDERS_SHIPPING: 'orders_shipping',
  CASH_SHIFTS: 'cash_shifts',
  CASH_MOVEMENTS: 'cash_movements',
  EXPENSES: 'expenses',
  RECEIVABLES_CXC: 'receivables_cxc',
  PAYABLES_CXP: 'payables_cxp',
  AUDIT_LOGS: 'audit_logs',
  SYSTEM_PARAMS: 'system_params',
  ATTACHMENTS: 'attachments'
};

class DBService {
  constructor() {
    this.db = null;
    this.initPromise = null;
    /** Contador de cambios: el respaldo automático lo usa para saber si hay algo nuevo que guardar. */
    this.changeSeq = 0;
  }

  /** Marca que la base de datos cambió (escrituras confirmadas). */
  _touch() { this.changeSeq++; }

  /**
   * Inicializa y abre la base de datos IndexedDB
   */
  async init() {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Crear almacenes si no existen
        const createStore = (name, keyPath = 'id', indexes = []) => {
          if (!db.objectStoreNames.contains(name)) {
            const store = db.createObjectStore(name, { keyPath });
            indexes.forEach(idx => {
              store.createIndex(idx.name, idx.key, { unique: !!idx.unique });
            });
          }
        };

        createStore(STORES.TENANTS, 'id');
        createStore(STORES.USERS, 'id', [
          { name: 'tenantId', key: 'tenantId' },
          { name: 'usuario', key: 'usuario', unique: false }
        ]);
        createStore(STORES.PRICE_LISTS, 'id', [{ name: 'tenantId', key: 'tenantId' }]);
        createStore(STORES.WAREHOUSES, 'id', [{ name: 'tenantId', key: 'tenantId' }]);
        createStore(STORES.PRODUCTS, 'id', [
          { name: 'tenantId', key: 'tenantId' },
          { name: 'sku', key: 'sku' },
          { name: 'tipoItem', key: 'tipoItem' }
        ]);
        createStore(STORES.KARDEX, 'id', [
          { name: 'tenantId', key: 'tenantId' },
          { name: 'productoId', key: 'productoId' },
          { name: 'fecha', key: 'fecha' }
        ]);
        createStore(STORES.RECIPES_BOM, 'id', [
          { name: 'tenantId', key: 'tenantId' },
          { name: 'productoTerminadoId', key: 'productoTerminadoId' }
        ]);
        createStore(STORES.PRODUCTION_ORDERS, 'id', [
          { name: 'tenantId', key: 'tenantId' },
          { name: 'estado', key: 'estado' }
        ]);
        createStore(STORES.CUSTOMERS, 'id', [
          { name: 'tenantId', key: 'tenantId' },
          { name: 'nitCc', key: 'nitCc' }
        ]);
        createStore(STORES.SUPPLIERS, 'id', [
          { name: 'tenantId', key: 'tenantId' },
          { name: 'nitCc', key: 'nitCc' }
        ]);
        createStore(STORES.SALES, 'id', [
          { name: 'tenantId', key: 'tenantId' },
          { name: 'fecha', key: 'fecha' },
          { name: 'clienteId', key: 'clienteId' }
        ]);
        createStore(STORES.PURCHASES, 'id', [
          { name: 'tenantId', key: 'tenantId' },
          { name: 'fecha', key: 'fecha' }
        ]);
        createStore(STORES.ORDERS_SHIPPING, 'id', [
          { name: 'tenantId', key: 'tenantId' },
          { name: 'estadoCiclo', key: 'estadoCiclo' }
        ]);
        createStore(STORES.CASH_SHIFTS, 'id', [
          { name: 'tenantId', key: 'tenantId' },
          { name: 'estado', key: 'estado' }
        ]);
        createStore(STORES.CASH_MOVEMENTS, 'id', [
          { name: 'tenantId', key: 'tenantId' },
          { name: 'turnoId', key: 'turnoId' }
        ]);
        createStore(STORES.EXPENSES, 'id', [
          { name: 'tenantId', key: 'tenantId' },
          { name: 'fecha', key: 'fecha' }
        ]);
        createStore(STORES.RECEIVABLES_CXC, 'id', [
          { name: 'tenantId', key: 'tenantId' },
          { name: 'clienteId', key: 'clienteId' },
          { name: 'estado', key: 'estado' }
        ]);
        createStore(STORES.PAYABLES_CXP, 'id', [
          { name: 'tenantId', key: 'tenantId' },
          { name: 'proveedorId', key: 'proveedorId' },
          { name: 'estado', key: 'estado' }
        ]);
        createStore(STORES.AUDIT_LOGS, 'id', [
          { name: 'tenantId', key: 'tenantId' },
          { name: 'fecha', key: 'fecha' },
          { name: 'modulo', key: 'modulo' }
        ]);
        createStore(STORES.SYSTEM_PARAMS, 'id', [{ name: 'tenantId', key: 'tenantId' }]);
        // v3: adjuntos (comprobantes de pago) fuera de las ventas para no cargar imágenes en cada consulta
        createStore(STORES.ATTACHMENTS, 'id', [
          { name: 'tenantId', key: 'tenantId' },
          { name: 'refId', key: 'refId' }
        ]);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        // Si otra pestaña actualiza la versión de la BD, cerrar esta conexión para no bloquearla
        this.db.onversionchange = () => {
          this.db.close();
          this.db = null;
          this.initPromise = null;
        };
        resolve(this.db);
      };

      // Otra pestaña con la versión anterior mantiene la base abierta: la actualización espera
      // hasta que esa pestaña se cierre. Se avisa en pantalla (antes la app quedaba en blanco).
      request.onblocked = () => {
        console.warn('IndexedDB bloqueada: hay otra pestaña de NexaAdmin abierta con una versión anterior.');
        if (typeof window !== 'undefined' && typeof window.__nexaBootMessage === 'function') {
          window.__nexaBootMessage(
            'Cierre las otras pestañas de NexaAdmin',
            'Hay otra pestaña o ventana con NexaAdmin abierta (versión anterior) y está bloqueando la actualización de la base de datos. ' +
            'Ciérrela y esta página continuará sola. Si no continúa, recárguela (F5).'
          );
        }
      };

      request.onerror = (event) => {
        console.error('Error al abrir IndexedDB:', event.target.error);
        if (typeof window !== 'undefined' && window.__nexaBootMessage) {
          window.__nexaBootMessage('El navegador no permitió abrir la base de datos',
            `${event.target.error && event.target.error.message || 'Error desconocido'}. En Brave: haga clic en el icono del león y desactive los escudos para esta página, o use Chrome/Edge.`, true);
        }
        this.initPromise = null;
        reject(event.target.error);
      };
    });

    return this.initPromise;
  }

  /**
   * Genera un identificador único con prefijo del almacén.
   */
  genId(storeName) {
    const rnd = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID().replace(/-/g, '').substring(0, 12)
      : Math.random().toString(36).substring(2, 14);
    return `${storeName.substring(0, 3)}_${Date.now()}_${rnd}`.toLowerCase();
  }

  /**
   * Obtiene todos los registros de una tabla, filtrados por tenantId opcional
   */
  async getAll(storeName, tenantId = null) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result || [];
        if (tenantId && storeName !== STORES.TENANTS) {
          results = results.filter(item => item.tenantId === tenantId);
        }
        resolve(results);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtiene registros por índice (más eficiente que getAll + filter en tablas grandes)
   */
  async getAllByIndex(storeName, indexName, value) {
    await this.init();
    return new Promise((resolve, reject) => {
      const store = this.db.transaction([storeName], 'readonly').objectStore(storeName);
      const request = store.index(indexName).getAll(value);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtiene un registro por su ID
   */
  async getById(storeName, id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Agrega un nuevo registro generando id si no lo tiene (upsert seguro con put)
   */
  async add(storeName, item) {
    await this.init();
    if (!item.id) item.id = this.genId(storeName);
    if (!item.fechaCreacion) item.fechaCreacion = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const request = transaction.objectStore(storeName).put(item);
      request.onsuccess = () => { this._touch(); resolve(item); };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Actualiza un registro existente
   */
  async update(storeName, item) {
    await this.init();
    item.fechaModificacion = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const request = transaction.objectStore(storeName).put(item);
      request.onsuccess = () => { this._touch(); resolve(item); };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Elimina un registro por ID
   */
  async delete(storeName, id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const request = transaction.objectStore(storeName).delete(id);
      request.onsuccess = () => { this._touch(); resolve(true); };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Inserta un lote de registros (útil para seeds e importación)
   */
  async bulkAdd(storeName, items) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      transaction.oncomplete = () => { this._touch(); resolve(true); };
      transaction.onerror = () => reject(transaction.error);

      items.forEach(item => {
        if (!item.id) item.id = this.genId(storeName);
        store.put(item);
      });
    });
  }

  /**
   * Ejecuta varias operaciones en UNA sola transacción atómica (todo o nada).
   * Dentro de `work` solo deben esperarse (await) operaciones del objeto `tx`;
   * esperar otra cosa (fetch, setTimeout, crypto) cierra la transacción de IndexedDB.
   *
   * @param {string[]} storeNames - almacenes involucrados
   * @param {(tx: TxHelper) => Promise<any>} work
   */
  async runTransaction(storeNames, work) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeNames, 'readwrite');
      let result;
      let workError = null;

      const wrap = (request) => new Promise((res, rej) => {
        request.onsuccess = () => res(request.result);
        request.onerror = () => rej(request.error);
      });

      const tx = {
        get: (store, id) => wrap(transaction.objectStore(store).get(id)).then(r => r || null),
        getAll: async (store, tenantId = null) => {
          const rows = (await wrap(transaction.objectStore(store).getAll())) || [];
          return tenantId ? rows.filter(r => r.tenantId === tenantId) : rows;
        },
        put: async (store, item) => {
          if (!item.id) item.id = this.genId(store);
          if (!item.fechaCreacion) item.fechaCreacion = new Date().toISOString();
          else item.fechaModificacion = new Date().toISOString();
          await wrap(transaction.objectStore(store).put(item));
          return item;
        },
        delete: (store, id) => wrap(transaction.objectStore(store).delete(id)),
        /**
         * Consecutivo secuencial por empresa y tipo de documento.
         * Se guarda en system_params y avanza dentro de la misma transacción.
         */
        nextSequence: async (tenantId, key, start = 1) => {
          if (!storeNames.includes(STORES.SYSTEM_PARAMS)) {
            throw new Error('nextSequence requiere incluir system_params en la transacción.');
          }
          const id = `seq_${tenantId}_${key}`;
          const row = (await wrap(transaction.objectStore(STORES.SYSTEM_PARAMS).get(id))) ||
            { id, tenantId, tipo: 'SECUENCIA', clave: key, valor: start - 1 };
          row.valor = Number(row.valor || 0) + 1;
          await wrap(transaction.objectStore(STORES.SYSTEM_PARAMS).put(row));
          return row.valor;
        },
        abort: (message) => {
          workError = new Error(message);
          try { transaction.abort(); } catch (e) { /* ya cerrada */ }
          throw workError;
        }
      };

      transaction.oncomplete = () => { this._touch(); resolve(result); };
      transaction.onabort = () => reject(workError || transaction.error || new Error('Transacción cancelada.'));
      transaction.onerror = () => { /* se maneja en onabort */ };

      Promise.resolve()
        .then(() => work(tx))
        .then(r => { result = r; })
        .catch(err => {
          workError = workError || err;
          try { transaction.abort(); } catch (e) { /* ya cerrada */ }
        });
    });
  }

  /**
   * Lee un parámetro del sistema (system_params) por id
   */
  async getParam(id, defaultValue = null) {
    const row = await this.getById(STORES.SYSTEM_PARAMS, id);
    return row ? row.valor : defaultValue;
  }

  async setParam(id, valor, tenantId = null) {
    const row = (await this.getById(STORES.SYSTEM_PARAMS, id)) || { id, tenantId };
    row.valor = valor;
    return this.update(STORES.SYSTEM_PARAMS, row);
  }

  /**
   * Exporta toda la base de datos a un objeto JSON
   */
  async exportBackup() {
    await this.init();
    const backup = {
      app: 'NexaAdmin',
      version: DB_VERSION,
      timestamp: new Date().toISOString(),
      stores: {}
    };

    for (const name of Object.values(STORES)) {
      backup.stores[name] = await this.getAll(name);
    }
    return backup;
  }

  /**
   * Descarga un respaldo JSON completo.
   */
  async downloadAutoBackup(triggerName = 'Auto') {
    try {
      const backupData = await this.exportBackup();
      const blob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-');

      const a = document.createElement('a');
      a.href = url;
      a.download = `NexaERP_CopiaSeguridad_${triggerName}_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return true;
    } catch (e) {
      console.error('Error generando copia de seguridad automática:', e);
      return false;
    }
  }

  /**
   * Valida la estructura de un respaldo antes de restaurarlo.
   * Devuelve un resumen { tablas, registros } o lanza error.
   */
  validateBackup(backupData) {
    if (!backupData || typeof backupData !== 'object' || !backupData.stores || typeof backupData.stores !== 'object') {
      throw new Error('Formato de archivo de respaldo inválido o corrupto.');
    }
    const known = Object.values(STORES);
    let registros = 0;
    const tablas = [];
    for (const [name, items] of Object.entries(backupData.stores)) {
      if (!known.includes(name)) continue;
      if (!Array.isArray(items)) throw new Error(`La tabla "${name}" no es una lista válida.`);
      for (const it of items) {
        if (!it || typeof it !== 'object' || typeof it.id !== 'string' || !it.id) {
          throw new Error(`La tabla "${name}" contiene registros sin identificador válido.`);
        }
      }
      tablas.push(name);
      registros += items.length;
    }
    if (!backupData.stores[STORES.TENANTS] || backupData.stores[STORES.TENANTS].length === 0) {
      throw new Error('El respaldo no contiene ninguna empresa.');
    }
    return { tablas, registros };
  }

  /**
   * Restaura un respaldo REEMPLAZANDO por completo la información actual.
   * Es atómico: si algo falla, la base de datos queda como estaba.
   * (La fusión parcial entre terminales corrompía stock, saldos y turnos.)
   */
  async restoreBackup(backupData) {
    this.validateBackup(backupData);
    await this.init();
    const storeNames = Object.values(STORES).filter(n => this.db.objectStoreNames.contains(n));

    await new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeNames, 'readwrite');
      transaction.oncomplete = () => resolve(true);
      transaction.onabort = () => reject(transaction.error || new Error('Restauración cancelada.'));
      for (const name of storeNames) {
        const store = transaction.objectStore(name);
        store.clear();
        const items = backupData.stores[name];
        if (Array.isArray(items)) items.forEach(item => store.put(item));
      }
    });
    return true;
  }
}

export const DB = new DBService();
