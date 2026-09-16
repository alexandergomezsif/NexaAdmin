/**
 * Nexa ERP - Servicio de Persistencia IndexedDB
 * Capa de abstracción de datos relacional/asíncrona para almacenamiento local
 * Preparada para reemplazo transparente por REST/GraphQL API
 */

const DB_NAME = 'NexaERP_DB';
const DB_VERSION = 2;

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
  SYSTEM_PARAMS: 'system_params'
};

class DBService {
  constructor() {
    this.db = null;
    this.initPromise = null;
  }

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
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('Error al abrir IndexedDB:', event.target.error);
        reject(event.target.error);
      };
    });

    return this.initPromise;
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
   * Agrega un nuevo registro generando UUID si no tiene id
   */
  async add(storeName, item) {
    await this.init();
    if (!item.id) {
      item.id = (storeName.substring(0, 3) + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)).toLowerCase();
    }
    if (!item.fechaCreacion) {
      item.fechaCreacion = new Date().toISOString();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => resolve(item);
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
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve(item);
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
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
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

      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);

      items.forEach(item => {
        if (!item.id) {
          item.id = (storeName.substring(0, 3) + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7)).toLowerCase();
        }
        store.put(item); // Usa put para soportar upsert
      });
    });
  }

  /**
   * Exporta toda la base de datos a un objeto JSON
   */
  async exportBackup() {
    await this.init();
    const backup = {
      version: DB_VERSION,
      timestamp: new Date().toISOString(),
      stores: {}
    };

    const storeNames = Object.values(STORES);
    for (const name of storeNames) {
      backup.stores[name] = await this.getAll(name);
    }

    return backup;
  }

  /**
   * Genera y fuerza la descarga automática de un archivo JSON de respaldo.
   * Utilizado para respaldos automáticos por seguridad.
   */
  async downloadAutoBackup(triggerName = 'Auto') {
    try {
      const backupData = await this.exportBackup();
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `NexaERP_CopiaSeguridad_${triggerName}_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generando copia de seguridad automática:', e);
    }
  }

  /**
   * Restaura la información desde un objeto de backup JSON
   */
  async restoreBackup(backupData) {
    if (!backupData || !backupData.stores) {
      throw new Error('Formato de archivo de respaldo inválido o corrupto.');
    }

    await this.init();
    const storeNames = Object.keys(backupData.stores);

    for (const name of storeNames) {
      if (Object.values(STORES).includes(name)) {
        const items = backupData.stores[name];
        if (Array.isArray(items) && items.length > 0) {
          await this.bulkAdd(name, items);
        }
      }
    }

    return true;
  }
}

export const DB = new DBService();
