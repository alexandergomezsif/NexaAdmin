(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // js/utils/formatters.js
  var Formatters, esc;
  var init_formatters = __esm({
    "js/utils/formatters.js"() {
      Formatters = {
        /**
         * Formatea un valor numérico a Pesos Colombianos (COP) sin decimales o con decimales según se requiera
         * Ejemplo: 45000 -> "$ 45.000"
         */
        currency(value, decimals = 0) {
          if (value === null || value === void 0 || isNaN(value)) {
            return "$ 0";
          }
          const num = Number(value);
          return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
          }).format(num);
        },
        /**
         * Formato numérico estándar con separadores de miles
         */
        number(value, decimals = 0) {
          if (value === null || value === void 0 || isNaN(value)) {
            return "0";
          }
          return new Intl.NumberFormat("es-CO", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
          }).format(Number(value));
        },
        /**
         * Formato de fecha legible (ej: 12 sep 2026)
         */
        date(dateStr) {
          if (!dateStr)
            return "-";
          const date = new Date(dateStr);
          if (isNaN(date.getTime()))
            return dateStr;
          return new Intl.DateTimeFormat("es-CO", {
            day: "2-digit",
            month: "short",
            year: "numeric"
          }).format(date);
        },
        /**
         * Formato de fecha y hora (ej: 12 sep 2026, 03:42 p. m.)
         */
        dateTime(dateStr) {
          if (!dateStr)
            return "-";
          const date = new Date(dateStr);
          if (isNaN(date.getTime()))
            return dateStr;
          return new Intl.DateTimeFormat("es-CO", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          }).format(date);
        },
        /**
         * Formato de fecha para inputs tipo date (YYYY-MM-DD)
         */
        toInputDate(date = /* @__PURE__ */ new Date()) {
          const d = new Date(date);
          const month = "" + (d.getMonth() + 1);
          const day = "" + d.getDate();
          const year = d.getFullYear();
          return [year, month.padStart(2, "0"), day.padStart(2, "0")].join("-");
        },
        /**
         * Limpia un string de moneda y retorna un float
         * Ejemplo: "$ 45.000" -> 45000
         */
        parseCurrency(str) {
          if (typeof str === "number")
            return str;
          if (!str)
            return 0;
          const clean = str.toString().replace(/[^0-9,-]/g, "").replace(",", ".");
          return parseFloat(clean) || 0;
        },
        /**
         * Saneamiento de cadenas HTML para evitar vulnerabilidades XSS
         * Fundamental al renderizar datos provenientes de JSON externos.
         */
        escapeHTML(str) {
          if (str === null || str === void 0)
            return "";
          return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
        }
      };
      esc = (v) => Formatters.escapeHTML(v);
    }
  });

  // js/components/toast.js
  var ToastManager, Toast;
  var init_toast = __esm({
    "js/components/toast.js"() {
      init_formatters();
      ToastManager = class {
        constructor() {
          this.container = null;
          this.init();
        }
        init() {
          if (!this.container || !document.body.contains(this.container)) {
            this.container = document.createElement("div");
            this.container.className = "toast-container";
            document.body.appendChild(this.container);
          }
        }
        show({ title, message, type = "info", duration = 3500 }) {
          this.init();
          const toast = document.createElement("div");
          toast.className = `toast toast-${type}`;
          const iconMap = {
            success: "\u2713",
            danger: "\u2715",
            warning: "\u26A0",
            info: "\u2139"
          };
          toast.innerHTML = `
      <div style="font-weight: bold; font-size: 16px; line-height: 1;">${iconMap[type] || "\u2139"}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${esc(title)}</div>` : ""}
        <div class="toast-message">${esc(message)}</div>
      </div>
      <button style="background: none; border: none; font-size: 16px; color: #94a3b8; cursor: pointer;">&times;</button>
    `;
          toast.querySelector("button").addEventListener("click", () => {
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
          toast.style.opacity = "0";
          toast.style.transform = "translateX(100%)";
          toast.style.transition = "all 0.2s ease-out";
          setTimeout(() => {
            if (toast.parentElement) {
              toast.parentElement.removeChild(toast);
            }
          }, 200);
        }
        success(message, title = "Operaci\xF3n Exitosa") {
          this.show({ title, message, type: "success" });
        }
        error(message, title = "Error") {
          this.show({ title, message, type: "danger", duration: 5e3 });
        }
        warning(message, title = "Atenci\xF3n") {
          this.show({ title, message, type: "warning" });
        }
        info(message, title = "Informaci\xF3n") {
          this.show({ title, message, type: "info" });
        }
      };
      Toast = new ToastManager();
    }
  });

  // js/services/export-service.js
  var export_service_exports = {};
  __export(export_service_exports, {
    ExportService: () => ExportService
  });
  var ExportService;
  var init_export_service = __esm({
    "js/services/export-service.js"() {
      init_formatters();
      init_toast();
      ExportService = {
        /**
         * Exporta un array de objetos a CSV / Excel
         * @param {Array} data - Array de objetos planos
         * @param {string} filename - Nombre del archivo sin extensión
         * @param {Array} headers - Map de claves a títulos legibles ej: { sku: 'Código SKU', nombre: 'Nombre' }
         */
        exportToCSV(data, filename = "reporte", headers = null) {
          if (!data || !data.length) {
            Toast.warning("No hay datos disponibles para exportar.");
            return;
          }
          const keys = headers ? Object.keys(headers) : Object.keys(data[0]);
          const headerTitles = headers ? Object.values(headers) : keys;
          let csvContent = "\uFEFF";
          csvContent += headerTitles.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(";") + "\r\n";
          data.forEach((row) => {
            const line = keys.map((k) => {
              let val = row[k];
              if (val === null || val === void 0)
                val = "";
              if (typeof val === "object")
                val = JSON.stringify(val);
              return `"${String(val).replace(/"/g, '""')}"`;
            }).join(";");
            csvContent += line + "\r\n";
          });
          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", `${filename}_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        },
        /**
         * Imprime un documento membretado en ventana emergente o dispara el diálogo de impresión PDF
         * Cuenta con fallback transparente a iframe oculto para evitar bloqueos por pop-up blocker.
         */
        printDocument(htmlContent, title = "Documento Nexa ERP") {
          const fullHtml = `<!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @page { size: letter; margin: 12mm; }
          body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            color: #1e293b;
            background: #fff;
            margin: 0;
            padding: 16px;
            font-size: 13px;
            line-height: 1.4;
          }
          .doc-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0071e3;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .doc-brand h1 { margin: 0 0 5px 0; font-size: 20px; color: #0f172a; }
          .doc-brand p { margin: 2px 0; color: #64748b; font-size: 12px; }
          .doc-meta { text-align: right; }
          .doc-badge {
            display: inline-block;
            background: #e0f2fe;
            color: #0369a1;
            font-weight: 700;
            font-size: 14px;
            padding: 4px 10px;
            border-radius: 6px;
            margin-bottom: 6px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
          }
          th {
            background: #f8fafc;
            color: #475569;
            font-weight: 600;
            text-align: left;
            padding: 8px 10px;
            border-bottom: 1px solid #cbd5e1;
            font-size: 12px;
          }
          td {
            padding: 8px 10px;
            border-bottom: 1px solid #f1f5f9;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .doc-totals {
            margin-left: auto;
            width: 320px;
            border-top: 1px solid #cbd5e1;
            padding-top: 10px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
          }
          .total-row.grand-total {
            font-size: 16px;
            font-weight: 700;
            color: #0071e3;
            border-top: 2px solid #0071e3;
            margin-top: 6px;
            padding-top: 6px;
          }
          .doc-footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px dashed #cbd5e1;
            font-size: 11px;
            color: #94a3b8;
            text-align: center;
          }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0 !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 15px; text-align: right;">
          <button onclick="window.print()" style="padding: 9px 20px; background: #0071e3; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 13px; box-shadow: 0 2px 6px rgba(0,113,227,0.3);">
            \u{1F5A8}\uFE0F Imprimir / Guardar en PDF
          </button>
        </div>
        ${htmlContent}
      </body>
      </html>
    `;
          let printWindow = null;
          try {
            printWindow = window.open("", "_blank", "width=880,height=920");
          } catch (e) {
            printWindow = null;
          }
          if (printWindow && !printWindow.closed) {
            try {
              printWindow.document.open();
              printWindow.document.write(fullHtml);
              printWindow.document.close();
              printWindow.focus();
              setTimeout(() => {
                try {
                  printWindow.print();
                } catch (err) {
                }
              }, 400);
              return;
            } catch (err) {
              console.warn("Fallback a iframe de impresi\xF3n por restricci\xF3n de ventana:", err);
            }
          }
          const iframe = document.createElement("iframe");
          iframe.style.position = "fixed";
          iframe.style.right = "0";
          iframe.style.bottom = "0";
          iframe.style.width = "0";
          iframe.style.height = "0";
          iframe.style.border = "0";
          document.body.appendChild(iframe);
          const iframeDoc = iframe.contentWindow.document;
          iframeDoc.open();
          iframeDoc.write(fullHtml);
          iframeDoc.close();
          setTimeout(() => {
            try {
              iframe.contentWindow.focus();
              iframe.contentWindow.print();
            } catch (e) {
              console.error("Error al imprimir desde iframe:", e);
            }
            setTimeout(() => {
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
            }, 5e3);
          }, 400);
        }
      };
    }
  });

  // js/services/db-service.js
  var DB_NAME = "NexaERP_DB";
  var DB_VERSION = 3;
  var STORES = {
    TENANTS: "tenants",
    USERS: "users",
    PRICE_LISTS: "price_lists",
    WAREHOUSES: "warehouses",
    PRODUCTS: "products",
    KARDEX: "kardex",
    RECIPES_BOM: "recipes_bom",
    PRODUCTION_ORDERS: "production_orders",
    CUSTOMERS: "customers",
    SUPPLIERS: "suppliers",
    SALES: "sales",
    PURCHASES: "purchases",
    ORDERS_SHIPPING: "orders_shipping",
    CASH_SHIFTS: "cash_shifts",
    CASH_MOVEMENTS: "cash_movements",
    EXPENSES: "expenses",
    RECEIVABLES_CXC: "receivables_cxc",
    PAYABLES_CXP: "payables_cxp",
    AUDIT_LOGS: "audit_logs",
    SYSTEM_PARAMS: "system_params",
    ATTACHMENTS: "attachments"
  };
  var DBService = class {
    constructor() {
      this.db = null;
      this.initPromise = null;
      this.changeSeq = 0;
    }
    /** Marca que la base de datos cambió (escrituras confirmadas). */
    _touch() {
      this.changeSeq++;
    }
    /**
     * Inicializa y abre la base de datos IndexedDB
     */
    async init() {
      if (this.db)
        return this.db;
      if (this.initPromise)
        return this.initPromise;
      this.initPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          const createStore = (name, keyPath = "id", indexes = []) => {
            if (!db.objectStoreNames.contains(name)) {
              const store = db.createObjectStore(name, { keyPath });
              indexes.forEach((idx) => {
                store.createIndex(idx.name, idx.key, { unique: !!idx.unique });
              });
            }
          };
          createStore(STORES.TENANTS, "id");
          createStore(STORES.USERS, "id", [
            { name: "tenantId", key: "tenantId" },
            { name: "usuario", key: "usuario", unique: false }
          ]);
          createStore(STORES.PRICE_LISTS, "id", [{ name: "tenantId", key: "tenantId" }]);
          createStore(STORES.WAREHOUSES, "id", [{ name: "tenantId", key: "tenantId" }]);
          createStore(STORES.PRODUCTS, "id", [
            { name: "tenantId", key: "tenantId" },
            { name: "sku", key: "sku" },
            { name: "tipoItem", key: "tipoItem" }
          ]);
          createStore(STORES.KARDEX, "id", [
            { name: "tenantId", key: "tenantId" },
            { name: "productoId", key: "productoId" },
            { name: "fecha", key: "fecha" }
          ]);
          createStore(STORES.RECIPES_BOM, "id", [
            { name: "tenantId", key: "tenantId" },
            { name: "productoTerminadoId", key: "productoTerminadoId" }
          ]);
          createStore(STORES.PRODUCTION_ORDERS, "id", [
            { name: "tenantId", key: "tenantId" },
            { name: "estado", key: "estado" }
          ]);
          createStore(STORES.CUSTOMERS, "id", [
            { name: "tenantId", key: "tenantId" },
            { name: "nitCc", key: "nitCc" }
          ]);
          createStore(STORES.SUPPLIERS, "id", [
            { name: "tenantId", key: "tenantId" },
            { name: "nitCc", key: "nitCc" }
          ]);
          createStore(STORES.SALES, "id", [
            { name: "tenantId", key: "tenantId" },
            { name: "fecha", key: "fecha" },
            { name: "clienteId", key: "clienteId" }
          ]);
          createStore(STORES.PURCHASES, "id", [
            { name: "tenantId", key: "tenantId" },
            { name: "fecha", key: "fecha" }
          ]);
          createStore(STORES.ORDERS_SHIPPING, "id", [
            { name: "tenantId", key: "tenantId" },
            { name: "estadoCiclo", key: "estadoCiclo" }
          ]);
          createStore(STORES.CASH_SHIFTS, "id", [
            { name: "tenantId", key: "tenantId" },
            { name: "estado", key: "estado" }
          ]);
          createStore(STORES.CASH_MOVEMENTS, "id", [
            { name: "tenantId", key: "tenantId" },
            { name: "turnoId", key: "turnoId" }
          ]);
          createStore(STORES.EXPENSES, "id", [
            { name: "tenantId", key: "tenantId" },
            { name: "fecha", key: "fecha" }
          ]);
          createStore(STORES.RECEIVABLES_CXC, "id", [
            { name: "tenantId", key: "tenantId" },
            { name: "clienteId", key: "clienteId" },
            { name: "estado", key: "estado" }
          ]);
          createStore(STORES.PAYABLES_CXP, "id", [
            { name: "tenantId", key: "tenantId" },
            { name: "proveedorId", key: "proveedorId" },
            { name: "estado", key: "estado" }
          ]);
          createStore(STORES.AUDIT_LOGS, "id", [
            { name: "tenantId", key: "tenantId" },
            { name: "fecha", key: "fecha" },
            { name: "modulo", key: "modulo" }
          ]);
          createStore(STORES.SYSTEM_PARAMS, "id", [{ name: "tenantId", key: "tenantId" }]);
          createStore(STORES.ATTACHMENTS, "id", [
            { name: "tenantId", key: "tenantId" },
            { name: "refId", key: "refId" }
          ]);
        };
        request.onsuccess = (event) => {
          this.db = event.target.result;
          this.db.onversionchange = () => {
            this.db.close();
            this.db = null;
            this.initPromise = null;
          };
          resolve(this.db);
        };
        request.onblocked = () => {
          console.warn("IndexedDB bloqueada: hay otra pesta\xF1a de NexaAdmin abierta con una versi\xF3n anterior.");
          if (typeof window !== "undefined" && typeof window.__nexaBootMessage === "function") {
            window.__nexaBootMessage(
              "Cierre las otras pesta\xF1as de NexaAdmin",
              "Hay otra pesta\xF1a o ventana con NexaAdmin abierta (versi\xF3n anterior) y est\xE1 bloqueando la actualizaci\xF3n de la base de datos. Ci\xE9rrela y esta p\xE1gina continuar\xE1 sola. Si no contin\xFAa, rec\xE1rguela (F5)."
            );
          }
        };
        request.onerror = (event) => {
          console.error("Error al abrir IndexedDB:", event.target.error);
          if (typeof window !== "undefined" && window.__nexaBootMessage) {
            window.__nexaBootMessage(
              "El navegador no permiti\xF3 abrir la base de datos",
              `${event.target.error && event.target.error.message || "Error desconocido"}. En Brave: haga clic en el icono del le\xF3n y desactive los escudos para esta p\xE1gina, o use Chrome/Edge.`,
              true
            );
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
      const rnd = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID().replace(/-/g, "").substring(0, 12) : Math.random().toString(36).substring(2, 14);
      return `${storeName.substring(0, 3)}_${Date.now()}_${rnd}`.toLowerCase();
    }
    /**
     * Obtiene todos los registros de una tabla, filtrados por tenantId opcional
     */
    async getAll(storeName, tenantId = null) {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => {
          let results = request.result || [];
          if (tenantId && storeName !== STORES.TENANTS) {
            results = results.filter((item) => item.tenantId === tenantId);
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
        const store = this.db.transaction([storeName], "readonly").objectStore(storeName);
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
        const transaction = this.db.transaction([storeName], "readonly");
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
      if (!item.id)
        item.id = this.genId(storeName);
      if (!item.fechaCreacion)
        item.fechaCreacion = (/* @__PURE__ */ new Date()).toISOString();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], "readwrite");
        const request = transaction.objectStore(storeName).put(item);
        request.onsuccess = () => {
          this._touch();
          resolve(item);
        };
        request.onerror = () => reject(request.error);
      });
    }
    /**
     * Actualiza un registro existente
     */
    async update(storeName, item) {
      await this.init();
      item.fechaModificacion = (/* @__PURE__ */ new Date()).toISOString();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], "readwrite");
        const request = transaction.objectStore(storeName).put(item);
        request.onsuccess = () => {
          this._touch();
          resolve(item);
        };
        request.onerror = () => reject(request.error);
      });
    }
    /**
     * Elimina un registro por ID
     */
    async delete(storeName, id) {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], "readwrite");
        const request = transaction.objectStore(storeName).delete(id);
        request.onsuccess = () => {
          this._touch();
          resolve(true);
        };
        request.onerror = () => reject(request.error);
      });
    }
    /**
     * Inserta un lote de registros (útil para seeds e importación)
     */
    async bulkAdd(storeName, items) {
      await this.init();
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        transaction.oncomplete = () => {
          this._touch();
          resolve(true);
        };
        transaction.onerror = () => reject(transaction.error);
        items.forEach((item) => {
          if (!item.id)
            item.id = this.genId(storeName);
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
        const transaction = this.db.transaction(storeNames, "readwrite");
        let result;
        let workError = null;
        const wrap = (request) => new Promise((res, rej) => {
          request.onsuccess = () => res(request.result);
          request.onerror = () => rej(request.error);
        });
        const tx = {
          get: (store, id) => wrap(transaction.objectStore(store).get(id)).then((r) => r || null),
          getAll: async (store, tenantId = null) => {
            const rows = await wrap(transaction.objectStore(store).getAll()) || [];
            return tenantId ? rows.filter((r) => r.tenantId === tenantId) : rows;
          },
          put: async (store, item) => {
            if (!item.id)
              item.id = this.genId(store);
            if (!item.fechaCreacion)
              item.fechaCreacion = (/* @__PURE__ */ new Date()).toISOString();
            else
              item.fechaModificacion = (/* @__PURE__ */ new Date()).toISOString();
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
              throw new Error("nextSequence requiere incluir system_params en la transacci\xF3n.");
            }
            const id = `seq_${tenantId}_${key}`;
            const row = await wrap(transaction.objectStore(STORES.SYSTEM_PARAMS).get(id)) || { id, tenantId, tipo: "SECUENCIA", clave: key, valor: start - 1 };
            row.valor = Number(row.valor || 0) + 1;
            await wrap(transaction.objectStore(STORES.SYSTEM_PARAMS).put(row));
            return row.valor;
          },
          abort: (message) => {
            workError = new Error(message);
            try {
              transaction.abort();
            } catch (e) {
            }
            throw workError;
          }
        };
        transaction.oncomplete = () => {
          this._touch();
          resolve(result);
        };
        transaction.onabort = () => reject(workError || transaction.error || new Error("Transacci\xF3n cancelada."));
        transaction.onerror = () => {
        };
        Promise.resolve().then(() => work(tx)).then((r) => {
          result = r;
        }).catch((err) => {
          workError = workError || err;
          try {
            transaction.abort();
          } catch (e) {
          }
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
      const row = await this.getById(STORES.SYSTEM_PARAMS, id) || { id, tenantId };
      row.valor = valor;
      return this.update(STORES.SYSTEM_PARAMS, row);
    }
    /**
     * Exporta toda la base de datos a un objeto JSON
     */
    async exportBackup() {
      await this.init();
      const backup = {
        app: "NexaAdmin",
        version: DB_VERSION,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
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
    async downloadAutoBackup(triggerName = "Auto") {
      try {
        const backupData = await this.exportBackup();
        const blob = new Blob([JSON.stringify(backupData)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const dateStr = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
        const a = document.createElement("a");
        a.href = url;
        a.download = `NexaERP_CopiaSeguridad_${triggerName}_${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2e3);
        return true;
      } catch (e) {
        console.error("Error generando copia de seguridad autom\xE1tica:", e);
        return false;
      }
    }
    /**
     * Valida la estructura de un respaldo antes de restaurarlo.
     * Devuelve un resumen { tablas, registros } o lanza error.
     */
    validateBackup(backupData) {
      if (!backupData || typeof backupData !== "object" || !backupData.stores || typeof backupData.stores !== "object") {
        throw new Error("Formato de archivo de respaldo inv\xE1lido o corrupto.");
      }
      const known = Object.values(STORES);
      let registros = 0;
      const tablas = [];
      for (const [name, items] of Object.entries(backupData.stores)) {
        if (!known.includes(name))
          continue;
        if (!Array.isArray(items))
          throw new Error(`La tabla "${name}" no es una lista v\xE1lida.`);
        for (const it of items) {
          if (!it || typeof it !== "object" || typeof it.id !== "string" || !it.id) {
            throw new Error(`La tabla "${name}" contiene registros sin identificador v\xE1lido.`);
          }
        }
        tablas.push(name);
        registros += items.length;
      }
      if (!backupData.stores[STORES.TENANTS] || backupData.stores[STORES.TENANTS].length === 0) {
        throw new Error("El respaldo no contiene ninguna empresa.");
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
      const storeNames = Object.values(STORES).filter((n) => this.db.objectStoreNames.contains(n));
      await new Promise((resolve, reject) => {
        const transaction = this.db.transaction(storeNames, "readwrite");
        transaction.oncomplete = () => resolve(true);
        transaction.onabort = () => reject(transaction.error || new Error("Restauraci\xF3n cancelada."));
        for (const name of storeNames) {
          const store = transaction.objectStore(name);
          store.clear();
          const items = backupData.stores[name];
          if (Array.isArray(items))
            items.forEach((item) => store.put(item));
        }
      });
      return true;
    }
  };
  var DB = new DBService();

  // js/data/seed-rayopro.js
  var RAYO_PRO_TENANT_ID = "tenant_rayopro";
  var ALT_DEMO_TENANT_ID = "tenant_autobrillo";
  var SeedData = {
    tenants: [
      {
        id: RAYO_PRO_TENANT_ID,
        nombreComercial: "Rayo Pro",
        razonSocial: "Rayo Pro Colombia S.A.S.",
        nit: "901458321",
        dv: 4,
        tipoPersona: "JURIDICA",
        regimen: "Responsable de IVA",
        direccion: "Carrera 42 # 54A - 77, Zona Industrial",
        ciudad: "Itag\xFC\xED",
        departamento: "Antioquia",
        telefono: "(604) 444 8920",
        whatsapp: "+573124567890",
        email: "contacto@rayopro.com.co",
        sitioWeb: "https://rayopro.com.co",
        isotipoLightUrl: "datos/isotipo fondo blanco.jpg",
        isotipoDarkUrl: "datos/isotipo fondo negro.jpg",
        logoHorizontalLightUrl: "datos/logo+isotipo.jpg",
        logoHorizontalDarkUrl: "datos/isotipo + logo fondo negro.jpg",
        membreteUrl: "",
        logoUrl: "datos/logo+isotipo.jpg",
        faviconUrl: "datos/isotipo fondo blanco.jpg",
        firmaUrl: "datos/firma juan.jpg",
        colores: {
          primary: "#0071e3",
          // Azul Apple / Rayo Pro moderno
          primaryHover: "#0077ed",
          secondary: "#f59e0b",
          accent: "#0071e3"
        },
        resolucionFacturacion: "",
        moneda: "COP",
        esDemo: false
      },
      {
        id: ALT_DEMO_TENANT_ID,
        nombreComercial: "AutoBrillo Colombia",
        razonSocial: "AutoBrillo Car Care S.A.S.",
        nit: "900874125",
        dv: 8,
        tipoPersona: "JURIDICA",
        regimen: "Responsable de IVA",
        direccion: "Calle 13 # 68D - 12",
        ciudad: "Bogot\xE1 D.C.",
        departamento: "Cundinamarca",
        telefono: "(601) 745 2200",
        whatsapp: "+573108889900",
        email: "administracion@autobrillo.co",
        sitioWeb: "https://autobrillo.co",
        logoUrl: "",
        faviconUrl: "",
        colores: {
          primary: "#34c759",
          // Verde iOS
          primaryHover: "#2db84d",
          secondary: "#ff9500",
          accent: "#34c759"
        },
        resolucionFacturacion: "",
        moneda: "COP",
        esDemo: true
      }
    ],
    price_lists: [
      { id: "plist_1", codigo: "P1", incluyeIva: true, tenantId: RAYO_PRO_TENANT_ID, nombre: "P1 - Precio P\xFAblico / Final", descripcion: "Mostrador y consumidor particular", esDefecto: true, orden: 1 },
      { id: "plist_2", codigo: "P2", incluyeIva: false, tenantId: RAYO_PRO_TENANT_ID, nombre: "P2 - Precio Lavaderos / Taller", descripcion: "Autolavados y centros de detailing", esDefecto: false, orden: 2 },
      { id: "plist_3", codigo: "P3", incluyeIva: false, tenantId: RAYO_PRO_TENANT_ID, nombre: "P3 - Precio Mayorista (Docenas)", descripcion: "Compras por cajas completas x 12 unidades", esDefecto: false, orden: 3 },
      { id: "plist_4", codigo: "P4", incluyeIva: false, tenantId: RAYO_PRO_TENANT_ID, nombre: "P4 - Precio Distribuidor Autorizado", descripcion: "Almacenes y distribuidores regionales", esDefecto: false, orden: 4 },
      { id: "plist_5", codigo: "P5", incluyeIva: false, tenantId: RAYO_PRO_TENANT_ID, nombre: "P5 - Precio Especial Cano Trucks", descripcion: "Tarifa preferencial convenio flotas", esDefecto: false, orden: 5 }
    ],
    warehouses: [
      { id: "wh_1", tenantId: RAYO_PRO_TENANT_ID, codigo: "BOD-01", nombre: "Bodega Principal & Despachos", direccion: "Carrera 42 # 54A - 77 Itag\xFC\xED", esPrincipal: true, estado: "ACTIVO" },
      { id: "wh_2", tenantId: RAYO_PRO_TENANT_ID, codigo: "BOD-02", nombre: "Planta de Producci\xF3n & Reactores", direccion: "\xC1rea de Envasado Nave B", esPrincipal: false, estado: "ACTIVO" },
      { id: "wh_3", tenantId: RAYO_PRO_TENANT_ID, codigo: "BOD-03", nombre: "Punto de Venta / Mostrador", direccion: "Mostrador de atenci\xF3n y retail", esPrincipal: false, estado: "ACTIVO" }
    ],
    // Sin usuarios precargados: el primer arranque pide crear el administrador con su propia contraseña.
    users: [],
    // CATÁLOGO REAL EXTRAÍDO DEL EXCEL RAYO PRO
    products: [
      // 1. Desengrasante 1 Litro
      {
        id: "prod_deseng_1l",
        tenantId: RAYO_PRO_TENANT_ID,
        codigoInterno: "RAYO-001",
        sku: "DESENG-1L",
        codigoBarras: "7707123450011",
        nombre: "Desengrasante Automotriz 1 Litro",
        descripcion: "Desengrasante concentrado de alta eficacia para motor, rines y chasis. Empaque est\xE1ndar Caja x 12.",
        categoria: "Desengrasantes",
        subcategoria: "L\xEDnea Concentrada",
        marca: "Rayo Pro",
        presentacion: "Botella 1 Litro (Caja x 12)",
        unidadMedida: "Litro",
        tipoItem: "PRODUCTO_TERMINADO",
        costoPromedio: 8500,
        ultimoCosto: 8700,
        margenEsperado: 60,
        precios: {
          plist_1: 21e3,
          // Público
          plist_2: 18e3,
          // Taller
          plist_3: 15500,
          // Mayorista
          plist_4: 13500,
          // Distribuidor
          plist_5: 11130
          // Cano Trucks (47% Dcto)
        },
        stock: 144,
        // 12 cajas x 12
        stockMinimo: 24,
        stockMaximo: 500,
        bodegaId: "wh_1",
        estado: "ACTIVO"
      },
      // 2. Shampoo Desincrustante 1 Litro
      {
        id: "prod_shamp_desinc_1l",
        tenantId: RAYO_PRO_TENANT_ID,
        codigoInterno: "RAYO-002",
        sku: "SHAMP-DESINC-1L",
        codigoBarras: "7707123450028",
        nombre: "Shampoo Desincrustante 1 Litro",
        descripcion: "F\xF3rmula \xE1cida controlada para remover sarro, lluvia \xE1cida y marcas minerales de pintura y rines. Caja x 12.",
        categoria: "Lavado Exterior",
        subcategoria: "Desincrustantes",
        marca: "Rayo Pro",
        presentacion: "Botella 1 Litro (Caja x 12)",
        unidadMedida: "Litro",
        tipoItem: "PRODUCTO_TERMINADO",
        costoPromedio: 11500,
        ultimoCosto: 11800,
        margenEsperado: 64,
        precios: {
          plist_1: 32e3,
          plist_2: 26e3,
          plist_3: 22500,
          plist_4: 19500,
          plist_5: 15712
          // Cano Trucks (50.9% Dcto)
        },
        stock: 96,
        stockMinimo: 24,
        stockMaximo: 300,
        bodegaId: "wh_1",
        estado: "ACTIVO"
      },
      // 3. Metal Polish 500 ml
      {
        id: "prod_metal_polish",
        tenantId: RAYO_PRO_TENANT_ID,
        codigoInterno: "RAYO-003",
        sku: "METAL-POLISH-500",
        codigoBarras: "7707123450035",
        nombre: "Metal Polish Restaurador Metales 500 ml",
        descripcion: "Pasta pulidora abrillantadora para rines de aluminio, escapes cromados y tanques de tractomulas. Caja x 12.",
        categoria: "Brillo y Pulido",
        subcategoria: "Metales & Cromados",
        marca: "Rayo Pro",
        presentacion: "Envase 500 ml (Caja x 12)",
        unidadMedida: "Unidad",
        tipoItem: "PRODUCTO_TERMINADO",
        costoPromedio: 9200,
        ultimoCosto: 9400,
        margenEsperado: 67,
        precios: {
          plist_1: 28e3,
          plist_2: 23e3,
          plist_3: 19500,
          plist_4: 16500,
          plist_5: 12040
          // Cano Trucks (57% Dcto)
        },
        stock: 120,
        stockMinimo: 24,
        stockMaximo: 300,
        bodegaId: "wh_1",
        estado: "ACTIVO"
      },
      // 4. Desengrasante Multiusos 1 Litro
      {
        id: "prod_deseng_multi_1l",
        tenantId: RAYO_PRO_TENANT_ID,
        codigoInterno: "RAYO-004",
        sku: "DESENG-MULTI-1L",
        codigoBarras: "7707123450042",
        nombre: "Desengrasante Multiusos 1 Litro",
        descripcion: "Limpiador desengrasante bioactivo para tapicer\xEDa pesada, carcasas y superficies lavables.",
        categoria: "Desengrasantes",
        subcategoria: "L\xEDnea Multiusos",
        marca: "Rayo Pro",
        presentacion: "Botella 1 Litro (Caja x 12)",
        unidadMedida: "Litro",
        tipoItem: "PRODUCTO_TERMINADO",
        costoPromedio: 7800,
        ultimoCosto: 8e3,
        margenEsperado: 65,
        precios: {
          plist_1: 22e3,
          plist_2: 18500,
          plist_3: 16e3,
          plist_4: 14e3,
          plist_5: 12500
        },
        stock: 108,
        stockMinimo: 24,
        stockMaximo: 400,
        bodegaId: "wh_1",
        estado: "ACTIVO"
      },
      // 5. Desengrasante Multiusos 1 Galón
      {
        id: "prod_deseng_multi_1g",
        tenantId: RAYO_PRO_TENANT_ID,
        codigoInterno: "RAYO-005",
        sku: "DESENG-MULTI-1G",
        codigoBarras: "7707123450059",
        nombre: "Desengrasante Multiusos 1 Gal\xF3n (3.78 L)",
        descripcion: "Presentaci\xF3n gal\xF3n econ\xF3mico para talleres y empresas de transporte de carga.",
        categoria: "Desengrasantes",
        subcategoria: "L\xEDnea Multiusos",
        marca: "Rayo Pro",
        presentacion: "Gal\xF3n (3785 ml)",
        unidadMedida: "Gal\xF3n",
        tipoItem: "PRODUCTO_TERMINADO",
        costoPromedio: 19500,
        ultimoCosto: 2e4,
        margenEsperado: 59,
        precios: {
          plist_1: 48e3,
          plist_2: 39e3,
          plist_3: 34e3,
          plist_4: 3e4,
          plist_5: 27500
        },
        stock: 45,
        stockMinimo: 15,
        stockMaximo: 200,
        bodegaId: "wh_1",
        estado: "ACTIVO"
      },
      // 6. Shampoo Desincrustante Galón 4 Litros
      {
        id: "prod_shamp_desinc_4l",
        tenantId: RAYO_PRO_TENANT_ID,
        codigoInterno: "RAYO-006",
        sku: "SHAMP-DESINC-4L",
        codigoBarras: "7707123450066",
        nombre: "Shampoo Desincrustante Gal\xF3n 4 Litros",
        descripcion: "Desincrustante \xE1cido en gal\xF3n para flotas de tractomulas y buses intermunicipales.",
        categoria: "Lavado Exterior",
        subcategoria: "Desincrustantes",
        marca: "Rayo Pro",
        presentacion: "Gal\xF3n 4 Litros",
        unidadMedida: "Gal\xF3n",
        tipoItem: "PRODUCTO_TERMINADO",
        costoPromedio: 26e3,
        ultimoCosto: 26500,
        margenEsperado: 60,
        precios: {
          plist_1: 65e3,
          plist_2: 52e3,
          plist_3: 45e3,
          plist_4: 4e4,
          plist_5: 37e3
        },
        stock: 32,
        stockMinimo: 12,
        stockMaximo: 150,
        bodegaId: "wh_1",
        estado: "ACTIVO"
      },
      // 7. Garrafa x 23 Litros Shampoo Desincrustante
      {
        id: "prod_garrafa_shamp_23l",
        tenantId: RAYO_PRO_TENANT_ID,
        codigoInterno: "RAYO-007",
        sku: "GARRAFA-SHAMP-23L",
        codigoBarras: "7707123450073",
        nombre: "Garrafa Industrial x 23 Litros Shampoo Desincrustante",
        descripcion: "Presentaci\xF3n mayorista en garrafa pl\xE1stica azul de 23 litros para alto consumo en lavaderos de carga pesada.",
        categoria: "Industrial Gran Formato",
        subcategoria: "Desincrustantes",
        marca: "Rayo Pro",
        presentacion: "Garrafa 23 Litros",
        unidadMedida: "Garrafa",
        tipoItem: "PRODUCTO_TERMINADO",
        costoPromedio: 118e3,
        ultimoCosto: 12e4,
        margenEsperado: 58,
        precios: {
          plist_1: 28e4,
          plist_2: 225e3,
          plist_3: 195e3,
          plist_4: 175e3,
          plist_5: 16e4
        },
        stock: 14,
        stockMinimo: 5,
        stockMaximo: 50,
        bodegaId: "wh_1",
        estado: "ACTIVO"
      },
      // 8. Galón Desengrasante Todero
      {
        id: "prod_deseng_todero_1g",
        tenantId: RAYO_PRO_TENANT_ID,
        codigoInterno: "RAYO-008",
        sku: "DESENG-TODERO-1G",
        codigoBarras: "7707123450080",
        nombre: "Gal\xF3n Desengrasante Todero Automotriz",
        descripcion: "F\xF3rmula vers\xE1til de media concentraci\xF3n para lavado r\xE1pido de carrocer\xEDas y chasis.",
        categoria: "Desengrasantes",
        subcategoria: "L\xEDnea Todero",
        marca: "Rayo Pro",
        presentacion: "Gal\xF3n (3785 ml)",
        unidadMedida: "Gal\xF3n",
        tipoItem: "PRODUCTO_TERMINADO",
        costoPromedio: 18e3,
        ultimoCosto: 18500,
        margenEsperado: 61,
        precios: {
          plist_1: 46e3,
          plist_2: 37e3,
          plist_3: 32e3,
          plist_4: 28500,
          plist_5: 26e3
        },
        stock: 28,
        stockMinimo: 10,
        stockMaximo: 120,
        bodegaId: "wh_1",
        estado: "ACTIVO"
      },
      // 9. Desengrasante Todero 1 Litro
      {
        id: "prod_deseng_todero_1l",
        tenantId: RAYO_PRO_TENANT_ID,
        codigoInterno: "RAYO-009",
        sku: "DESENG-TODERO-1L",
        codigoBarras: "7707123450097",
        nombre: "Desengrasante Todero 1 Litro",
        descripcion: "Presentaci\xF3n 1 litro para mantenimiento diario de veh\xEDculos livianos y motos.",
        categoria: "Desengrasantes",
        subcategoria: "L\xEDnea Todero",
        marca: "Rayo Pro",
        presentacion: "Botella 1 Litro (Caja x 12)",
        unidadMedida: "Litro",
        tipoItem: "PRODUCTO_TERMINADO",
        costoPromedio: 6800,
        ultimoCosto: 7e3,
        margenEsperado: 64,
        precios: {
          plist_1: 19e3,
          plist_2: 15e3,
          plist_3: 13e3,
          plist_4: 11500,
          plist_5: 10200
        },
        stock: 72,
        stockMinimo: 24,
        stockMaximo: 300,
        bodegaId: "wh_1",
        estado: "ACTIVO"
      },
      // 10. Garrafa x 23 Litros Desengrasante Industrial
      {
        id: "prod_garrafa_deseng_23l",
        tenantId: RAYO_PRO_TENANT_ID,
        codigoInterno: "RAYO-010",
        sku: "GARRAFA-DESENG-23L",
        codigoBarras: "7707123450103",
        nombre: "Garrafa Industrial x 23 Litros Desengrasante",
        descripcion: "Desengrasante alcalino industrial de choque en garrafa de 23 litros para desengrase severo de quintas ruedas.",
        categoria: "Industrial Gran Formato",
        subcategoria: "Desengrasantes",
        marca: "Rayo Pro",
        presentacion: "Garrafa 23 Litros",
        unidadMedida: "Garrafa",
        tipoItem: "PRODUCTO_TERMINADO",
        costoPromedio: 105e3,
        ultimoCosto: 108e3,
        margenEsperado: 60,
        precios: {
          plist_1: 26e4,
          plist_2: 21e4,
          plist_3: 18e4,
          plist_4: 16e4,
          plist_5: 145e3
        },
        stock: 18,
        stockMinimo: 6,
        stockMaximo: 60,
        bodegaId: "wh_1",
        estado: "ACTIVO"
      },
      // 11. RayoBlack Partes Negras 500 ml
      {
        id: "prod_rayoblack_500",
        tenantId: RAYO_PRO_TENANT_ID,
        codigoInterno: "RAYO-011",
        sku: "RAYOBLACK-500",
        codigoBarras: "7707123450110",
        nombre: "RayoBlack Restaurador de Partes Negras 500 ml",
        descripcion: "Acondicionador cer\xE1mico polim\xE9rico negro para molduras, llantas y defensas pl\xE1sticas. Terminado seco.",
        categoria: "Acondicionadores",
        subcategoria: "Pl\xE1sticos y Llantas",
        marca: "Rayo Pro",
        presentacion: "Botella dosificadora 500 ml",
        unidadMedida: "Unidad",
        tipoItem: "PRODUCTO_TERMINADO",
        costoPromedio: 12500,
        ultimoCosto: 12800,
        margenEsperado: 64,
        precios: {
          plist_1: 35e3,
          plist_2: 28e3,
          plist_3: 24e3,
          plist_4: 21e3,
          plist_5: 18500
        },
        stock: 85,
        stockMinimo: 20,
        stockMaximo: 250,
        bodegaId: "wh_1",
        estado: "ACTIVO"
      },
      // MATERIAS PRIMAS QUÍMICAS Y EMPAQUES
      {
        id: "prod_mp_base_alcalina",
        tenantId: RAYO_PRO_TENANT_ID,
        codigoInterno: "MP-010",
        sku: "MP-BASE-ALCAL",
        nombre: "Base Desengrasante Alcalina Concentrada",
        categoria: "Materias Primas Qu\xEDmicas",
        unidadMedida: "Kg",
        tipoItem: "MATERIA_PRIMA",
        costoPromedio: 9200,
        stock: 850,
        stockMinimo: 200,
        bodegaId: "wh_2",
        estado: "ACTIVO"
      },
      {
        id: "prod_mp_acido_fluorhidrico",
        tenantId: RAYO_PRO_TENANT_ID,
        codigoInterno: "MP-011",
        sku: "MP-ACIDO-DESINC",
        nombre: "Compuesto Activo \xC1cido Desincrustante Grado Auto",
        categoria: "Materias Primas Qu\xEDmicas",
        unidadMedida: "Kg",
        tipoItem: "MATERIA_PRIMA",
        costoPromedio: 16800,
        stock: 420,
        stockMinimo: 100,
        bodegaId: "wh_2",
        estado: "ACTIVO"
      },
      {
        id: "prod_mp_envase_1l",
        tenantId: RAYO_PRO_TENANT_ID,
        codigoInterno: "EMP-010",
        sku: "EMP-BOTELLA-1L",
        nombre: "Botella PEAD 1 Litro Boca 28mm Blanca",
        categoria: "Material de Empaque",
        unidadMedida: "Unidad",
        tipoItem: "MATERIA_PRIMA",
        costoPromedio: 1100,
        stock: 1200,
        stockMinimo: 300,
        bodegaId: "wh_2",
        estado: "ACTIVO"
      },
      {
        id: "prod_mp_caja_12",
        tenantId: RAYO_PRO_TENANT_ID,
        codigoInterno: "EMP-012",
        sku: "EMP-CAJA-12",
        nombre: "Caja Cart\xF3n Corrugado Rayo Pro x 12 Unidades",
        categoria: "Material de Empaque",
        unidadMedida: "Unidad",
        tipoItem: "MATERIA_PRIMA",
        costoPromedio: 2200,
        stock: 350,
        stockMinimo: 80,
        bodegaId: "wh_2",
        estado: "ACTIVO"
      },
      {
        id: "prod_mp_garrafa_23l",
        tenantId: RAYO_PRO_TENANT_ID,
        codigoInterno: "EMP-023",
        sku: "EMP-GARRAFA-23L",
        nombre: "Garrafa Industrial PEAD 23 Litros Azul c/Tapa 60mm",
        categoria: "Material de Empaque",
        unidadMedida: "Unidad",
        tipoItem: "MATERIA_PRIMA",
        costoPromedio: 18500,
        stock: 65,
        stockMinimo: 20,
        bodegaId: "wh_2",
        estado: "ACTIVO"
      }
    ],
    // CLIENTES CON DATOS REALES EXTRAÍDOS DEL EXCEL
    customers: [
      {
        id: "cli_cano_trucks",
        tenantId: RAYO_PRO_TENANT_ID,
        codigo: "CLI-CANO",
        tipoCliente: "Flotas de Tractomulas / Carga Pesada",
        tipoPersona: "NATURAL",
        nombre: "Cliente Convenio Flotas (Demo)",
        razonSocial: "Cliente Convenio Flotas S.A.S. (Demo)",
        nitCc: "1000000001",
        dv: 1,
        facturaElectronica: false,
        // Cliente con acuerdo especial de remisión directa
        aplicaIva: false,
        // Precios preferenciales netos sin IVA (etapa inicial)
        telefono: "3000000001",
        whatsapp: "+573000000001",
        email: "flotas.demo@example.com",
        direccion: "Direcci\xF3n de ejemplo",
        barrio: "La Estaci\xF3n",
        ciudad: "La Tebaida",
        departamento: "Quind\xEDo",
        vendedorId: "usr_gerente",
        vendedorNombre: "Gerente General",
        listaPreciosId: "plist_5",
        // Tarifa Especial Cano Trucks
        cupoCredito: 3e7,
        diasCredito: 30,
        saldoPendiente: 19756e3,
        // $26.000.000 original - $4.244.000 (03 Sep) - $2.000.000 (09 Sep)
        totalComprado: 485e5,
        numeroCompras: 12,
        ultimaCompra: "2026-09-09",
        estado: "ACTIVO",
        observaciones: "Cliente VIP flotas del Quind\xEDo. Pedidos en Cajas x 12. Facturaci\xF3n por remisiones internas netas sin IVA."
      },
      {
        id: "cli_autospa",
        tenantId: RAYO_PRO_TENANT_ID,
        codigo: "CLI-002",
        tipoCliente: "Taller / Detailing",
        tipoPersona: "JURIDICA",
        nombre: "AutoSpa Premium Medell\xEDn",
        razonSocial: "AutoSpa Detailing SAS",
        nitCc: "901223445",
        dv: 1,
        facturaElectronica: true,
        // Factura Electrónica formal DIAN
        aplicaIva: true,
        // Responsable de IVA 19%
        telefono: "(604) 321 4455",
        whatsapp: "+573004561234",
        email: "gerencia@autospamedellin.co",
        direccion: "Calle 10 # 43E - 28 El Poblado",
        ciudad: "Medell\xEDn",
        departamento: "Antioquia",
        barrio: "El Poblado",
        vendedorId: "usr_vendedor",
        vendedorNombre: "Vendedor Principal",
        listaPreciosId: "plist_2",
        cupoCredito: 5e6,
        diasCredito: 30,
        saldoPendiente: 125e4,
        totalComprado: 1485e4,
        numeroCompras: 14,
        ultimaCompra: "2026-09-08",
        estado: "ACTIVO",
        observaciones: "Cliente frecuente VIP detailing. Requiere factura electr\xF3nica en cada compra."
      },
      {
        id: "cli_lavadero_bello",
        tenantId: RAYO_PRO_TENANT_ID,
        codigo: "CLI-003",
        tipoCliente: "Consumidor Final / Negocio Inicial",
        tipoPersona: "NATURAL",
        nombre: "Lavadero El Oasis Bello (Emprendimiento)",
        razonSocial: "Carlos Andr\xE9s Mu\xF1oz",
        nitCc: "71239844",
        dv: 3,
        facturaElectronica: false,
        // En etapa inicial, sin facturación electrónica
        aplicaIva: false,
        // No cobra IVA
        telefono: "3128901234",
        whatsapp: "+573128901234",
        email: "eloasis.bello@gmail.com",
        direccion: "Calle 50 # 48 - 19",
        ciudad: "Bello",
        departamento: "Antioquia",
        barrio: "Prado",
        vendedorId: "usr_vendedor",
        vendedorNombre: "Vendedor Principal",
        listaPreciosId: "plist_1",
        cupoCredito: 1e6,
        diasCredito: 15,
        saldoPendiente: 0,
        totalComprado: 185e4,
        numeroCompras: 3,
        ultimaCompra: "2026-09-11",
        estado: "ACTIVO",
        observaciones: "Negocio en etapa inicial. Se le expide cuenta de cobro / remisi\xF3n sin IVA."
      }
    ],
    // RECETAS BOM REALES DE RAYO PRO
    recipes_bom: [
      {
        id: "bom_deseng_1l",
        tenantId: RAYO_PRO_TENANT_ID,
        productoTerminadoId: "prod_deseng_1l",
        nombreReceta: "F\xF3rmula Maestra Desengrasante 1L (Lote 120 Botellas / 10 Cajas x 12)",
        rendimientoLote: 120,
        unidadMedidaLote: "Botellas",
        tiempoProduccionMinutos: 90,
        costosIndirectosEstimados: 45e3,
        insumos: [
          { materiaPrimaId: "prod_mp_base_alcalina", cantidad: 36, unidadMedida: "Kg", mermaEsperada: 1 },
          { materiaPrimaId: "prod_mp_envase_1l", cantidad: 120, unidadMedida: "Unidad", mermaEsperada: 0 },
          { materiaPrimaId: "prod_mp_caja_12", cantidad: 10, unidadMedida: "Unidad", mermaEsperada: 0 }
        ],
        estado: "ACTIVO",
        observaciones: "Agitaci\xF3n constante a 500 RPM. Control de pH alcalino en 11.5."
      },
      {
        id: "bom_shamp_desinc_1l",
        tenantId: RAYO_PRO_TENANT_ID,
        productoTerminadoId: "prod_shamp_desinc_1l",
        nombreReceta: "F\xF3rmula Maestra Shampoo Desincrustante 1L (Lote 120 Botellas / 10 Cajas x 12)",
        rendimientoLote: 120,
        unidadMedidaLote: "Botellas",
        tiempoProduccionMinutos: 110,
        costosIndirectosEstimados: 55e3,
        insumos: [
          { materiaPrimaId: "prod_mp_acido_fluorhidrico", cantidad: 28, unidadMedida: "Kg", mermaEsperada: 1.5 },
          { materiaPrimaId: "prod_mp_envase_1l", cantidad: 120, unidadMedida: "Unidad", mermaEsperada: 0 },
          { materiaPrimaId: "prod_mp_caja_12", cantidad: 10, unidadMedida: "Unidad", mermaEsperada: 0 }
        ],
        estado: "ACTIVO",
        observaciones: "Manipulaci\xF3n con EPP de seguridad industrial \xE1cido. pH final calibrado en 2.8."
      }
    ],
    // ÓRDENES DE PRODUCCIÓN
    production_orders: [
      {
        id: "ord_prod_001",
        tenantId: RAYO_PRO_TENANT_ID,
        numeroOrden: "OP-2026-0042",
        recetaId: "bom_deseng_1l",
        productoTerminadoId: "prod_deseng_1l",
        productoTerminadoNombre: "Desengrasante Automotriz 1 Litro (10 Cajas x 12)",
        loteCodigo: "LOTE-DES2609-01",
        fechaProgramada: "2026-09-10",
        fechaInicio: "2026-09-10T08:00:00Z",
        fechaFin: "2026-09-10T11:30:00Z",
        cantidadPlanificada: 120,
        cantidadProducida: 120,
        costoEstimadoTotal: 102e4,
        costoRealTotal: 1018500,
        costoUnitarioReal: 8487,
        costosIndirectosReales: 45e3,
        estado: "COMPLETADA",
        responsableId: "usr_gerente",
        responsableNombre: "Gerente General",
        firmaUrl: "datos/firma juan.jpg",
        insumosConsumidos: [
          { materiaPrimaId: "prod_mp_base_alcalina", sku: "MP-BASE-ALCAL", nombre: "Base Desengrasante Alcalina Concentrada", cantidad: 36, unidadMedida: "Kg", costoUnitario: 9200, costoTotal: 331200 },
          { materiaPrimaId: "prod_mp_envase_1l", sku: "EMP-BOTELLA-1L", nombre: "Botella PEAD 1 Litro Boca 28mm Blanca", cantidad: 120, unidadMedida: "Unidad", costoUnitario: 1100, costoTotal: 132e3 },
          { materiaPrimaId: "prod_mp_caja_12", sku: "EMP-CAJA-12", nombre: "Caja Cart\xF3n Corrugado Rayo Pro x 12 Und", cantidad: 10, unidadMedida: "Unidad", costoUnitario: 2200, costoTotal: 22e3 }
        ],
        observaciones: "Lote empacado en 10 cajas rotuladas con logo Rayo Pro para despacho."
      }
    ],
    // ENVÍOS Y DESPACHOS CON DATOS REALES DE CANO TRUCKS
    orders_shipping: [
      {
        id: "ship_cano_01",
        tenantId: RAYO_PRO_TENANT_ID,
        ventaId: "sale_cano_01",
        clienteId: "cli_cano_trucks",
        clienteNombre: "Cliente Convenio Flotas (Demo)",
        nitCc: "1000000001-0",
        telefono: "3000000001",
        whatsapp: "+57 301 710 0508",
        email: "flotas.demo@example.com",
        direccion: "Direcci\xF3n de ejemplo",
        barrio: "La Estaci\xF3n",
        ciudad: "La Tebaida",
        departamento: "Quind\xEDo",
        transportadora: "Coordinadora Mercantil Carga",
        numeroGuia: "77092184531",
        costoEnvio: 165e3,
        estadoCiclo: "ENVIADO",
        fechaDespacho: "2026-09-11",
        fechaEntregaEstimada: "2026-09-14",
        cajasTotal: 17,
        contenidoDescripcion: "17 CAJAS X 12 (Productos de mantenimiento y embellecimiento automotriz)",
        responsable: "Gerente General",
        observaciones: "Manejar con cuidado. Cajas con sellos de seguridad Rayo Pro. Productos de mantenimiento y embellecimiento automotriz."
      },
      {
        id: "ship_cano_02",
        tenantId: RAYO_PRO_TENANT_ID,
        ventaId: "sale_cano_02",
        clienteId: "cli_cano_trucks",
        clienteNombre: "Cliente Convenio Flotas (Demo)",
        nitCc: "1000000001-0",
        telefono: "3000000001",
        whatsapp: "+57 301 710 0508",
        email: "flotas.demo@example.com",
        direccion: "Direcci\xF3n de ejemplo",
        barrio: "La Estaci\xF3n",
        ciudad: "La Tebaida",
        departamento: "Quind\xEDo",
        transportadora: "Envia Colvanes",
        numeroGuia: "04128994711",
        costoEnvio: 95e3,
        estadoCiclo: "LISTO_DESPACHO",
        fechaDespacho: "2026-09-12",
        fechaEntregaEstimada: "2026-09-15",
        cajasTotal: 8,
        contenidoDescripcion: "8 CAJAS X 12 (Productos de mantenimiento y embellecimiento automotriz)",
        responsable: "Vendedor Principal",
        observaciones: "Despacho prioritario programado para recolecci\xF3n hoy en la tarde. Productos de embellecimiento automotriz."
      }
    ],
    // CUENTAS POR COBRAR (CARTERA DE EJEMPLO)
    receivables_cxc: [
      {
        id: "cxc_cano_01",
        tenantId: RAYO_PRO_TENANT_ID,
        ventaId: "sale_cano_prev",
        documento: "RP-CANO-088",
        clienteId: "cli_cano_trucks",
        clienteNombre: "Cliente Convenio Flotas (Demo)",
        fechaEmision: "2026-08-15",
        fechaVencimiento: "2026-09-15",
        valorTotal: 26e6,
        // Deuda original registrada en Excel
        abonos: 6244e3,
        // $4.244.000 (03-Sep) + $2.000.000 (09-Sep)
        saldo: 19756e3,
        // Saldo actual adeudado
        diasMora: 0,
        estado: "POR_VENCER",
        observaciones: "Abonos conciliados: $4.244.000 el 03-Sep-2026 y $2.000.000 el 09-Sep-2026."
      }
    ],
    // VENTAS REALES
    sales: [
      {
        id: "sale_cano_01",
        tenantId: RAYO_PRO_TENANT_ID,
        consecutivo: "RP-10026",
        tipoDoc: "VENTA_CREDITO",
        clienteId: "cli_cano_trucks",
        clienteNombre: "Cliente Convenio Flotas (Demo)",
        clienteNit: "1000000001-0",
        vendedorId: "usr_gerente",
        vendedorNombre: "Gerente General",
        listaPreciosId: "plist_5",
        fecha: "2026-09-11T14:20:00Z",
        estado: "CREDITO_PENDIENTE",
        subtotal: 6964706,
        descuentos: 0,
        impuestos: 1323294,
        // IVA 19%
        total: 8288e3,
        // Total exacto registrado en el Excel
        metodoPago: "Cr\xE9dito",
        pagoRecibido: 0,
        cambio: 0,
        saldoCredito: 8288e3,
        items: [
          { productoId: "prod_deseng_1l", sku: "DESENG-1L", nombre: "Desengrasante Automotriz 1 Litro (17 Cajas x 12 = 204 Und)", cantidad: 204, precioUnitario: 11130, total: 2270520 },
          { productoId: "prod_shamp_desinc_1l", sku: "SHAMP-DESINC-1L", nombre: "Shampoo Desincrustante 1 Litro (17 Cajas x 12 = 204 Und)", cantidad: 204, precioUnitario: 15712, total: 3205248 },
          { productoId: "prod_metal_polish", sku: "METAL-POLISH-500", nombre: "Metal Polish Restaurador 500 ml (192 Und)", cantidad: 192, precioUnitario: 12040, total: 2311680 }
        ]
      }
    ],
    cash_shifts: [
      {
        id: "cshift_actual",
        tenantId: RAYO_PRO_TENANT_ID,
        usuarioId: "usr_gerente",
        usuarioNombre: "Gerente General",
        fechaApertura: "2026-09-12T07:30:00Z",
        fechaCierre: null,
        montoApertura: 3e5,
        totalVentasEfectivo: 85e4,
        totalVentasTransferencia: 2e6,
        // Abono transferido por Cano
        totalVentasNequiDaviplata: 45e4,
        totalVentasTarjeta: 25e4,
        totalVentasCredito: 8288e3,
        totalIngresos: 5e4,
        totalEgresos: 4e4,
        totalGastos: 35e3,
        totalRetiros: 0,
        saldoEsperado: 1125e3,
        saldoContado: 0,
        diferencia: 0,
        estado: "ABIERTA",
        observaciones: "Turno activo principal Rayo Pro"
      }
    ],
    expenses: [
      {
        id: "exp_001",
        tenantId: RAYO_PRO_TENANT_ID,
        fecha: "2026-09-12T09:20:00Z",
        categoria: "Mensajer\xEDa y Env\xEDos",
        concepto: "Flete despacho Coordinadora a La Tebaida Quind\xEDo (Cano Trucks)",
        proveedor: "Coordinadora Mercantil S.A.",
        valor: 165e3,
        formaPago: "Transferencia Bancolombia",
        responsableId: "usr_gerente",
        responsableNombre: "Gerente General",
        observacion: "Gu\xEDa 77092184531"
      }
    ],
    payables_cxp: [
      {
        id: "cxp_001",
        tenantId: RAYO_PRO_TENANT_ID,
        compraId: "comp_042",
        documento: "FAC-QUIM-8841",
        proveedorId: "prov_01",
        proveedorNombre: "Qu\xEDmicos Industriales de Colombia S.A.S.",
        fechaEmision: "2026-09-01",
        fechaVencimiento: "2026-10-15",
        valorTotal: 45e5,
        abonos: 0,
        saldo: 45e5,
        diasMora: 0,
        estado: "AL_DIA"
      }
    ],
    suppliers: [
      {
        id: "prov_01",
        tenantId: RAYO_PRO_TENANT_ID,
        codigo: "PROV-001",
        razonSocial: "Qu\xEDmicos Industriales de Colombia S.A.S.",
        nitCc: "890900123",
        dv: 5,
        contacto: "Ing. Fernando G\xF3mez",
        telefono: "(604) 448 3030",
        ciudad: "Sabaneta",
        departamento: "Antioquia",
        diasCredito: 45,
        categoria: "Materias Primas Qu\xEDmicas",
        estado: "ACTIVO"
      },
      {
        id: "prov_02",
        tenantId: RAYO_PRO_TENANT_ID,
        codigo: "PROV-002",
        razonSocial: "Pl\xE1sticos & Envases del Valle S.A.",
        nitCc: "805011456",
        dv: 2,
        contacto: "Carolina Morales",
        telefono: "(602) 441 5500",
        ciudad: "Palmira",
        departamento: "Valle del Cauca",
        diasCredito: 30,
        categoria: "Envases & Tapas",
        estado: "ACTIVO"
      }
    ],
    kardex: [
      {
        id: "kdx_001",
        tenantId: RAYO_PRO_TENANT_ID,
        fecha: "2026-09-10T11:30:00Z",
        productoId: "prod_deseng_1l",
        productoNombre: "Desengrasante Automotriz 1 Litro",
        sku: "DESENG-1L",
        bodegaId: "wh_1",
        bodegaNombre: "Bodega Principal & Despachos",
        documentoTipo: "PRODUCCION_ENTRADA",
        documentoNumero: "OP-2026-0042",
        cantidadEntrada: 120,
        cantidadSalida: 0,
        saldoCantidad: 144,
        costoUnitario: 8487,
        costoTotal: 1018500,
        usuarioId: "usr_gerente",
        usuarioNombre: "Gerente General",
        observacion: "Entrada por lote fabricado LOTE-DES2609-01 (10 cajas x 12)"
      }
    ],
    audit_logs: [
      {
        id: "aud_001",
        tenantId: RAYO_PRO_TENANT_ID,
        fecha: "2026-09-12",
        hora: "10:15:00",
        usuarioId: "usr_gerente",
        usuarioNombre: "Gerente General",
        modulo: "Ventas POS",
        accion: "CREAR",
        registroId: "RP-10026",
        campoModificado: "Factura Despacho Cano Trucks",
        valorAnterior: "-",
        valorNuevo: "$ 8.288.000 (Cr\xE9dito a 30 d\xEDas)",
        ipUserAgent: "Nexa iOS Desktop App"
      }
    ]
  };

  // js/services/pricing-service.js
  var PricingService = {
    /** Código de la lista (P1..P5). Deriva del campo `codigo`, del `orden` o del nombre. */
    codeOf(priceList) {
      if (!priceList)
        return null;
      if (priceList.codigo)
        return priceList.codigo;
      if (priceList.orden)
        return `P${priceList.orden}`;
      const m = String(priceList.nombre || "").match(/^P(\d)/i);
      return m ? `P${m[1]}` : null;
    },
    /** Busca una lista por código (P1..P5) */
    findByCode(priceLists, code) {
      return (priceLists || []).find((pl) => this.codeOf(pl) === code) || null;
    },
    /** Acepta un id o un código y devuelve el id de lista correspondiente en esta empresa */
    resolveListId(priceLists, idOrCode) {
      if (!idOrCode)
        return null;
      const byId = (priceLists || []).find((pl) => pl.id === idOrCode);
      if (byId)
        return byId.id;
      const byCode = this.findByCode(priceLists, idOrCode);
      if (byCode)
        return byCode.id;
      const legacy = String(idOrCode).match(/^plist_(\d)$/);
      if (legacy) {
        const pl = this.findByCode(priceLists, `P${legacy[1]}`);
        if (pl)
          return pl.id;
      }
      return null;
    },
    defaultList(priceLists) {
      return (priceLists || []).find((pl) => pl.esDefecto) || this.findByCode(priceLists, "P1") || (priceLists || [])[0] || null;
    },
    /** Lista base para comisiones freelance (por defecto P3) */
    freelanceBaseListId(priceLists, freelancer) {
      return this.resolveListId(priceLists, freelancer && freelancer.precioBaseId) || this.resolveListId(priceLists, "P3") || (this.defaultList(priceLists) || {}).id || null;
    },
    /** Precio del producto en una lista. Devuelve 0 si no está definido (nunca inventa precios). */
    priceFor(product, listId) {
      if (!product || !product.precios || !listId)
        return 0;
      const v = Number(product.precios[listId]);
      return Number.isFinite(v) && v > 0 ? v : 0;
    },
    listIncludesIva(priceLists, listId) {
      const pl = (priceLists || []).find((p) => p.id === listId);
      return !!(pl && pl.incluyeIva);
    },
    label(priceList) {
      if (!priceList)
        return "-";
      return priceList.nombre || this.codeOf(priceList) || priceList.id;
    }
  };

  // js/services/migrations.js
  var PARAM_ID = "migraciones";
  function initialsPrefix(name) {
    const words = String(name || "V").trim().split(/\s+/).filter(Boolean);
    const p = words.length > 1 ? words[0][0] + words[1][0] : String(name || "V").substring(0, 2);
    return p.toUpperCase().replace(/[^A-Z]/g, "") || "V";
  }
  var MIGRATIONS = [
    {
      id: "semilla-inicial-v1",
      descripcion: "Carga los datos iniciales SOLO si la base de datos est\xE1 vac\xEDa.",
      async run() {
        const tenants = await DB.getAll(STORES.TENANTS);
        if (tenants.length > 0)
          return "BD existente: semilla omitida";
        for (const [storeKey, items] of Object.entries(SeedData)) {
          const storeName = STORES[storeKey.toUpperCase()];
          if (storeName && Array.isArray(items) && items.length) {
            await DB.bulkAdd(storeName, JSON.parse(JSON.stringify(items)));
          }
        }
        return "Semilla cargada";
      }
    },
    {
      id: "listas-codigo-iva-v1",
      descripcion: "Asigna c\xF3digo P1..P5 a las listas de precios y si incluyen IVA (P1 s\xED, dem\xE1s no).",
      async run() {
        const lists = await DB.getAll(STORES.PRICE_LISTS);
        let n = 0;
        for (const pl of lists) {
          let changed = false;
          if (!pl.codigo) {
            pl.codigo = PricingService.codeOf(pl) || "P1";
            changed = true;
          }
          if (pl.incluyeIva === void 0) {
            pl.incluyeIva = pl.codigo === "P1";
            changed = true;
          }
          if (changed) {
            await DB.update(STORES.PRICE_LISTS, pl);
            n++;
          }
        }
        return `${n} listas actualizadas`;
      }
    },
    {
      id: "empresa-prefijos-v1",
      descripcion: "Prefijos de consecutivos por empresa.",
      async run() {
        const tenants = await DB.getAll(STORES.TENANTS);
        for (const t of tenants) {
          let changed = false;
          if (!t.prefijoVenta) {
            t.prefijoVenta = t.id === RAYO_PRO_TENANT_ID ? "RP" : initialsPrefix(t.nombreComercial);
            changed = true;
          }
          if (!t.prefijoCotizacion) {
            t.prefijoCotizacion = "COT";
            changed = true;
          }
          if (t.id === RAYO_PRO_TENANT_ID) {
            if (!t.isotipoLightUrl) {
              t.isotipoLightUrl = "datos/isotipo fondo blanco.jpg";
              changed = true;
            }
            if (!t.isotipoDarkUrl) {
              t.isotipoDarkUrl = "datos/isotipo fondo negro.jpg";
              changed = true;
            }
            if (!t.logoHorizontalLightUrl) {
              t.logoHorizontalLightUrl = "datos/logo+isotipo.jpg";
              changed = true;
            }
            if (!t.logoHorizontalDarkUrl) {
              t.logoHorizontalDarkUrl = "datos/isotipo + logo fondo negro.jpg";
              changed = true;
            }
          }
          if (t.firmaUrl && !t.firmaNombre && /juan/i.test(t.firmaUrl)) {
            t.firmaNombre = "Juan Pablo";
            t.firmaCargo = "Gerencia de Operaciones y Planta";
            changed = true;
          }
          if (t.resolucionFacturacion && /18764000(123456|987654)/.test(t.resolucionFacturacion)) {
            t.resolucionFacturacion = "";
            changed = true;
          }
          if (changed)
            await DB.update(STORES.TENANTS, t);
        }
        return "ok";
      }
    },
    {
      id: "adjuntos-separados-v1",
      descripcion: "Mueve las fotos de comprobantes de ventas y abonos a un almac\xE9n aparte.",
      async run() {
        const sales = await DB.getAll(STORES.SALES);
        let n = 0;
        for (const s of sales) {
          if (s.comprobantePagoUrl && !s.comprobanteId) {
            const att = await DB.add(STORES.ATTACHMENTS, {
              tenantId: s.tenantId,
              refTipo: "VENTA",
              refId: s.id,
              descripcion: `Comprobante ${s.consecutivo}`,
              dataUrl: s.comprobantePagoUrl
            });
            s.comprobanteId = att.id;
            delete s.comprobantePagoUrl;
            await DB.update(STORES.SALES, s);
            n++;
          }
        }
        const cxcs = await DB.getAll(STORES.RECEIVABLES_CXC);
        for (const c of cxcs) {
          let changed = false;
          for (const h of c.historialPagos || []) {
            if (h.comprobanteBase64 && !h.comprobanteId) {
              const att = await DB.add(STORES.ATTACHMENTS, {
                tenantId: c.tenantId,
                refTipo: "ABONO_CXC",
                refId: c.id,
                descripcion: `Abono ${c.documento}`,
                dataUrl: h.comprobanteBase64
              });
              h.comprobanteId = att.id;
              delete h.comprobanteBase64;
              changed = true;
              n++;
            }
          }
          if (changed)
            await DB.update(STORES.RECEIVABLES_CXC, c);
        }
        return `${n} adjuntos movidos`;
      }
    },
    {
      id: "recetas-esquema-unico-v1",
      descripcion: "Unifica los campos de recetas entre Producci\xF3n y B\xF3veda.",
      async run() {
        const recipes = await DB.getAll(STORES.RECIPES_BOM);
        for (const r of recipes) {
          const before = JSON.stringify(r);
          if (!r.nombreReceta && r.nombreFormula)
            r.nombreReceta = r.nombreFormula;
          if (!r.nombreFormula && r.nombreReceta)
            r.nombreFormula = r.nombreReceta;
          if (!r.rendimientoLote && r.cantidadProducir)
            r.rendimientoLote = Number(r.cantidadProducir);
          if (!r.cantidadProducir && r.rendimientoLote)
            r.cantidadProducir = Number(r.rendimientoLote);
          (r.insumos || []).forEach((i) => {
            if (!i.materiaPrimaId && i.productoId)
              i.materiaPrimaId = i.productoId;
            if (!i.productoId && i.materiaPrimaId)
              i.productoId = i.materiaPrimaId;
          });
          if (JSON.stringify(r) !== before)
            await DB.update(STORES.RECIPES_BOM, r);
        }
        return "ok";
      }
    },
    {
      id: "ventas-tipo-documento-v1",
      descripcion: "Reclasifica cotizaciones antiguas que se registraron como PAGADA.",
      async run() {
        const sales = await DB.getAll(STORES.SALES);
        let n = 0;
        for (const s of sales) {
          if (s.tipoDoc === "COTIZACION" && s.estado !== "COTIZACION" && s.estado !== "ANULADA") {
            s.estadoOriginal = s.estado;
            s.estado = "COTIZACION";
            s.requiereRevision = "Cotizaci\xF3n antigua que descont\xF3 inventario y/o sum\xF3 a caja (error corregido en v3).";
            await DB.update(STORES.SALES, s);
            n++;
          }
        }
        return `${n} cotizaciones antiguas reclasificadas`;
      }
    }
  ];
  var Migrations = {
    async run() {
      await DB.init();
      const applied = await DB.getParam(PARAM_ID, []) || [];
      const done = new Set(applied.map((a) => a.id));
      const log = [];
      for (const m of MIGRATIONS) {
        if (done.has(m.id))
          continue;
        if (typeof window !== "undefined" && window.__nexaStep)
          window.__nexaStep(`Migraci\xF3n: ${m.descripcion}`);
        const resultado = await m.run();
        applied.push({ id: m.id, fecha: (/* @__PURE__ */ new Date()).toISOString(), resultado });
        await DB.setParam(PARAM_ID, applied);
        log.push(`${m.id}: ${resultado}`);
      }
      if (log.length)
        console.info("[NexaAdmin] Migraciones aplicadas:\n" + log.join("\n"));
      return log;
    },
    async applied() {
      return await DB.getParam(PARAM_ID, []) || [];
    }
  };

  // js/utils/session.js
  var Session = {
    user: null,
    // { id, nombre, rol }
    tenantId: null,
    setUser(user) {
      this.user = user ? { id: user.id, nombre: user.nombre, rol: user.rol } : null;
    },
    setTenant(tenantId) {
      this.tenantId = tenantId || null;
    },
    userId() {
      return this.user ? this.user.id : "sistema";
    },
    userName() {
      return this.user ? this.user.nombre : "Sistema";
    }
  };

  // js/utils/dian-dv.js
  var DianDV = {
    // Factores de ponderación oficiales DIAN (hasta 15 dígitos)
    WEIGHTS: [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71],
    /**
     * Calcula el Dígito de Verificación (DV) para un NIT o Cédula
     * @param {string|number} nit - Número de identificación sin puntos ni guiones
     * @returns {number|null} - Dígito entre 0 y 9, o null si el NIT es inválido
     */
    calculate(nit) {
      if (!nit)
        return null;
      const cleanNit = nit.toString().replace(/\D/g, "");
      if (cleanNit.length === 0)
        return null;
      let total = 0;
      const len = cleanNit.length;
      for (let i = 0; i < len; i++) {
        const digit = parseInt(cleanNit.charAt(len - 1 - i), 10);
        const weight = this.WEIGHTS[i] || 0;
        total += digit * weight;
      }
      const remainder = total % 11;
      if (remainder > 1) {
        return 11 - remainder;
      } else {
        return remainder;
      }
    },
    /**
     * Formatea un NIT con su DV
     * Ejemplo: (901456789) -> "901.456.789-5"
     */
    formatWithDV(nit) {
      if (!nit)
        return "";
      const cleanNit = nit.toString().replace(/\D/g, "");
      if (!cleanNit)
        return "";
      const dv = this.calculate(cleanNit);
      const formattedNum = new Intl.NumberFormat("es-CO").format(parseInt(cleanNit, 10));
      return dv !== null ? `${formattedNum}-${dv}` : formattedNum;
    }
  };

  // js/utils/event-bus.js
  var EventBusService = class {
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
      if (!this.events[event])
        return;
      this.events[event] = this.events[event].filter((cb) => cb !== callback);
    }
    /**
     * Emitir un evento con datos
     */
    emit(event, data) {
      if (!this.events[event])
        return;
      this.events[event].forEach((callback) => {
        try {
          callback(data);
        } catch (err) {
          console.error(`Error en listener de evento "${event}":`, err);
        }
      });
    }
  };
  var EventBus = new EventBusService();

  // js/services/tenant-service.js
  var TenantService = class {
    constructor() {
      this.currentTenant = null;
      this.activeTenantId = localStorage.getItem("nexa_active_tenant") || RAYO_PRO_TENANT_ID;
    }
    /**
     * Inicializa el servicio: aplica migraciones (incluida la semilla, SOLO si la BD está vacía)
     * y selecciona la empresa activa.
     */
    async init() {
      await DB.init();
      await Migrations.run();
      const tenants = await DB.getAll(STORES.TENANTS);
      this.currentTenant = tenants.find((t) => t.id === this.activeTenantId) || tenants[0] || null;
      if (this.currentTenant) {
        this.activeTenantId = this.currentTenant.id;
        localStorage.setItem("nexa_active_tenant", this.activeTenantId);
        Session.setTenant(this.activeTenantId);
        this.applyTheme(this.currentTenant);
      }
      return this.currentTenant;
    }
    /**
     * Obtiene la empresa actualmente activa
     */
    getActiveTenant() {
      return this.currentTenant;
    }
    /**
     * Lista todas las empresas configuradas
     */
    async getAllTenants() {
      return await DB.getAll(STORES.TENANTS);
    }
    /**
     * Cambia la empresa activa en tiempo de ejecución sin recargar la página
     */
    async switchTenant(tenantId) {
      const tenant = await DB.getById(STORES.TENANTS, tenantId);
      if (!tenant)
        throw new Error("Empresa no encontrada.");
      this.currentTenant = tenant;
      this.activeTenantId = tenant.id;
      localStorage.setItem("nexa_active_tenant", this.activeTenantId);
      Session.setTenant(this.activeTenantId);
      this.applyTheme(tenant);
      EventBus.emit("tenant:changed", tenant);
      return tenant;
    }
    /**
     * Actualiza los datos de la empresa activa (NIT, colores, nombre, etc.)
     */
    async updateTenant(tenantData) {
      if (tenantData.nit) {
        tenantData.dv = DianDV.calculate(tenantData.nit);
      }
      const updated = await DB.update(STORES.TENANTS, tenantData);
      if (updated.id === this.activeTenantId) {
        this.currentTenant = updated;
        this.applyTheme(updated);
        EventBus.emit("tenant:changed", updated);
      }
      return updated;
    }
    /**
     * Crea una nueva organización multiempresa con parámetros base
     */
    async createTenant(tenantData) {
      if (!tenantData.id) {
        tenantData.id = "tenant_" + Date.now();
      }
      if (!tenantData.prefijoVenta) {
        const w = String(tenantData.nombreComercial || "V").trim().split(/\s+/);
        tenantData.prefijoVenta = ((w.length > 1 ? w[0][0] + w[1][0] : w[0].substring(0, 2)) || "V").toUpperCase();
      }
      if (!tenantData.prefijoCotizacion)
        tenantData.prefijoCotizacion = "COT";
      if (tenantData.nit) {
        tenantData.dv = DianDV.calculate(tenantData.nit);
      }
      const created = await DB.add(STORES.TENANTS, tenantData);
      const basePriceLists = [
        { id: `plist_1_${created.id}`, codigo: "P1", incluyeIva: true, tenantId: created.id, nombre: "P1 - Precio P\xFAblico / Final", descripcion: "Mostrador y consumidor particular", esDefecto: true, orden: 1 },
        { id: `plist_2_${created.id}`, codigo: "P2", incluyeIva: false, tenantId: created.id, nombre: "P2 - Precio Lavaderos / Taller", descripcion: "Autolavados y centros de detailing", esDefecto: false, orden: 2 },
        { id: `plist_3_${created.id}`, codigo: "P3", incluyeIva: false, tenantId: created.id, nombre: "P3 - Precio Mayorista (Docenas)", descripcion: "Compras por cajas completas x 12 unidades", esDefecto: false, orden: 3 },
        { id: `plist_4_${created.id}`, codigo: "P4", incluyeIva: false, tenantId: created.id, nombre: "P4 - Precio Distribuidor Autorizado", descripcion: "Almacenes y distribuidores regionales", esDefecto: false, orden: 4 },
        { id: `plist_5_${created.id}`, codigo: "P5", incluyeIva: false, tenantId: created.id, nombre: "P5 - Precio Especial Convenio", descripcion: "Tarifa preferencial convenios", esDefecto: false, orden: 5 }
      ];
      for (const pl of basePriceLists) {
        await DB.add(STORES.PRICE_LISTS, pl);
      }
      await DB.add(STORES.WAREHOUSES, {
        id: `wh_1_${created.id}`,
        tenantId: created.id,
        codigo: "BOD-01",
        nombre: "Bodega Principal & Despachos",
        direccion: created.direccion || "Sede Principal",
        esPrincipal: true,
        estado: "ACTIVO"
      });
      return created;
    }
    /**
     * Inyecta variables CSS en el root del documento para cambiar el tema
     */
    applyTheme(tenant) {
      if (!tenant)
        return;
      const root = document.documentElement;
      const colores = tenant.colores || {
        primary: "#0284c7",
        primaryHover: "#0369a1",
        secondary: "#f59e0b",
        accent: "#0284c7"
      };
      root.style.setProperty("--brand-primary", colores.primary);
      root.style.setProperty("--brand-primary-hover", colores.primaryHover || colores.primary);
      root.style.setProperty("--brand-secondary", colores.secondary);
      root.style.setProperty("--brand-accent", colores.accent || colores.primary);
      document.title = `${tenant.nombreComercial} | Nexa ERP Cloud`;
      document.querySelectorAll("[data-tenant-name]").forEach((el) => {
        el.textContent = tenant.nombreComercial;
      });
      document.querySelectorAll("[data-tenant-nit]").forEach((el) => {
        el.textContent = `NIT: ${tenant.nit}-${tenant.dv}`;
      });
    }
    /**
     * Obtiene el isotipo cuadrado oficial o genera uno automático
     * @param {Object} tenant 
     * @param {boolean} isDark 
     * @returns {string} URL o Data URL
     */
    getIsotipo(tenant, isDark = false) {
      if (!tenant)
        return "";
      if (isDark) {
        if (tenant.isotipoDarkUrl)
          return tenant.isotipoDarkUrl;
        if (tenant.id === RAYO_PRO_TENANT_ID)
          return "datos/isotipo fondo negro.jpg";
      } else {
        if (tenant.isotipoLightUrl)
          return tenant.isotipoLightUrl;
        if (tenant.faviconUrl)
          return tenant.faviconUrl;
        if (tenant.id === RAYO_PRO_TENANT_ID)
          return "datos/isotipo fondo blanco.jpg";
      }
      return this.generateAutoIsotipo(tenant, isDark);
    }
    /**
     * Obtiene el logotipo horizontal completo o genera uno automático
     * @param {Object} tenant 
     * @param {boolean} isDark 
     * @returns {string} URL o Data URL
     */
    getHorizontalLogo(tenant, isDark = false) {
      if (!tenant)
        return "";
      if (isDark) {
        if (tenant.logoHorizontalDarkUrl)
          return tenant.logoHorizontalDarkUrl;
        if (tenant.id === RAYO_PRO_TENANT_ID)
          return "datos/isotipo + logo fondo negro.jpg";
      } else {
        if (tenant.logoHorizontalLightUrl)
          return tenant.logoHorizontalLightUrl;
        if (tenant.logoUrl)
          return tenant.logoUrl;
        if (tenant.id === RAYO_PRO_TENANT_ID)
          return "datos/logo+isotipo.jpg";
      }
      return this.generateAutoHorizontalLogo(tenant, isDark);
    }
    /**
     * Obtiene el membrete oficial para documentos o genera uno automático
     * @param {Object} tenant 
     * @returns {string} URL o Data URL
     */
    getMembrete(tenant) {
      if (!tenant)
        return "";
      if (tenant.membreteUrl)
        return tenant.membreteUrl;
      return this.generateAutoMembrete(tenant);
    }
    /**
     * Genera dinámicamente un isotipo SVG cuadrado con identidad corporativa
     */
    generateAutoIsotipo(tenant, isDark = false) {
      const name = tenant.nombreComercial || "Nexa";
      const words = name.trim().split(/\s+/);
      const initials = words.length > 1 ? (words[0][0] + words[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
      const primary = tenant.colores?.primary || "#0071e3";
      const secondary = tenant.colores?.secondary || "#38bdf8";
      const bg = isDark ? "#000000" : "#ffffff";
      const border = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.08)";
      const textColor = isDark ? "#ffffff" : primary;
      const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="grad_${tenant.id || "auto"}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${primary}" />
            <stop offset="100%" stop-color="${secondary}" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="22" fill="${bg}" stroke="${border}" stroke-width="2"/>
        <circle cx="50" cy="50" r="36" fill="url(#grad_${tenant.id || "auto"})" opacity="${isDark ? "0.22" : "0.12"}"/>
        <text x="50" y="59" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="30" font-weight="900" fill="${textColor}" text-anchor="middle" letter-spacing="-1">${initials}</text>
      </svg>
    `.trim();
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
    /**
     * Genera dinámicamente un logotipo horizontal SVG corporativo
     */
    generateAutoHorizontalLogo(tenant, isDark = false) {
      const name = tenant.nombreComercial || "Nexa ERP";
      const razon = tenant.razonSocial || name;
      const words = name.trim().split(/\s+/);
      const initials = words.length > 1 ? (words[0][0] + words[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
      const primary = tenant.colores?.primary || "#0071e3";
      const textColor = isDark ? "#ffffff" : "#1d1d1f";
      const subColor = isDark ? "#94a3b8" : "#64748b";
      const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 70" width="340" height="70">
        <rect width="54" height="54" x="8" y="8" rx="14" fill="${primary}" />
        <text x="35" y="44" font-family="-apple-system, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle">${initials}</text>
        <text x="74" y="36" font-family="-apple-system, sans-serif" font-size="19" font-weight="900" fill="${textColor}" letter-spacing="-0.5">${name}</text>
        <text x="74" y="52" font-family="-apple-system, sans-serif" font-size="10" font-weight="600" fill="${subColor}" letter-spacing="0.5">${razon.substring(0, 32).toUpperCase()}</text>
      </svg>
    `.trim();
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
    /**
     * Genera dinámicamente un membrete SVG institucional para documentos
     */
    generateAutoMembrete(tenant) {
      const name = tenant.nombreComercial || "Nexa ERP";
      const nit = `NIT: ${tenant.nit || ""}-${tenant.dv || ""}`;
      const contact = `${tenant.direccion || ""} \u2022 ${tenant.ciudad || ""} \u2022 Tel: ${tenant.telefono || ""}`;
      const primary = tenant.colores?.primary || "#0071e3";
      const secondary = tenant.colores?.secondary || "#f59e0b";
      const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 110" width="800" height="110">
        <rect width="800" height="8" x="0" y="0" fill="${primary}"/>
        <rect width="180" height="8" x="620" y="0" fill="${secondary}"/>
        <text x="25" y="46" font-family="-apple-system, sans-serif" font-size="24" font-weight="900" fill="#1d1d1f">${name}</text>
        <text x="25" y="68" font-family="-apple-system, sans-serif" font-size="12" font-weight="700" fill="#374151">${nit} \u2022 ${tenant.regimen || "Responsable de IVA"}</text>
        <text x="25" y="88" font-family="-apple-system, sans-serif" font-size="11" font-weight="500" fill="#6b7280">${contact}</text>
        <line x1="25" y1="102" x2="775" y2="102" stroke="#e5e7eb" stroke-width="1.5"/>
      </svg>
    `.trim();
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
  };
  var TenantServiceInstance = new TenantService();

  // js/services/audit-service.js
  var AuditServiceManager = class {
    /** Construye la entrada de auditoría (sin guardarla) */
    entry({ modulo, accion, registroId, campoModificado, valorAnterior, valorNuevo, tenantId }) {
      const now = /* @__PURE__ */ new Date();
      return {
        tenantId: tenantId || Session.tenantId,
        fecha: now.toISOString().split("T")[0],
        hora: now.toLocaleTimeString("es-CO", { hour12: false }),
        usuarioId: Session.userId(),
        usuarioNombre: Session.userName(),
        modulo,
        accion,
        registroId: registroId || "-",
        campoModificado: campoModificado || "Operaci\xF3n General",
        valorAnterior: valorAnterior !== void 0 && valorAnterior !== null ? String(valorAnterior) : "-",
        valorNuevo: valorNuevo !== void 0 && valorNuevo !== null ? String(valorNuevo) : "-",
        ipUserAgent: (typeof navigator !== "undefined" ? navigator.userAgent : "").substring(0, 50)
      };
    }
    /** Registra una acción en su propia transacción. Nunca interrumpe el flujo si falla. */
    async log(data) {
      try {
        const logEntry = this.entry(data);
        await DB.add(STORES.AUDIT_LOGS, logEntry);
        return logEntry;
      } catch (err) {
        console.warn("No se pudo registrar la entrada de auditor\xEDa:", err);
        return null;
      }
    }
    /** Registra dentro de una transacción existente (DB.runTransaction debe incluir audit_logs) */
    async logTx(tx, data) {
      return tx.put(STORES.AUDIT_LOGS, this.entry(data));
    }
    async getLogs(tenantId) {
      const logs = await DB.getAll(STORES.AUDIT_LOGS, tenantId);
      return logs.sort((a, b) => new Date(b.fechaCreacion || b.fecha) - new Date(a.fechaCreacion || a.fecha));
    }
  };
  var AuditService = new AuditServiceManager();

  // js/utils/crypto.js
  var PBKDF2_ITERATIONS = 15e4;
  var enc = new TextEncoder();
  var dec = new TextDecoder();
  function subtle() {
    if (typeof crypto === "undefined" || !crypto.subtle) {
      throw new Error("El navegador no ofrece WebCrypto en este contexto. Abra NexaAdmin en Chrome, Edge o Brave actualizado.");
    }
    return crypto.subtle;
  }
  function toB64(buf) {
    const bytes = new Uint8Array(buf);
    let bin = "";
    for (let i = 0; i < bytes.length; i++)
      bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }
  function fromB64(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++)
      out[i] = bin.charCodeAt(i);
    return out;
  }
  function randomBytes(n) {
    const a = new Uint8Array(n);
    crypto.getRandomValues(a);
    return a;
  }
  function safeEqual(a, b) {
    if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length)
      return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++)
      diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }
  async function pbkdf2Bits(secret, salt, iterations, bits = 256) {
    const key = await subtle().importKey("raw", enc.encode(secret), "PBKDF2", false, ["deriveBits"]);
    return subtle().deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, bits);
  }
  var CryptoUtil = {
    isHash(value) {
      return typeof value === "string" && value.startsWith("pbkdf2$");
    },
    async hashPassword(password) {
      if (!password)
        throw new Error("La contrase\xF1a no puede estar vac\xEDa.");
      const salt = randomBytes(16);
      const bits = await pbkdf2Bits(password, salt, PBKDF2_ITERATIONS);
      return `pbkdf2$${PBKDF2_ITERATIONS}$${toB64(salt)}$${toB64(bits)}`;
    },
    async verifyPassword(password, stored) {
      if (!password || !this.isHash(stored))
        return false;
      const [, iterStr, saltB64, hashB64] = stored.split("$");
      const iterations = Number(iterStr);
      if (!iterations || !saltB64 || !hashB64)
        return false;
      const bits = await pbkdf2Bits(password, fromB64(saltB64), iterations);
      return safeEqual(toB64(bits), hashB64);
    },
    /** Código legible para recuperación: XXXX-XXXX-XXXX-XXXX (sin caracteres ambiguos) */
    generateRecoveryCode() {
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const bytes = randomBytes(16);
      let out = "";
      for (let i = 0; i < 16; i++) {
        out += alphabet[bytes[i] % alphabet.length];
        if (i % 4 === 3 && i < 15)
          out += "-";
      }
      return out;
    },
    normalizeRecoveryCode(code) {
      return String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/(.{4})(?=.)/g, "$1-");
    },
    async encryptJSON(obj, pin) {
      const salt = randomBytes(16);
      const iv = randomBytes(12);
      const keyMaterial = await subtle().importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveKey"]);
      const key = await subtle().deriveKey(
        { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"]
      );
      const data = await subtle().encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(obj)));
      return { v: 1, alg: "AES-GCM", iter: PBKDF2_ITERATIONS, salt: toB64(salt), iv: toB64(iv), data: toB64(data) };
    },
    async decryptJSON(payload, pin) {
      if (!payload || payload.alg !== "AES-GCM")
        throw new Error("Formato cifrado desconocido.");
      const keyMaterial = await subtle().importKey("raw", enc.encode(pin), "PBKDF2", false, ["deriveKey"]);
      const key = await subtle().deriveKey(
        { name: "PBKDF2", hash: "SHA-256", salt: fromB64(payload.salt), iterations: payload.iter },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );
      try {
        const plain = await subtle().decrypt({ name: "AES-GCM", iv: fromB64(payload.iv) }, key, fromB64(payload.data));
        return JSON.parse(dec.decode(plain));
      } catch (e) {
        throw new Error("Clave incorrecta o datos alterados.");
      }
    }
  };

  // js/services/auth-service.js
  var ROLES = {
    DEV: "Desarrollador",
    ADMIN: "Desarrollador",
    // Alias de compatibilidad
    GERENTE: "Gerente",
    VENDEDOR: "Vendedor",
    BODEGA: "Bodega",
    PRODUCCION: "Producci\xF3n",
    CAJA: "Caja"
  };
  var PERMISSIONS = {
    VER: "VER",
    CREAR: "CREAR",
    EDITAR: "EDITAR",
    ELIMINAR: "ELIMINAR",
    AUTORIZAR: "AUTORIZAR",
    EXPORTAR: "EXPORTAR",
    FINANCIERO: "FINANCIERO",
    DEVELOPER: "DEVELOPER"
  };
  var ROLE_ALLOWED_MODULES = {
    // DESARROLLADOR / AUTOR DEL SOFTWARE: Acceso irrestricto a los 20 módulos, auditoría forense y control multiempresa
    [ROLES.DEV]: [
      "dashboard",
      "sales-pos",
      "clients",
      "freelancers",
      "shipping",
      "products",
      "inventory",
      "production",
      "purchases",
      "cash",
      "expenses",
      "cxc",
      "cxp",
      "reports",
      "users",
      "audit",
      "settings",
      "backup",
      "importer",
      "integrations",
      "documents",
      "formulas-vault",
      "pricing-calculator"
    ],
    // GERENCIA: Enfoque estratégico, comercial, financiero y operativo completo.
    // NO tiene acceso a 'users', 'audit' ni 'settings' (Parámetros & Empresa: solo el Desarrollador).
    [ROLES.GERENTE]: [
      "dashboard",
      "sales-pos",
      "clients",
      "freelancers",
      "shipping",
      "products",
      "inventory",
      "production",
      "purchases",
      "cash",
      "expenses",
      "cxc",
      "cxp",
      "reports",
      "backup",
      "importer",
      "integrations",
      "documents",
      "formulas-vault",
      "pricing-calculator"
    ],
    // ASESOR COMERCIAL / VENTAS: POS, Clientes 360, Pedidos y Despachos, Catálogo y Documentos
    [ROLES.VENDEDOR]: [
      "sales-pos",
      "clients",
      "freelancers",
      "shipping",
      "products",
      "documents"
    ],
    // LOGÍSTICA & BODEGA: Catálogo, Inventario/Kardex, Despachos y Recepción de Compras
    [ROLES.BODEGA]: [
      "products",
      "inventory",
      "shipping",
      "purchases"
    ],
    // PLANTA & PRODUCCIÓN: Catálogo de fórmulas, Inventario de insumos, Módulo de Envasado/BOM y Compras
    [ROLES.PRODUCCION]: [
      "products",
      "inventory",
      "production",
      "purchases",
      "documents"
    ],
    // CAJERO / TESORERÍA MOSTRADOR: Punto de venta, Arqueo de caja, Gastos menores y Cartera CxC
    [ROLES.CAJA]: [
      "sales-pos",
      "cash",
      "expenses",
      "cxc"
    ]
  };
  var SESSION_KEY = "nexa_session";
  var LEGACY_SESSION_KEY = "nexa_active_user";
  var IDLE_TIMEOUT_MS = 8 * 60 * 60 * 1e3;
  var RECOVERY_PARAM = "auth_recuperacion";
  var LOCK_KEY = "nexa_login_lock";
  var MAX_ATTEMPTS = 5;
  var LOCK_MS = 60 * 1e3;
  var AuthService = class {
    constructor() {
      this.currentUser = null;
      this.needsSetup = false;
      this._activityBound = false;
    }
    /**
     * Inicializa: migra contraseñas en texto plano a hash, detecta primer arranque
     * y restaura la sesión si sigue vigente. Ya NO crea ni borra usuarios.
     */
    async init() {
      await this.migrateUsers();
      const users = await DB.getAll(STORES.USERS);
      this.needsSetup = users.length === 0;
      localStorage.removeItem(LEGACY_SESSION_KEY);
      this.currentUser = null;
      const sess = this.readSession();
      if (sess) {
        const user = users.find((u) => u.id === sess.userId);
        const vigente = Date.now() - Number(sess.lastActive || 0) < IDLE_TIMEOUT_MS;
        if (user && user.estado !== "INACTIVO" && vigente && !user.debeCambiarClave) {
          this.currentUser = user;
          this.touch();
        } else {
          this.clearSession();
        }
      }
      Session.setUser(this.currentUser);
      this.bindActivityTracking();
      return this.currentUser;
    }
    /** Convierte claves en texto plano (versiones anteriores y respaldos antiguos) a hash PBKDF2 */
    async migrateUsers() {
      if (!await DB.getParam("auth_pin4_v1", false)) {
        for (const u of await DB.getAll(STORES.USERS)) {
          if (u.debeCambiarClave) {
            u.debeCambiarClave = false;
            await DB.update(STORES.USERS, u);
          }
        }
        await DB.setParam("auth_pin4_v1", true);
      }
      const users = await DB.getAll(STORES.USERS);
      for (const u of users) {
        if (!Object.prototype.hasOwnProperty.call(u, "clave"))
          continue;
        const plain = (u.clave || "").trim();
        delete u.clave;
        if (plain) {
          u.claveHash = await CryptoUtil.hashPassword(plain);
        } else if (!u.claveHash) {
          u.sinClave = true;
        }
        if (!u.estado)
          u.estado = "ACTIVO";
        await DB.update(STORES.USERS, u);
      }
      if (!await DB.getParam("auth_pin_reset_1234_v1", false)) {
        const all = await DB.getAll(STORES.USERS);
        if (all.length) {
          const hash = await CryptoUtil.hashPassword("1234");
          for (const u of all) {
            u.claveHash = hash;
            delete u.clave;
            delete u.sinClave;
            u.debeCambiarClave = false;
            await DB.update(STORES.USERS, u);
          }
          localStorage.removeItem(LOCK_KEY);
        }
        await DB.setParam("auth_pin_reset_1234_v1", true);
      }
    }
    /** Regla simplificada (decisión del propietario): PIN de exactamente 4 dígitos numéricos */
    isStrongPassword(p) {
      return /^\d{4}$/.test(String(p || ""));
    }
    passwordRules() {
      return "El PIN debe tener exactamente 4 d\xEDgitos num\xE9ricos.";
    }
    // ---------------------------------------------------------------- sesión
    readSession() {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    }
    startSession(user) {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, inicio: Date.now(), lastActive: Date.now() }));
      this.currentUser = user;
      Session.setUser(user);
    }
    clearSession() {
      localStorage.removeItem(SESSION_KEY);
    }
    touch() {
      const s = this.readSession();
      if (s) {
        s.lastActive = Date.now();
        localStorage.setItem(SESSION_KEY, JSON.stringify(s));
      }
    }
    bindActivityTracking() {
      if (this._activityBound || typeof document === "undefined")
        return;
      this._activityBound = true;
      let last = 0;
      const onActivity = () => {
        const now = Date.now();
        if (now - last > 6e4) {
          last = now;
          this.touch();
        }
      };
      ["click", "keydown"].forEach((ev) => document.addEventListener(ev, onActivity, { passive: true }));
      setInterval(() => {
        const s = this.readSession();
        if (this.currentUser && s && Date.now() - Number(s.lastActive || 0) > IDLE_TIMEOUT_MS)
          this.logout();
      }, 5 * 60 * 1e3);
    }
    // ---------------------------------------------------------------- bloqueo por intentos
    lockState() {
      try {
        return JSON.parse(localStorage.getItem(LOCK_KEY) || '{"fails":0,"until":0}');
      } catch (e) {
        return { fails: 0, until: 0 };
      }
    }
    registerFailure() {
      const st = this.lockState();
      st.fails = (st.fails || 0) + 1;
      if (st.fails >= MAX_ATTEMPTS) {
        st.until = Date.now() + LOCK_MS;
        st.fails = 0;
      }
      localStorage.setItem(LOCK_KEY, JSON.stringify(st));
    }
    // ---------------------------------------------------------------- primer arranque
    /**
     * Crea el primer usuario (Desarrollador) cuando la base de datos no tiene usuarios.
     * @returns {Promise<string>} código de recuperación (mostrar una sola vez)
     */
    async createInitialAdmin({ nombre, usuario, password, tenantId }) {
      const users = await DB.getAll(STORES.USERS);
      if (users.length > 0)
        throw new Error("El sistema ya tiene usuarios configurados.");
      if (!this.isStrongPassword(password))
        throw new Error(this.passwordRules());
      const u = {
        id: "usr_dev",
        tenantId,
        nombre: (nombre || "Administrador").trim(),
        usuario: (usuario || "admin").trim().toLowerCase(),
        claveHash: await CryptoUtil.hashPassword(password),
        rol: ROLES.DEV,
        estado: "ACTIVO",
        permisos: Object.values(PERMISSIONS)
      };
      await DB.add(STORES.USERS, u);
      this.startSession(u);
      await AuditService.log({ modulo: "Seguridad", accion: "CREAR", registroId: u.id, campoModificado: "Configuraci\xF3n inicial", valorNuevo: u.usuario });
      return null;
    }
    /** Usuarios que pueden iniciar sesión (para el desplegable del login) */
    async listLoginUsers() {
      const users = await DB.getAll(STORES.USERS);
      return users.filter((u) => u.estado !== "INACTIVO" && u.claveHash && !u.sinClave).map((u) => ({ usuario: u.usuario, nombre: u.nombre, rol: u.rol })).sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), "es"));
    }
    // ---------------------------------------------------------------- login
    /**
     * @returns {Promise<{user: Object, mustChange: boolean}>}
     */
    async login(usuario, password) {
      const st = this.lockState();
      if (st.until && Date.now() < st.until) {
        const s = Math.ceil((st.until - Date.now()) / 1e3);
        throw new Error(`Demasiados intentos fallidos. Espere ${s} segundos.`);
      }
      const uname = String(usuario || "").trim().toLowerCase();
      const users = await DB.getAll(STORES.USERS);
      const user = users.find((u) => String(u.usuario || "").toLowerCase() === uname);
      const fail = async () => {
        this.registerFailure();
        await AuditService.log({ modulo: "Seguridad", accion: "LOGIN_FALLIDO", registroId: uname || "-", campoModificado: "Intento de acceso", valorNuevo: "Rechazado" });
        throw new Error("Usuario o contrase\xF1a incorrectos.");
      };
      if (!user || user.estado === "INACTIVO")
        return fail();
      if (user.sinClave || !user.claveHash) {
        throw new Error("Este usuario no tiene contrase\xF1a asignada. Pida al administrador que le asigne una.");
      }
      const ok = await CryptoUtil.verifyPassword(String(password || ""), user.claveHash);
      if (!ok)
        return fail();
      localStorage.removeItem(LOCK_KEY);
      if (user.debeCambiarClave)
        return { user, mustChange: true };
      this.startSession(user);
      await AuditService.log({ modulo: "Seguridad", accion: "LOGIN", registroId: user.id, campoModificado: "Sesi\xF3n", valorNuevo: `${user.nombre} (${user.rol})` });
      EventBus.emit("auth:userChanged", user);
      return { user, mustChange: false };
    }
    /** Cambio de clave verificando la actual (usado también para el cambio obligatorio) */
    async changePassword(userId, currentPassword, newPassword) {
      const user = await DB.getById(STORES.USERS, userId);
      if (!user)
        throw new Error("Usuario no encontrado.");
      if (!await CryptoUtil.verifyPassword(String(currentPassword || ""), user.claveHash)) {
        throw new Error("La contrase\xF1a actual no es correcta.");
      }
      return this.setPassword(userId, newPassword, { startSession: true });
    }
    /** Asigna una clave nueva (administración de usuarios o recuperación) */
    async setPassword(userId, newPassword, { startSession = false } = {}) {
      if (!this.isStrongPassword(newPassword))
        throw new Error(this.passwordRules());
      const user = await DB.getById(STORES.USERS, userId);
      if (!user)
        throw new Error("Usuario no encontrado.");
      user.claveHash = await CryptoUtil.hashPassword(newPassword);
      delete user.clave;
      delete user.sinClave;
      user.debeCambiarClave = false;
      user.fechaCambioClave = (/* @__PURE__ */ new Date()).toISOString();
      await DB.update(STORES.USERS, user);
      if (startSession)
        this.startSession(user);
      await AuditService.log({ modulo: "Seguridad", accion: "MODIFICAR", registroId: user.id, campoModificado: "Contrase\xF1a", valorNuevo: "Actualizada" });
      return user;
    }
    // ---------------------------------------------------------------- recuperación
    async hasRecoveryCode() {
      return !!await DB.getParam(RECOVERY_PARAM, null);
    }
    /** Genera un nuevo código de recuperación (invalida el anterior). Solo Desarrollador o primer arranque. */
    async regenerateRecoveryCode(force = false) {
      if (!force && !this.isDeveloper())
        throw new Error("Solo el Desarrollador puede generar el c\xF3digo de recuperaci\xF3n.");
      const code = CryptoUtil.generateRecoveryCode();
      await DB.setParam(RECOVERY_PARAM, { hash: await CryptoUtil.hashPassword(code), fecha: (/* @__PURE__ */ new Date()).toISOString() });
      return code;
    }
    /**
     * Restablece la clave de un usuario con el código de recuperación.
     * El código se consume y se devuelve uno nuevo para guardar.
     */
    async recoverWithCode(usuario, code, newPassword) {
      const st = this.lockState();
      if (st.until && Date.now() < st.until)
        throw new Error("Demasiados intentos fallidos. Espere un momento.");
      const rec = await DB.getParam(RECOVERY_PARAM, null);
      if (!rec || !rec.hash)
        throw new Error("No hay un c\xF3digo de recuperaci\xF3n configurado en este equipo.");
      const ok = await CryptoUtil.verifyPassword(CryptoUtil.normalizeRecoveryCode(code), rec.hash);
      if (!ok) {
        this.registerFailure();
        await AuditService.log({ modulo: "Seguridad", accion: "RECUPERACION_FALLIDA", registroId: usuario || "-", campoModificado: "C\xF3digo de recuperaci\xF3n", valorNuevo: "Rechazado" });
        throw new Error("C\xF3digo de recuperaci\xF3n incorrecto.");
      }
      const users = await DB.getAll(STORES.USERS);
      const user = users.find((u) => String(u.usuario || "").toLowerCase() === String(usuario || "").trim().toLowerCase());
      if (!user)
        throw new Error("Usuario no encontrado.");
      await this.setPassword(user.id, newPassword);
      user.estado = "ACTIVO";
      await DB.update(STORES.USERS, { ...await DB.getById(STORES.USERS, user.id), estado: "ACTIVO" });
      const nuevo = await this.regenerateRecoveryCode(true);
      await AuditService.log({ modulo: "Seguridad", accion: "RECUPERACION", registroId: user.id, campoModificado: "Contrase\xF1a restablecida con c\xF3digo", valorNuevo: user.usuario });
      localStorage.removeItem(LOCK_KEY);
      return nuevo;
    }
    logout() {
      if (this.currentUser) {
        AuditService.log({ modulo: "Seguridad", accion: "LOGOUT", registroId: this.currentUser.id, campoModificado: "Sesi\xF3n", valorNuevo: "Cerrada" });
      }
      this.currentUser = null;
      Session.setUser(null);
      this.clearSession();
      window.location.reload();
    }
    getCurrentUser() {
      return this.currentUser;
    }
    isDeveloper() {
      return this.currentUser?.rol === ROLES.DEV;
    }
    canManageUsers() {
      return this.isDeveloper();
    }
    canManageTenants() {
      return this.isDeveloper();
    }
    /**
     * Cambio de perfil sin contraseña: SOLO para el Desarrollador (soporte / pruebas). Queda auditado.
     */
    async switchUser(userId) {
      if (!this.isDeveloper())
        throw new Error("Solo el Desarrollador puede cambiar de perfil sin cerrar sesi\xF3n.");
      const user = await DB.getById(STORES.USERS, userId);
      if (!user)
        throw new Error("Usuario no encontrado.");
      if (user.estado === "INACTIVO")
        throw new Error("El usuario est\xE1 inactivo.");
      const from = this.currentUser;
      await AuditService.log({ modulo: "Seguridad", accion: "SUPLANTAR", registroId: user.id, campoModificado: "Cambio de perfil", valorAnterior: from.nombre, valorNuevo: user.nombre });
      this.startSession(user);
      EventBus.emit("auth:userChanged", user);
      return user;
    }
    getAllowedModules() {
      if (!this.currentUser)
        return [];
      if (this.isDeveloper())
        return ROLE_ALLOWED_MODULES[ROLES.DEV];
      return ROLE_ALLOWED_MODULES[this.currentUser.rol] || [];
    }
    canAccessRoute(route) {
      if (!route)
        return true;
      if (!this.currentUser)
        return false;
      if (this.isDeveloper())
        return true;
      return this.getAllowedModules().includes(route);
    }
    getDefaultRoute() {
      const allowed = this.getAllowedModules();
      return allowed.length > 0 ? allowed[0] : "dashboard";
    }
    hasPermission(permission) {
      if (!this.currentUser)
        return false;
      if (this.isDeveloper())
        return true;
      return (this.currentUser.permisos || []).includes(permission);
    }
    canViewFinancials() {
      return this.hasPermission(PERMISSIONS.FINANCIERO);
    }
  };
  var AuthServiceInstance = new AuthService();

  // js/services/cash-service.js
  var CASH_TX_STORES = [STORES.CASH_SHIFTS, STORES.CASH_MOVEMENTS, STORES.AUDIT_LOGS];
  var PAYMENT_FIELD = {
    "Efectivo": "totalVentasEfectivo",
    "Transferencia": "totalVentasTransferencia",
    "Nequi": "totalVentasNequiDaviplata",
    "Daviplata": "totalVentasNequiDaviplata",
    "Tarjeta": "totalVentasTarjeta"
  };
  var MOV_SIGN = { INGRESO: 1, EGRESO: -1, RETIRO: -1, GASTO: -1 };
  var MOV_FIELD = { INGRESO: "totalIngresos", EGRESO: "totalEgresos", RETIRO: "totalRetiros", GASTO: "totalGastos" };
  var CashService = {
    async getCurrentShift(tenantId) {
      const shifts = await DB.getAll(STORES.CASH_SHIFTS, tenantId);
      return shifts.find((s) => s.estado === "ABIERTA") || null;
    },
    async openShift({ tenantId, montoApertura, observaciones }) {
      const monto = Number(montoApertura);
      if (!Number.isFinite(monto) || monto < 0)
        throw new Error("La base de apertura debe ser un valor igual o mayor a cero.");
      const saved = await DB.runTransaction(CASH_TX_STORES, async (tx) => {
        const shifts = await tx.getAll(STORES.CASH_SHIFTS, tenantId);
        if (shifts.some((s) => s.estado === "ABIERTA")) {
          throw new Error("Ya existe un turno de caja abierto. Debe cerrarlo antes de abrir uno nuevo.");
        }
        const shift = await tx.put(STORES.CASH_SHIFTS, {
          tenantId,
          usuarioId: Session.userId(),
          usuarioNombre: Session.userName(),
          fechaApertura: (/* @__PURE__ */ new Date()).toISOString(),
          fechaCierre: null,
          montoApertura: monto,
          totalVentasEfectivo: 0,
          totalVentasTransferencia: 0,
          totalVentasNequiDaviplata: 0,
          totalVentasTarjeta: 0,
          totalVentasCredito: 0,
          totalIngresos: 0,
          totalEgresos: 0,
          totalGastos: 0,
          totalRetiros: 0,
          saldoEsperado: monto,
          saldoContado: 0,
          diferencia: 0,
          estado: "ABIERTA",
          observaciones: observaciones || ""
        });
        await AuditService.logTx(tx, {
          tenantId,
          modulo: "Caja",
          accion: "CREAR",
          registroId: shift.id,
          campoModificado: "Apertura de Turno",
          valorNuevo: `Base: $ ${monto}`
        });
        return shift;
      });
      EventBus.emit("cash:shiftChanged", saved);
      return saved;
    },
    /**
     * Movimiento manual dentro de una transacción.
     * Las salidas no pueden superar el efectivo esperado en gaveta.
     */
    async applyMovementTx(tx, { tenantId, turnoId, tipo, monto, concepto, tercero, formaPago, refTipo, refId }) {
      const shift = await tx.get(STORES.CASH_SHIFTS, turnoId);
      if (!shift || shift.estado !== "ABIERTA") {
        throw new Error("No hay un turno de caja abierto v\xE1lido para registrar este movimiento.");
      }
      const val = Number(monto);
      if (!Number.isFinite(val) || val <= 0)
        throw new Error("El monto del movimiento debe ser mayor a cero.");
      if (!MOV_SIGN[tipo])
        throw new Error(`Tipo de movimiento de caja inv\xE1lido: ${tipo}`);
      if (MOV_SIGN[tipo] < 0 && val > Number(shift.saldoEsperado || 0)) {
        throw new Error(`No hay suficiente efectivo en caja: esperado ${shift.saldoEsperado}, salida ${val}.`);
      }
      shift[MOV_FIELD[tipo]] = Number(shift[MOV_FIELD[tipo]] || 0) + val;
      shift.saldoEsperado = Number(shift.saldoEsperado || 0) + MOV_SIGN[tipo] * val;
      await tx.put(STORES.CASH_SHIFTS, shift);
      const movement = await tx.put(STORES.CASH_MOVEMENTS, {
        tenantId,
        turnoId,
        tipo,
        monto: val,
        concepto: concepto || "-",
        tercero: tercero || "-",
        formaPago: formaPago || "Efectivo",
        refTipo: refTipo || null,
        refId: refId || null,
        fecha: (/* @__PURE__ */ new Date()).toISOString(),
        usuarioId: Session.userId(),
        usuarioNombre: Session.userName()
      });
      await AuditService.logTx(tx, {
        tenantId,
        modulo: "Caja",
        accion: "CREAR",
        registroId: turnoId,
        campoModificado: `Movimiento Caja: ${tipo}`,
        valorNuevo: `$ ${val} - ${concepto || ""}`
      });
      return movement;
    },
    async addMovement(params) {
      const mov = await DB.runTransaction(CASH_TX_STORES, (tx) => this.applyMovementTx(tx, params));
      EventBus.emit("cash:shiftChanged");
      return mov;
    },
    /**
     * Suma (signo +1) o revierte (signo -1) el valor de una venta en el turno.
     * Solo los pagos en efectivo afectan el saldo esperado en gaveta.
     */
    async applySaleTx(tx, turnoId, metodoPago, total, signo = 1) {
      const shift = await tx.get(STORES.CASH_SHIFTS, turnoId);
      if (!shift || shift.estado !== "ABIERTA")
        throw new Error("El turno de caja de la venta no est\xE1 abierto.");
      const field = PAYMENT_FIELD[metodoPago];
      if (!field)
        return shift;
      const val = Number(total) * signo;
      if (metodoPago === "Efectivo" && signo < 0 && Number(total) > Number(shift.saldoEsperado || 0)) {
        throw new Error("No hay suficiente efectivo en caja para devolver esta venta.");
      }
      shift[field] = Number(shift[field] || 0) + val;
      if (metodoPago === "Efectivo")
        shift.saldoEsperado = Number(shift.saldoEsperado || 0) + val;
      await tx.put(STORES.CASH_SHIFTS, shift);
      return shift;
    },
    async closeShift({ turnoId, saldoContado, observacionesCierre }) {
      const contado = Number(saldoContado);
      if (!Number.isFinite(contado) || contado < 0)
        throw new Error("El efectivo contado debe ser un valor igual o mayor a cero.");
      const shift = await DB.runTransaction(CASH_TX_STORES, async (tx) => {
        const s = await tx.get(STORES.CASH_SHIFTS, turnoId);
        if (!s)
          throw new Error("Turno de caja no encontrado.");
        if (s.estado !== "ABIERTA")
          throw new Error("El turno ya est\xE1 cerrado.");
        s.fechaCierre = (/* @__PURE__ */ new Date()).toISOString();
        s.saldoContado = contado;
        s.diferencia = contado - Number(s.saldoEsperado || 0);
        s.observacionesCierre = observacionesCierre || "";
        s.cerradoPorId = Session.userId();
        s.cerradoPorNombre = Session.userName();
        s.estado = "CERRADA";
        await tx.put(STORES.CASH_SHIFTS, s);
        await AuditService.logTx(tx, {
          tenantId: s.tenantId,
          modulo: "Caja",
          accion: "MODIFICAR",
          registroId: turnoId,
          campoModificado: "Cierre y Arqueo de Caja",
          valorAnterior: `Esperado: $ ${s.saldoEsperado}`,
          valorNuevo: `Contado: $ ${contado} (Diferencia: $ ${s.diferencia})`
        });
        return s;
      });
      EventBus.emit("cash:shiftChanged", null);
      return shift;
    }
  };

  // js/app.js
  init_toast();

  // js/components/modal.js
  init_formatters();
  var Modal = {
    activeModal: null,
    /**
     * Abre un diálogo modal configurable
     */
    show({ title, content, footerButtons = [], size = "md", onClose = null }) {
      this.close();
      const backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";
      const dialog = document.createElement("div");
      dialog.className = `modal-dialog modal-${size}`;
      dialog.innerHTML = `
      <div class="modal-header">
        <h3 class="modal-title">${esc(title)}</h3>
        <button class="modal-close" aria-label="Cerrar">&times;</button>
      </div>
      <div class="modal-body">${content}</div>
      <div class="modal-footer"></div>
    `;
      const footer = dialog.querySelector(".modal-footer");
      if (footerButtons && footerButtons.length > 0) {
        footerButtons.forEach((btnConfig) => {
          const btn = document.createElement("button");
          btn.className = `btn ${btnConfig.class || "btn-secondary"}`;
          btn.textContent = btnConfig.label;
          if (btnConfig.id)
            btn.id = btnConfig.id;
          btn.addEventListener("click", (e) => {
            if (btnConfig.onClick) {
              btnConfig.onClick(dialog, e);
            } else {
              this.close();
            }
          });
          footer.appendChild(btn);
        });
      } else {
        footer.style.display = "none";
      }
      dialog.querySelector(".modal-close").addEventListener("click", () => {
        this.close();
        if (onClose)
          onClose();
      });
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) {
          this.close();
          if (onClose)
            onClose();
        }
      });
      backdrop.appendChild(dialog);
      document.body.appendChild(backdrop);
      const handleEsc = (e) => {
        if (e.key === "Escape") {
          this.close();
          if (onClose)
            onClose();
        }
      };
      document.addEventListener("keydown", handleEsc);
      this.activeModal = { backdrop, dialog, onClose, handleEsc };
      return dialog;
    },
    /**
     * Cierra el modal activo
     */
    close() {
      if (this.activeModal) {
        if (this.activeModal.handleEsc)
          document.removeEventListener("keydown", this.activeModal.handleEsc);
        if (this.activeModal.backdrop && this.activeModal.backdrop.parentElement) {
          this.activeModal.backdrop.parentElement.removeChild(this.activeModal.backdrop);
        }
        this.activeModal = null;
      }
    },
    /**
     * Diálogo de confirmación estándar seguro
     */
    confirm({ title = "\xBFEst\xE1 seguro?", message, confirmText = "Confirmar", cancelText = "Cancelar", isDanger = false, onConfirm }) {
      this.show({
        title,
        content: `<p style="font-size: 14px; color: var(--text-secondary);">${message}</p>`,
        size: "sm",
        footerButtons: [
          { label: cancelText, class: "btn-secondary", onClick: () => this.close() },
          {
            label: confirmText,
            class: isDanger ? "btn-danger" : "btn-primary",
            onClick: () => {
              this.close();
              if (onConfirm)
                onConfirm();
            }
          }
        ]
      });
    }
  };

  // js/app.js
  init_formatters();

  // js/services/backup-folder-service.js
  var CFG_DB = "NexaAdmin_Config";
  var CFG_STORE = "kv";
  var FILE_LATEST = "NexaAdmin_ultimo.json";
  var FILE_RX = /^NexaAdmin_(\d{4})-(\d{2})-(\d{2})(?:_.*)?\.json$/;
  var DEFAULTS = { enabled: true, intervalMin: 5, keepDays: 30, downloadFallback: true };
  var SHRINK_GUARD = 0.5;
  var SHRINK_MIN_RECORDS = 50;
  var cfgDbPromise = null;
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
      r.onsuccess = () => resolve(r.result === void 0 ? def : r.result);
      r.onerror = () => reject(r.error);
    });
  }
  async function kvSet(key, value) {
    const db = await cfgDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(CFG_STORE, "readwrite");
      if (value === null || value === void 0)
        tx.objectStore(CFG_STORE).delete(key);
      else
        tx.objectStore(CFG_STORE).put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }
  var pad = (n) => String(n).padStart(2, "0");
  function localDay(d = /* @__PURE__ */ new Date()) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function localHHMM(d = /* @__PURE__ */ new Date()) {
    return `${pad(d.getHours())}${pad(d.getMinutes())}`;
  }
  function countRecords(backup) {
    return Object.values(backup.stores || {}).reduce((n, rows) => n + (Array.isArray(rows) ? rows.length : 0), 0);
  }
  function safeEvent(name) {
    return String(name || "Evento").replace(/[^A-Za-z0-9-]/g, "").slice(0, 30) || "Evento";
  }
  async function writeFile(dir, name, text) {
    const fh = await dir.getFileHandle(name, { create: true });
    const w = await fh.createWritable();
    await w.write(text);
    await w.close();
  }
  var BackupFolderServiceClass = class {
    constructor() {
      this.handle = null;
      this.settings = { ...DEFAULTS };
      this.lastOk = null;
      this.lastError = null;
      this.lastCount = 0;
      this.savedSeq = -1;
      this.lastRunAt = 0;
      this.busy = null;
      this.timer = null;
      this.permission = "none";
      this.loaded = false;
    }
    isSupported() {
      return typeof window.showDirectoryPicker === "function";
    }
    isBrave() {
      return !!(navigator.brave && typeof navigator.brave.isBrave === "function");
    }
    folderName() {
      return this.handle ? this.handle.name || "carpeta seleccionada" : null;
    }
    /** Estado resumido para la interfaz. */
    get state() {
      if (!this.settings.enabled)
        return "disabled";
      if (!this.handle)
        return this.isSupported() ? "no-folder" : "unsupported";
      if (this.permission !== "granted")
        return "needs-permission";
      if (this.lastError)
        return "error";
      return "ok";
    }
    async load() {
      if (this.loaded)
        return;
      try {
        this.settings = { ...DEFAULTS, ...await kvGet("settings", {}) };
        this.handle = await kvGet("dirHandle", null);
        const st = await kvGet("status", {});
        this.lastOk = st.lastOk || null;
        this.lastCount = st.lastCount || 0;
        this.lastError = null;
        await this.checkPermission(false);
      } catch (e) {
        console.warn("[Respaldo] No se pudo leer la configuraci\xF3n:", e);
      }
      this.loaded = true;
    }
    async saveSettings(patch) {
      this.settings = { ...this.settings, ...patch };
      await kvSet("settings", this.settings);
      this.emit();
    }
    emit() {
      EventBus.emit("backup:status", this);
    }
    /**
     * Consulta (y opcionalmente solicita) permiso de escritura sobre la carpeta.
     * Solicitarlo exige un gesto del usuario (clic o tecla).
     */
    async checkPermission(request = false) {
      if (!this.handle) {
        this.permission = "none";
        return this.permission;
      }
      try {
        let p = typeof this.handle.queryPermission === "function" ? await this.handle.queryPermission({ mode: "readwrite" }) : "granted";
        if (p !== "granted" && request && typeof this.handle.requestPermission === "function") {
          p = await this.handle.requestPermission({ mode: "readwrite" });
        }
        this.permission = p;
      } catch (e) {
        this.permission = "denied";
      }
      this.emit();
      return this.permission;
    }
    /** Abre el selector de carpeta del sistema. Devuelve información del respaldo existente en ella, si lo hay. */
    async chooseFolder() {
      if (!this.isSupported())
        throw new Error("Este navegador no permite elegir carpetas. Active la funci\xF3n o use Chrome/Edge.");
      const dir = await window.showDirectoryPicker({ id: "nexa-respaldos", mode: "readwrite", startIn: "documents" });
      return this.useHandle(dir);
    }
    /** Usa una carpeta ya obtenida (también lo usan las pruebas automáticas). */
    async useHandle(dir) {
      this.handle = dir;
      this.lastError = null;
      this.lastCount = 0;
      await kvSet("dirHandle", dir);
      await this.saveStatus();
      await this.checkPermission(true);
      return this.inspectFolder();
    }
    async forgetFolder() {
      this.handle = null;
      this.permission = "none";
      this.lastError = null;
      await kvSet("dirHandle", null);
      this.emit();
    }
    /** Lee NexaAdmin_ultimo.json de la carpeta (si existe) para comparar con la base actual. */
    async inspectFolder() {
      if (!this.handle || this.permission !== "granted")
        return null;
      try {
        const fh = await this.handle.getFileHandle(FILE_LATEST);
        const data = JSON.parse(await (await fh.getFile()).text());
        const current = countRecords(await DB.exportBackup());
        return { timestamp: data.timestamp || null, records: countRecords(data), currentRecords: current, data };
      } catch (e) {
        return null;
      }
    }
    /** Lista los respaldos de la carpeta, del más reciente al más antiguo. */
    async listFiles() {
      if (!this.handle || this.permission !== "granted")
        return [];
      const out = [];
      for await (const [name, h] of this.handle.entries()) {
        if (h.kind !== "file" || !(name === FILE_LATEST || FILE_RX.test(name)))
          continue;
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
      await kvSet("status", { lastOk: this.lastOk, lastCount: this.lastCount });
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
      if (this.busy)
        return this.busy;
      this.busy = (async () => {
        try {
          if (!this.handle)
            throw new Error("No hay carpeta de respaldo configurada.");
          if (await this.checkPermission(false) !== "granted")
            throw new Error("Falta dar permiso a la carpeta de respaldo.");
          const seq = DB.changeSeq;
          const backup = await DB.exportBackup();
          const records = countRecords(backup);
          if (!opts.force && this.lastCount >= SHRINK_MIN_RECORDS && records < this.lastCount * SHRINK_GUARD) {
            throw new Error(`La base actual tiene ${records} registros y el \xFAltimo respaldo ${this.lastCount}. No se sobrescribi\xF3 para no perder informaci\xF3n. Si borr\xF3 los datos del navegador, restaure desde la carpeta.`);
          }
          const text = JSON.stringify(backup);
          const now = /* @__PURE__ */ new Date();
          await writeFile(this.handle, FILE_LATEST, text);
          await writeFile(this.handle, `NexaAdmin_${localDay(now)}.json`, text);
          if (eventName)
            await writeFile(this.handle, `NexaAdmin_${localDay(now)}_${localHHMM(now)}_${safeEvent(eventName)}.json`, text);
          await this.rotate(now);
          this.savedSeq = seq;
          this.lastOk = now.toISOString();
          this.lastCount = records;
          this.lastError = null;
          await this.saveStatus();
          return true;
        } catch (e) {
          this.lastError = e.message || String(e);
          console.warn("[Respaldo] " + this.lastError);
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
    async rotate(now = /* @__PURE__ */ new Date()) {
      const keep = Math.max(1, Number(this.settings.keepDays) || DEFAULTS.keepDays);
      const limit = new Date(now.getFullYear(), now.getMonth(), now.getDate() - keep);
      const old = [];
      for await (const [name, h] of this.handle.entries()) {
        const m = h.kind === "file" && name.match(FILE_RX);
        if (m && new Date(+m[1], +m[2] - 1, +m[3]) < limit)
          old.push(name);
      }
      for (const name of old) {
        try {
          await this.handle.removeEntry(name);
        } catch (e) {
        }
      }
      return old;
    }
    /** Respalda si hubo cambios desde la última copia. */
    async runIfDirty() {
      if (this.state === "disabled" || !this.handle || this.permission !== "granted")
        return false;
      if (DB.changeSeq === this.savedSeq)
        return false;
      return this.backupNow();
    }
    /**
     * Respaldo por evento (cierre de caja, antes de restaurar).
     * Con carpeta activa escribe ahí; si no, descarga el archivo como antes.
     */
    async backupEvent(eventName) {
      if (this.settings.enabled && this.handle && this.permission === "granted") {
        if (await this.backupNow(eventName, { force: eventName === "AntesDeRestaurar" }))
          return true;
      }
      return DB.downloadAutoBackup(eventName);
    }
    /** Arranca el ciclo automático (después de iniciar sesión). */
    async start() {
      await this.load();
      if (this.timer)
        return;
      this.savedSeq = -1;
      this.timer = setInterval(() => {
        const due = Date.now() - this.lastRunAt >= (Number(this.settings.intervalMin) || 5) * 6e4;
        if (due)
          this.runIfDirty();
      }, 3e4);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden")
          this.runIfDirty();
      });
      if (this.handle && this.permission === "prompt") {
        const ask = async () => {
          document.removeEventListener("click", ask, true);
          if (await this.checkPermission(true) === "granted")
            this.backupNow();
        };
        document.addEventListener("click", ask, true);
      }
      if (this.state === "ok")
        setTimeout(() => this.runIfDirty(), 3e3);
      if (this.state === "unsupported" && this.settings.enabled && this.settings.downloadFallback) {
        const today2 = localDay();
        if (await kvGet("lastDownloadDay", null) !== today2) {
          setTimeout(async () => {
            if (await DB.downloadAutoBackup("Diario"))
              await kvSet("lastDownloadDay", today2);
          }, 5e3);
        }
      }
      this.emit();
    }
  };
  var BackupFolderService = new BackupFolderServiceClass();
  window.NexaBackup = BackupFolderService;

  // js/services/kardex-service.js
  var MOVEMENT_TYPES = {
    COMPRA: { label: "Compra de Mercanc\xEDa/Insumos", type: "IN" },
    VENTA: { label: "Venta Facturada / POS", type: "OUT" },
    DEVOLUCION_VENTA: { label: "Devoluci\xF3n / Anulaci\xF3n de Venta", type: "IN" },
    DEVOLUCION_COMPRA: { label: "Devoluci\xF3n a Proveedor", type: "OUT" },
    AJUSTE_POS: { label: "Ajuste de Inventario (+)", type: "IN" },
    AJUSTE_NEG: { label: "Ajuste de Inventario (-)", type: "OUT" },
    TRASLADO_ENTRADA: { label: "Traslado entre Bodegas (Entrada)", type: "IN" },
    TRASLADO_SALIDA: { label: "Traslado entre Bodegas (Salida)", type: "OUT" },
    PRODUCCION_ENTRADA: { label: "Entrada de Producto Terminado", type: "IN" },
    CONSUMO_PRODUCCION: { label: "Consumo de Materia Prima", type: "OUT" },
    MERMA: { label: "Baja por Merma T\xE9cnica", type: "OUT" },
    DANO: { label: "Baja por Da\xF1o / Vencimiento", type: "OUT" }
  };
  var KARDEX_TX_STORES = [STORES.PRODUCTS, STORES.KARDEX, STORES.WAREHOUSES, STORES.AUDIT_LOGS];
  var round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
  var round3 = (n) => Math.round((Number(n) || 0) * 1e3) / 1e3;
  var today = () => (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  var LotService = {
    isExpired(l, ref = today()) {
      return !!(l && l.vence && l.vence < ref);
    },
    daysToExpire(l, ref = /* @__PURE__ */ new Date()) {
      if (!l || !l.vence)
        return null;
      return Math.floor((/* @__PURE__ */ new Date(l.vence + "T00:00:00") - /* @__PURE__ */ new Date(ref.toISOString().split("T")[0] + "T00:00:00")) / 864e5);
    },
    lotted(product) {
      return round3((product.lotes || []).reduce((a, l) => a + Number(l.cantidad || 0), 0));
    },
    unlotted(product) {
      return Math.max(0, round3(Number(product.stock || 0) - this.lotted(product)));
    },
    addLot(product, { codigo, cantidad, fecha, vence }) {
      if (!codigo || !(cantidad > 0))
        return;
      product.lotes = product.lotes || [];
      const ex = product.lotes.find((l) => l.codigo === codigo);
      if (ex) {
        ex.cantidad = round3(Number(ex.cantidad || 0) + cantidad);
        if (vence && !ex.vence)
          ex.vence = vence;
      } else {
        product.lotes.push({ codigo, cantidad: round3(cantidad), fecha: fecha || today(), vence: vence || null });
      }
    },
    /** Descuenta `qty` (ya validada contra el stock previo) y devuelve la asignación por lote. */
    consume(product, qty, { expiredFirst = false } = {}) {
      const lots = product.lotes || [];
      const prevStock = Number(product.stock || 0);
      const alloc = [];
      let rest = qty;
      const sinLote = Math.max(0, round3(prevStock - this.lotted(product)));
      if (sinLote > 0 && rest > 0 && !expiredFirst) {
        const take = Math.min(sinLote, rest);
        rest = round3(rest - take);
      }
      const ref = today();
      const key = (l) => [this.isExpired(l, ref) === expiredFirst ? 0 : 1, l.vence || "9999-12-31", l.fecha || ""].join("|");
      for (const l of [...lots].sort((a, b) => key(a).localeCompare(key(b)))) {
        if (rest <= 0)
          break;
        const take = Math.min(Number(l.cantidad || 0), rest);
        if (take <= 0)
          continue;
        l.cantidad = round3(Number(l.cantidad) - take);
        rest = round3(rest - take);
        alloc.push({ codigo: l.codigo, cantidad: round3(take), vence: l.vence || null });
      }
      if (rest > 0 && expiredFirst && sinLote > 0)
        rest = round3(rest - Math.min(sinLote, rest));
      product.lotes = lots.filter((l) => Number(l.cantidad) > 0);
      return alloc;
    }
  };
  var KardexService = {
    /**
     * Aplica un movimiento dentro de una transacción abierta.
     * @returns {Promise<Object>} movimiento guardado (incluye costoUnitario aplicado)
     */
    async applyMovement(tx, {
      tenantId,
      productoId,
      bodegaId,
      documentoTipo,
      documentoNumero,
      cantidad,
      costoUnitario,
      observacion,
      permitirNegativo = false,
      lote = null,
      // entrada: código de lote nuevo (producción)
      vence = null,
      // entrada: fecha de vencimiento AAAA-MM-DD
      lotes = null
      // entrada: devolver lotes exactos [{codigo, cantidad, vence}]
    }) {
      const def = MOVEMENT_TYPES[documentoTipo];
      if (!def)
        throw new Error(`Tipo de movimiento desconocido: ${documentoTipo}`);
      const qty = Number(cantidad);
      if (!Number.isFinite(qty) || qty <= 0)
        throw new Error("La cantidad del movimiento debe ser mayor a cero.");
      const product = await tx.get(STORES.PRODUCTS, productoId);
      if (!product)
        throw new Error(`Producto con ID ${productoId} no encontrado.`);
      const warehouse = bodegaId ? await tx.get(STORES.WAREHOUSES, bodegaId) : null;
      const isEntry = def.type === "IN";
      const prevStock = Number(product.stock || 0);
      const prevAvg = Number(product.costoPromedio || 0);
      if (!isEntry && qty > prevStock + 1e-9 && !permitirNegativo) {
        throw new Error(`Stock insuficiente de "${product.nombre}": disponible ${prevStock}, requerido ${qty}.`);
      }
      let unitCost;
      if (isEntry) {
        unitCost = round2(costoUnitario !== void 0 && costoUnitario !== null ? costoUnitario : prevAvg);
      } else {
        unitCost = documentoTipo === "DEVOLUCION_COMPRA" && costoUnitario ? round2(costoUnitario) : prevAvg;
      }
      const newStock = round2(isEntry ? prevStock + qty : prevStock - qty);
      let newAvg = prevAvg;
      if (isEntry && newStock > 0) {
        const prevValue = Math.max(0, prevStock) * prevAvg;
        newAvg = round2((prevValue + qty * unitCost) / newStock);
      }
      let lotesMov = [];
      if (isEntry) {
        if (Array.isArray(lotes) && lotes.length) {
          lotes.forEach((l) => LotService.addLot(product, { codigo: l.codigo, cantidad: Number(l.cantidad), vence: l.vence }));
          lotesMov = lotes.map((l) => ({ codigo: l.codigo, cantidad: Number(l.cantidad), vence: l.vence || null }));
        } else if (lote) {
          LotService.addLot(product, { codigo: lote, cantidad: qty, vence });
          lotesMov = [{ codigo: lote, cantidad: qty, vence: vence || null }];
        }
      } else if ((product.lotes || []).length) {
        lotesMov = LotService.consume(product, qty, { expiredFirst: documentoTipo === "DANO" });
      }
      product.stock = newStock;
      product.costoPromedio = newAvg;
      if (isEntry && unitCost > 0 && (documentoTipo === "COMPRA" || documentoTipo === "PRODUCCION_ENTRADA")) {
        product.ultimoCosto = unitCost;
      }
      await tx.put(STORES.PRODUCTS, product);
      const movement = await tx.put(STORES.KARDEX, {
        tenantId,
        fecha: (/* @__PURE__ */ new Date()).toISOString(),
        productoId,
        productoNombre: product.nombre,
        sku: product.sku,
        bodegaId: bodegaId || product.bodegaId || null,
        bodegaNombre: warehouse ? warehouse.nombre : "Bodega Principal",
        documentoTipo,
        documentoNumero: documentoNumero || "-",
        cantidadEntrada: isEntry ? qty : 0,
        cantidadSalida: isEntry ? 0 : qty,
        saldoCantidad: newStock,
        costoUnitario: unitCost,
        costoTotal: round2(qty * unitCost),
        costoPromedioResultante: newAvg,
        lotes: lotesMov,
        usuarioId: Session.userId(),
        usuarioNombre: Session.userName(),
        observacion: observacion || ""
      });
      await AuditService.logTx(tx, {
        tenantId,
        modulo: "Inventario",
        accion: isEntry ? "ENTRADA" : "SALIDA",
        registroId: product.sku,
        campoModificado: `Movimiento: ${documentoTipo} (${documentoNumero || "-"})`,
        valorAnterior: `${prevStock} ${product.unidadMedida || ""}`.trim(),
        valorNuevo: `${newStock} ${product.unidadMedida || ""}`.trim()
      });
      return movement;
    },
    /** Registra un movimiento aislado en su propia transacción */
    async registerMovement(params) {
      return DB.runTransaction(KARDEX_TX_STORES, (tx) => this.applyMovement(tx, params));
    },
    async getMovements(tenantId, filters = {}) {
      let list = await DB.getAll(STORES.KARDEX, tenantId);
      if (filters.productoId)
        list = list.filter((m) => m.productoId === filters.productoId);
      if (filters.bodegaId)
        list = list.filter((m) => m.bodegaId === filters.bodegaId);
      if (filters.documentoTipo)
        list = list.filter((m) => m.documentoTipo === filters.documentoTipo);
      return list.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }
  };

  // js/services/tax-service.js
  var TAX_RATES = {
    EXENTO: 0,
    REDUCIDO: 0.05,
    GENERAL: 0.19
  };
  var round = (n) => Math.round(Number(n) || 0);
  var TaxService = {
    /**
     * @param {Array} items - { cantidad, precioUnitario, descuentoPct?, ivaPct?, precioIncluyeIva? }
     * @param {Number} globalDiscountPct - descuento global (%) aplicado después de los descuentos por ítem
     * @param {Object} options - { aplicaIva: boolean }
     */
    calculateTotals(items = [], globalDiscountPct = 0, options = { aplicaIva: true }) {
      const cobrarIva = options.aplicaIva !== false;
      const gd = Math.min(100, Math.max(0, Number(globalDiscountPct) || 0)) / 100;
      let subtotalBruto = 0;
      let totalDescuentos = 0;
      let baseGravable = 0;
      let totalIva = 0;
      let total = 0;
      const lineas = [];
      items.forEach((item) => {
        const qty = Number(item.cantidad) || 0;
        const price = Number(item.precioUnitario) || 0;
        const discPct = Math.min(100, Math.max(0, Number(item.descuentoPct) || 0)) / 100;
        const rate = (item.ivaPct !== void 0 && item.ivaPct !== null ? Number(item.ivaPct) : 19) / 100;
        const bruto = qty * price;
        const despuesDescItem = bruto * (1 - discPct);
        const neto = despuesDescItem * (1 - gd);
        const descuento = bruto - neto;
        let base;
        let iva;
        let totalLinea;
        if (!cobrarIva || rate === 0) {
          base = neto;
          iva = 0;
          totalLinea = neto;
        } else if (item.precioIncluyeIva) {
          totalLinea = neto;
          base = neto / (1 + rate);
          iva = neto - base;
        } else {
          base = neto;
          iva = neto * rate;
          totalLinea = neto + iva;
        }
        const l = {
          bruto: round(bruto),
          descuento: round(descuento),
          base: round(base),
          iva: round(totalLinea) - round(base),
          total: round(totalLinea)
        };
        lineas.push(l);
        subtotalBruto += l.bruto;
        totalDescuentos += l.descuento;
        baseGravable += l.base;
        totalIva += l.iva;
        total += l.total;
      });
      return {
        subtotalBruto,
        totalDescuentos,
        baseGravable,
        totalIva,
        aplicaIva: cobrarIva,
        total,
        lineas
      };
    }
  };

  // js/services/sales-service.js
  var DOC_TYPES = {
    VENTA: { label: "Venta de contado (documento interno)", short: "Venta", seq: "VENTA" },
    VENTA_CREDITO: { label: "Venta a cr\xE9dito (cuenta por cobrar)", short: "Venta a cr\xE9dito", seq: "VENTA" },
    COTIZACION: { label: "Cotizaci\xF3n (no afecta inventario)", short: "Cotizaci\xF3n", seq: "COTIZACION" }
  };
  var LEGACY_DOC_LABELS = {
    FACTURA_ELECTRONICA: 'Venta (registrada antes como "Factura Electr\xF3nica")',
    DOCUMENTO_EQUIVALENTE_POS: 'Venta (registrada antes como "Documento Equivalente POS")',
    VENTA_CREDITO: "Venta a cr\xE9dito",
    COTIZACION: "Cotizaci\xF3n"
  };
  var PAYMENT_METHODS = ["Efectivo", "Nequi", "Daviplata", "Transferencia", "Tarjeta", "Cr\xE9dito"];
  var SALE_TX_STORES = [
    STORES.SALES,
    STORES.PRODUCTS,
    STORES.KARDEX,
    STORES.WAREHOUSES,
    STORES.AUDIT_LOGS,
    STORES.CASH_SHIFTS,
    STORES.CASH_MOVEMENTS,
    STORES.CUSTOMERS,
    STORES.RECEIVABLES_CXC,
    STORES.PAYABLES_CXP,
    STORES.SUPPLIERS,
    STORES.ORDERS_SHIPPING,
    STORES.SYSTEM_PARAMS,
    STORES.ATTACHMENTS,
    STORES.TENANTS,
    STORES.PRICE_LISTS
  ];
  var IVA_DEFAULT = 19;
  function formatConsecutivo(prefix, n) {
    return `${prefix}-${String(n).padStart(6, "0")}`;
  }
  function salePrefix(tenant, docType) {
    if (docType === "COTIZACION")
      return tenant && tenant.prefijoCotizacion || "COT";
    return tenant && tenant.prefijoVenta || "V";
  }
  function netUnit(price, includesIva, ivaPct = IVA_DEFAULT) {
    return includesIva ? Number(price) / (1 + ivaPct / 100) : Number(price);
  }
  var SalesService = {
    /**
     * Comisión freelance = Σ max(0, precioVendido − precioBase) × cantidad, comparando SIN IVA.
     */
    computeCommission(items, products, priceLists, freelancer, saleListIncludesIva) {
      if (!freelancer)
        return { comision: 0, base: 0, baseListId: null, detalle: [] };
      const baseListId = PricingService.freelanceBaseListId(priceLists, freelancer);
      const baseIncl = PricingService.listIncludesIva(priceLists, baseListId);
      let comision = 0;
      let base = 0;
      const detalle = [];
      items.forEach((it) => {
        const prod = products.find((p) => p.id === it.productoId);
        const pBase = PricingService.priceFor(prod, baseListId);
        const vendidoNeto = netUnit(it.precioUnitario, it.precioIncluyeIva ?? saleListIncludesIva, it.ivaPct ?? IVA_DEFAULT);
        const baseNeto = netUnit(pBase, baseIncl, it.ivaPct ?? IVA_DEFAULT);
        const c = pBase > 0 ? Math.max(0, (vendidoNeto - baseNeto) * Number(it.cantidad)) : 0;
        comision += c;
        base += baseNeto * Number(it.cantidad);
        detalle.push({ productoId: it.productoId, nombre: it.nombre, comision: Math.round(c), sinPrecioBase: pBase <= 0 });
      });
      return { comision: Math.round(comision), base: Math.round(base), baseListId, detalle };
    },
    /**
     * Crea una venta o cotización.
     * @param {Object} p
     * @param {string} p.tenantId
     * @param {string} p.tipoDoc - VENTA | VENTA_CREDITO | COTIZACION
     * @param {Object} p.cliente - registro de cliente (se relee dentro de la transacción)
     * @param {Array}  p.items - { productoId, cantidad, precioUnitario }
     * @param {string} p.listaPreciosId
     * @param {string} p.metodoPago
     * @param {number} p.pagoRecibido
     * @param {Object|null} p.freelancer
     * @param {boolean} p.crearDespacho
     * @param {string|null} p.comprobanteDataUrl
     */
    async createSale(p) {
      const tipoDoc = DOC_TYPES[p.tipoDoc] ? p.tipoDoc : "VENTA";
      const esCotizacion = tipoDoc === "COTIZACION";
      const esCredito = tipoDoc === "VENTA_CREDITO" || p.metodoPago === "Cr\xE9dito";
      if (!p.items || p.items.length === 0)
        throw new Error("El carrito de venta est\xE1 vac\xEDo.");
      if (!esCotizacion && !esCredito && !PAYMENT_METHODS.includes(p.metodoPago)) {
        throw new Error("Seleccione un m\xE9todo de pago v\xE1lido.");
      }
      const result = await DB.runTransaction(SALE_TX_STORES, async (tx) => {
        const tenant = await tx.get(STORES.TENANTS, p.tenantId);
        const priceLists = await tx.getAll(STORES.PRICE_LISTS, p.tenantId);
        const listIncl = PricingService.listIncludesIva(priceLists, p.listaPreciosId);
        const products = [];
        for (const it of p.items) {
          const prod = await tx.get(STORES.PRODUCTS, it.productoId);
          if (!prod)
            throw new Error(`Producto no encontrado: ${it.nombre || it.productoId}`);
          const qty = Number(it.cantidad);
          if (!Number.isFinite(qty) || qty <= 0)
            throw new Error(`Cantidad inv\xE1lida para ${prod.nombre}.`);
          if (!(Number(it.precioUnitario) > 0))
            throw new Error(`El precio de ${prod.nombre} debe ser mayor a cero.`);
          products.push(prod);
        }
        if (!esCotizacion) {
          const requerido = {};
          p.items.forEach((it) => {
            requerido[it.productoId] = (requerido[it.productoId] || 0) + Number(it.cantidad);
          });
          for (const prod of products) {
            if (requerido[prod.id] > Number(prod.stock || 0)) {
              throw new Error(`Stock insuficiente de "${prod.nombre}": disponible ${prod.stock}, solicitado ${requerido[prod.id]}.`);
            }
          }
        }
        const cliente = p.cliente ? await tx.get(STORES.CUSTOMERS, p.cliente.id) : null;
        const aplicaIva = !cliente || cliente.aplicaIva !== false;
        const lineItems = p.items.map((it, i) => ({
          productoId: it.productoId,
          sku: products[i].sku,
          nombre: products[i].nombre,
          cantidad: Number(it.cantidad),
          precioUnitario: Math.round(Number(it.precioUnitario)),
          precioIncluyeIva: listIncl,
          ivaPct: products[i].ivaPct !== void 0 && products[i].ivaPct !== null && products[i].ivaPct !== "" ? Number(products[i].ivaPct) : IVA_DEFAULT
        }));
        const totals = TaxService.calculateTotals(lineItems, 0, { aplicaIva });
        lineItems.forEach((li, i) => Object.assign(li, {
          base: totals.lineas[i].base,
          iva: totals.lineas[i].iva,
          total: totals.lineas[i].total
        }));
        if (esCredito && !esCotizacion) {
          if (!cliente)
            throw new Error("Una venta a cr\xE9dito requiere un cliente registrado.");
          const cupo = Number(cliente.cupoCredito || 0);
          if (cupo <= 0)
            throw new Error(`El cliente ${cliente.nombre} no tiene cupo de cr\xE9dito asignado.`);
          const nuevoSaldo = Number(cliente.saldoPendiente || 0) + totals.total;
          if (nuevoSaldo > cupo) {
            throw new Error(`Cupo de cr\xE9dito excedido: cupo ${cupo}, saldo actual ${cliente.saldoPendiente || 0}, esta venta ${totals.total}.`);
          }
        }
        let turno = null;
        if (!esCotizacion && !esCredito) {
          const shifts = await tx.getAll(STORES.CASH_SHIFTS, p.tenantId);
          turno = shifts.find((s) => s.estado === "ABIERTA") || null;
          if (!turno)
            throw new Error("No hay turno de caja abierto. Abra la caja antes de registrar ventas de contado.");
          if (p.metodoPago === "Efectivo" && Number(p.pagoRecibido || totals.total) < totals.total) {
            throw new Error("El pago recibido en efectivo es menor que el total de la venta.");
          }
        }
        const seqKey = DOC_TYPES[tipoDoc].seq;
        const n = await tx.nextSequence(p.tenantId, seqKey);
        const consecutivo = formatConsecutivo(salePrefix(tenant, tipoDoc), n);
        const com = esCotizacion ? { comision: 0, base: 0 } : this.computeCommission(lineItems, products, priceLists, p.freelancer, listIncl);
        const pagoRecibido = esCredito || esCotizacion ? 0 : Number(p.pagoRecibido || totals.total);
        const sale = {
          tenantId: p.tenantId,
          consecutivo,
          numero: n,
          tipoDoc,
          facturaElectronica: false,
          aplicaIva,
          clienteId: cliente ? cliente.id : null,
          clienteNombre: cliente ? cliente.nombre : "Cliente Mostrador",
          clienteNit: cliente ? cliente.nitCc : "222222222222",
          vendedorId: Session.userId(),
          vendedorNombre: Session.userName(),
          esVentaFreelance: !!p.freelancer && !esCotizacion,
          freelancerId: p.freelancer ? p.freelancer.id : null,
          freelancerNombre: p.freelancer ? p.freelancer.nombre : null,
          listaPreciosId: p.listaPreciosId,
          preciosIncluyenIva: listIncl,
          fecha: (/* @__PURE__ */ new Date()).toISOString(),
          estado: esCotizacion ? "COTIZACION" : esCredito ? "CREDITO_PENDIENTE" : "PAGADA",
          subtotal: totals.baseGravable,
          descuentos: totals.totalDescuentos,
          impuestos: totals.totalIva,
          total: totals.total,
          metodoPago: esCotizacion ? "-" : esCredito ? "Cr\xE9dito" : p.metodoPago,
          pagoRecibido,
          cambio: Math.max(0, pagoRecibido - totals.total),
          saldoCredito: esCredito && !esCotizacion ? totals.total : 0,
          turnoId: turno ? turno.id : null,
          items: lineItems,
          costoTotal: 0,
          comprobanteId: null,
          comisionFreelance: com.comision,
          precioBaseFreelance: com.base
        };
        await tx.put(STORES.SALES, sale);
        if (esCotizacion) {
          await AuditService.logTx(tx, {
            tenantId: p.tenantId,
            modulo: "Ventas POS",
            accion: "CREAR",
            registroId: consecutivo,
            campoModificado: "Cotizaci\xF3n emitida",
            valorNuevo: `$ ${totals.total}`
          });
          return sale;
        }
        let costoTotal = 0;
        for (const li of sale.items) {
          const mov = await KardexService.applyMovement(tx, {
            tenantId: p.tenantId,
            productoId: li.productoId,
            bodegaId: null,
            documentoTipo: "VENTA",
            documentoNumero: consecutivo,
            cantidad: li.cantidad,
            observacion: `Venta ${consecutivo} a ${sale.clienteNombre}`
          });
          li.costoUnitario = mov.costoUnitario;
          li.lotes = mov.lotes || [];
          costoTotal += mov.costoTotal;
        }
        sale.costoTotal = Math.round(costoTotal);
        if (esCredito) {
          cliente.saldoPendiente = Number(cliente.saldoPendiente || 0) + totals.total;
          const cxc = await tx.put(STORES.RECEIVABLES_CXC, {
            tenantId: p.tenantId,
            ventaId: sale.id,
            documento: consecutivo,
            clienteId: cliente.id,
            clienteNombre: cliente.nombre,
            fechaEmision: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            fechaVencimiento: new Date(Date.now() + (Number(cliente.diasCredito) || 30) * 864e5).toISOString().split("T")[0],
            valorTotal: totals.total,
            abonos: 0,
            saldo: totals.total,
            diasMora: 0,
            estado: "AL_DIA",
            historialPagos: []
          });
          sale.cxcId = cxc.id;
        } else {
          await CashService.applySaleTx(tx, turno.id, p.metodoPago, totals.total, 1);
        }
        if (cliente) {
          cliente.totalComprado = Number(cliente.totalComprado || 0) + totals.total;
          cliente.numeroCompras = Number(cliente.numeroCompras || 0) + 1;
          cliente.ultimaCompra = sale.fecha;
          await tx.put(STORES.CUSTOMERS, cliente);
        }
        if (p.freelancer && com.comision > 0) {
          const hoy = /* @__PURE__ */ new Date();
          const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
          const cxp = await tx.put(STORES.PAYABLES_CXP, {
            tenantId: p.tenantId,
            documento: `COM-${consecutivo}`,
            proveedorNombre: p.freelancer.nombre,
            proveedorId: p.freelancer.id,
            tipoDocumento: "COMISION_FREELANCE",
            ventaId: sale.id,
            ventaConsecutivo: consecutivo,
            fechaEmision: hoy.toISOString().split("T")[0],
            fechaVencimiento: finMes.toISOString().split("T")[0],
            valorTotal: com.comision,
            saldo: com.comision,
            abonos: 0,
            estado: "AL_DIA",
            historialPagos: []
          });
          sale.comisionCxpId = cxp.id;
          const fl = await tx.get(STORES.SUPPLIERS, p.freelancer.id);
          if (fl) {
            fl.comisionesTotalesGanadas = Number(fl.comisionesTotalesGanadas || 0) + com.comision;
            await tx.put(STORES.SUPPLIERS, fl);
          }
        }
        if (p.crearDespacho) {
          const totalUnidades = sale.items.reduce((a, i) => a + Number(i.cantidad || 0), 0);
          const desp = await tx.put(STORES.ORDERS_SHIPPING, {
            tenantId: p.tenantId,
            ventaId: sale.id,
            documentoNumero: consecutivo,
            clienteId: cliente ? cliente.id : null,
            clienteNombre: sale.clienteNombre,
            nitCc: sale.clienteNit,
            telefono: cliente ? cliente.telefono || cliente.whatsapp || "" : "",
            whatsapp: cliente ? cliente.whatsapp || cliente.telefono || "" : "",
            email: cliente ? cliente.email || "" : "",
            ciudad: cliente ? cliente.ciudad || "" : "",
            departamento: cliente ? cliente.departamento || "" : "",
            barrio: cliente ? cliente.barrio || "" : "",
            direccion: cliente ? cliente.direccion || "" : "",
            transportadora: tenant && tenant.transportadoraDefecto || "",
            numeroGuia: "",
            costoEnvio: 0,
            fechaDespacho: null,
            fechaEntregaEstimada: null,
            estadoCiclo: "RECIBIDO",
            responsable: "",
            cajasTotal: Math.max(1, Math.ceil(totalUnidades / 12)),
            contenidoDescripcion: tenant && tenant.descripcionContenidoEnvio || "Productos de mantenimiento y embellecimiento automotriz",
            observaciones: ""
          });
          sale.despachoId = desp.id;
        }
        if (p.comprobanteDataUrl) {
          const att = await tx.put(STORES.ATTACHMENTS, {
            tenantId: p.tenantId,
            refTipo: "VENTA",
            refId: sale.id,
            descripcion: `Comprobante ${consecutivo}`,
            dataUrl: p.comprobanteDataUrl
          });
          sale.comprobanteId = att.id;
          sale.comprobanteFecha = (/* @__PURE__ */ new Date()).toISOString();
        }
        await tx.put(STORES.SALES, sale);
        await AuditService.logTx(tx, {
          tenantId: p.tenantId,
          modulo: "Ventas POS",
          accion: "CREAR",
          registroId: consecutivo,
          campoModificado: DOC_TYPES[tipoDoc].short,
          valorNuevo: `$ ${totals.total} (${sale.metodoPago})`
        });
        return sale;
      });
      if (!esCotizacion)
        EventBus.emit("cash:shiftChanged");
      return result;
    },
    /**
     * Anula una venta: devuelve inventario al costo original, revierte caja/cartera/comisión,
     * anula el despacho. Bloquea si hay abonos o pagos de comisión ya realizados.
     */
    async annulSale(saleId, motivo) {
      if (!motivo || String(motivo).trim().length < 5)
        throw new Error("Indique el motivo de la anulaci\xF3n (m\xEDnimo 5 caracteres).");
      const res = await DB.runTransaction(SALE_TX_STORES, async (tx) => {
        const sale = await tx.get(STORES.SALES, saleId);
        if (!sale)
          throw new Error("Venta no encontrada.");
        if (sale.estado === "ANULADA")
          throw new Error("La venta ya est\xE1 anulada.");
        const esCotizacion = sale.tipoDoc === "COTIZACION" || sale.estado === "COTIZACION";
        let notaCaja = "";
        if (!esCotizacion) {
          const cxc = (await tx.getAll(STORES.RECEIVABLES_CXC, sale.tenantId)).find((c) => c.ventaId === sale.id || c.documento === sale.consecutivo);
          if (cxc && Number(cxc.abonos || 0) > 0) {
            throw new Error("La venta tiene abonos registrados en cartera. Reverse primero los abonos con el cliente.");
          }
          const comCxp = sale.comisionCxpId ? await tx.get(STORES.PAYABLES_CXP, sale.comisionCxpId) : null;
          if (comCxp && Number(comCxp.abonos || 0) > 0) {
            throw new Error("La comisi\xF3n de esta venta ya fue pagada (total o parcialmente) al vendedor freelance.");
          }
          for (const li of sale.items || []) {
            const prod = await tx.get(STORES.PRODUCTS, li.productoId);
            if (!prod)
              continue;
            await KardexService.applyMovement(tx, {
              tenantId: sale.tenantId,
              productoId: li.productoId,
              documentoTipo: "DEVOLUCION_VENTA",
              documentoNumero: sale.consecutivo,
              cantidad: li.cantidad,
              costoUnitario: li.costoUnitario !== void 0 ? li.costoUnitario : prod.costoPromedio,
              lotes: li.lotes || null,
              observacion: `Anulaci\xF3n ${sale.consecutivo}: ${motivo}`
            });
          }
          const esCredito = sale.estado === "CREDITO_PENDIENTE" || sale.metodoPago === "Cr\xE9dito";
          if (esCredito) {
            if (cxc) {
              cxc.saldo = 0;
              cxc.estado = "ANULADA";
              await tx.put(STORES.RECEIVABLES_CXC, cxc);
            }
          } else {
            const turnoOrig = sale.turnoId ? await tx.get(STORES.CASH_SHIFTS, sale.turnoId) : null;
            if (turnoOrig && turnoOrig.estado === "ABIERTA") {
              await CashService.applySaleTx(tx, turnoOrig.id, sale.metodoPago, sale.total, -1);
              notaCaja = "Revertida en el turno de caja original.";
            } else if (sale.metodoPago === "Efectivo") {
              const shifts = await tx.getAll(STORES.CASH_SHIFTS, sale.tenantId);
              const abierto = shifts.find((s) => s.estado === "ABIERTA");
              if (!abierto)
                throw new Error("Para devolver dinero en efectivo de un turno ya cerrado, abra un turno de caja.");
              await CashService.applyMovementTx(tx, {
                tenantId: sale.tenantId,
                turnoId: abierto.id,
                tipo: "EGRESO",
                monto: sale.total,
                concepto: `Devoluci\xF3n por anulaci\xF3n ${sale.consecutivo}`,
                tercero: sale.clienteNombre,
                refTipo: "ANULACION_VENTA",
                refId: sale.id
              });
              notaCaja = "Devoluci\xF3n registrada como egreso en el turno actual.";
            } else {
              notaCaja = `El reembolso por ${sale.metodoPago} debe hacerse por fuera de la caja.`;
            }
          }
          if (sale.clienteId) {
            const cli = await tx.get(STORES.CUSTOMERS, sale.clienteId);
            if (cli) {
              if (esCredito)
                cli.saldoPendiente = Math.max(0, Number(cli.saldoPendiente || 0) - Number(sale.total));
              cli.totalComprado = Math.max(0, Number(cli.totalComprado || 0) - Number(sale.total));
              cli.numeroCompras = Math.max(0, Number(cli.numeroCompras || 0) - 1);
              await tx.put(STORES.CUSTOMERS, cli);
            }
          }
          if (comCxp) {
            comCxp.saldo = 0;
            comCxp.estado = "ANULADA";
            await tx.put(STORES.PAYABLES_CXP, comCxp);
            const fl = await tx.get(STORES.SUPPLIERS, comCxp.proveedorId);
            if (fl) {
              fl.comisionesTotalesGanadas = Math.max(0, Number(fl.comisionesTotalesGanadas || 0) - Number(comCxp.valorTotal || 0));
              await tx.put(STORES.SUPPLIERS, fl);
            }
          }
          const despachos = (await tx.getAll(STORES.ORDERS_SHIPPING, sale.tenantId)).filter((d) => d.ventaId === sale.id);
          for (const d of despachos) {
            d.estadoCiclo = "CANCELADO";
            await tx.put(STORES.ORDERS_SHIPPING, d);
          }
        }
        sale.estadoAnterior = sale.estado;
        sale.estado = "ANULADA";
        sale.saldoCredito = 0;
        sale.anulacion = {
          fecha: (/* @__PURE__ */ new Date()).toISOString(),
          motivo: String(motivo).trim(),
          usuarioId: Session.userId(),
          usuarioNombre: Session.userName(),
          notaCaja
        };
        await tx.put(STORES.SALES, sale);
        await AuditService.logTx(tx, {
          tenantId: sale.tenantId,
          modulo: "Ventas POS",
          accion: "ANULAR",
          registroId: sale.consecutivo,
          campoModificado: "Estado",
          valorAnterior: sale.estadoAnterior,
          valorNuevo: `ANULADA \u2014 ${motivo}`
        });
        return sale;
      });
      EventBus.emit("cash:shiftChanged");
      return res;
    },
    /** Guarda o reemplaza el comprobante de una venta existente */
    async attachReceipt(saleId, dataUrl) {
      return DB.runTransaction([STORES.SALES, STORES.ATTACHMENTS, STORES.AUDIT_LOGS], async (tx) => {
        const sale = await tx.get(STORES.SALES, saleId);
        if (!sale)
          throw new Error("Venta no encontrada.");
        if (sale.comprobanteId)
          await tx.delete(STORES.ATTACHMENTS, sale.comprobanteId);
        const att = await tx.put(STORES.ATTACHMENTS, {
          tenantId: sale.tenantId,
          refTipo: "VENTA",
          refId: sale.id,
          descripcion: `Comprobante ${sale.consecutivo}`,
          dataUrl
        });
        sale.comprobanteId = att.id;
        sale.comprobanteFecha = (/* @__PURE__ */ new Date()).toISOString();
        delete sale.comprobantePagoUrl;
        await tx.put(STORES.SALES, sale);
        await AuditService.logTx(tx, {
          tenantId: sale.tenantId,
          modulo: "Ventas POS",
          accion: "MODIFICAR",
          registroId: sale.consecutivo,
          campoModificado: "Comprobante de pago",
          valorNuevo: "Adjuntado"
        });
        return sale;
      });
    },
    /** Devuelve el dataUrl del comprobante (compatible con ventas antiguas) */
    async getReceipt(sale) {
      if (!sale)
        return null;
      if (sale.comprobanteId) {
        const att = await DB.getById(STORES.ATTACHMENTS, sale.comprobanteId);
        return att ? att.dataUrl : null;
      }
      return sale.comprobantePagoUrl || null;
    },
    /** Ventas que cuentan como ingreso (excluye cotizaciones y anuladas) */
    isEffectiveSale(s) {
      return s && s.estado !== "ANULADA" && s.estado !== "COTIZACION" && s.tipoDoc !== "COTIZACION";
    }
  };

  // js/services/finance-service.js
  var inRange = (iso, from, to) => {
    if (!iso)
      return false;
    const t = new Date(iso).getTime();
    return (!from || t >= from.getTime()) && (!to || t < to.getTime());
  };
  var FinanceService = {
    periods(now = /* @__PURE__ */ new Date()) {
      const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return {
        hoy: { from: d0, to: new Date(d0.getTime() + 864e5), label: "Hoy" },
        mes: { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date(now.getFullYear(), now.getMonth() + 1, 1), label: "Mes actual" },
        anio: { from: new Date(now.getFullYear(), 0, 1), to: new Date(now.getFullYear() + 1, 0, 1), label: "A\xF1o actual" }
      };
    },
    saleCost(sale, products) {
      if (Number(sale.costoTotal) > 0)
        return { costo: Number(sale.costoTotal), estimado: false };
      let costo = 0;
      let estimado = false;
      (sale.items || []).forEach((it) => {
        if (it.costoUnitario !== void 0) {
          costo += Number(it.costoUnitario) * Number(it.cantidad || 0);
        } else {
          const p = products.find((x) => x.id === it.productoId);
          costo += Number(p && p.costoPromedio || 0) * Number(it.cantidad || 0);
          estimado = true;
        }
      });
      return { costo, estimado };
    },
    summarize({ sales, expenses, products, from = null, to = null }) {
      const efectivas = sales.filter((s) => SalesService.isEffectiveSale(s) && inRange(s.fecha, from, to));
      let ventasBrutas = 0, ventasNetas = 0, iva = 0, costoVentas = 0, comisiones = 0, costoEstimado = false;
      efectivas.forEach((s) => {
        ventasBrutas += Number(s.total || 0);
        ventasNetas += Number(s.subtotal !== void 0 ? s.subtotal : s.total || 0);
        iva += Number(s.impuestos || 0);
        comisiones += Number(s.comisionFreelance || 0);
        const c = this.saleCost(s, products);
        costoVentas += c.costo;
        if (c.estimado)
          costoEstimado = true;
      });
      const gastos = expenses.filter((e) => inRange(e.fecha, from, to)).reduce((a, e) => a + Number(e.valor || 0), 0);
      const utilidadBruta = ventasNetas - costoVentas;
      const utilidadOperativa = utilidadBruta - comisiones - gastos;
      return {
        n: efectivas.length,
        ventasBrutas: Math.round(ventasBrutas),
        ventasNetas: Math.round(ventasNetas),
        iva: Math.round(iva),
        costoVentas: Math.round(costoVentas),
        comisiones: Math.round(comisiones),
        gastos: Math.round(gastos),
        utilidadBruta: Math.round(utilidadBruta),
        utilidadOperativa: Math.round(utilidadOperativa),
        margenBrutoPct: ventasNetas > 0 ? utilidadBruta / ventasNetas * 100 : null,
        costoEstimado
      };
    },
    monthlySeries(sales, months = 6, now = /* @__PURE__ */ new Date()) {
      const out = [];
      for (let i = months - 1; i >= 0; i--) {
        const from = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const to = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const value = sales.filter((s) => SalesService.isEffectiveSale(s) && inRange(s.fecha, from, to)).reduce((a, s) => a + Number(s.subtotal !== void 0 ? s.subtotal : s.total || 0), 0);
        out.push({ label: from.toLocaleDateString("es-CO", { month: "short" }).replace(".", ""), value: Math.round(value) });
      }
      return out;
    },
    byCategory(sales, products, from = null, to = null) {
      const acc = {};
      sales.filter((s) => SalesService.isEffectiveSale(s) && inRange(s.fecha, from, to)).forEach((s) => {
        (s.items || []).forEach((it) => {
          const p = products.find((x) => x.id === it.productoId);
          const cat = p && p.categoria || "Sin categor\xEDa";
          const val = it.base !== void 0 ? Number(it.base) : Number(it.total || it.cantidad * it.precioUnitario || 0);
          acc[cat] = (acc[cat] || 0) + val;
        });
      });
      const total = Object.values(acc).reduce((a, b) => a + b, 0);
      return Object.entries(acc).map(([categoria, valor]) => ({ categoria, valor: Math.round(valor), pct: total ? valor / total * 100 : 0 })).sort((a, b) => b.valor - a.valor);
    },
    byPayment(sales, from = null, to = null) {
      const acc = {};
      sales.filter((s) => SalesService.isEffectiveSale(s) && inRange(s.fecha, from, to)).forEach((s) => {
        const m = s.metodoPago || "Sin dato";
        acc[m] = (acc[m] || 0) + Number(s.total || 0);
      });
      const total = Object.values(acc).reduce((a, b) => a + b, 0);
      return Object.entries(acc).map(([metodo, valor]) => ({ metodo, valor: Math.round(valor), pct: total ? valor / total * 100 : 0 })).sort((a, b) => b.valor - a.valor);
    },
    /**
     * Rentabilidad por producto: unidades, ventas netas (sin IVA), costo de lo vendido, utilidad y margen.
     * Costo: el guardado en cada línea al vender (Kardex). Si falta, se estima con el costo promedio actual.
     */
    byProduct(sales, products, from = null, to = null) {
      const acc = {};
      sales.filter((s) => SalesService.isEffectiveSale(s) && inRange(s.fecha, from, to)).forEach((s) => {
        (s.items || []).forEach((it) => {
          const p = products.find((x) => x.id === it.productoId);
          const row = acc[it.productoId] || (acc[it.productoId] = {
            productoId: it.productoId,
            sku: it.sku || p && p.sku || "",
            nombre: it.nombre || p && p.nombre || "Producto",
            unidades: 0,
            ventasNetas: 0,
            costo: 0,
            costoEstimado: false
          });
          const qty = Number(it.cantidad || 0);
          let net;
          if (it.base !== void 0)
            net = Number(it.base);
          else {
            const iva = Number(it.ivaPct ?? 19) / 100;
            const incl = it.precioIncluyeIva ?? s.preciosIncluyenIva;
            net = qty * Number(it.precioUnitario || 0) / (incl ? 1 + iva : 1);
          }
          let cost;
          if (it.costoUnitario !== void 0)
            cost = Number(it.costoUnitario) * qty;
          else {
            cost = Number(p && p.costoPromedio || 0) * qty;
            row.costoEstimado = true;
          }
          row.unidades += qty;
          row.ventasNetas += net;
          row.costo += cost;
        });
      });
      return Object.values(acc).map((r) => {
        const utilidad = r.ventasNetas - r.costo;
        return {
          ...r,
          ventasNetas: Math.round(r.ventasNetas),
          costo: Math.round(r.costo),
          utilidad: Math.round(utilidad),
          margenPct: r.ventasNetas > 0 ? Math.round(utilidad / r.ventasNetas * 1e3) / 10 : null
        };
      }).sort((a, b) => b.utilidad - a.utilidad);
    }
  };

  // js/modules/dashboard.js
  init_formatters();

  // js/components/kpi-card.js
  function renderKpiCard({
    label,
    value,
    icon = "\u{1F4CA}",
    iconBg = "var(--brand-primary-light)",
    iconColor = "var(--brand-primary)",
    trend = null,
    trendPositive = true,
    footerText = ""
  }) {
    const trendHtml = trend !== null ? `
    <span class="kpi-trend ${trendPositive ? "positive" : "negative"}">
      ${trendPositive ? "\u2191" : "\u2193"} ${trend}
    </span>
  ` : "";
    return `
    <div class="kpi-card">
      <div class="kpi-card-header">
        <span class="kpi-label">${label}</span>
        <div class="kpi-icon-wrap" style="background: ${iconBg}; color: ${iconColor};">
          ${icon}
        </div>
      </div>
      <div class="kpi-value">${value}</div>
      <div class="kpi-footer">
        ${trendHtml}
        <span>${footerText}</span>
      </div>
    </div>
  `;
  }

  // js/modules/dashboard.js
  init_toast();
  var DashboardModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const [sales, products, expenses, cxc, cxp, shipping, orders] = await Promise.all([
        DB.getAll(STORES.SALES, tenantId),
        DB.getAll(STORES.PRODUCTS, tenantId),
        DB.getAll(STORES.EXPENSES, tenantId),
        DB.getAll(STORES.RECEIVABLES_CXC, tenantId),
        DB.getAll(STORES.PAYABLES_CXP, tenantId),
        DB.getAll(STORES.ORDERS_SHIPPING, tenantId),
        DB.getAll(STORES.PRODUCTION_ORDERS, tenantId)
      ]);
      const P = FinanceService.periods();
      const resDia = FinanceService.summarize({ sales, expenses, products, ...P.hoy });
      const resMes = FinanceService.summarize({ sales, expenses, products, ...P.mes });
      const ventasDia = resDia.ventasNetas;
      const ventasMes = resMes.ventasNetas;
      const serieMensual = FinanceService.monthlySeries(sales, 6);
      const maxSerie = Math.max(1, ...serieMensual.map((x) => x.value));
      const porCategoria = FinanceService.byCategory(sales, products, P.mes.from, P.mes.to).slice(0, 5);
      const porPago = FinanceService.byPayment(sales, P.mes.from, P.mes.to);
      const totalGastos = expenses.reduce((acc, exp) => acc + Number(exp.valor || 0), 0);
      const totalCarteraCobrar = cxc.reduce((acc, c) => acc + Number(c.saldo || 0), 0);
      const totalCuentasPagar = cxp.reduce((acc, p) => acc + Number(p.saldo || 0), 0);
      const inventarioValorizado = products.reduce((acc, p) => acc + Number(p.stock || 0) * Number(p.costoPromedio || 0), 0);
      const productosStockBajo = products.filter((p) => p.stock > 0 && p.stock <= (p.stockMinimo || 15));
      const productosAgotados = products.filter((p) => Number(p.stock || 0) <= 0);
      const carteraVencida = cxc.filter((c) => c.estado === "VENCIDO" || c.diasMora && c.diasMora > 0);
      const enviosPendientes = shipping.filter((s) => !["ENTREGADO", "CANCELADO", "DEVUELTO"].includes(s.estadoCiclo));
      const utilidadEstimada = resMes.utilidadOperativa;
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <div class="d-flex items-center gap-2">
            <h1>Dashboard Ejecutivo</h1>

          </div>
          <p>Visi\xF3n general de ventas, cartera, inventario y alertas operativas de <strong>${esc(tenant.nombreComercial)}</strong></p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-refresh-dashboard">\u{1F504} Actualizar</button>
          <button class="btn btn-primary btn-sm" id="btn-quick-new-sale">\u26A1 Nueva Venta POS</button>
        </div>
      </div>

      <!-- BOTONES DE ACCI\xD3N R\xC1PIDA (COMPACTO) -->
      <div class="card mb-3" style="background: var(--bg-surface); border: 1px solid var(--border-color);">
        <div class="card-body" style="padding: 10px 14px;">
          <div class="text-xs font-bold text-muted mb-1" style="letter-spacing: 0.5px; font-size: 10.5px;">ACCIONES R\xC1PIDAS OPERATIVAS</div>
          <div class="d-flex flex-wrap gap-1">
            <button class="btn btn-secondary btn-sm" data-nav-to="sales-pos" style="padding: 4px 10px; font-size: 11.5px;">\u2795 Venta</button>
            <button class="btn btn-secondary btn-sm" data-nav-to="clients" style="padding: 4px 10px; font-size: 11.5px;">\u{1F464} Cliente</button>
            <button class="btn btn-secondary btn-sm" data-nav-to="products" style="padding: 4px 10px; font-size: 11.5px;">\u{1F4E6} Producto</button>
            <button class="btn btn-secondary btn-sm" data-nav-to="production" style="padding: 4px 10px; font-size: 11.5px;">\u2699\uFE0F Producci\xF3n</button>
            <button class="btn btn-secondary btn-sm" data-nav-to="expenses" style="padding: 4px 10px; font-size: 11.5px;">\u{1F3F7}\uFE0F Gasto</button>
            <button class="btn btn-secondary btn-sm" data-nav-to="purchases" style="padding: 4px 10px; font-size: 11.5px;">\u{1F6CD}\uFE0F Compra</button>
            <button class="btn btn-secondary btn-sm" data-nav-to="shipping" style="padding: 4px 10px; font-size: 11.5px;">\u{1F69A} Env\xEDos</button>
            <button class="btn btn-secondary btn-sm" data-nav-to="cash" style="padding: 4px 10px; font-size: 11.5px;">\u{1F4B5} Caja</button>
          </div>
        </div>
      </div>

      <!-- CENTRO DE RECORDATORIOS & RESUMEN EJECUTIVO (SOCIOS / GERENCIA) -->
      <div class="card mb-3" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-left: 4px solid #25d366;">
        <div class="card-body" style="padding: 12px 16px;">
          <div class="d-flex justify-between items-center flex-wrap gap-3">
            <div>
              <div class="d-flex items-center gap-2">
                <strong style="font-size: 13.5px; color: var(--text-main);">\u{1F4BC} Notificaciones & Resumen Ejecutivo (Socios / Gerencia)</strong>
                <span class="badge badge-success" style="font-size: 10px;">En Vivo</span>
              </div>
              <div class="text-xs text-muted" style="margin-top: 2px;">
                Cierre de jornada laboral, balances peri\xF3dicos y programaci\xF3n en Google Calendar sin scripts externos.
              </div>
            </div>
            <div class="d-flex items-center gap-2 flex-wrap">
              <button class="btn btn-sm" id="btn-dash-wa-summary" style="background: #25d366; border-color: #25d366; color: #fff; font-weight: 700; font-size: 12px;">
                \u{1F4F2} Resumen D\xEDa por WhatsApp
              </button>
              <button class="btn btn-secondary btn-sm" id="btn-dash-email-summary" style="font-size: 12px;">
                \u{1F4E7} Enviar por Correo
              </button>
              <button class="btn btn-secondary btn-sm" id="btn-dash-calendar" style="font-size: 12px;">
                \u{1F4C5} Agendar en Google Calendar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- GRID DE KPIS -->
      <div class="kpi-grid">
        ${renderKpiCard({
        label: "Ventas del D\xEDa",
        value: Formatters.currency(ventasDia),
        icon: "\u{1F4B0}",
        iconBg: "var(--color-success-bg)",
        iconColor: "var(--color-success)",
        footerText: `${resDia.n} ventas hoy \xB7 sin IVA`
      })}

        ${renderKpiCard({
        label: "Ventas del Mes",
        value: Formatters.currency(ventasMes),
        icon: "\u{1F4C8}",
        iconBg: "var(--brand-primary-light)",
        iconColor: "var(--brand-primary)",
        footerText: `${resMes.n} ventas \xB7 bruto con IVA ${Formatters.currency(resMes.ventasBrutas)}`
      })}

        ${renderKpiCard({
        label: "Inventario Valorizado",
        value: Formatters.currency(inventarioValorizado),
        icon: "\u{1F4E6}",
        iconBg: "#f3e8ff",
        iconColor: "#7e22ce",
        footerText: `${products.length} referencias activas`
      })}

        ${renderKpiCard({
        label: "Utilidad operativa del mes",
        value: Formatters.currency(utilidadEstimada),
        icon: "\u{1F48E}",
        iconBg: "#ecfdf5",
        iconColor: "#059669",
        footerText: resMes.margenBrutoPct === null ? "Sin ventas este mes" : `Margen bruto ${resMes.margenBrutoPct.toFixed(1)}%${resMes.costoEstimado ? " (costo parcialmente estimado)" : ""}`
      })}

        ${renderKpiCard({
        label: "Cuentas por Cobrar",
        value: Formatters.currency(totalCarteraCobrar),
        icon: "\u{1F465}",
        iconBg: "var(--color-warning-bg)",
        iconColor: "var(--color-warning)",
        footerText: `${carteraVencida.length} en mora`
      })}

        ${renderKpiCard({
        label: "Cuentas por Pagar",
        value: Formatters.currency(totalCuentasPagar),
        icon: "\u{1F4D1}",
        iconBg: "var(--color-danger-bg)",
        iconColor: "var(--color-danger)",
        footerText: `${cxp.length} facturas proveedores`
      })}

        ${renderKpiCard({
        label: "Gastos del mes",
        value: Formatters.currency(resMes.gastos),
        icon: "\u{1F3F7}\uFE0F",
        iconBg: "#fff1f2",
        iconColor: "#e11d48",
        footerText: `Total hist\xF3rico: ${Formatters.currency(totalGastos)}`
      })}

        ${renderKpiCard({
        label: "Env\xEDos en Curso",
        value: `${enviosPendientes.length} Despachos`,
        icon: "\u{1F69A}",
        iconBg: "#e0f2fe",
        iconColor: "#0369a1",
        footerText: "Por entregar a clientes"
      })}
      </div>

      <!-- PANEL PRINCIPAL DE GR\xC1FICOS Y ALERTAS -->
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;" class="dashboard-columns">
        <!-- COLUMNA IZQUIERDA: GR\xC1FICOS ANAL\xCDTICOS -->
        <div class="d-flex flex-col gap-4">
          <!-- Gr\xE1fico de Ventas Mensuales -->
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">Ventas netas por mes</div>
                <div class="card-subtitle">\xDAltimos 6 meses, sin IVA, excluye cotizaciones y anuladas</div>
              </div>
            </div>
            <div class="card-body">
              <div style="display: flex; align-items: flex-end; justify-content: space-between; height: 180px; padding-top: 20px; border-bottom: 1px solid var(--border-color); gap: 12px;">
                ${serieMensual.map((x) => ({ m: x.label, val: x.value, h: Math.max(2, Math.round(x.value / maxSerie * 95)) })).map((bar) => `
                  <div style="flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end;">
                    <div style="font-size: 10px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">${Formatters.currency(bar.val, 0)}</div>
                    <div style="width: 100%; max-width: 48px; height: ${bar.h}%; background: var(--brand-primary); border-radius: 6px 6px 0 0; transition: height 0.5s ease;"></div>
                    <div style="font-size: 11px; font-weight: 600; color: var(--text-muted); margin-top: 8px;">${esc(bar.m)}</div>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>

          <!-- Distribuci\xF3n por Categor\xEDa y M\xE9todos de Pago -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="card" style="margin-bottom: 0;">
              <div class="card-header">
                <div class="card-title" style="font-size: 14px;">Ventas por categor\xEDa (mes)</div>
              </div>
              <div class="card-body">
                <div class="d-flex flex-col gap-3">
                  ${porCategoria.length ? porCategoria.map((c, i) => `
                    <div>
                      <div class="d-flex justify-between text-xs font-semibold mb-1">
                        <span>${esc(c.categoria)}</span>
                        <span>${c.pct.toFixed(0)}% \xB7 ${Formatters.currency(c.valor)}</span>
                      </div>
                      <div style="height: 8px; background: var(--border-color); border-radius: 4px; overflow: hidden;">
                        <div style="width: ${c.pct.toFixed(1)}%; height: 100%; background: ${["var(--brand-primary)", "var(--brand-secondary)", "#10b981", "#8b5cf6", "#64748b"][i]};"></div>
                      </div>
                    </div>`).join("") : '<div class="text-xs text-muted">Sin ventas este mes.</div>'}
                </div>
              </div>
            </div>

            <div class="card" style="margin-bottom: 0;">
              <div class="card-header">
                <div class="card-title" style="font-size: 14px;">M\xE9todos de pago (mes)</div>
              </div>
              <div class="card-body">
                <div class="d-flex flex-col gap-2 text-xs">
                  ${porPago.length ? porPago.map((m) => `
                    <div class="d-flex justify-between items-center" style="padding: 6px 0; border-bottom: 1px solid var(--border-color);">
                      <span>${esc(m.metodo)}</span>
                      <strong>${m.pct.toFixed(0)}% (${Formatters.currency(m.valor)})</strong>
                    </div>`).join("") : '<div class="text-muted">Sin ventas este mes.</div>'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- COLUMNA DERECHA: PANEL DE ALERTAS OPERATIVAS -->
        <div>
          <div class="card">
            <div class="card-header">
              <div class="card-title">Alertas de Operaci\xF3n</div>
              <span class="badge badge-danger">${productosStockBajo.length + productosAgotados.length + carteraVencida.length}</span>
            </div>
            <div class="card-body" style="padding: 12px 16px;">
              <div class="d-flex flex-col gap-2">
                ${productosAgotados.map((p) => `
                  <div class="alert alert-danger" style="margin-bottom: 4px; padding: 10px 12px;">
                    <div>
                      <div class="font-bold">\u274C Producto Agotado</div>
                      <div class="text-xs">${esc(p.nombre)} (Stock: 0 ${esc(p.unidadMedida)})</div>
                      <a href="#production" class="text-xs font-bold text-danger" style="text-decoration: underline; margin-top: 4px; display: inline-block;">Programar Producci\xF3n \u2192</a>
                    </div>
                  </div>
                `).join("")}

                ${productosStockBajo.map((p) => `
                  <div class="alert alert-warning" style="margin-bottom: 4px; padding: 10px 12px;">
                    <div>
                      <div class="font-bold">\u26A0\uFE0F Stock Cr\xEDtico M\xEDnimo</div>
                      <div class="text-xs">${esc(p.nombre)} (Existencias: ${p.stock} / M\xEDnimo: ${p.stockMinimo})</div>
                    </div>
                  </div>
                `).join("")}

                ${carteraVencida.map((c) => `
                  <div class="alert alert-warning" style="margin-bottom: 4px; padding: 10px 12px;">
                    <div>
                      <div class="font-bold">\u23F0 Factura en Mora</div>
                      <div class="text-xs">${esc(c.clienteNombre)} - Doc ${esc(c.documento)} - Saldo: ${Formatters.currency(c.saldo)}</div>
                    </div>
                  </div>
                `).join("")}

                ${productosStockBajo.length === 0 && productosAgotados.length === 0 && carteraVencida.length === 0 ? `
                  <div class="text-center text-muted" style="padding: 20px;">
                    \u2713 Todas las operaciones se encuentran al d\xEDa. Sin alertas activas.
                  </div>
                ` : ""}
              </div>
            </div>
          </div>

          <!-- ESTADO DE FACTURACI\xD3N DIAN -->
          <div class="card" style="border-left: 4px solid var(--brand-secondary);">
            <div class="card-header">
              <div class="card-title" style="font-size: 14px;">Facturaci\xF3n Electr\xF3nica DIAN</div>
            </div>
            <div class="card-body" style="padding: 14px 16px;">
              <div class="text-xs text-muted mb-2">
                Ambiente de Facturaci\xF3n Electr\xF3nica en Colombia:
              </div>
              <div class="badge badge-warning mb-2">Integraci\xF3n Pendiente de Configuraci\xF3n</div>
              <p class="text-xs" style="color: var(--text-secondary); line-height: 1.4;">
                Los documentos que genera NexaAdmin son internos (no son factura electr\xF3nica ni documento equivalente). Para emitir factura electr\xF3nica con CUFE se requiere integrar un proveedor tecnol\xF3gico autorizado por la DIAN (pendiente).
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
      container.querySelector("#btn-refresh-dashboard").addEventListener("click", () => {
        this.render(container);
      });
      container.querySelector("#btn-quick-new-sale").addEventListener("click", () => {
        window.location.hash = "#sales-pos";
      });
      container.querySelectorAll("[data-nav-to]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const target = e.currentTarget.getAttribute("data-nav-to");
          window.location.hash = `#${target}`;
        });
      });
      const btnWaSummary = container.querySelector("#btn-dash-wa-summary");
      if (btnWaSummary) {
        btnWaSummary.addEventListener("click", () => {
          const todayFormatted = (/* @__PURE__ */ new Date()).toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
          const defaultSummaryText = `\u{1F4CA} *RESUMEN EJECUTIVO DIARIO - ${esc(tenant.nombreComercial)}*
\u{1F4C5} *Fecha:* ${todayFormatted}

\u{1F4B0} *Ventas netas del d\xEDa:* ${Formatters.currency(ventasDia)}
\u{1F4C8} *Ventas netas del mes:* ${Formatters.currency(ventasMes)}
\u{1F48E} *Utilidad operativa del mes:* ${Formatters.currency(utilidadEstimada)}
\u26A0\uFE0F *Cartera Pendiente Total:* ${Formatters.currency(totalCarteraCobrar)}
\u{1F6A8} *Cartera en Mora:* ${Formatters.currency(carteraVencida.reduce((a, b) => a + Number(b.saldo || 0), 0))} (${carteraVencida.length} cuentas)
\u{1F4E6} *Inventario Valorizado:* ${Formatters.currency(inventarioValorizado)} (${products.length} referencias)
\u{1F69A} *Despachos Activos:* ${enviosPendientes.length} \xF3rdenes en curso

${productosStockBajo.length > 0 ? `\u26A0\uFE0F *Productos con Stock Bajo:* ${productosStockBajo.map((p) => p.nombre + " (" + p.stock + ")").join(", ")}
` : ""}
\u2705 Cierre y monitoreo generado desde Nexa ERP.`;
          Modal.show({
            title: "\u{1F4F2} Enviar Resumen Diario a Socios por WhatsApp",
            size: "md",
            content: `
            <div class="mb-3" style="background: rgba(37, 211, 102, 0.08); border: 1px solid rgba(37, 211, 102, 0.25); border-radius: 8px; padding: 12px 14px;">
              <div style="font-size: 13px; font-weight: 700; color: #166534; margin-bottom: 2px;">
                Resumen Ejecutivo Listo para WhatsApp Web
              </div>
              <div style="font-size: 11.5px; color: var(--text-secondary);">
                Este informe consolida las ventas, recaudo, cartera e inventario de hoy. Ingrese el n\xFAmero del socio o el grupo de socios.
              </div>
            </div>

            <div class="form-group mb-3">
              <label class="form-label font-bold">N\xFAmero de WhatsApp (Socio o Gerente)</label>
              <input type="text" class="form-control font-bold" id="dash-wa-phone" value="${tenant.whatsapp ? tenant.whatsapp.replace(/\D/g, "") : "57"}" placeholder="Ej: 573124567890">
            </div>

            <div class="form-group mb-3">
              <label class="form-label font-bold">Mensaje Ejecutivo a Enviar</label>
              <textarea class="form-control" id="dash-wa-text" rows="10" style="font-size: 12px; font-family: monospace; line-height: 1.4;">${defaultSummaryText}</textarea>
            </div>
          `,
            footerButtons: [
              { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
              {
                label: "\u{1F4AC} Abrir en WhatsApp Web y Enviar",
                class: "btn-primary",
                onClick: () => {
                  const phoneInp = document.getElementById("dash-wa-phone");
                  const textInp = document.getElementById("dash-wa-text");
                  const phone = (phoneInp ? phoneInp.value : "").replace(/\D/g, "");
                  const text = textInp ? textInp.value : defaultSummaryText;
                  if (!phone || phone.length < 10) {
                    Toast.warning("Por favor ingrese un n\xFAmero de tel\xE9fono v\xE1lido.");
                    return;
                  }
                  window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`, "_blank");
                  Toast.success("Abriendo WhatsApp Web con el resumen del d\xEDa...");
                  Modal.close();
                }
              }
            ]
          });
        });
      }
      const btnEmailSummary = container.querySelector("#btn-dash-email-summary");
      if (btnEmailSummary) {
        btnEmailSummary.addEventListener("click", () => {
          const todayFormatted = (/* @__PURE__ */ new Date()).toLocaleDateString("es-CO");
          const subject = `Resumen Ejecutivo Diario - ${tenant.nombreComercial} (${todayFormatted})`;
          const body = `Resumen Ejecutivo Diario - ${tenant.nombreComercial}
Fecha: ${todayFormatted}

Ventas netas del d\xEDa: ${Formatters.currency(ventasDia)}
Ventas Mes: ${Formatters.currency(ventasMes)}
Utilidad operativa del mes: ${Formatters.currency(utilidadEstimada)}
Cartera Pendiente: ${Formatters.currency(totalCarteraCobrar)}
Inventario: ${Formatters.currency(inventarioValorizado)}

Generado por Nexa ERP.`;
          window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
        });
      }
      const btnCalendar = container.querySelector("#btn-dash-calendar");
      if (btnCalendar) {
        btnCalendar.addEventListener("click", () => {
          const todayRaw = (/* @__PURE__ */ new Date()).toISOString().split("T")[0].replace(/-/g, "");
          const now = /* @__PURE__ */ new Date();
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          const endOfMonthRaw = endOfMonth.toISOString().split("T")[0].replace(/-/g, "");
          const endOfYearRaw = `${now.getFullYear()}1231`;
          Modal.show({
            title: "\u{1F4C5} Programar Cierres & Recordatorios en Google Calendar",
            size: "md",
            content: `
            <p class="text-xs text-muted mb-3">
              Seleccione el evento que desea agendar en su Google Calendar personal o institucional para recibir alertas autom\xE1ticas:
            </p>
            <div class="d-flex flex-col gap-2">
              <div class="card p-3 d-flex justify-between items-center" style="margin-bottom: 0; border: 1px solid var(--border-color); background: var(--bg-surface-solid);">
                <div>
                  <strong style="font-size: 13px;">\u{1F4B0} Cierre de Caja & Arqueo Diario</strong>
                  <div class="text-xs text-muted">Recordatorio para hoy al finalizar la jornada (6:30 PM)</div>
                </div>
                <button class="btn btn-secondary btn-sm" id="btn-gcal-daily">\u{1F4C5} Agendar</button>
              </div>

              <div class="card p-3 d-flex justify-between items-center" style="margin-bottom: 0; border: 1px solid var(--border-color); background: var(--bg-surface-solid);">
                <div>
                  <strong style="font-size: 13px;">\u{1F4E6} Cierre Mensual de Inventario & Balances</strong>
                  <div class="text-xs text-muted">Programar para el \xFAltimo d\xEDa del mes en curso</div>
                </div>
                <button class="btn btn-secondary btn-sm" id="btn-gcal-monthly">\u{1F4C5} Agendar</button>
              </div>

              <div class="card p-3 d-flex justify-between items-center" style="margin-bottom: 0; border: 1px solid var(--border-color); background: var(--bg-surface-solid);">
                <div>
                  <strong style="font-size: 13px;">\u{1F3DB}\uFE0F Vencimiento DIAN: IVA & Retenci\xF3n</strong>
                  <div class="text-xs text-muted">Recordatorio tributario para declaraci\xF3n bimestral DIAN</div>
                </div>
                <button class="btn btn-secondary btn-sm" id="btn-gcal-dian">\u{1F4C5} Agendar</button>
              </div>

              <div class="card p-3 d-flex justify-between items-center" style="margin-bottom: 0; border: 1px solid var(--border-color); background: var(--bg-surface-solid);">
                <div>
                  <strong style="font-size: 13px;">\u{1F3C1} Cierre Fiscal de Fin de A\xF1o & Estados Financieros</strong>
                  <div class="text-xs text-muted">Programado para el 31 de Diciembre</div>
                </div>
                <button class="btn btn-secondary btn-sm" id="btn-gcal-yearly">\u{1F4C5} Agendar</button>
              </div>
            </div>
          `,
            footerButtons: [
              { label: "Cerrar", class: "btn-secondary", onClick: () => Modal.close() }
            ]
          });
          const launchGCal = (title, start, end, details) => {
            const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(details)}&location=Rayo+Pro+Colombia`;
            window.open(url, "_blank");
            Toast.info("Abriendo Google Calendar...");
          };
          document.getElementById("btn-gcal-daily")?.addEventListener("click", () => {
            launchGCal(
              `Cierre de Caja y Arqueo Diario - ${esc(tenant.nombreComercial)}`,
              `${todayRaw}T183000Z`,
              `${todayRaw}T190000Z`,
              `Conciliaci\xF3n de efectivo f\xEDsico, transferencias Nequi/Daviplata y env\xEDo de reporte a socios en Nexa ERP.`
            );
          });
          document.getElementById("btn-gcal-monthly")?.addEventListener("click", () => {
            launchGCal(
              `Cierre Mensual de Inventario y Contabilidad - ${esc(tenant.nombreComercial)}`,
              `${endOfMonthRaw}T170000Z`,
              `${endOfMonthRaw}T190000Z`,
              `Auditor\xEDa de existencias f\xEDsicas en bodega vs Kardex y balance general mensual en Nexa ERP.`
            );
          });
          document.getElementById("btn-gcal-dian")?.addEventListener("click", () => {
            launchGCal(
              `Vencimiento Tributario DIAN (IVA / ReteFuente) - ${esc(tenant.nombreComercial)}`,
              `${endOfMonthRaw}T140000Z`,
              `${endOfMonthRaw}T160000Z`,
              `Presentaci\xF3n y pago de obligaciones tributarias DIAN para NIT ${esc(tenant.nit)}-${tenant.dv}.`
            );
          });
          document.getElementById("btn-gcal-yearly")?.addEventListener("click", () => {
            launchGCal(
              `Cierre Anual Fiscal y Balance General - ${esc(tenant.nombreComercial)}`,
              `${endOfYearRaw}T150000Z`,
              `${endOfYearRaw}T180000Z`,
              `Cierre de ejercicio fiscal anual, inventario total valorizado y distribuci\xF3n de utilidades a socios.`
            );
          });
        });
      }
    }
  };

  // js/utils/dom.js
  function bindOnce(el, key, eventName, handler) {
    if (!el)
      return;
    el.__nexaHandlers = el.__nexaHandlers || {};
    const prev = el.__nexaHandlers[key];
    if (prev)
      el.removeEventListener(prev.eventName, prev.handler);
    el.__nexaHandlers[key] = { eventName, handler };
    el.addEventListener(eventName, handler);
  }

  // js/modules/clients.js
  init_formatters();

  // js/components/data-table.js
  init_formatters();
  var DataTable = class {
    constructor({
      containerId,
      columns = [],
      data = [],
      pageSize = 10,
      searchable = true,
      searchPlaceholder = "Buscar en la tabla...",
      emptyMessage = "No se encontraron registros.",
      actions = null
    }) {
      this.container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
      this.columns = columns;
      this.rawData = [...data];
      this.filteredData = [...data];
      this.pageSize = pageSize;
      this.currentPage = 1;
      this.searchQuery = "";
      this.sortKey = null;
      this.sortAsc = true;
      this.searchable = searchable;
      this.searchPlaceholder = searchPlaceholder;
      this.emptyMessage = emptyMessage;
      this.actions = actions;
      this.render();
    }
    updateData(newData) {
      this.rawData = [...newData];
      this.applyFilters();
    }
    applyFilters() {
      let result = [...this.rawData];
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        result = result.filter((row) => {
          return this.columns.some((col) => {
            const val = row[col.key];
            if (val === null || val === void 0)
              return false;
            return String(val).toLowerCase().includes(q);
          });
        });
      }
      if (this.sortKey) {
        result.sort((a, b) => {
          const valA = a[this.sortKey];
          const valB = b[this.sortKey];
          if (valA === valB)
            return 0;
          if (valA === null || valA === void 0)
            return 1;
          if (valB === null || valB === void 0)
            return -1;
          const comp = valA > valB ? 1 : -1;
          return this.sortAsc ? comp : -comp;
        });
      }
      this.filteredData = result;
      this.currentPage = 1;
      this.renderBody();
    }
    render() {
      if (!this.container)
        return;
      this.container.innerHTML = `
      <div class="card" style="margin-bottom: 0;">
        ${this.searchable ? `
          <div class="table-toolbar">
            <div class="table-search">
              <span class="table-search-icon">\u{1F50D}</span>
              <input type="text" class="table-search-input" placeholder="${esc(this.searchPlaceholder)}" value="${esc(this.searchQuery)}">
            </div>
            <div class="table-info-counter text-xs text-muted"></div>
          </div>
        ` : ""}
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                ${this.columns.map((col) => `
                  <th style="cursor: pointer; ${col.width ? `width: ${col.width};` : ""}" data-col-key="${col.key}">
                    ${col.title} <span class="sort-indicator" data-sort-for="${col.key}">\u2195</span>
                  </th>
                `).join("")}
                ${this.actions ? '<th style="text-align: right; width: 120px;">Acciones</th>' : ""}
              </tr>
            </thead>
            <tbody class="table-body"></tbody>
          </table>
        </div>
        <div class="table-pagination">
          <div class="pagination-info"></div>
          <div class="pagination-controls d-flex gap-2">
            <button class="btn btn-secondary btn-sm btn-prev">Anterior</button>
            <button class="btn btn-secondary btn-sm btn-next">Siguiente</button>
          </div>
        </div>
      </div>
    `;
      const searchInput = this.container.querySelector(".table-search-input");
      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          this.searchQuery = e.target.value;
          this.applyFilters();
        });
      }
      this.container.querySelectorAll("thead th[data-col-key]").forEach((th) => {
        th.addEventListener("click", () => {
          const key = th.getAttribute("data-col-key");
          if (this.sortKey === key) {
            this.sortAsc = !this.sortAsc;
          } else {
            this.sortKey = key;
            this.sortAsc = true;
          }
          this.applyFilters();
        });
      });
      this.container.querySelector(".btn-prev").addEventListener("click", () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.renderBody();
        }
      });
      this.container.querySelector(".btn-next").addEventListener("click", () => {
        const maxPages = Math.ceil(this.filteredData.length / this.pageSize) || 1;
        if (this.currentPage < maxPages) {
          this.currentPage++;
          this.renderBody();
        }
      });
      this.renderBody();
    }
    renderBody() {
      const tbody = this.container.querySelector(".table-body");
      const paginationInfo = this.container.querySelector(".pagination-info");
      const counter = this.container.querySelector(".table-info-counter");
      const btnPrev = this.container.querySelector(".btn-prev");
      const btnNext = this.container.querySelector(".btn-next");
      const total = this.filteredData.length;
      const maxPages = Math.ceil(total / this.pageSize) || 1;
      const startIdx = (this.currentPage - 1) * this.pageSize;
      const pageItems = this.filteredData.slice(startIdx, startIdx + this.pageSize);
      if (counter) {
        counter.textContent = `Mostrando ${pageItems.length} de ${total} registros`;
      }
      if (paginationInfo) {
        paginationInfo.textContent = `P\xE1gina ${this.currentPage} de ${maxPages} (${total} total)`;
      }
      if (btnPrev)
        btnPrev.disabled = this.currentPage <= 1;
      if (btnNext)
        btnNext.disabled = this.currentPage >= maxPages;
      this.container.querySelectorAll("[data-sort-for]").forEach((el) => {
        const key = el.getAttribute("data-sort-for");
        if (key === this.sortKey) {
          el.textContent = this.sortAsc ? "\u2191" : "\u2193";
          el.style.color = "var(--brand-primary)";
        } else {
          el.textContent = "\u2195";
          el.style.color = "var(--text-light)";
        }
      });
      if (pageItems.length === 0) {
        const cols = this.columns.length + (this.actions ? 1 : 0);
        tbody.innerHTML = `
        <tr>
          <td colspan="${cols}" class="text-center" style="padding: 30px; color: var(--text-muted);">
            ${this.emptyMessage}
          </td>
        </tr>
      `;
        return;
      }
      tbody.innerHTML = pageItems.map((row) => {
        const cellsHtml = this.columns.map((col) => {
          let content = row[col.key];
          if (col.render) {
            content = col.render(row[col.key], row);
          } else if (content === null || content === void 0) {
            content = "-";
          } else {
            content = esc(content);
          }
          return `<td>${content}</td>`;
        }).join("");
        let actionsHtml = "";
        if (this.actions) {
          actionsHtml = `<td style="text-align: right; white-space: nowrap;">${this.actions(row)}</td>`;
        }
        return `<tr>${cellsHtml}${actionsHtml}</tr>`;
      }).join("");
    }
  };

  // js/modules/clients.js
  init_toast();
  var CLIENT_SEGMENTS = {
    "Consumidor Final": {
      priceListOrder: 1,
      badge: "badge-neutral",
      titulo: "P1 - Precio P\xFAblico / Final",
      requisitos: "Sin m\xEDnimo de compra. Venta al detal y mostrador. Pago 100% de contado (Efectivo, Nequi, Tarjeta). Sin cupo de cr\xE9dito.",
      cupoRecomendado: 0,
      diasCredito: 0
    },
    "Taller / Detailing": {
      priceListOrder: 2,
      badge: "badge-info",
      titulo: "P2 - Precio Lavaderos & Centros de Detailing",
      requisitos: "Negocio f\xEDsico activo de autolavado o taller. RUT o registro fotogr\xE1fico. Frecuencia de compra quincenal. Descuento profesional.",
      cupoRecomendado: 8e5,
      diasCredito: 15
    },
    "Mayorista": {
      priceListOrder: 3,
      badge: "badge-warning",
      titulo: "P3 - Precio Mayorista por Cajas (Docenas)",
      requisitos: "Compras m\xEDnimas por cajas cerradas de 12 unidades o pedido consolidado superior a $600.000 COP. Despacho directo.",
      cupoRecomendado: 25e5,
      diasCredito: 30
    },
    "Distribuidor": {
      priceListOrder: 4,
      badge: "badge-primary",
      titulo: "P4 - Precio Distribuidor Autorizado Regional",
      requisitos: "Almac\xE9n de repuestos o lubricentro con fuerza comercial. Pedido inicial de apertura m\xEDnimo de $2.500.000 COP y recompra mensual sostenida. C\xE1mara de Comercio y 2 referencias.",
      cupoRecomendado: 6e6,
      diasCredito: 30
    },
    "Flotas / Convenios": {
      priceListOrder: 5,
      badge: "badge-success",
      titulo: "P5 - Precio Especial Grandes Flotas & Convenios",
      requisitos: "Flotas de tractomulas, camiones pesados o buses (>10 veh\xEDculos, ej: Cano Trucks). Suministro en garrafas 23L o canecas. Convenio corporativo formal a cr\xE9dito.",
      cupoRecomendado: 12e6,
      diasCredito: 45
    }
  };
  var ClientsModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const [clients, priceLists, sales, cxcList, shipments, products, allSuppliers] = await Promise.all([
        DB.getAll(STORES.CUSTOMERS, tenantId),
        DB.getAll(STORES.PRICE_LISTS, tenantId),
        DB.getAll(STORES.SALES, tenantId),
        DB.getAll(STORES.RECEIVABLES_CXC, tenantId),
        DB.getAll(STORES.ORDERS_SHIPPING, tenantId),
        DB.getAll(STORES.PRODUCTS, tenantId),
        DB.getAll(STORES.SUPPLIERS, tenantId)
      ]);
      const freelancers = allSuppliers.filter((s) => s.tipo === "FREELANCER" && s.estado === "ACTIVO");
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Directorio de Clientes</h1>
          <p>Control de terceros, cartera, asignaci\xF3n de listas de precios y cupos comerciales</p>
        </div>
        <div class="view-actions">
          <a href="#freelancers" class="btn btn-secondary btn-sm" style="text-decoration: none; border-color: var(--brand-primary); color: var(--brand-primary);">\u{1F91D} Red Vendedores Freelance</a>
          <button class="btn btn-secondary btn-sm" id="btn-export-clients">\u{1F4CA} Exportar</button>
          <button class="btn btn-primary btn-sm" id="btn-new-client">\u2795 Nuevo Cliente</button>
        </div>
      </div>

      <div id="clients-table-container"></div>
    `;
      const dataTable = new DataTable({
        containerId: "clients-table-container",
        data: clients,
        columns: [
          {
            key: "codigo",
            title: "C\xF3digo",
            width: "90px",
            render: (val) => `<strong>${esc(val || "-")}</strong>`
          },
          {
            key: "nombre",
            title: "Cliente / Raz\xF3n Social",
            render: (val, row) => `
            <div>
              <div class="font-bold">${esc(val)}</div>
              <div class="text-xs text-muted">NIT/CC: ${DianDV.formatWithDV(row.nitCc)}</div>
            </div>
          `
          },
          {
            key: "tipoCliente",
            title: "Tipo / Segmento",
            render: (val) => {
              const seg = CLIENT_SEGMENTS[val];
              const badgeClass = seg ? seg.badge : "badge-neutral";
              return `<span class="badge ${badgeClass}" style="font-weight: 700;">${esc(val || "General")}</span>`;
            }
          },
          {
            key: "ciudad",
            title: "Ciudad",
            render: (val, row) => `${esc(val || "-")}, ${esc(row.departamento || "")}`
          },
          {
            key: "telefono",
            title: "Contacto",
            render: (val, row) => `
            <div class="text-xs">
              <div>\u{1F4DE} ${esc(val || "-")}</div>
              ${row.whatsapp ? `<div>\u{1F4AC} <a href="https://wa.me/${row.whatsapp.replace(/\D/g, "")}" target="_blank" style="color: var(--brand-primary);">${esc(row.whatsapp)}</a></div>` : ""}
            </div>
          `
          },
          {
            key: "vendedorFreelanceId",
            title: "Vendedor Freelance",
            render: (val) => {
              if (!val)
                return '<span class="text-muted" style="font-size: 11px;">Directo (Rayo Pro)</span>';
              const f = (freelancers || []).find((x) => x.id === val);
              return f ? `<span class="badge badge-info" style="font-size: 11px;">\u{1F91D} ${esc(f.nombre)}</span>` : '<span class="text-muted">\u2014</span>';
            }
          },
          {
            key: "listaPreciosId",
            title: "Lista Asignada",
            render: (val) => {
              const list = priceLists.find((p) => p.id === val);
              return `<span class="badge badge-info">${list ? list.nombre : "P1 (P\xFAblico)"}</span>`;
            }
          },
          {
            key: "facturaElectronica",
            title: "Facturaci\xF3n & IVA",
            render: (val, row) => {
              const esFE = val !== false;
              const aplicaIva = row.aplicaIva !== false;
              return `
              <div>
                <span class="badge ${esFE ? "badge-success" : "badge-neutral"}" style="font-size: 11px;">
                  ${esFE ? "\u26A1 Requiere factura electr\xF3nica" : "\u{1F4C4} Sin factura electr\xF3nica"}
                </span>
                <div class="text-xs" style="margin-top: 2px; color: ${aplicaIva ? "var(--text-muted)" : "var(--color-warning)"}; font-weight: ${aplicaIva ? "normal" : "bold"};">
                  ${aplicaIva ? "\u2713 Con IVA (19%)" : "\u2715 Exento / Sin IVA (0%)"}
                </div>
              </div>
            `;
            }
          },
          {
            key: "saldoPendiente",
            title: "Saldo Cartera",
            render: (val) => {
              const saldo = Number(val || 0);
              return saldo > 0 ? `<strong class="text-danger">${Formatters.currency(saldo)}</strong>` : '<span class="text-success">$ 0</span>';
            }
          },
          {
            key: "estado",
            title: "Estado",
            render: (val) => `<span class="badge ${val === "ACTIVO" ? "badge-success" : "badge-danger"}">${esc(val)}</span>`
          }
        ],
        actions: (row) => `
        <button class="btn btn-secondary btn-sm btn-view-client" data-id="${esc(row.id)}" title="Ficha 360\xB0">\u{1F441}\uFE0F Ficha</button>
        <button class="btn btn-secondary btn-sm btn-edit-client" data-id="${esc(row.id)}" title="Editar">\u270F\uFE0F</button>
      `
      });
      const exportBtn = container.querySelector("#btn-export-clients");
      if (exportBtn) {
        exportBtn.addEventListener("click", async () => {
          const { ExportService: ExportService2 } = await Promise.resolve().then(() => (init_export_service(), export_service_exports));
          ExportService2.exportToCSV(clients, "Clientes_RayoPro");
        });
      }
      const newClientBtn = container.querySelector("#btn-new-client");
      if (newClientBtn) {
        newClientBtn.addEventListener("click", () => {
          this.openClientModal(null, tenantId, priceLists, products, freelancers, () => this.render(container));
        });
      }
      bindOnce(container, "clients-click", "click", (e) => {
        const editBtn = e.target.closest(".btn-edit-client");
        if (editBtn) {
          const id = editBtn.getAttribute("data-id");
          const client = clients.find((c) => c.id === id);
          this.openClientModal(client, tenantId, priceLists, products, freelancers, () => this.render(container));
          return;
        }
        const viewBtn = e.target.closest(".btn-view-client");
        if (viewBtn) {
          const id = viewBtn.getAttribute("data-id");
          const client = clients.find((c) => c.id === id);
          const clientSales = sales.filter((s) => s.clienteId === id);
          const clientCxc = cxcList.filter((c) => c.clienteId === id);
          const clientShipments = shipments.filter((sh) => sh.clienteId === id);
          this.openClientProfileModal(client, clientSales, priceLists, clientCxc, clientShipments);
        }
      });
    },
    /**
     * Modal de Creación / Edición de Cliente
     */
    openClientModal(client = null, tenantId, priceLists, products = [], freelancers = [], onSaved) {
      const isEdit = !!client;
      const content = `
      <form id="client-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">C\xF3digo Interno</label>
            <input type="text" class="form-control" name="codigo" required value="${client ? client.codigo : "CLI-" + Math.floor(100 + Math.random() * 900)}">
          </div>
          <div class="form-group">
            <label class="form-label">Tipo de Persona</label>
            <select class="form-select" name="tipoPersona" id="modal-client-persona">
              <option value="NATURAL" ${client && client.tipoPersona === "NATURAL" ? "selected" : ""}>Persona Natural</option>
              <option value="JURIDICA" ${!client || client.tipoPersona === "JURIDICA" ? "selected" : ""}>Persona Jur\xEDdica (Empresa)</option>
            </select>
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">Nombre Comercial o Completo</label>
            <input type="text" class="form-control" name="nombre" required value="${client ? client.nombre : ""}" placeholder="Ej: AutoSpa Medell\xEDn o Juan P\xE9rez">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">NIT o C\xE9dula (Sin DV)</label>
            <input type="text" class="form-control" id="modal-client-nit" name="nitCc" required value="${client ? client.nitCc : ""}" placeholder="Ej: 901458321">
          </div>
          <div class="form-group">
            <label class="form-label">DV (C\xE1lculo DIAN)</label>
            <input type="text" class="form-control" id="modal-client-dv" name="dv" readonly value="${client ? client.dv : "-"}" style=" font-weight: bold;">
          </div>
        </div>

        <div class="card p-3 mb-3" style="background: rgba(0, 113, 227, 0.04); border: 1px solid rgba(0, 113, 227, 0.2);">
          <div class="d-flex justify-between items-center mb-2">
            <label class="form-label font-bold" style="color: var(--brand-primary); margin: 0;">\u{1F91D} Vendedor Freelance Asignado</label>
            <span class="badge badge-info" style="font-size: 10px;">Comisiones Autom\xE1ticas</span>
          </div>
          <select class="form-select" name="vendedorFreelanceId" id="modal-client-freelancer" style="font-weight: 700;">
            <option value="">-- Sin vendedor freelance (Venta Directa de F\xE1brica) --</option>
            ${(freelancers || []).map((fl) => `
              <option value="${fl.id}" ${client && client.vendedorFreelanceId === fl.id ? "selected" : ""}>
                \u{1F91D} ${esc(fl.nombre)} ${fl.zona ? "(" + fl.zona + ")" : ""}
              </option>
            `).join("")}
          </select>
          <span class="text-xs text-muted mt-1">Al facturar en POS a este cliente, la venta y su comisi\xF3n en $$ se asignar\xE1n autom\xE1ticamente a este vendedor.</span>
        </div>

        <div class="form-row mb-1">
          <div class="form-group">
            <label class="form-label font-bold">Tipo / Segmento Comercial</label>
            <select class="form-select" name="tipoCliente" id="modal-client-segment">
              <option value="Consumidor Final" ${client && client.tipoCliente === "Consumidor Final" ? "selected" : ""}>Consumidor Final (P1 - P\xFAblico)</option>
              <option value="Taller / Detailing" ${!client || client.tipoCliente === "Taller / Detailing" ? "selected" : ""}>Taller / Detailing (P2 - Taller)</option>
              <option value="Mayorista" ${client && client.tipoCliente === "Mayorista" ? "selected" : ""}>Mayorista (P3 - Docenas/Cajas)</option>
              <option value="Distribuidor" ${client && client.tipoCliente === "Distribuidor" ? "selected" : ""}>Distribuidor (P4 - Distribuidor)</option>
              <option value="Flotas / Convenios" ${client && client.tipoCliente === "Flotas / Convenios" ? "selected" : ""}>Flotas / Convenios (P5 - Especial)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Lista de Precios Asignada</label>
            <select class="form-select" name="listaPreciosId" id="modal-client-pricelist">
              ${priceLists.map((pl) => `
                <option value="${pl.id}" ${client && client.listaPreciosId === pl.id ? "selected" : ""}>${esc(pl.nombre)}</option>
              `).join("")}
            </select>
          </div>
        </div>

        <!-- GU\xCDA DE REQUISITOS Y CONDICIONES POR SEGMENTO -->
        <div id="modal-segment-guide" class="mb-3" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px 14px; font-size: 11.5px; line-height: 1.4;">
          <div style="font-weight: 700; color: var(--brand-primary); margin-bottom: 2px;" id="modal-seg-title">
            ${CLIENT_SEGMENTS[client?.tipoCliente || "Taller / Detailing"]?.titulo || "Condiciones Comerciales"}
          </div>
          <div style="color: var(--text-secondary);" id="modal-seg-requisitos">
            <strong>Requisitos Comerciales:</strong> ${CLIENT_SEGMENTS[client?.tipoCliente || "Taller / Detailing"]?.requisitos || ""}
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Tel\xE9fono Fijo / M\xF3vil</label>
            <input type="text" class="form-control" name="telefono" value="${client ? client.telefono : ""}">
          </div>
          <div class="form-group">
            <label class="form-label">WhatsApp (Notificaciones)</label>
            <input type="text" class="form-control" name="whatsapp" value="${client ? client.whatsapp : ""}" placeholder="+573001234567">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Correo Electr\xF3nico</label>
            <input type="email" class="form-control" name="email" value="${client ? client.email : ""}">
          </div>
          <div class="form-group">
            <label class="form-label">Ciudad / Municipio</label>
            <input type="text" class="form-control" name="ciudad" value="${client ? client.ciudad : "Medell\xEDn"}">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Direcci\xF3n de Entrega</label>
            <input type="text" class="form-control" name="direccion" value="${client ? client.direccion : ""}">
          </div>
          <div class="form-group">
            <label class="form-label">Barrio / Sector</label>
            <input type="text" class="form-control" name="barrio" value="${client ? client.barrio : ""}">
          </div>
        </div>

        <!-- CONFIGURACI\xD3N TRIBUTARIA Y FACTURACI\xD3N ELECTR\xD3NICA -->
        <div class="card p-3 mb-3" style="background: rgba(0, 113, 227, 0.04); border: 1px solid rgba(0, 113, 227, 0.15);">
          <div style="font-size: 13px; font-weight: 700; color: var(--brand-primary); margin-bottom: 8px;">
            \u2696\uFE0F Configuraci\xF3n Tributaria & Facturaci\xF3n
          </div>
          <div class="form-row">
            <div class="form-group mb-0">
              <label class="form-label font-bold">\xBFFacturar Electr\xF3nicamente?</label>
              <select class="form-select" name="facturaElectronica" id="modal-client-fe">
                <option value="SI" ${!client || client.facturaElectronica !== false ? "selected" : ""}>\u26A1 S\xED - Requiere factura electr\xF3nica (pendiente de integraci\xF3n DIAN)</option>
                <option value="NO" ${client && client.facturaElectronica === false ? "selected" : ""}>\u{1F4C4} No - Remisi\xF3n / Venta Interna (Sin FE)</option>
              </select>
              <span class="form-help">Para clientes que a\xFAn no requieren o no reciben FE formal.</span>
            </div>
            <div class="form-group mb-0">
              <label class="form-label font-bold">\xBFLiquidar con IVA (19%)?</label>
              <select class="form-select" name="aplicaIva" id="modal-client-iva">
                <option value="SI" ${!client || client.aplicaIva !== false ? "selected" : ""}>\u2713 S\xED - Liquidar IVA (19%)</option>
                <option value="NO" ${client && client.aplicaIva === false ? "selected" : ""}>\u2715 No - Sin IVA / Exento (0% Etapa Inicial)</option>
              </select>
              <span class="form-help">Ideal para empresas en etapa inicial o tratos comerciales netos.</span>
            </div>
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Cupo de Cr\xE9dito ($ COP)</label>
            <input type="number" class="form-control" name="cupoCredito" value="${client ? client.cupoCredito : 0}">
          </div>
          <div class="form-group">
            <label class="form-label">D\xEDas de Cr\xE9dito Plazo</label>
            <input type="number" class="form-control" name="diasCredito" value="${client ? client.diasCredito : 0}">
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Observaciones Comerciales</label>
          <textarea class="form-control" name="observaciones" rows="2">${client ? client.observaciones || "" : ""}</textarea>
        </div>
      </form>
    `;
      const dialog = Modal.show({
        title: isEdit ? `Editar Cliente: ${client.nombre}` : "Crear Nuevo Cliente",
        content,
        size: "lg",
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: isEdit ? "Guardar Cambios" : "Crear Cliente",
            class: "btn-primary",
            onClick: async () => {
              const form = dialog.querySelector("#client-form");
              if (!form.checkValidity()) {
                form.reportValidity();
                return;
              }
              const formData = new FormData(form);
              const nitCc = formData.get("nitCc").replace(/\D/g, "");
              const calculatedDv = DianDV.calculate(nitCc);
              const preciosEspeciales = {};
              dialog.querySelectorAll(".special-price-input").forEach((inp) => {
                const pid = inp.getAttribute("data-product-id");
                const val = Number(inp.value);
                if (pid && val > 0)
                  preciosEspeciales[pid] = val;
              });
              if (nitCc && nitCc !== "222222222222") {
                const dup = (await DB.getAll(STORES.CUSTOMERS, tenantId)).find((c) => String(c.nitCc || "").replace(/\D/g, "") === nitCc && (!client || c.id !== client.id));
                if (dup) {
                  Toast.warning(`Ya existe un cliente con ese NIT/CC: ${dup.nombre}.`);
                  return;
                }
              }
              const hasSpecialInputs = dialog.querySelectorAll(".special-price-input").length > 0;
              const payload = {
                ...client || {},
                tenantId,
                codigo: formData.get("codigo"),
                tipoPersona: formData.get("tipoPersona"),
                nombre: formData.get("nombre"),
                nitCc,
                dv: calculatedDv !== null ? calculatedDv : 0,
                vendedorFreelanceId: formData.get("vendedorFreelanceId") || null,
                tipoCliente: formData.get("tipoCliente"),
                listaPreciosId: formData.get("listaPreciosId"),
                facturaElectronica: formData.get("facturaElectronica") === "SI",
                aplicaIva: formData.get("aplicaIva") === "SI",
                telefono: formData.get("telefono"),
                whatsapp: formData.get("whatsapp"),
                email: formData.get("email"),
                direccion: formData.get("direccion"),
                ciudad: formData.get("ciudad"),
                barrio: formData.get("barrio"),
                cupoCredito: Number(formData.get("cupoCredito") || 0),
                diasCredito: Number(formData.get("diasCredito") || 0),
                observaciones: formData.get("observaciones"),
                preciosEspeciales: hasSpecialInputs ? preciosEspeciales : client ? client.preciosEspeciales || {} : {},
                estado: client && client.estado || "ACTIVO"
              };
              if (isEdit) {
                payload.id = client.id;
                payload.saldoPendiente = client.saldoPendiente || 0;
                payload.totalComprado = client.totalComprado || 0;
                payload.numeroCompras = client.numeroCompras || 0;
                await DB.update(STORES.CUSTOMERS, payload);
                await AuditService.log({
                  modulo: "Clientes",
                  accion: "MODIFICAR",
                  registroId: payload.codigo,
                  campoModificado: "Datos Generales",
                  valorAnterior: client.nombre,
                  valorNuevo: payload.nombre
                });
                Toast.success("Cliente actualizado correctamente.");
              } else {
                payload.saldoPendiente = 0;
                payload.totalComprado = 0;
                payload.numeroCompras = 0;
                const saved = await DB.add(STORES.CUSTOMERS, payload);
                await AuditService.log({
                  modulo: "Clientes",
                  accion: "CREAR",
                  registroId: payload.codigo,
                  campoModificado: "Cliente Nuevo",
                  valorAnterior: "-",
                  valorNuevo: payload.nombre
                });
                Toast.success("Cliente registrado exitosamente.");
                Modal.close();
                if (onSaved)
                  onSaved(saved || payload);
                return;
              }
              Modal.close();
              if (onSaved)
                onSaved(payload);
            }
          }
        ]
      });
      const nitInput = dialog.querySelector("#modal-client-nit");
      const dvInput = dialog.querySelector("#modal-client-dv");
      nitInput.addEventListener("input", (e) => {
        const clean = e.target.value.replace(/\D/g, "");
        const dv = DianDV.calculate(clean);
        dvInput.value = dv !== null ? dv : "-";
      });
      const segSelect = dialog.querySelector("#modal-client-segment");
      const plSelect = dialog.querySelector("#modal-client-pricelist");
      const segTitle = dialog.querySelector("#modal-seg-title");
      const segReq = dialog.querySelector("#modal-seg-requisitos");
      const cupoInp = dialog.querySelector('input[name="cupoCredito"]');
      const diasInp = dialog.querySelector('input[name="diasCredito"]');
      if (segSelect && plSelect) {
        segSelect.addEventListener("change", (e) => {
          const segKey = e.target.value;
          const segData = CLIENT_SEGMENTS[segKey];
          if (segData) {
            if (segTitle)
              segTitle.textContent = segData.titulo;
            if (segReq)
              segReq.innerHTML = `<strong>Requisitos Comerciales:</strong> ${segData.requisitos}`;
            const matchingPl = priceLists.find((p) => p.orden === segData.priceListOrder) || priceLists[segData.priceListOrder - 1];
            if (matchingPl) {
              plSelect.value = matchingPl.id;
            }
            if (!isEdit && cupoInp && diasInp) {
              cupoInp.value = segData.cupoRecomendado;
              diasInp.value = segData.diasCredito;
            }
          }
        });
      }
    },
    /**
     * Modal Ficha 360° del Cliente con Historial y Métricas
     */
    openClientProfileModal(client, clientSales = [], priceLists, clientCxc = [], clientShipments = []) {
      const list = priceLists.find((p) => p.id === client.listaPreciosId);
      const listName = list ? list.nombre : "Precio P\xFAblico";
      const totalComprado = clientSales.reduce((acc, s) => acc + Number(s.total || 0), client.totalComprado || 0);
      const numCompras = Math.max(clientSales.length, client.numeroCompras || 0);
      const ticketPromedio = numCompras > 0 ? Math.round(totalComprado / numCompras) : 0;
      const content = `
      <div class="mb-4" style="background: rgba(0, 113, 227, 0.03); padding: 18px; border-radius: 16px; border: 1px solid rgba(0, 113, 227, 0.12);">
        <div class="d-flex justify-between items-center mb-2">
          <div>
            <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin: 0; letter-spacing: -0.02em;">${esc(client.nombre)}</h2>
            <div class="text-xs text-muted" style="margin-top: 2px;">NIT/CC: <strong>${DianDV.formatWithDV(client.nitCc)}</strong> \u2022 Segmento: <span class="badge badge-neutral" style="font-size: 11px;">${esc(client.tipoCliente)}</span></div>
          </div>
          <span class="badge ${client.estado === "ACTIVO" ? "badge-success" : "badge-danger"}">${esc(client.estado)}</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 14px;">
          <div style="background: var(--bg-surface-solid); padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-xs);">
            <div class="text-xs text-muted">Total Comprado</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--color-success);">${Formatters.currency(totalComprado)}</div>
          </div>
          <div style="background: var(--bg-surface-solid); padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-xs);">
            <div class="text-xs text-muted">Saldo en Cartera</div>
            <div style="font-size: 16px; font-weight: 700; color: ${client.saldoPendiente > 0 ? "var(--color-danger)" : "var(--color-success)"};">
              ${Formatters.currency(client.saldoPendiente || 0)}
            </div>
          </div>
          <div style="background: var(--bg-surface-solid); padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-xs);">
            <div class="text-xs text-muted">Cupo Disponible</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--brand-primary);">
              ${Formatters.currency(Math.max(0, (client.cupoCredito || 0) - (client.saldoPendiente || 0)))}
            </div>
          </div>
          <div style="background: var(--bg-surface-solid); padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-xs);">
            <div class="text-xs text-muted">Ticket Promedio</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--text-main);">${Formatters.currency(ticketPromedio)}</div>
          </div>
        </div>
      </div>

      <div class="d-flex flex-col gap-2 mb-4 text-xs" style="color: var(--text-main); background: var(--bg-surface-solid); padding: 14px; border-radius: 12px; border: 1px solid var(--border-color);">
        <div>\u{1F4CD} <strong>Direcci\xF3n de Entrega:</strong> ${esc(client.direccion || "-")}, ${esc(client.barrio || "")} (${esc(client.ciudad || "-")}, ${esc(client.departamento || "")})</div>
        <div>\u{1F4DE} <strong>Contacto Comercial:</strong> ${esc(client.telefono || "-")} | <strong>WhatsApp:</strong> ${esc(client.whatsapp || "-")} | <strong>Email:</strong> ${esc(client.email || "-")}</div>
        <div>\u{1F3F7}\uFE0F <strong>Lista de Precios Predilecta:</strong> <span class="badge badge-info" style="font-size: 11px;">${listName}</span></div>
        <div>\u26A1 <strong>R\xE9gimen de Facturaci\xF3n:</strong> 
          <span class="badge ${client.facturaElectronica !== false ? "badge-success" : "badge-neutral"}" style="font-size: 11px;">
            ${client.facturaElectronica !== false ? "Facturaci\xF3n Electr\xF3nica DIAN" : "Documento Interno / Sin FE"}
          </span>
          <span class="badge ${client.aplicaIva !== false ? "badge-info" : "badge-warning"}" style="font-size: 11px; margin-left: 6px;">
            ${client.aplicaIva !== false ? "Liquida IVA (19%)" : "Exento de IVA / Etapa Inicial (0%)"}
          </span>
        </div>
        <div>\u23F1\uFE0F <strong>Condici\xF3n de Cr\xE9dito:</strong> ${client.diasCredito > 0 ? `${client.diasCredito} D\xEDas plazo (Cupo Total: ${Formatters.currency(client.cupoCredito)})` : "Contado inmediato"}</div>
        ${client.observaciones ? `<div style="background: rgba(245, 158, 11, 0.08); padding: 8px 12px; border-radius: 8px; border-left: 3px solid #f59e0b; margin-top: 4px;">\u{1F4DD} <strong>Notas Internas:</strong> ${esc(client.observaciones)}</div>` : ""}
      </div>

      <!-- SECCI\xD3N CARTERA & ABONOS HIST\xD3RICOS -->
      ${clientCxc.length > 0 ? `
        <div class="mb-4">
          <h4 class="text-sm font-bold mb-2" style="color: var(--text-main);">\u{1F4D1} Estado de Cartera & Conciliaci\xF3n de Pagos</h4>
          <div class="table-responsive" style="max-height: 180px; overflow-y: auto;">
            <table class="data-table" style="font-size: 12px;">
              <thead>
                <tr>
                  <th>Doc. Cartera</th>
                  <th>Emisi\xF3n / Venc.</th>
                  <th class="text-right">Valor Inicial</th>
                  <th class="text-right">Abonos Aplicados</th>
                  <th class="text-right">Saldo Actual</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${clientCxc.map((c) => `
                  <tr>
                    <td><strong>${esc(c.documento)}</strong><br><span class="text-xs text-muted">${esc(c.observaciones || "")}</span></td>
                    <td>${Formatters.date(c.fechaEmision)}<br><span class="text-xs text-muted">Vence: ${Formatters.date(c.fechaVencimiento)}</span></td>
                    <td class="text-right font-medium">${Formatters.currency(c.valorTotal)}</td>
                    <td class="text-right font-medium" style="color: var(--color-success);">- ${Formatters.currency(c.abonos || 0)}</td>
                    <td class="text-right font-bold" style="color: var(--color-danger);">${Formatters.currency(c.saldo)}</td>
                    <td><span class="badge ${c.saldo === 0 ? "badge-success" : "badge-warning"}">${esc(c.estado)}</span></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      ` : ""}

      <h4 class="text-sm font-bold mb-2" style="color: var(--text-main);">\u{1F6D2} Historial de Facturas & Ventas</h4>
      <div class="table-responsive" style="max-height: 180px; overflow-y: auto;">
        <table class="data-table" style="font-size: 12px;">
          <thead>
            <tr>
              <th>Consecutivo</th>
              <th>Fecha</th>
              <th>Medio Pago</th>
              <th class="text-right">Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${clientSales.length > 0 ? clientSales.map((s) => `
              <tr>
                <td><strong>${esc(s.consecutivo)}</strong></td>
                <td>${Formatters.date(s.fecha)}</td>
                <td>${esc(s.metodoPago)}</td>
                <td class="text-right font-bold">${Formatters.currency(s.total)}</td>
                <td><span class="badge ${s.estado === "PAGADA" ? "badge-success" : "badge-warning"}">${esc(s.estado)}</span></td>
              </tr>
            `).join("") : `
              <tr><td colspan="5" class="text-center text-muted" style="padding: 15px;">Sin compras registradas a\xFAn.</td></tr>
            `}
          </tbody>
        </table>
      </div>

      <!-- DESPACHOS RECIENTES -->
      ${clientShipments.length > 0 ? `
        <div class="mt-4">
          <h4 class="text-sm font-bold mb-2" style="color: var(--text-main);">\u{1F4E6} Env\xEDos y Gu\xEDas de Carga Registradas</h4>
          <div class="table-responsive" style="max-height: 160px; overflow-y: auto;">
            <table class="data-table" style="font-size: 12px;">
              <thead>
                <tr>
                  <th>No. Gu\xEDa</th>
                  <th>Transportadora</th>
                  <th>Cajas / Bultos</th>
                  <th>Contenido</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${clientShipments.map((sh) => `
                  <tr>
                    <td><strong>${esc(sh.numeroGuia)}</strong></td>
                    <td>${esc(sh.transportadora)}</td>
                    <td>${sh.cajasTotal || 1} Cajas</td>
                    <td class="text-xs">${esc(sh.contenidoDescripcion || "-")}</td>
                    <td><span class="badge ${sh.estadoCiclo === "ENTREGADO" ? "badge-success" : "badge-info"}">${sh.estadoCiclo}</span></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      ` : ""}
    `;
      Modal.show({
        title: `Ficha 360\xB0 del Cliente: ${client.nombre}`,
        content,
        size: "lg",
        footerButtons: [
          { label: "Cerrar", class: "btn-secondary", onClick: () => Modal.close() }
        ]
      });
    }
  };

  // js/modules/products.js
  init_formatters();
  init_toast();
  var ProductsModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const [products, priceLists, warehouses] = await Promise.all([
        DB.getAll(STORES.PRODUCTS, tenantId),
        DB.getAll(STORES.PRICE_LISTS, tenantId),
        DB.getAll(STORES.WAREHOUSES, tenantId)
      ]);
      container.innerHTML = `
            <div class="view-header">
        <div class="view-title-wrap">
          <h1>Cat\xE1logo</h1>
          <p>Productos a la venta, materias primas, existencias y precios</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-export-products">Exportar</button>
          <button class="btn btn-primary btn-sm" id="btn-new-product">Nuevo producto</button>
        </div>
      </div>

      <!-- FILTROS -->
      <div class="chip-group mb-3">
        <button type="button" class="chip-filter filter-type-btn active" data-type="ALL">Todos <span class="chip-count">${products.length}</span></button>
        <button type="button" class="chip-filter filter-type-btn" data-type="PRODUCTO_TERMINADO">Terminados <span class="chip-count">${products.filter((p) => p.tipoItem === "PRODUCTO_TERMINADO").length}</span></button>
        <button type="button" class="chip-filter filter-type-btn" data-type="MATERIA_PRIMA">Materias primas <span class="chip-count">${products.filter((p) => p.tipoItem === "MATERIA_PRIMA").length}</span></button>
        <button type="button" class="chip-filter filter-type-btn" data-type="MERCANCIA">Reventa <span class="chip-count">${products.filter((p) => p.tipoItem === "MERCANCIA").length}</span></button>
        <button type="button" class="chip-filter filter-type-btn" data-type="LOW_STOCK">Bajo m\xEDnimo <span class="chip-count">${products.filter((p) => Number(p.stock || 0) <= Number(p.stockMinimo || 0) && Number(p.stockMinimo || 0) > 0).length}</span></button>
      </div>

      <div id="products-table-container"></div>
    `;
      let currentFiltered = [...products];
      const dataTable = new DataTable({
        containerId: "products-table-container",
        data: currentFiltered,
        columns: [
          {
            key: "sku",
            title: "SKU / C\xF3digo",
            width: "120px",
            render: (val, row) => `
            <div>
              <strong style="color: var(--brand-primary);">${val || row.codigoInterno}</strong>
              <div class="text-xs text-muted">${esc(row.codigoBarras || "")}</div>
            </div>
          `
          },
          {
            key: "nombre",
            title: "Descripci\xF3n / Presentaci\xF3n",
            render: (val, row) => `
            <div>
              <div class="font-bold">${esc(val)}</div>
              <div class="text-xs text-muted">${esc(row.categoria)} \u2022 ${row.presentacion || row.unidadMedida}</div>
            </div>
          `
          },
          {
            key: "tipoItem",
            title: "Tipo",
            render: (val) => {
              const map = {
                PRODUCTO_TERMINADO: { label: "Terminado", class: "badge-info" },
                MATERIA_PRIMA: { label: "Materia Prima", class: "badge-warning" },
                MERCANCIA: { label: "Mercanc\xEDa", class: "badge-neutral" },
                SERVICIO: { label: "Servicio", class: "badge-success" }
              };
              const item = map[val] || { label: val, class: "badge-neutral" };
              return `<span class="badge ${item.class}">${item.label}</span>`;
            }
          },
          {
            key: "stock",
            title: "Existencias",
            render: (val, row) => {
              const stock = Number(val || 0);
              const min = Number(row.stockMinimo || 10);
              let badge = "badge-success";
              if (stock <= 0)
                badge = "badge-danger";
              else if (stock <= min)
                badge = "badge-warning";
              return `
              <div>
                <span class="badge ${badge}">${stock} ${esc(row.unidadMedida)}</span>
                <div class="text-xs text-muted" style="margin-top: 2px;">M\xEDn: ${min} | M\xE1x: ${row.stockMaximo || 100}</div>
              </div>
            `;
            }
          },
          {
            key: "costoPromedio",
            title: "Costo Promedio",
            render: (val) => Formatters.currency(val, 2)
          },
          {
            key: "precios",
            title: "Precio 1 (P\xFAblico)",
            render: (val, row) => {
              const p1 = PricingService.priceFor(row, (PricingService.findByCode(priceLists, "P1") || {}).id);
              return p1 ? `<strong>${Formatters.currency(p1)}</strong>` : '<span class="text-muted">\u2014</span>';
            }
          },
          {
            key: "estado",
            title: "Estado",
            render: (val) => `<span class="badge ${val === "ACTIVO" ? "badge-success" : "badge-danger"}">${esc(val)}</span>`
          }
        ],
        actions: (row) => `
        <button class="btn btn-secondary btn-sm btn-edit-product" data-id="${esc(row.id)}" title="Editar">\u270F\uFE0F Editar</button>
      `
      });
      container.querySelectorAll(".filter-type-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          container.querySelectorAll(".filter-type-btn").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          const type = btn.getAttribute("data-type");
          if (type === "ALL") {
            currentFiltered = [...products];
          } else if (type === "LOW_STOCK") {
            currentFiltered = products.filter((p) => Number(p.stock || 0) <= Number(p.stockMinimo || 0) && Number(p.stockMinimo || 0) > 0);
          } else {
            currentFiltered = products.filter((p) => p.tipoItem === type);
          }
          dataTable.updateData(currentFiltered);
        });
      });
      const exportProdBtn = container.querySelector("#btn-export-products");
      if (exportProdBtn) {
        exportProdBtn.addEventListener("click", async () => {
          const { ExportService: ExportService2 } = await Promise.resolve().then(() => (init_export_service(), export_service_exports));
          ExportService2.exportToCSV(products, "Catalogo_Productos_RayoPro");
        });
      }
      const newProdBtn = container.querySelector("#btn-new-product");
      if (newProdBtn) {
        newProdBtn.addEventListener("click", () => {
          this.openProductModal(null, tenantId, priceLists, warehouses, () => this.render(container));
        });
      }
      bindOnce(container, "products-click", "click", (e) => {
        const editBtn = e.target.closest(".btn-edit-product");
        if (editBtn) {
          const id = editBtn.getAttribute("data-id");
          const product = products.find((p) => p.id === id);
          this.openProductModal(product, tenantId, priceLists, warehouses, () => this.render(container));
        }
      });
    },
    /**
     * Modal de Creación / Edición de Producto con las 5 Listas de Precios
     */
    openProductModal(product = null, tenantId, priceLists, warehouses, onSaved) {
      const isEdit = !!product;
      const content = `
      <form id="product-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Tipo de \xCDtem</label>
            <select class="form-select" name="tipoItem">
              <option value="PRODUCTO_TERMINADO" ${product && product.tipoItem === "PRODUCTO_TERMINADO" ? "selected" : ""}>Producto Terminado (Fabricado)</option>
              <option value="MATERIA_PRIMA" ${product && product.tipoItem === "MATERIA_PRIMA" ? "selected" : ""}>Materia Prima / Qu\xEDmico / Insumo</option>
              <option value="MERCANCIA" ${product && product.tipoItem === "MERCANCIA" ? "selected" : ""}>Mercanc\xEDa para Reventa</option>
              <option value="SERVICIO" ${product && product.tipoItem === "SERVICIO" ? "selected" : ""}>Servicio</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">SKU / Referencia</label>
            <input type="text" class="form-control" name="sku" required value="${esc(product ? product.sku : "")}" placeholder="Ej: RAYO-SHAMP-1G">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">Nombre Comercial del Producto</label>
            <input type="text" class="form-control" name="nombre" required value="${esc(product ? product.nombre : "")}" placeholder="Ej: Shampoo Automotriz pH Neutro 1 Gal\xF3n">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Categor\xEDa</label>
            <input type="text" class="form-control" name="categoria" required value="${esc(product ? product.categoria : "")}" placeholder="Ej: Lavado Exterior">
          </div>
          <div class="form-group">
            <label class="form-label">Unidad de Medida</label>
            <select class="form-select" name="unidadMedida">
              <option value="Unidad" ${product && product.unidadMedida === "Unidad" ? "selected" : ""}>Unidad</option>
              <option value="Gal\xF3n" ${product && product.unidadMedida === "Gal\xF3n" ? "selected" : ""}>Gal\xF3n (3785 ml)</option>
              <option value="Litro" ${product && product.unidadMedida === "Litro" ? "selected" : ""}>Litro</option>
              <option value="Kg" ${product && product.unidadMedida === "Kg" ? "selected" : ""}>Kilogramo (Kg)</option>
              <option value="Gramo" ${product && product.unidadMedida === "Gramo" ? "selected" : ""}>Gramo</option>
            </select>
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Costo promedio ($ COP, sin IVA)</label>
            <input type="number" step="any" min="0" class="form-control" name="costoPromedio" id="prod-costo" value="${product ? product.costoPromedio : 0}" ${isEdit && Number(product.stock || 0) !== 0 ? 'readonly title="El costo con existencias se actualiza solo con compras, producci\xF3n y ajustes (Kardex)."' : ""}>
            ${isEdit && Number(product.stock || 0) !== 0 ? '<div class="form-help">Con existencias, el costo lo calcula el Kardex.</div>' : ""}
          </div>
          <div class="form-group">
            <label class="form-label">IVA del producto</label>
            <select class="form-select" name="ivaPct">
              ${[[19, "19 % (general)"], [5, "5 %"], [0, "Exento / excluido (0 %)"]].map(([v, l]) => `<option value="${v}" ${Number(product && product.ivaPct !== void 0 && product.ivaPct !== null ? product.ivaPct : 19) === v ? "selected" : ""}>${l}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Vida \xFAtil (meses, opcional)</label>
            <input type="number" min="0" step="1" class="form-control" name="vidaUtilMeses" value="${product && product.vidaUtilMeses ? esc(product.vidaUtilMeses) : ""}" placeholder="Para calcular el vencimiento del lote">
          </div>
        </div>

        <!-- 5 LISTAS DE PRECIOS CONFIGURABLES -->
        <div class="card mb-3" style="background: var(--bg-surface); border: 1px solid var(--border-color);">
          <div class="card-header" style="padding: 10px 14px; background: rgba(0, 113, 227, 0.06); border-bottom: 1px solid var(--border-color);">
            <div class="card-title" style="font-size: 13px; font-weight: 700; color: var(--brand-primary);">\u{1F4B0} 5 Listas de Precios de Venta (COP)</div>
          </div>
          <div class="card-body" style="padding: 14px;">
            <div class="form-row">
              ${priceLists.map((pl) => `
                <div class="form-group mb-2">
                  <label class="form-label text-xs font-bold" style="color: var(--text-main);">${esc(pl.nombre)} ${pl.incluyeIva ? '<span class="badge badge-info" style="font-size: 9px;">IVA incluido</span>' : '<span class="badge badge-neutral" style="font-size: 9px;">+ IVA</span>'}</label>
                  <input type="number" min="0" step="100" class="form-control font-bold" name="precio_${pl.id}" value="${product && product.precios && product.precios[pl.id] || 0}" style="color: var(--brand-primary);">
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Stock M\xEDnimo Alerta</label>
            <input type="number" class="form-control" name="stockMinimo" value="${product ? product.stockMinimo : 15}">
          </div>
          <div class="form-group">
            <label class="form-label">Bodega Habitual</label>
            <select class="form-select" name="bodegaId">
              ${warehouses.map((w) => `
                <option value="${w.id}" ${product && product.bodegaId === w.id ? "selected" : ""}>${esc(w.nombre)}</option>
              `).join("")}
            </select>
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Descripci\xF3n T\xE9cnica</label>
          <textarea class="form-control" name="descripcion" rows="2">${esc(product ? product.descripcion || "" : "")}</textarea>
        </div>
      </form>
    `;
      const dialog = Modal.show({
        title: isEdit ? `Editar Producto: ${product.nombre}` : "Nuevo Producto / Referencia",
        content,
        size: "lg",
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: isEdit ? "Guardar Cambios" : "Crear Producto",
            class: "btn-primary",
            onClick: async () => {
              const form = dialog.querySelector("#product-form");
              if (!form.checkValidity()) {
                form.reportValidity();
                return;
              }
              const formData = new FormData(form);
              const precios = {};
              priceLists.forEach((pl) => {
                precios[pl.id] = Number(formData.get(`precio_${pl.id}`) || 0);
              });
              const sku = String(formData.get("sku") || "").trim();
              const allProducts = await DB.getAll(STORES.PRODUCTS, tenantId);
              if (allProducts.some((p) => String(p.sku || "").toLowerCase() === sku.toLowerCase() && (!isEdit || p.id !== product.id))) {
                Toast.warning(`Ya existe un producto con el SKU ${sku}.`);
                return;
              }
              const payload = {
                ...isEdit ? product : {},
                tenantId,
                tipoItem: formData.get("tipoItem"),
                sku,
                codigoInterno: sku,
                nombre: String(formData.get("nombre")).trim(),
                categoria: formData.get("categoria"),
                unidadMedida: formData.get("unidadMedida"),
                costoPromedio: isEdit && Number(product.stock || 0) !== 0 ? Number(product.costoPromedio || 0) : Number(formData.get("costoPromedio") || 0),
                ivaPct: Number(formData.get("ivaPct") ?? 19),
                vidaUtilMeses: Number(formData.get("vidaUtilMeses") || 0) || null,
                stockMinimo: Number(formData.get("stockMinimo") || 0),
                bodegaId: formData.get("bodegaId"),
                descripcion: formData.get("descripcion"),
                precios: { ...isEdit && product.precios || {}, ...precios },
                estado: isEdit && product.estado || "ACTIVO"
              };
              if (isEdit) {
                payload.id = product.id;
                payload.stock = Number(product.stock || 0);
                await DB.update(STORES.PRODUCTS, payload);
                await AuditService.log({
                  modulo: "Productos",
                  accion: "MODIFICAR",
                  registroId: payload.sku,
                  campoModificado: "Ficha y Precios",
                  valorAnterior: product.nombre,
                  valorNuevo: `${payload.nombre} \xB7 precios: ${Object.values(precios).join(" / ")}`
                });
                Toast.success("Producto actualizado con \xE9xito.");
              } else {
                payload.stock = 0;
                await DB.add(STORES.PRODUCTS, payload);
                await AuditService.log({
                  modulo: "Productos",
                  accion: "CREAR",
                  registroId: payload.sku,
                  campoModificado: "Producto Creado",
                  valorAnterior: "-",
                  valorNuevo: payload.nombre
                });
                Toast.success("Producto registrado exitosamente.");
              }
              Modal.close();
              if (onSaved)
                onSaved();
            }
          }
        ]
      });
    }
  };

  // js/modules/inventory.js
  init_formatters();
  init_toast();
  var InventoryModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const [products, warehouses, movements] = await Promise.all([
        DB.getAll(STORES.PRODUCTS, tenantId),
        DB.getAll(STORES.WAREHOUSES, tenantId),
        KardexService.getMovements(tenantId)
      ]);
      container.innerHTML = `
            <div class="view-header">
        <div class="view-title-wrap">
          <h1>Inventario y Kardex</h1>
          <p>Entradas, salidas, consumos de producci\xF3n y ajustes, al costo promedio</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-inventory-adjustment">Ajuste manual</button>
          <button class="btn btn-primary btn-sm" id="btn-inventory-transfer">Traslado de bodega</button>
        </div>
      </div>

      <!-- RESUMEN -->
      <div class="pricing-summary stat-strip mb-3">
        <div><span class="ps-value">${Formatters.currency(products.reduce((a, p) => a + Math.max(0, Number(p.stock || 0)) * Number(p.costoPromedio || 0), 0))}</span><span class="ps-label">valor del inventario al costo</span></div>
        <div><span class="ps-value">${products.length}</span><span class="ps-label">referencias</span></div>
        <div><span class="ps-value ${products.some((p) => Number(p.stockMinimo || 0) > 0 && Number(p.stock || 0) <= Number(p.stockMinimo || 0)) ? "text-warning" : ""}">${products.filter((p) => Number(p.stockMinimo || 0) > 0 && Number(p.stock || 0) <= Number(p.stockMinimo || 0)).length}</span><span class="ps-label">en o bajo el m\xEDnimo</span></div>
        <div><span class="ps-value ${products.some((p) => Number(p.stock || 0) <= 0) ? "text-danger" : ""}">${products.filter((p) => Number(p.stock || 0) <= 0).length}</span><span class="ps-label">sin existencias</span></div>
      </div>

      <!-- TABS: KARDEX VS EXISTENCIAS -->
      <div class="chip-group mb-3">
        <button type="button" class="chip-filter tab-btn active" data-tab="kardex">Movimientos <span class="chip-count">${movements.length}</span></button>
        <button type="button" class="chip-filter tab-btn" data-tab="stocks">Existencias <span class="chip-count">${products.length}</span></button>
        <button type="button" class="chip-filter tab-btn" data-tab="lots">Lotes y vencimientos ${(() => {
        const n = products.reduce((a, p) => a + (p.lotes || []).filter((l) => {
          const d = LotService.daysToExpire(l);
          return d !== null && d <= 30;
        }).length, 0);
        return n ? `<span class="chip-count" style="color: var(--color-danger);">${n} por vencer o vencidos</span>` : "";
      })()}</button>
      </div>

      <div id="inventory-content-area"></div>
    `;
      const renderKardexTable = () => {
        const target = container.querySelector("#inventory-content-area");
        target.innerHTML = '<div id="kardex-table-container"></div>';
        new DataTable({
          containerId: "kardex-table-container",
          data: movements,
          columns: [
            {
              key: "fecha",
              title: "Fecha y Hora",
              render: (val) => Formatters.dateTime(val)
            },
            {
              key: "productoNombre",
              title: "Producto / Insumo",
              render: (val, row) => `
              <div>
                <strong>${esc(val)}</strong>
                <div class="text-xs text-muted">SKU: ${esc(row.sku || "-")}</div>
              </div>
            `
            },
            {
              key: "bodegaNombre",
              title: "Bodega",
              render: (val) => `<span class="badge badge-neutral">${esc(val)}</span>`
            },
            {
              key: "documentoTipo",
              title: "Tipo Movimiento",
              render: (val, row) => {
                const meta = MOVEMENT_TYPES[val] || { label: val, type: "OTHER" };
                const badgeClass = meta.type === "IN" ? "badge-success" : meta.type === "OUT" ? "badge-danger" : "badge-warning";
                return `
                <div>
                  <span class="badge ${badgeClass}">${meta.label}</span>
                  <div class="text-xs text-muted">Doc: ${esc(row.documentoNumero)}</div>
                </div>
              `;
              }
            },
            {
              key: "cantidadEntrada",
              title: "Entrada",
              render: (val) => val > 0 ? `<strong class="text-success">+${esc(val)}</strong>` : "-"
            },
            {
              key: "cantidadSalida",
              title: "Salida",
              render: (val) => val > 0 ? `<strong class="text-danger">-${esc(val)}</strong>` : "-"
            },
            {
              key: "saldoCantidad",
              title: "Saldo Final",
              render: (val) => `<strong>${esc(val)}</strong>`
            },
            {
              key: "costoUnitario",
              title: "Costo Unit.",
              render: (val) => Formatters.currency(val)
            },
            {
              key: "lotes",
              title: "Lote",
              render: (val) => val && val.length ? val.map((l) => `<span class="badge badge-neutral" title="${esc(l.cantidad)}">${esc(l.codigo)}</span>`).join(" ") : '<span class="text-muted">\u2014</span>'
            },
            {
              key: "observacion",
              title: "Observaciones",
              render: (val) => `<span class="text-xs text-muted">${esc(val || "-")}</span>`
            }
          ]
        });
      };
      const renderStocksTable = () => {
        const target = container.querySelector("#inventory-content-area");
        target.innerHTML = '<div id="stocks-table-container"></div>';
        new DataTable({
          containerId: "stocks-table-container",
          data: products,
          columns: [
            {
              key: "sku",
              title: "SKU",
              render: (val) => `<strong>${esc(val)}</strong>`
            },
            {
              key: "nombre",
              title: "Nombre Producto",
              render: (val, row) => `${esc(val)} <span class="text-xs text-muted">(${esc(row.unidadMedida)})</span>`
            },
            {
              key: "stock",
              title: "Existencia Actual",
              render: (val, row) => {
                const stock = Number(val || 0);
                const min = Number(row.stockMinimo || 10);
                let cls = "badge-success";
                if (stock <= 0)
                  cls = "badge-danger";
                else if (stock <= min)
                  cls = "badge-warning";
                return `<span class="badge ${cls}">${stock} ${esc(row.unidadMedida)}</span>`;
              }
            },
            {
              key: "costoPromedio",
              title: "Costo Promedio",
              render: (val) => Formatters.currency(val)
            },
            {
              key: "stock",
              title: "Valor Total Stock",
              render: (val, row) => Formatters.currency(Number(val || 0) * Number(row.costoPromedio || 0))
            },
            {
              key: "ubicacionBodega",
              title: "Ubicaci\xF3n",
              render: (val) => val || "No especificada"
            }
          ]
        });
      };
      renderKardexTable();
      container.querySelectorAll(".tab-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          container.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          const tab = btn.getAttribute("data-tab");
          if (tab === "kardex")
            renderKardexTable();
          else if (tab === "lots")
            this.renderLots(container.querySelector("#inventory-content-area"), tenantId, products);
          else
            renderStocksTable();
        });
      });
      container.querySelector("#btn-inventory-adjustment").addEventListener("click", () => {
        this.openAdjustmentModal(tenantId, products, warehouses, () => this.render(container));
      });
      container.querySelector("#btn-inventory-transfer").addEventListener("click", () => {
        this.openTransferModal(tenantId, products, warehouses, () => this.render(container));
      });
    },
    /**
     * Lotes en existencia, vencimientos y rastreo de un lote hasta los clientes.
     */
    async renderLots(target, tenantId, products) {
      const rows = [];
      products.forEach((p) => {
        (p.lotes || []).forEach((l) => rows.push({ p, l, d: LotService.daysToExpire(l) }));
        const sin = LotService.unlotted(p);
        if (sin > 0 && (p.lotes || []).length)
          rows.push({ p, l: { codigo: "Sin lote", cantidad: sin }, d: null, sinLote: true });
      });
      rows.sort((a, b) => (a.d === null ? 99999 : a.d) - (b.d === null ? 99999 : b.d));
      const estado = (d) => d === null ? '<span class="text-muted">sin fecha</span>' : d < 0 ? `<span class="mg mg-bad">vencido hace ${-d} d</span>` : d <= 30 ? `<span class="mg mg-warn">vence en ${d} d</span>` : `<span class="mg mg-ok">${d} d</span>`;
      target.innerHTML = `
      <div class="card mb-3">
        <div class="pricing-toolbar">
          <strong>Rastrear un lote</strong>
          <input type="search" class="form-control" id="lot-trace-inp" placeholder="C\xF3digo de lote, p. ej. LOTE-RAYO-S-0001" style="max-width: 320px;">
          <button class="btn btn-primary btn-sm" id="lot-trace-btn">Buscar</button>
          <span class="text-xs text-muted">Muestra la producci\xF3n y a qu\xE9 clientes se vendi\xF3.</span>
        </div>
        <div id="lot-trace-result"></div>
      </div>
      <div class="card">
        <div class="table-responsive">
          <table class="table pricing-table">
            <thead><tr><th>Producto</th><th>Lote</th><th class="text-right">Existencia</th><th>Producido</th><th>Vence</th><th>Estado</th></tr></thead>
            <tbody>
              ${rows.length ? rows.map((r) => `
                <tr>
                  <td><strong>${esc(r.p.nombre)}</strong> <span class="text-xs text-muted">${esc(r.p.sku || "")}</span></td>
                  <td>${r.sinLote ? '<span class="text-muted">Sin lote (inventario anterior)</span>' : `<a href="#" class="lot-link" data-lot="${esc(r.l.codigo)}">${esc(r.l.codigo)}</a>`}</td>
                  <td class="text-right">${esc(r.l.cantidad)} ${esc(r.p.unidadMedida || "")}</td>
                  <td>${esc(r.l.fecha || "\u2014")}</td>
                  <td>${esc(r.l.vence || "\u2014")}</td>
                  <td>${r.sinLote ? "" : estado(r.d)}</td>
                </tr>`).join("") : '<tr><td colspan="6" class="text-center text-muted p-4">A\xFAn no hay lotes. Se crean al registrar una producci\xF3n.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>`;
      const trace = async (code) => {
        const box = target.querySelector("#lot-trace-result");
        code = String(code || "").trim();
        if (!code) {
          box.innerHTML = "";
          return;
        }
        const [orders, sales] = await Promise.all([DB.getAll(STORES.PRODUCTION_ORDERS, tenantId), DB.getAll(STORES.SALES, tenantId)]);
        const ord = orders.filter((o) => String(o.loteCodigo || "").toLowerCase() === code.toLowerCase());
        const hits = [];
        sales.forEach((s) => (s.items || []).forEach((it) => (it.lotes || []).forEach((l) => {
          if (String(l.codigo).toLowerCase() === code.toLowerCase())
            hits.push({ s, it, l });
        })));
        box.innerHTML = `
        <div class="p-3 text-sm">
          ${ord.length ? ord.map((o) => `<div class="mb-2">Producci\xF3n <strong>${esc(o.numeroOrden)}</strong> \xB7 ${esc(o.productoTerminadoNombre)} \xB7 ${esc(o.cantidadProducida)} und \xB7 ${esc(Formatters.date(o.fechaFin || o.fechaInicio))}${o.fechaVencimiento ? ` \xB7 vence ${esc(o.fechaVencimiento)}` : ""}</div>`).join("") : '<div class="mb-2 text-muted">No se encontr\xF3 una orden de producci\xF3n con ese lote.</div>'}
          ${hits.length ? `
            <table class="table table-sm pricing-table">
              <thead><tr><th>Documento</th><th>Fecha</th><th>Cliente</th><th>NIT/CC</th><th class="text-right">Cantidad</th><th>Estado</th></tr></thead>
              <tbody>${hits.map((h) => `<tr><td>${esc(h.s.consecutivo)}</td><td>${esc(Formatters.date(h.s.fecha))}</td><td>${esc(h.s.clienteNombre)}</td><td>${esc(h.s.clienteNit || "")}</td><td class="text-right">${esc(h.l.cantidad)}</td><td>${esc(h.s.estado)}</td></tr>`).join("")}</tbody>
            </table>` : '<div class="text-muted">Ninguna venta registrada con ese lote.</div>'}
        </div>`;
      };
      target.querySelector("#lot-trace-btn").addEventListener("click", () => trace(target.querySelector("#lot-trace-inp").value));
      target.querySelector("#lot-trace-inp").addEventListener("keydown", (e) => {
        if (e.key === "Enter")
          trace(e.target.value);
      });
      target.querySelectorAll(".lot-link").forEach((a) => a.addEventListener("click", (e) => {
        e.preventDefault();
        target.querySelector("#lot-trace-inp").value = a.dataset.lot;
        trace(a.dataset.lot);
      }));
    },
    /**
     * Modal de Ajuste de Inventario (+ / -)
     */
    openAdjustmentModal(tenantId, products, warehouses, onComplete) {
      const content = `
      <form id="adjustment-form">
        <div class="form-group mb-3">
          <label class="form-label">Seleccionar Producto o Insumo</label>
          <select class="form-select" name="productoId" required>
            ${products.map((p) => `
              <option value="${p.id}">${esc(p.nombre)} (SKU: ${esc(p.sku)} | Stock: ${p.stock} ${esc(p.unidadMedida)})</option>
            `).join("")}
          </select>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Tipo de Ajuste</label>
            <select class="form-select" name="documentoTipo" required>
              <option value="AJUSTE_POS">Ajuste Positivo (+) Entrada f\xEDsica encontrada</option>
              <option value="AJUSTE_NEG">Ajuste Negativo (-) Salida o faltante</option>
              <option value="MERMA">Baja por Merma T\xE9cnica (-)</option>
              <option value="DANO">Baja por Da\xF1o / Vencimiento (-)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Cantidad a Ajustar</label>
            <input type="number" step="any" min="0.01" class="form-control" name="cantidad" required placeholder="Ej: 5">
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Bodega Afectada</label>
          <select class="form-select" name="bodegaId">
            ${warehouses.map((w) => `<option value="${w.id}">${esc(w.nombre)}</option>`).join("")}
          </select>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Motivo o Justificaci\xF3n del Ajuste</label>
          <textarea class="form-control" name="observacion" required rows="2" placeholder="Ej: Conteo f\xEDsico fin de mes o frasco quebrado en estiba"></textarea>
        </div>
      </form>
    `;
      const dialog = Modal.show({
        title: "Registrar Ajuste Manual de Inventario",
        content,
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: "Aplicar Ajuste a Kardex",
            class: "btn-primary",
            onClick: async () => {
              const form = dialog.querySelector("#adjustment-form");
              if (!form.checkValidity()) {
                form.reportValidity();
                return;
              }
              const formData = new FormData(form);
              const productoId = formData.get("productoId");
              const cantidad = Number(formData.get("cantidad"));
              const tipo = formData.get("documentoTipo");
              const bodegaId = formData.get("bodegaId");
              const observacion = formData.get("observacion");
              try {
                await DB.runTransaction([...KARDEX_TX_STORES, STORES.SYSTEM_PARAMS], async (tx) => {
                  const n = await tx.nextSequence(tenantId, "AJUSTE");
                  await KardexService.applyMovement(tx, {
                    tenantId,
                    productoId,
                    bodegaId,
                    documentoTipo: tipo,
                    documentoNumero: `AJ-${String(n).padStart(6, "0")}`,
                    cantidad,
                    observacion
                  });
                });
              } catch (err) {
                Toast.error(err.message);
                return;
              }
              Toast.success("Ajuste de inventario registrado en Kardex.");
              Modal.close();
              if (onComplete)
                onComplete();
            }
          }
        ]
      });
    },
    /**
     * Modal de Traslado entre Bodegas
     */
    openTransferModal(tenantId, products, warehouses, onComplete) {
      const content = `
      <div class="alert alert-info text-xs mb-3">El inventario se controla como una sola existencia por producto. El traslado deja trazabilidad de la ubicaci\xF3n en el Kardex pero no cambia el stock total.</div>
      <form id="transfer-form">
        <div class="form-group mb-3">
          <label class="form-label">Producto a Trasladar</label>
          <select class="form-select" name="productoId" required>
            ${products.map((p) => `
              <option value="${p.id}">${esc(p.nombre)} (Stock: ${p.stock} ${esc(p.unidadMedida)})</option>
            `).join("")}
          </select>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Bodega Origen</label>
            <select class="form-select" name="bodegaOrigenId" required>
              ${warehouses.map((w) => `<option value="${w.id}">${esc(w.nombre)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Bodega Destino</label>
            <select class="form-select" name="bodegaDestinoId" required>
              ${warehouses.map((w, idx) => `<option value="${w.id}" ${idx === 1 ? "selected" : ""}>${esc(w.nombre)}</option>`).join("")}
            </select>
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Cantidad a Trasladar</label>
          <input type="number" step="any" min="0.01" class="form-control" name="cantidad" required placeholder="Ej: 10">
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Observaciones</label>
          <textarea class="form-control" name="observacion" rows="2" placeholder="Reabastecimiento de punto de venta"></textarea>
        </div>
      </form>
    `;
      const dialog = Modal.show({
        title: "Traslado de mercanc\xEDa entre bodegas",
        content,
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: "Ejecutar Traslado",
            class: "btn-primary",
            onClick: async () => {
              const form = dialog.querySelector("#transfer-form");
              if (!form.checkValidity()) {
                form.reportValidity();
                return;
              }
              const formData = new FormData(form);
              const productoId = formData.get("productoId");
              const origenId = formData.get("bodegaOrigenId");
              const destinoId = formData.get("bodegaDestinoId");
              const cantidad = Number(formData.get("cantidad"));
              const obs = formData.get("observacion") || "Traslado entre bodegas";
              if (origenId === destinoId) {
                Toast.warning("La bodega de origen y destino no pueden ser la misma.");
                return;
              }
              try {
                await DB.runTransaction([...KARDEX_TX_STORES, STORES.SYSTEM_PARAMS], async (tx) => {
                  const n = await tx.nextSequence(tenantId, "TRASLADO");
                  const docNum = `TR-${String(n).padStart(6, "0")}`;
                  const salida = await KardexService.applyMovement(tx, { tenantId, productoId, bodegaId: origenId, documentoTipo: "TRASLADO_SALIDA", documentoNumero: docNum, cantidad, observacion: `Salida por traslado. ${obs}` });
                  await KardexService.applyMovement(tx, { tenantId, productoId, bodegaId: destinoId, documentoTipo: "TRASLADO_ENTRADA", documentoNumero: docNum, cantidad, lotes: salida.lotes, observacion: `Entrada por traslado. ${obs}` });
                });
              } catch (err) {
                Toast.error(err.message);
                return;
              }
              Toast.success("Traslado registrado (trazabilidad entre bodegas).");
              Modal.close();
              if (onComplete)
                onComplete();
            }
          }
        ]
      });
    }
  };

  // js/modules/production.js
  init_formatters();

  // js/services/production-service.js
  var ProductionService = {
    /**
     * Calcula el costo estimado unitario y total para una receta y cantidad solicitada
     */
    async calculateEstimatedCost(recetaId, cantidadAProducir) {
      const receta = await DB.getById(STORES.RECIPES_BOM, recetaId);
      if (!receta)
        throw new Error("Receta no encontrada.");
      const factor = cantidadAProducir / (Number(receta.rendimientoLote || receta.cantidadProducir) || 1);
      let costoTotalInsumos = 0;
      const desgloseInsumos = [];
      for (const insumo of receta.insumos || []) {
        const mpId = insumo.materiaPrimaId || insumo.productoId;
        if (!mpId)
          continue;
        const prod = await DB.getById(STORES.PRODUCTS, mpId);
        const cantRequerida = insumo.cantidad * factor;
        const cantConMerma = cantRequerida * (1 + (insumo.mermaEsperada || 0) / 100);
        const costoUnitario = prod ? prod.costoPromedio || 0 : 0;
        const costoInsumo = cantConMerma * costoUnitario;
        costoTotalInsumos += costoInsumo;
        desgloseInsumos.push({
          materiaPrimaId: mpId,
          nombre: prod ? prod.nombre : "Insumo no encontrado",
          sku: prod ? prod.sku : "-",
          cantidadBase: insumo.cantidad,
          cantidadRequerida: Math.round(cantConMerma * 100) / 100,
          unidadMedida: insumo.unidadMedida,
          stockDisponible: prod ? prod.stock : 0,
          costoUnitario,
          costoTotal: Math.round(costoInsumo),
          stockSuficiente: prod ? prod.stock >= cantConMerma : false
        });
      }
      const costosIndirectos = (receta.costosIndirectosEstimados || 0) * factor;
      const costoTotalEstimado = Math.round(costoTotalInsumos + costosIndirectos);
      const costoUnitarioEstimado = Math.round(costoTotalEstimado / cantidadAProducir);
      return {
        receta,
        cantidadAProducir,
        desgloseInsumos,
        costoTotalInsumos: Math.round(costoTotalInsumos),
        costosIndirectos: Math.round(costosIndirectos),
        costoTotalEstimado,
        costoUnitarioEstimado,
        todosConStock: desgloseInsumos.every((i) => i.stockSuficiente)
      };
    },
    /**
     * Ejecuta una Orden de Producción:
     * 1. Consume materias primas del inventario
     * 2. Calcula costo real de fabricación
     * 3. Registra el lote
     * 4. Ingresa el producto terminado en inventario
     * 5. Genera movimientos de Kardex
     */
    async executeProductionOrder({
      tenantId,
      recetaId,
      productoTerminadoId,
      cantidadProducida,
      loteCodigo,
      costosIndirectosReales = 0,
      observaciones,
      fechaVencimiento = null
    }) {
      const cant = Number(cantidadProducida);
      if (!Number.isFinite(cant) || cant <= 0)
        throw new Error("La cantidad a producir debe ser mayor a cero.");
      const stores = [.../* @__PURE__ */ new Set([...KARDEX_TX_STORES, STORES.RECIPES_BOM, STORES.PRODUCTION_ORDERS, STORES.SYSTEM_PARAMS])];
      return DB.runTransaction(stores, async (tx) => {
        const pt = await tx.get(STORES.PRODUCTS, productoTerminadoId);
        if (!pt)
          throw new Error("Producto terminado no encontrado.");
        const receta = await tx.get(STORES.RECIPES_BOM, recetaId);
        if (!receta)
          throw new Error("Receta no encontrada.");
        const insumos = (receta.insumos || []).filter((i) => i.materiaPrimaId || i.productoId);
        if (insumos.length === 0)
          throw new Error("La receta no tiene insumos configurados.");
        const n = await tx.nextSequence(tenantId, "PRODUCCION");
        const numeroOrden = `OP-${String(n).padStart(6, "0")}`;
        const lote = loteCodigo || `LOTE-${String(pt.sku || "PT").substring(0, 6)}-${String(n).padStart(4, "0")}`;
        const factor = cant / (Number(receta.rendimientoLote || receta.cantidadProducir) || 1);
        let costoMP = 0;
        const insumosConsumidos = [];
        for (const insumo of insumos) {
          const mpId = insumo.materiaPrimaId || insumo.productoId;
          const cantConsumida = Math.round(Number(insumo.cantidad) * factor * (1 + (Number(insumo.mermaEsperada) || 0) / 100) * 1e3) / 1e3;
          if (cantConsumida <= 0)
            continue;
          const mov = await KardexService.applyMovement(tx, {
            tenantId,
            productoId: mpId,
            bodegaId: null,
            documentoTipo: "CONSUMO_PRODUCCION",
            documentoNumero: numeroOrden,
            cantidad: cantConsumida,
            observacion: `Consumo para ${cant} ${pt.unidadMedida || ""} de ${pt.nombre} (Lote ${lote})`
          });
          costoMP += mov.costoTotal;
          insumosConsumidos.push({
            materiaPrimaId: mpId,
            nombre: mov.productoNombre,
            sku: mov.sku,
            cantidad: cantConsumida,
            unidadMedida: insumo.unidadMedida || "",
            costoUnitario: mov.costoUnitario,
            costoTotal: Math.round(mov.costoTotal)
          });
        }
        const costoRealTotal = Math.round(costoMP + Number(costosIndirectosReales || 0));
        const costoUnitarioReal = Math.round(costoRealTotal / cant * 100) / 100;
        await KardexService.applyMovement(tx, {
          tenantId,
          productoId: pt.id,
          bodegaId: null,
          documentoTipo: "PRODUCCION_ENTRADA",
          documentoNumero: numeroOrden,
          cantidad: cant,
          costoUnitario: costoUnitarioReal,
          lote,
          vence: fechaVencimiento || null,
          observacion: `Producto terminado. Lote ${lote}${fechaVencimiento ? ` \xB7 vence ${fechaVencimiento}` : ""}`
        });
        const ahora = (/* @__PURE__ */ new Date()).toISOString();
        const orden = await tx.put(STORES.PRODUCTION_ORDERS, {
          tenantId,
          numeroOrden,
          recetaId,
          recetaNombre: receta.nombreReceta || receta.nombreFormula || "-",
          productoTerminadoId: pt.id,
          productoTerminadoNombre: pt.nombre,
          loteCodigo: lote,
          fechaVencimiento: fechaVencimiento || null,
          fechaProgramada: ahora.split("T")[0],
          fechaInicio: ahora,
          fechaFin: ahora,
          cantidadPlanificada: cant,
          cantidadProducida: cant,
          costoEstimadoTotal: costoRealTotal,
          costoRealTotal,
          costoUnitarioReal,
          costosIndirectosReales: Number(costosIndirectosReales || 0),
          insumosConsumidos,
          estado: "COMPLETADA",
          responsableId: Session.userId(),
          responsableNombre: Session.userName(),
          observaciones: observaciones || ""
        });
        await AuditService.logTx(tx, {
          tenantId,
          modulo: "Producci\xF3n",
          accion: "CREAR",
          registroId: numeroOrden,
          campoModificado: "Orden ejecutada",
          valorNuevo: `${cant} ${pt.unidadMedida || ""} de ${pt.nombre} (Lote ${lote}) - Costo unit. $ ${costoUnitarioReal}`
        });
        return orden;
      });
    }
  };

  // js/modules/production.js
  init_export_service();

  // js/components/print-template.js
  init_formatters();
  var LEGAL_NOTE = "Documento interno \u2014 no v\xE1lido como factura electr\xF3nica de venta.";
  function tenantOrBlank() {
    return TenantServiceInstance.getActiveTenant() || {
      nombreComercial: "Empresa",
      razonSocial: "Empresa",
      nit: "",
      dv: "",
      direccion: "",
      ciudad: "",
      telefono: "",
      email: ""
    };
  }
  var PrintTemplates = {
    /** Cabecera membretada de la empresa activa */
    getHeader(docTitle, docNumber, docDate) {
      const tenant = tenantOrBlank();
      if (tenant.membreteUrl) {
        return `
        <div class="doc-header" style="display: block; margin-bottom: 16px;">
          <img src="${esc(tenant.membreteUrl)}" alt="${esc(tenant.nombreComercial)}" style="width: 100%; max-height: 100px; object-fit: contain; margin-bottom: 10px; border-radius: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #000; padding-bottom: 6px;">
            <div>
              <div class="doc-badge">${esc(docTitle)}</div>
              <div style="font-size: 16px; font-weight: 800; color: #1d1d1f; margin: 4px 0 0 0;">No. ${esc(docNumber)}</div>
            </div>
            <div style="text-align: right; font-size: 11.5px; color: #444;">
              <div><strong>Fecha:</strong> ${esc(Formatters.dateTime(docDate))}</div>
            </div>
          </div>
        </div>
      `;
      }
      const logoSrc = TenantServiceInstance.getHorizontalLogo(tenant, false);
      return `
      <div class="doc-header">
        <div class="doc-brand">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
            <img src="${esc(logoSrc)}" alt="${esc(tenant.nombreComercial)}" style="height: 48px; max-width: 180px; object-fit: contain; display: block; border-radius: 4px;" onerror="this.style.display='none'">
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #1d1d1f; line-height: 1.2;">${esc(tenant.razonSocial || tenant.nombreComercial)}</div>
          <p><strong>NIT:</strong> ${esc(tenant.nit)}${tenant.dv !== void 0 && tenant.dv !== null && tenant.dv !== "" ? "-" + esc(tenant.dv) : ""} | <strong>R\xE9gimen:</strong> ${esc(tenant.regimen || "-")}</p>
          <p>${esc(tenant.direccion || "")}${tenant.ciudad ? " \u2022 " + esc(tenant.ciudad) : ""}</p>
          <p>${tenant.telefono ? "<strong>Tel:</strong> " + esc(tenant.telefono) : ""}${tenant.email ? " | <strong>Email:</strong> " + esc(tenant.email) : ""}</p>
        </div>
        <div class="doc-meta">
          <div class="doc-badge">${esc(docTitle)}</div>
          <div style="font-size: 16px; font-weight: 800; color: #1d1d1f; margin: 4px 0;">No. ${esc(docNumber)}</div>
          <div style="font-size: 12px; color: #6e6e73;"><strong>Fecha:</strong> ${esc(Formatters.dateTime(docDate))}</div>
        </div>
      </div>
    `;
    },
    /** 1. Rótulo de envío (diseñado para 4 por página) */
    shippingBoxLabel(shipping) {
      const tenant = tenantOrBlank();
      const qr = tenant.qrResenaUrl ? `<div style="position: absolute; top: 10px; right: 10px; text-align: center; width: 70px;">
           <img src="${esc(tenant.qrResenaUrl)}" alt="QR" style="width: 55px; height: 55px; display: block; margin: 0 auto;">
           <div style="font-size: 8px; line-height: 1.2; margin-top: 4px; font-weight: bold; color: #444;">${esc(tenant.qrResenaTexto || "D\xC9JANOS UNA RESE\xD1A")}</div>
         </div>` : "";
      return `
      <div style="flex: 1; min-height: 225px; border: 2px solid #000; border-radius: 8px; display: flex; flex-direction: column; padding: 8px; box-sizing: border-box; position: relative; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 8px;">
          <div style="font-weight: 900; font-size: 14px;">${esc(tenant.nombreComercial)}</div>
          <div style="text-align: right;">
            <div style="background: #000; color: #fff; padding: 2px 8px; font-weight: bold; border-radius: 4px; font-size: 11px; display: inline-block;">
              ${esc(shipping.transportadora || "Transportadora por definir")}
            </div>
            <div style="font-size: 10px; font-weight: bold; margin-top: 4px;">GU\xCDA: ${esc(shipping.numeroGuia || "PENDIENTE")} \xB7 DOC: ${esc(shipping.documentoNumero || "-")}</div>
          </div>
        </div>

        <div style="display: flex; flex: 1; gap: 12px;">
          <div style="flex: 1; border: 2px solid #000; padding: 6px; border-radius: 4px; font-size: 10px; line-height: 1.2; display: flex; flex-direction: column;">
            <div style="color: #444; margin-bottom: 4px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 2px;">DE (REMITENTE):</div>
            <div style="font-weight: 900; font-size: 11px;">${esc(tenant.razonSocial || tenant.nombreComercial)}</div>
            <div>NIT: ${esc(tenant.nit)}${tenant.dv !== void 0 && tenant.dv !== "" ? "-" + esc(tenant.dv) : ""}</div>
            <div>${esc(tenant.direccion || "")}</div>
            <div>${esc(tenant.ciudad || "")}</div>
            <div>Tel: ${esc(tenant.telefono || "")}</div>
          </div>

          <div style="flex: 2; border: 2px solid #000; padding: 6px; ${qr ? "padding-right: 90px;" : ""} border-radius: 4px; font-size: 11px; line-height: 1.2; display: flex; flex-direction: column; background: #fffdf0; position: relative;">
            <div style="font-weight: 900; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 4px;">PARA (DESTINATARIO):</div>
            <div style="font-weight: 900; font-size: 13px;">${esc(shipping.clienteNombre)}</div>
            <div><strong>NIT/CC:</strong> ${esc(shipping.nitCc || "-")}</div>
            <div><strong>Direcci\xF3n:</strong> ${esc(shipping.direccion || "-")}${shipping.barrio ? " (" + esc(shipping.barrio) + ")" : ""}</div>
            <div><strong>Destino:</strong> ${esc(shipping.ciudad || "-")} ${shipping.departamento ? "- " + esc(shipping.departamento) : ""}</div>
            <div><strong>Tel:</strong> ${esc(shipping.telefono || "-")}</div>
            <div style="margin-top: 2px; padding-top: 2px; border-top: 1px dashed #999; font-weight: 600;">
              Contenido: ${esc(shipping.contenidoDescripcion || "Mercanc\xEDa")} - ${esc(shipping.cajasTotal || 1)} CAJA(S)
            </div>
            ${qr}
          </div>
        </div>
      </div>
    `;
    },
    /** 1.5. Lote de rótulos (4 por página carta) */
    batchShippingLabels(shippings) {
      if (!shippings || shippings.length === 0)
        return "";
      let html = "";
      const perPage = 4;
      for (let i = 0; i < shippings.length; i += perPage) {
        const chunk = shippings.slice(i, i + perPage);
        html += `<div style="box-sizing: border-box; display: flex; flex-direction: column; gap: 8px; ${i + perPage < shippings.length ? "page-break-after: always;" : ""}">`;
        chunk.forEach((s) => {
          html += this.shippingBoxLabel(s);
        });
        for (let j = chunk.length; j < perPage; j++)
          html += '<div style="flex: 1;"></div>';
        html += "</div>";
      }
      return html;
    },
    /** 2. Documento de venta / venta a crédito / cotización */
    saleInvoice(sale, items = []) {
      const tipo = sale.tipoDoc;
      const anulada = sale.estado === "ANULADA";
      const esCotizacion = tipo === "COTIZACION" || sale.estado === "COTIZACION";
      const esCredito = tipo === "VENTA_CREDITO" || sale.metodoPago === "Cr\xE9dito";
      const conIva = Number(sale.impuestos || 0) > 0;
      let docTitle = "DOCUMENTO INTERNO DE VENTA";
      if (esCotizacion)
        docTitle = "COTIZACI\xD3N";
      else if (esCredito)
        docTitle = "VENTA A CR\xC9DITO (DOC. INTERNO)";
      const header = this.getHeader(docTitle, sale.consecutivo, sale.fecha);
      const rows = (items || []).map((it, idx) => `
      <tr style="font-size: 11px;">
        <td class="text-center" style="padding: 4px;">${idx + 1}</td>
        <td style="padding: 4px;"><strong>${esc(it.sku || "-")}</strong></td>
        <td style="padding: 4px;">${esc(it.nombre)}</td>
        <td class="text-center" style="padding: 4px;"><strong>${esc(it.cantidad)}</strong></td>
        <td class="text-right" style="padding: 4px;">${Formatters.currency(it.precioUnitario)}</td>
        <td class="text-right" style="padding: 4px;"><strong>${Formatters.currency(it.total !== void 0 ? it.total : it.cantidad * it.precioUnitario)}</strong></td>
      </tr>
    `).join("");
      const validez = esCotizacion ? `<p style="margin-top: 2px;">Cotizaci\xF3n v\xE1lida por ${esc(tenantOrBlank().diasValidezCotizacion || 15)} d\xEDas. Precios sujetos a disponibilidad de inventario.</p>` : "";
      return `
      <div style="position: relative;">
      ${anulada ? `<div style="position: absolute; top: 35%; left: 0; right: 0; text-align: center; font-size: 72px; font-weight: 900; color: rgba(220, 38, 38, 0.18); transform: rotate(-18deg); pointer-events: none;">ANULADA</div>` : ""}
      ${header}

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; background: #fbfbfd; padding: 8px; border-radius: 6px; border: 1px solid #e5e5ea; line-height: 1.3;">
        <div>
          <div style="font-size: 10px; text-transform: uppercase; color: #86868b; font-weight: 700;">Cliente</div>
          <div style="font-size: 12px; font-weight: 700; color: #1d1d1f; margin: 2px 0;">${esc(sale.clienteNombre)}</div>
          <div style="font-size: 11px; color: #424245;"><strong>NIT/CC:</strong> ${esc(sale.clienteNit || "-")}</div>
          ${esCotizacion ? "" : `<div style="font-size: 11px; color: #424245;"><strong>Forma de pago:</strong> ${esc(sale.metodoPago || "-")}</div>`}
        </div>
        <div>
          <div style="font-size: 10px; text-transform: uppercase; color: #86868b; font-weight: 700;">Informaci\xF3n</div>
          <div style="font-size: 11px; color: #424245;"><strong>Atendi\xF3:</strong> ${esc(sale.vendedorNombre || "-")}</div>
          ${sale.freelancerNombre ? `<div style="font-size: 11px; color: #424245;"><strong>Asesor comercial:</strong> ${esc(sale.freelancerNombre)}</div>` : ""}
          <div style="font-size: 11px; color: #424245;"><strong>Estado:</strong> ${esc(sale.estado)}</div>
          <div style="font-size: 10px; color: #86868b; margin-top: 2px;">${conIva ? "Incluye IVA discriminado" : "Sin IVA liquidado"}</div>
        </div>
      </div>

      <table style="margin-bottom: 10px;">
        <thead>
          <tr style="font-size: 11px;">
            <th class="text-center" style="width: 30px; padding: 4px;">#</th>
            <th style="width: 100px; padding: 4px;">SKU</th>
            <th style="padding: 4px;">Descripci\xF3n</th>
            <th class="text-center" style="width: 50px; padding: 4px;">Cant.</th>
            <th class="text-right" style="width: 90px; padding: 4px;">V. Unit</th>
            <th class="text-right" style="width: 100px; padding: 4px;">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="doc-totals" style="margin-top: 5px;">
        <div class="total-row" style="padding: 2px 0;"><span>Base (antes de IVA):</span><span>${Formatters.currency(sale.subtotal)}</span></div>
        ${Number(sale.descuentos) > 0 ? `<div class="total-row" style="padding: 2px 0; color: #ff3b30;"><span>Descuentos:</span><span>-${Formatters.currency(sale.descuentos)}</span></div>` : ""}
        <div class="total-row" style="padding: 2px 0;"><span>IVA:</span><span>${Formatters.currency(sale.impuestos || 0)}</span></div>
        <div class="total-row grand-total" style="padding-top: 4px; margin-top: 4px;"><span>TOTAL:</span><span>${Formatters.currency(sale.total)}</span></div>
        ${!esCotizacion && !esCredito && Number(sale.cambio) > 0 ? `<div class="total-row" style="padding: 2px 0; font-size: 11px;"><span>Recibido / Cambio:</span><span>${Formatters.currency(sale.pagoRecibido)} / ${Formatters.currency(sale.cambio)}</span></div>` : ""}
      </div>

      ${anulada && sale.anulacion ? `<div style="margin-top: 10px; padding: 8px; border: 1px solid #fca5a5; border-radius: 6px; font-size: 11px; color: #991b1b;"><strong>Anulada</strong> el ${esc(Formatters.dateTime(sale.anulacion.fecha))} por ${esc(sale.anulacion.usuarioNombre)}. Motivo: ${esc(sale.anulacion.motivo)}</div>` : ""}

      <div class="doc-footer" style="margin-top: 15px; padding-top: 10px; font-size: 10px; line-height: 1.3;">
        ${tenantOrBlank().piePaginaDocumentos ? `<p>${esc(tenantOrBlank().piePaginaDocumentos)}</p>` : "<p>Gracias por su compra.</p>"}
        ${validez}
        <p style="margin-top: 4px; font-size: 9px; font-weight: 700;">${LEGAL_NOTE}</p>
      </div>
      </div>
    `;
    },
    /** 3. Orden de fabricación con firma configurable */
    productionOrder(order) {
      const tenant = tenantOrBlank();
      const header = this.getHeader("ORDEN DE FABRICACI\xD3N", order.numeroOrden, order.fechaInicio || order.fechaProgramada);
      const rows = (order.insumosConsumidos || []).map((ins, idx) => `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td><strong>${esc(ins.sku || "-")}</strong></td>
        <td>${esc(ins.nombre)}</td>
        <td class="text-center font-bold">${esc(ins.cantidad)} ${esc(ins.unidadMedida || "")}</td>
        <td class="text-right">${Formatters.currency(ins.costoUnitario, 2)}</td>
        <td class="text-right"><strong>${Formatters.currency(ins.costoTotal)}</strong></td>
      </tr>
    `).join("");
      return `
      ${header}
      <div style="background: #fbfbfd; border: 1px solid #e5e5ea; padding: 14px; border-radius: 8px; margin-bottom: 20px;">
        <div style="font-size: 11px; font-weight: 700; color: #0071e3; text-transform: uppercase;">Producto fabricado</div>
        <div style="font-size: 17px; font-weight: 800; color: #1d1d1f; margin: 4px 0;">${esc(order.productoTerminadoNombre)}</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 12px; margin-top: 8px;">
          <div><strong>Lote:</strong> ${esc(order.loteCodigo)}</div>
          <div><strong>Cantidad:</strong> ${esc(order.cantidadProducida)}</div>
          <div><strong>Estado:</strong> ${esc(order.estado)}</div>
          <div><strong>Responsable:</strong> ${esc(order.responsableNombre || "-")}</div>
        </div>
      </div>

      <h4 style="font-size: 13px; margin-bottom: 8px; color: #1d1d1f;">Insumos y empaques consumidos</h4>
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 40px;">#</th>
            <th style="width: 120px;">SKU</th>
            <th>Descripci\xF3n</th>
            <th class="text-center" style="width: 100px;">Consumo</th>
            <th class="text-right" style="width: 120px;">Costo unit.</th>
            <th class="text-right" style="width: 130px;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="doc-totals">
        <div class="total-row"><span>Costos indirectos (CIF):</span><span>${Formatters.currency(order.costosIndirectosReales || 0)}</span></div>
        <div class="total-row grand-total"><span>COSTO TOTAL LOTE:</span><span>${Formatters.currency(order.costoRealTotal)}</span></div>
        <div class="total-row" style="font-weight: 700; color: #0071e3; margin-top: 4px;"><span>Costo unitario real:</span><span>${Formatters.currency(order.costoUnitarioReal, 2)}</span></div>
      </div>

      <div style="margin-top: 50px; display: flex; justify-content: space-around; align-items: flex-end;">
        <div style="width: 220px; text-align: center;">
          ${tenant.firmaUrl ? `<img src="${esc(tenant.firmaUrl)}" alt="Firma" style="height: 60px; object-fit: contain; margin-bottom: -10px;" onerror="this.style.display='none'">` : '<div style="height: 60px;"></div>'}
          <div style="border-top: 1px solid #1d1d1f; font-size: 11px; padding-top: 4px; font-weight: bold;">${esc(tenant.firmaNombre || "Responsable de planta")}</div>
          <div style="font-size: 10px; color: #6e6e73;">${esc(tenant.firmaCargo || "Operaciones y planta")}</div>
        </div>
        <div style="width: 220px; text-align: center;">
          <div style="height: 60px;"></div>
          <div style="border-top: 1px solid #1d1d1f; font-size: 11px; padding-top: 4px; font-weight: bold;">Control de calidad</div>
          <div style="font-size: 10px; color: #6e6e73;">Inspecci\xF3n pH, viscosidad y sello</div>
        </div>
      </div>
    `;
    },
    /** 4. Cotización */
    commercialQuote(quote, items = []) {
      return this.saleInvoice({ ...quote, tipoDoc: "COTIZACION" }, items);
    }
  };

  // js/modules/production.js
  init_toast();
  var ProductionModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const [recipes, orders, rawMaterials, finishedGoods] = await Promise.all([
        DB.getAll(STORES.RECIPES_BOM, tenantId),
        DB.getAll(STORES.PRODUCTION_ORDERS, tenantId),
        (await DB.getAll(STORES.PRODUCTS, tenantId)).filter((p) => p.tipoItem === "MATERIA_PRIMA"),
        (await DB.getAll(STORES.PRODUCTS, tenantId)).filter((p) => p.tipoItem === "PRODUCTO_TERMINADO")
      ]);
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Producci\xF3n</h1>
          <p>\xD3rdenes de fabricaci\xF3n con consumo de insumos y costo real por lote</p>
        </div>
        <div class="view-actions">
          <a href="#formulas-vault" class="btn btn-secondary btn-sm" id="btn-new-recipe" style="text-decoration: none;">Nueva f\xF3rmula</a>
          <button class="btn btn-primary btn-sm" id="btn-execute-production">Producir</button>
        </div>
      </div>

      <!-- TABS: \xD3RDENES REALIZADAS VS F\xD3RMULAS ACTIVAS + B\xD3VEDA + COSTOS -->
      <div class="chip-group mb-3">
        <button type="button" class="chip-filter tab-prod-btn active" data-tab="orders">\xD3rdenes <span class="chip-count">${orders.length}</span></button>
        <button type="button" class="chip-filter tab-prod-btn" data-tab="recipes">F\xF3rmulas <span class="chip-count">${recipes.length}</span></button>
      </div>

      <div id="production-content-area"></div>
    `;
      const renderOrdersTable = () => {
        const target = container.querySelector("#production-content-area");
        target.innerHTML = '<div id="orders-table-container"></div>';
        new DataTable({
          containerId: "orders-table-container",
          data: orders.sort((a, b) => new Date(b.fechaInicio || b.fechaProgramada) - new Date(a.fechaInicio || a.fechaProgramada)),
          columns: [
            {
              key: "numeroOrden",
              title: "No. Orden / Lote",
              render: (val, row) => `
              <div>
                <strong style="color: var(--brand-primary);">${esc(val)}</strong>
                <div class="text-xs text-muted">Lote: <strong>${esc(row.loteCodigo)}</strong></div>
              </div>
            `
            },
            {
              key: "productoTerminadoNombre",
              title: "Producto Fabricado",
              render: (val, row) => `
              <div>
                <div class="font-bold">${esc(val)}</div>
                <div class="text-xs text-muted">Cant: <strong>${esc(row.cantidadProducida)} unidades</strong></div>
              </div>
            `
            },
            {
              key: "fechaInicio",
              title: "Fecha Fabricaci\xF3n",
              render: (val) => Formatters.date(val)
            },
            {
              key: "costoRealTotal",
              title: "Costo Total Lote",
              render: (val) => Formatters.currency(val)
            },
            {
              key: "costoUnitarioReal",
              title: "Costo Unit. Real",
              render: (val) => `<strong class="text-success">${Formatters.currency(val)}</strong>`
            },
            {
              key: "responsableNombre",
              title: "Responsable",
              render: (val) => `<span class="badge badge-neutral">${esc(val || "Planta")}</span>`
            },
            {
              key: "estado",
              title: "Estado",
              render: (val) => `<span class="badge badge-success">${esc(val)}</span>`
            }
          ],
          actions: (row) => `
          <button class="btn btn-secondary btn-sm btn-print-order" data-id="${esc(row.id)}" title="Imprimir Orden">\u{1F5A8}\uFE0F Imprimir</button>
        `
        });
      };
      const renderRecipesTable = () => {
        const target = container.querySelector("#production-content-area");
        target.innerHTML = `
        <div class="card">
          <div class="card-header">
            <div class="card-title">F\xF3rmulas Qu\xEDmicas y Estructura de Materiales (BOM)</div>
          </div>
          <div class="card-body">
            <div class="d-flex flex-col gap-3">
              ${recipes.map((r) => {
          const pt = finishedGoods.find((p) => p.id === r.productoTerminadoId);
          return `
                  <div class="card" style="border: 1px solid var(--border-color); margin-bottom: 0;">
                    <div class="card-header">
                      <div>
                        <strong style="color: var(--brand-primary); font-size: 15px;">${esc(r.nombreReceta || r.nombreFormula)}</strong>
                        <div class="text-xs text-muted">Producto resultante: <strong>${esc(pt ? pt.nombre : "Sin producto vinculado")}</strong> | Rendimiento por lote: <strong>${esc(r.rendimientoLote || r.cantidadProducir)} ${esc(r.unidadMedidaLote || r.unidadMedida || "")}</strong></div>
                      </div>
                      <button class="btn btn-primary btn-sm btn-quick-produce" data-receta-id="${r.id}">\u26A1 Fabricar Este Lote</button>
                    </div>
                    <div class="card-body" style="padding: 12px 16px;">
                      <div class="text-xs font-bold text-muted mb-2">INSUMOS Y MATERIAS PRIMAS CONSUMIDAS POR LOTE:</div>
                      <div class="table-responsive">
                        <table class="data-table" style="font-size: 12px;">
                          <thead>
                            <tr>
                              <th>Materia Prima / Insumo</th>
                              <th class="text-center">Cant. Lote</th>
                              <th class="text-center">Unidad</th>
                              <th class="text-center">Merma Esp.</th>
                              <th class="text-right">Stock Disponible</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${(r.insumos || []).map((ins) => {
            const mp = rawMaterials.find((m) => m.id === (ins.materiaPrimaId || ins.productoId));
            const stock = mp ? mp.stock : 0;
            const isSufficient = stock >= ins.cantidad;
            return `
                                <tr>
                                  <td><strong>${esc(mp ? mp.nombre : "Insumo no encontrado")}</strong> <span class="text-xs text-muted">(${esc(mp ? mp.sku : "-")})</span></td>
                                  <td class="text-center font-bold">${ins.cantidad}</td>
                                  <td class="text-center">${esc(ins.unidadMedida || "")}</td>
                                  <td class="text-center">${ins.mermaEsperada || 0}%</td>
                                  <td class="text-right">
                                    <span class="badge ${isSufficient ? "badge-success" : "badge-danger"}">
                                      ${esc(stock)} ${esc(ins.unidadMedida || "")}
                                    </span>
                                  </td>
                                </tr>
                              `;
          }).join("")}
                          </tbody>
                        </table>
                      </div>
                      ${r.observaciones ? `<div class="text-xs text-muted mt-2"><strong>Notas:</strong> ${esc(r.observaciones)}</div>` : ""}
                    </div>
                  </div>
                `;
        }).join("")}
            </div>
          </div>
        </div>
      `;
      };
      renderOrdersTable();
      container.querySelectorAll(".tab-prod-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          container.querySelectorAll(".tab-prod-btn").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          const tab = btn.getAttribute("data-tab");
          if (tab === "orders")
            renderOrdersTable();
          else
            renderRecipesTable();
        });
      });
      container.querySelector("#btn-execute-production").addEventListener("click", () => {
        this.openExecuteProductionModal(tenantId, recipes, finishedGoods, rawMaterials, () => this.render(container));
      });
      bindOnce(container, "production-click", "click", (e) => {
        const quickBtn = e.target.closest(".btn-quick-produce");
        if (quickBtn) {
          const recetaId = quickBtn.getAttribute("data-receta-id");
          this.openExecuteProductionModal(tenantId, recipes, finishedGoods, rawMaterials, () => this.render(container), recetaId);
          return;
        }
        const printBtn = e.target.closest(".btn-print-order");
        if (printBtn) {
          const orderId = printBtn.getAttribute("data-id");
          const order = orders.find((o) => o.id === orderId);
          if (order) {
            const html = PrintTemplates.productionOrder(order);
            ExportService.printDocument(html, `Orden_Produccion_${esc(order.numeroOrden)}`);
          }
        }
      });
    },
    /**
     * Modal de Explosión y Ejecución de Orden de Producción
     */
    openExecuteProductionModal(tenantId, recipes, finishedGoods, rawMaterials, onCompleted, preselectedRecipeId = null) {
      if (recipes.length === 0) {
        Toast.warning("No hay recetas BOM registradas. Debe crear una receta primero.");
        return;
      }
      const selectedRecipe = preselectedRecipeId ? recipes.find((r) => r.id === preselectedRecipeId) : recipes[0];
      const ptOf = (r) => finishedGoods.find((p) => p.id === r.productoTerminadoId) || null;
      const venceFor = (r) => {
        const pt = ptOf(r);
        const m = Number(pt && pt.vidaUtilMeses) || 0;
        if (!m)
          return "";
        const d = /* @__PURE__ */ new Date();
        d.setMonth(d.getMonth() + m);
        return d.toISOString().split("T")[0];
      };
      const rindeTxt = (r) => {
        const lote = Number(r.rendimientoLote || r.cantidadProducir) || 1;
        const pt = ptOf(r);
        const u = r.unidadMedidaLote || r.unidadMedida || "";
        const enUnidades = !u || /^(unidad|unidades|botellas?|und|u)$/i.test(u);
        return `La f\xF3rmula rinde <strong>${lote}</strong> ${esc(pt ? pt.unidadMedida || "unidades" : "unidades")} de ${esc(pt ? pt.nombre : "producto sin vincular")} por lote.` + (enUnidades ? "" : ` <span class="mg mg-warn">Revise la f\xF3rmula: el rendimiento est\xE1 en "${esc(u)}" y debe estar en unidades del producto.</span>`);
      };
      const content = `
      <form id="execute-production-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Seleccionar F\xF3rmula Maestra (BOM)</label>
            <select class="form-select" id="sel-production-recipe" name="recetaId">
              ${recipes.map((r) => `
                <option value="${esc(r.id)}" ${r.id === selectedRecipe.id ? "selected" : ""}>${esc(r.nombreReceta || r.nombreFormula)}</option>
              `).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Cantidad a fabricar (unidades del producto)</label>
            <input type="number" step="1" min="1" class="form-control" id="inp-prod-qty" name="cantidad" value="${esc(selectedRecipe.rendimientoLote || selectedRecipe.cantidadProducir || 1)}" required>
          </div>
        </div>

        <div class="text-xs text-muted mb-3" id="prod-rinde">${rindeTxt(selectedRecipe)}</div>
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">C\xF3digo de Lote</label>
            <input type="text" class="form-control" name="loteCodigo" value="" placeholder="Vac\xEDo = se genera autom\xE1ticamente">
          </div>
          <div class="form-group">
            <label class="form-label">Costos Indirectos Adicionales (CIF COP)</label>
            <input type="number" class="form-control" id="inp-prod-cif" name="costosIndirectos" value="${Math.round(Number(selectedRecipe.costosIndirectosEstimados) || 0)}" min="0" step="100">
          </div>
          <div class="form-group">
            <label class="form-label">Vence (opcional)</label>
            <input type="date" class="form-control" id="inp-prod-vence" name="fechaVencimiento" value="${venceFor(selectedRecipe)}">
          </div>
        </div>

        <!-- EXPLOSI\xD3N DIN\xC1MICA DE INSUMOS -->
        <div class="card mb-3" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color);">
          <div class="card-header" style="padding: 10px 14px;">
            <div class="card-title" style="font-size: 13px;">\u{1F4A5} Explosi\xF3n de Insumos & Verificaci\xF3n de Stock</div>
          </div>
          <div class="card-body" style="padding: 12px;" id="explosion-preview-area">
            <div class="text-xs text-muted">Calculando insumos requeridos...</div>
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Observaciones / Registro de Calidad</label>
          <textarea class="form-control" name="observaciones" rows="2" placeholder="Control de pH, viscosidad o densidad verificado"></textarea>
        </div>
      </form>
    `;
      const dialog = Modal.show({
        title: "Ejecutar Fabricaci\xF3n en Planta",
        content,
        size: "lg",
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: "Fabricar & Ingresar a Inventario",
            class: "btn-primary",
            id: "btn-confirm-production",
            onClick: async () => {
              const form = dialog.querySelector("#execute-production-form");
              if (!form.checkValidity()) {
                form.reportValidity();
                return;
              }
              const formData = new FormData(form);
              const recetaId = formData.get("recetaId");
              const cantidad = Number(formData.get("cantidad"));
              const loteCodigo = formData.get("loteCodigo");
              const cif = Number(formData.get("costosIndirectos") || 0);
              const observaciones = formData.get("observaciones");
              const fechaVencimiento = formData.get("fechaVencimiento") || null;
              const receta = recipes.find((r) => r.id === recetaId);
              try {
                dialog.querySelector("#btn-confirm-production").disabled = true;
                dialog.querySelector("#btn-confirm-production").textContent = "Procesando fabricaci\xF3n...";
                await ProductionService.executeProductionOrder({
                  tenantId,
                  recetaId,
                  productoTerminadoId: receta.productoTerminadoId,
                  cantidadProducida: cantidad,
                  loteCodigo,
                  costosIndirectosReales: cif,
                  observaciones,
                  fechaVencimiento
                });
                Toast.success("Orden de producci\xF3n registrada: se consumieron los insumos e ingres\xF3 el producto terminado.");
                Modal.close();
                if (onCompleted)
                  onCompleted();
              } catch (err) {
                console.error(err);
                Toast.error(`Error al procesar la producci\xF3n: ${err.message}`);
                dialog.querySelector("#btn-confirm-production").disabled = false;
                dialog.querySelector("#btn-confirm-production").textContent = "Fabricar & Ingresar a Inventario";
              }
            }
          }
        ]
      });
      const updateExplosion = async () => {
        const recId = dialog.querySelector("#sel-production-recipe").value;
        const qty = Number(dialog.querySelector("#inp-prod-qty").value) || 1;
        const previewArea = dialog.querySelector("#explosion-preview-area");
        const submitBtn = dialog.querySelector("#btn-confirm-production");
        try {
          const est = await ProductionService.calculateEstimatedCost(recId, qty);
          const cifInp = dialog.querySelector("#inp-prod-cif");
          if (!cifInp.dataset.manual)
            cifInp.value = Math.round(est.costosIndirectos || 0);
          const cif = Number(cifInp.value) || 0;
          const totalReal = est.costoTotalInsumos + cif;
          const unitReal = qty > 0 ? Math.round(totalReal / qty) : 0;
          previewArea.innerHTML = `
          <div class="table-responsive mb-2">
            <table class="data-table" style="font-size: 11px;">
              <thead>
                <tr>
                  <th>Insumo Qu\xEDmico / Empaque</th>
                  <th class="text-center">Requerido</th>
                  <th class="text-right">Stock Disponible</th>
                  <th class="text-right">Costo Estimado</th>
                </tr>
              </thead>
              <tbody>
                ${est.desgloseInsumos.map((ins) => `
                  <tr>
                    <td><strong>${esc(ins.nombre)}</strong></td>
                    <td class="text-center font-bold">${ins.cantidadRequerida} ${esc(ins.unidadMedida)}</td>
                    <td class="text-right">
                      <span class="badge ${ins.stockSuficiente ? "badge-success" : "badge-danger"}">
                        ${ins.stockDisponible} ${esc(ins.unidadMedida)}
                      </span>
                    </td>
                    <td class="text-right">${Formatters.currency(ins.costoTotal)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <div class="d-flex justify-between items-center text-xs mt-2" style="border-top: 1px dashed #cbd5e1; padding-top: 8px;">
            <div>
              <span>Insumos ${Formatters.currency(est.costoTotalInsumos)} + indirectos ${Formatters.currency(cif)} = <strong>${Formatters.currency(totalReal)}</strong></span>
              <span class="ml-2 text-muted">| Costo por unidad: <strong class="text-success">${Formatters.currency(unitReal)}</strong></span>
            </div>
            ${!est.todosConStock ? `
              <span class="badge badge-danger">\u26A0\uFE0F Stock insuficiente en uno o m\xE1s insumos</span>
            ` : `
              <span class="badge badge-success">\u2713 Stock disponible para producir</span>
            `}
          </div>
        `;
          if (!est.todosConStock) {
            submitBtn.disabled = true;
            submitBtn.title = "Insumos insuficientes en bodega";
          } else {
            submitBtn.disabled = false;
          }
        } catch (e) {
          previewArea.innerHTML = `<div class="text-danger text-xs">${e.message}</div>`;
        }
      };
      const cifField = dialog.querySelector("#inp-prod-cif");
      cifField.addEventListener("input", () => {
        cifField.dataset.manual = "1";
        updateExplosion();
      });
      dialog.querySelector("#sel-production-recipe").addEventListener("change", (e) => {
        delete cifField.dataset.manual;
        const r = recipes.find((x) => x.id === e.target.value);
        if (r) {
          dialog.querySelector("#prod-rinde").innerHTML = rindeTxt(r);
          dialog.querySelector("#inp-prod-vence").value = venceFor(r);
        }
        updateExplosion();
      });
      dialog.querySelector("#inp-prod-qty").addEventListener("input", updateExplosion);
      updateExplosion();
    }
  };

  // js/modules/purchases.js
  init_formatters();

  // js/services/purchase-service.js
  var PURCHASE_TERMS = {
    CONTADO_BANCO: "Contado (transferencia / banco)",
    CONTADO_CAJA: "Contado (efectivo de caja)",
    CREDITO: "Cr\xE9dito (genera cuenta por pagar)"
  };
  var PurchaseService = {
    async registerPurchase({ tenantId, proveedorId, facturaProveedor, bodegaId, condicion, items }) {
      if (!proveedorId)
        throw new Error("Seleccione un proveedor.");
      if (!items || items.length === 0)
        throw new Error("Agregue al menos un \xEDtem a la compra.");
      for (const it of items) {
        if (!(Number(it.cantidad) > 0))
          throw new Error(`Cantidad inv\xE1lida para ${it.nombre}.`);
        if (!(Number(it.costoUnitario) >= 0))
          throw new Error(`Costo inv\xE1lido para ${it.nombre}.`);
      }
      if (!PURCHASE_TERMS[condicion])
        throw new Error("Seleccione la forma de pago.");
      const total = Math.round(items.reduce((a, i) => a + Number(i.cantidad) * Number(i.costoUnitario), 0) * 100) / 100;
      const stores = [.../* @__PURE__ */ new Set([
        ...KARDEX_TX_STORES,
        STORES.PURCHASES,
        STORES.SUPPLIERS,
        STORES.PAYABLES_CXP,
        STORES.CASH_SHIFTS,
        STORES.CASH_MOVEMENTS,
        STORES.SYSTEM_PARAMS
      ])];
      const res = await DB.runTransaction(stores, async (tx) => {
        const supp = await tx.get(STORES.SUPPLIERS, proveedorId);
        if (!supp)
          throw new Error("Proveedor no encontrado.");
        const fac = String(facturaProveedor || "").trim();
        if (fac) {
          const prev = (await tx.getAll(STORES.PURCHASES, tenantId)).find((p) => p.proveedorId === proveedorId && String(p.facturaProveedor || p.consecutivo).trim().toLowerCase() === fac.toLowerCase() && p.estado !== "ANULADA");
          if (prev)
            throw new Error(`La factura ${fac} de este proveedor ya fue registrada (${prev.consecutivo}).`);
        }
        let turno = null;
        if (condicion === "CONTADO_CAJA") {
          turno = (await tx.getAll(STORES.CASH_SHIFTS, tenantId)).find((s) => s.estado === "ABIERTA");
          if (!turno)
            throw new Error("Para pagar en efectivo de caja debe haber un turno abierto.");
        }
        const n = await tx.nextSequence(tenantId, "COMPRA");
        const consecutivo = `CP-${String(n).padStart(6, "0")}`;
        const nombreProv = supp.razonSocial || supp.nombre || "Proveedor";
        const compra = await tx.put(STORES.PURCHASES, {
          tenantId,
          consecutivo,
          facturaProveedor: fac || null,
          proveedorId,
          proveedorNombre: nombreProv,
          fecha: (/* @__PURE__ */ new Date()).toISOString(),
          total,
          condicionPago: condicion === "CREDITO" ? "Cr\xE9dito" : "Contado",
          condicionDetalle: PURCHASE_TERMS[condicion],
          estado: "RECIBIDA",
          bodegaId: bodegaId || null,
          items: items.map((i) => ({ productoId: i.productoId, nombre: i.nombre, cantidad: Number(i.cantidad), costoUnitario: Number(i.costoUnitario) })),
          registradoPorId: Session.userId(),
          registradoPorNombre: Session.userName()
        });
        for (const it of compra.items) {
          await KardexService.applyMovement(tx, {
            tenantId,
            productoId: it.productoId,
            bodegaId,
            documentoTipo: "COMPRA",
            documentoNumero: consecutivo,
            cantidad: it.cantidad,
            costoUnitario: it.costoUnitario,
            observacion: `Compra ${consecutivo}${fac ? " (fac. " + fac + ")" : ""} a ${nombreProv}`
          });
        }
        if (condicion === "CREDITO") {
          const cxp = await tx.put(STORES.PAYABLES_CXP, {
            tenantId,
            compraId: compra.id,
            documento: fac || consecutivo,
            proveedorId,
            proveedorNombre: nombreProv,
            tipoDocumento: "FACTURA_COMPRA",
            fechaEmision: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            fechaVencimiento: new Date(Date.now() + (Number(supp.diasCredito) || 30) * 864e5).toISOString().split("T")[0],
            valorTotal: total,
            abonos: 0,
            saldo: total,
            diasMora: 0,
            estado: "AL_DIA",
            historialPagos: []
          });
          compra.cxpId = cxp.id;
        } else if (turno) {
          const mov = await CashService.applyMovementTx(tx, {
            tenantId,
            turnoId: turno.id,
            tipo: "EGRESO",
            monto: total,
            concepto: `Compra ${consecutivo} a ${nombreProv}`,
            tercero: nombreProv,
            refTipo: "COMPRA",
            refId: compra.id
          });
          compra.movimientoCajaId = mov.id;
        }
        await tx.put(STORES.PURCHASES, compra);
        await AuditService.logTx(tx, {
          tenantId,
          modulo: "Compras",
          accion: "CREAR",
          registroId: consecutivo,
          campoModificado: PURCHASE_TERMS[condicion],
          valorNuevo: `$ ${total} - ${nombreProv}`
        });
        return compra;
      });
      if (condicion === "CONTADO_CAJA")
        EventBus.emit("cash:shiftChanged");
      return res;
    }
  };

  // js/modules/purchases.js
  init_toast();
  var PurchasesModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const [purchases, suppliers, products, warehouses] = await Promise.all([
        DB.getAll(STORES.PURCHASES, tenantId),
        DB.getAll(STORES.SUPPLIERS, tenantId),
        DB.getAll(STORES.PRODUCTS, tenantId),
        DB.getAll(STORES.WAREHOUSES, tenantId)
      ]);
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Compras & Abastecimiento</h1>
          <p>Recepci\xF3n de materias primas, insumos de empaque y actualizaci\xF3n autom\xE1tica de costos en Kardex</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-manage-suppliers">\u{1F465} Directorio Proveedores</button>
          <button class="btn btn-primary btn-sm" id="btn-new-purchase">\u{1F6CD}\uFE0F Registrar Compra</button>
        </div>
      </div>

      <div id="purchases-table-container"></div>
    `;
      new DataTable({
        containerId: "purchases-table-container",
        data: purchases,
        columns: [
          {
            key: "consecutivo",
            title: "Factura / Doc.",
            render: (val) => `<strong style="color: var(--brand-primary);">${esc(val)}</strong>`
          },
          {
            key: "proveedorNombre",
            title: "Proveedor",
            render: (val) => `<strong>${esc(val || "Proveedor General")}</strong>`
          },
          {
            key: "fecha",
            title: "Fecha Emisi\xF3n",
            render: (val) => Formatters.date(val)
          },
          {
            key: "total",
            title: "Valor Total",
            render: (val) => `<strong>${Formatters.currency(val)}</strong>`
          },
          {
            key: "condicionPago",
            title: "Condici\xF3n",
            render: (val) => `<span class="badge ${val === "Cr\xE9dito" ? "badge-warning" : "badge-success"}">${esc(val || "Contado")}</span>`
          },
          {
            key: "estado",
            title: "Estado Recepci\xF3n",
            render: (val) => `<span class="badge badge-success">${esc(val || "RECIBIDA")}</span>`
          }
        ]
      });
      container.querySelector("#btn-new-purchase").addEventListener("click", () => {
        this.openPurchaseModal(tenantId, suppliers, products, warehouses, () => this.render(container));
      });
      container.querySelector("#btn-manage-suppliers").addEventListener("click", () => {
        this.openSuppliersModal(tenantId, suppliers, () => this.render(container));
      });
    },
    openPurchaseModal(tenantId, suppliers, products, warehouses, onSaved) {
      let purchaseItems = [];
      const content = `
      <form id="purchase-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Proveedor</label>
            <select class="form-select" id="purch-supplier" name="proveedorId" required>
              ${suppliers.map((s) => `<option value="${s.id}">${esc(s.razonSocial)} (NIT: ${esc(s.nitCc)}-${s.dv || 0})</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">No. factura o remisi\xF3n del proveedor</label>
            <input type="text" class="form-control" name="consecutivo" placeholder="Ej: FE-12345 (recomendado)">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Bodega Destino de Almacenamiento</label>
            <select class="form-select" name="bodegaDestinoId">
              ${warehouses.map((w) => `<option value="${w.id}">${esc(w.nombre)}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Forma de Pago</label>
            <select class="form-select" name="condicionPago" id="purch-payment-term">
              ${Object.entries(PURCHASE_TERMS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}
            </select>
          </div>
        </div>

        <!-- AGREGAR \xCDTEMS A LA COMPRA -->
        <div class="card mb-3" style="border: 1px solid var(--border-color);">
          <div class="card-header" style="padding: 10px 14px;">
            <div class="card-title" style="font-size: 13px;">\u{1F4E6} \xCDtems Comprados / Materias Primas</div>
          </div>
          <div class="card-body" style="padding: 12px;">
            <div class="form-row mb-2">
              <div class="form-group mb-0" style="flex: 2;">
                <select class="form-select" id="purch-item-prod">
                  ${products.map((p) => `<option value="${p.id}" data-cost="${p.costoPromedio}">${esc(p.nombre)} (${esc(p.unidadMedida)})</option>`).join("")}
                </select>
              </div>
              <div class="form-group mb-0">
                <input type="number" step="any" min="0.1" class="form-control" id="purch-item-qty" placeholder="Cantidad" value="10">
              </div>
              <div class="form-group mb-0">
                <input type="number" step="any" min="0" class="form-control" id="purch-item-cost" placeholder="Costo unit. (sin IVA)">
              </div>
              <div class="form-group mb-0">
                <button type="button" class="btn btn-secondary" id="btn-add-purch-item">\u2795 A\xF1adir</button>
              </div>
            </div>

            <div class="table-responsive">
              <table class="data-table" style="font-size: 11px;">
                <thead>
                  <tr>
                    <th>\xCDtem</th>
                    <th class="text-center">Cantidad</th>
                    <th class="text-right">Costo Unit.</th>
                    <th class="text-right">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody id="purch-items-tbody">
                  <tr><td colspan="5" class="text-center text-muted" style="padding: 12px;">Sin \xEDtems agregados.</td></tr>
                </tbody>
              </table>
            </div>
            <div class="d-flex justify-between items-center text-xs mt-2" style="border-top: 1px solid #cbd5e1; padding-top: 6px;">
              <span class="font-bold">TOTAL COMPRA:</span>
              <strong id="purch-total-lbl" style="font-size: 15px; color: var(--brand-primary);">$ 0</strong>
            </div>
          </div>
        </div>
      </form>
    `;
      const dialog = Modal.show({
        title: "Registrar Entrada de Mercanc\xEDa / Compra",
        content,
        size: "lg",
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: "Ingresar Compra a Kardex",
            class: "btn-primary",
            onClick: async (dlg, ev) => {
              const form = dialog.querySelector("#purchase-form");
              const fd = new FormData(form);
              ev.target.disabled = true;
              try {
                const compra = await PurchaseService.registerPurchase({
                  tenantId,
                  proveedorId: fd.get("proveedorId"),
                  facturaProveedor: fd.get("consecutivo"),
                  bodegaId: fd.get("bodegaDestinoId"),
                  condicion: fd.get("condicionPago"),
                  items: purchaseItems
                });
                Toast.success(`Compra ${compra.consecutivo} registrada. Inventario y costos actualizados.`);
                Modal.close();
                if (onSaved)
                  onSaved();
              } catch (err) {
                Toast.error(err.message);
                ev.target.disabled = false;
              }
            }
          }
        ]
      });
      const updatePurchTable = () => {
        const tbody = dialog.querySelector("#purch-items-tbody");
        const totalLbl = dialog.querySelector("#purch-total-lbl");
        if (purchaseItems.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 12px;">Sin \xEDtems agregados.</td></tr>`;
          totalLbl.textContent = "$ 0";
          return;
        }
        let total = 0;
        tbody.innerHTML = purchaseItems.map((it, idx) => {
          const sub = it.cantidad * it.costoUnitario;
          total += sub;
          return `
          <tr>
            <td><strong>${esc(it.nombre)}</strong></td>
            <td class="text-center">${it.cantidad}</td>
            <td class="text-right">${Formatters.currency(it.costoUnitario)}</td>
            <td class="text-right"><strong>${Formatters.currency(sub)}</strong></td>
            <td class="text-right"><button type="button" class="btn btn-danger btn-sm purch-del-item" data-idx="${idx}">&times;</button></td>
          </tr>
        `;
        }).join("");
        totalLbl.textContent = Formatters.currency(total);
      };
      const prodSelect = dialog.querySelector("#purch-item-prod");
      const costInput = dialog.querySelector("#purch-item-cost");
      const setCostFromSelect = () => {
        const selected = prodSelect.options[prodSelect.selectedIndex];
        costInput.value = selected.getAttribute("data-cost") || 0;
      };
      prodSelect.addEventListener("change", setCostFromSelect);
      setCostFromSelect();
      dialog.querySelector("#btn-add-purch-item").addEventListener("click", () => {
        const pId = prodSelect.value;
        const prod = products.find((p) => p.id === pId);
        const qty = Number(dialog.querySelector("#purch-item-qty").value);
        const cost = Number(costInput.value);
        if (!prod)
          return;
        if (!(qty > 0)) {
          Toast.warning("La cantidad debe ser mayor a cero.");
          return;
        }
        if (!(cost >= 0) || costInput.value === "") {
          Toast.warning("Indique el costo unitario.");
          return;
        }
        purchaseItems.push({
          productoId: pId,
          nombre: prod.nombre,
          cantidad: qty,
          costoUnitario: cost
        });
        updatePurchTable();
      });
      dialog.querySelector("#purch-items-tbody").addEventListener("click", (e) => {
        if (e.target.classList.contains("purch-del-item")) {
          const idx = Number(e.target.getAttribute("data-idx"));
          purchaseItems.splice(idx, 1);
          updatePurchTable();
        }
      });
    },
    openSuppliersModal(tenantId, suppliers, onUpdated) {
      const content = `
      <div class="d-flex justify-between items-center mb-3">
        <h4 class="text-sm font-bold">Directorio de Proveedores Comerciales</h4>
        <button class="btn btn-primary btn-sm" id="btn-add-supplier-inner">\u2795 Nuevo Proveedor</button>
      </div>
      <div class="table-responsive">
        <table class="data-table" style="font-size: 12px;">
          <thead>
            <tr>
              <th>Raz\xF3n Social</th>
              <th>NIT</th>
              <th>Contacto</th>
              <th>D\xEDas Cr\xE9dito</th>
              <th>Categor\xEDa</th>
            </tr>
          </thead>
          <tbody>
            ${suppliers.map((s) => `
              <tr>
                <td><strong>${esc(s.razonSocial)}</strong></td>
                <td>${esc(s.nitCc)}-${s.dv || 0}</td>
                <td>${esc(s.contacto || "-")} (${esc(s.telefono || "-")})</td>
                <td>${s.diasCredito || 0} d\xEDas</td>
                <td><span class="badge badge-neutral">${esc(s.categoria || "Insumos")}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
      const suppDialog = Modal.show({
        title: "Gesti\xF3n de Proveedores",
        content,
        size: "lg",
        footerButtons: [{ label: "Cerrar", class: "btn-secondary", onClick: () => Modal.close() }]
      });
      const btnAddInner = suppDialog.querySelector("#btn-add-supplier-inner");
      if (btnAddInner) {
        btnAddInner.addEventListener("click", () => {
          this.openAddSupplierForm(tenantId, async () => {
            const updatedSuppliers = await DB.getAll(STORES.SUPPLIERS, tenantId);
            Modal.close();
            this.openSuppliersModal(tenantId, updatedSuppliers, onUpdated);
            if (onUpdated)
              onUpdated();
          });
        });
      }
    },
    openAddSupplierForm(tenantId, onSaved) {
      const content = `
      <form id="new-supplier-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Raz\xF3n Social / Nombre *</label>
            <input type="text" class="form-control" name="razonSocial" required placeholder="Ej: Distribuidora Qu\xEDmica S.A.S">
          </div>
          <div class="form-group">
            <label class="form-label">NIT / C\xE9dula</label>
            <input type="text" class="form-control" name="nitCc" placeholder="Ej: 900123456">
          </div>
        </div>
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Persona de Contacto</label>
            <input type="text" class="form-control" name="contacto" placeholder="Ej: Mar\xEDa Gonz\xE1lez">
          </div>
          <div class="form-group">
            <label class="form-label">Tel\xE9fono / WhatsApp</label>
            <input type="text" class="form-control" name="telefono" placeholder="3001234567">
          </div>
        </div>
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" name="email" placeholder="proveedor@empresa.com">
          </div>
          <div class="form-group">
            <label class="form-label">Ciudad</label>
            <input type="text" class="form-control" name="ciudad" value="Medell\xEDn">
          </div>
        </div>
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Categor\xEDa de Insumos</label>
            <select class="form-select" name="categoria">
              <option value="Insumos Qu\xEDmicos">Insumos Qu\xEDmicos</option>
              <option value="Empaque y Envases">Empaque y Envases</option>
              <option value="Materias Primas">Materias Primas</option>
              <option value="Servicios">Servicios</option>
              <option value="Log\xEDstica">Log\xEDstica</option>
              <option value="Otros">Otros</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">D\xEDas de Cr\xE9dito</label>
            <input type="number" class="form-control" name="diasCredito" value="30" min="0">
          </div>
        </div>
      </form>
    `;
      const dialog = Modal.show({
        title: "\u2795 Nuevo Proveedor",
        content,
        size: "md",
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: "Guardar Proveedor",
            class: "btn-primary",
            onClick: async () => {
              const form = dialog.querySelector("#new-supplier-form");
              if (!form.checkValidity()) {
                form.reportValidity();
                return;
              }
              const fd = new FormData(form);
              const payload = {
                tenantId,
                razonSocial: fd.get("razonSocial"),
                nitCc: fd.get("nitCc") || "0",
                dv: "0",
                contacto: fd.get("contacto"),
                telefono: fd.get("telefono"),
                email: fd.get("email"),
                ciudad: fd.get("ciudad"),
                categoria: fd.get("categoria"),
                diasCredito: Number(fd.get("diasCredito")) || 30,
                estado: "ACTIVO",
                creadoEn: (/* @__PURE__ */ new Date()).toISOString()
              };
              await DB.add(STORES.SUPPLIERS, payload);
              Toast.success(`Proveedor "${payload.razonSocial}" registrado.`);
              Modal.close();
              if (onSaved)
                onSaved();
            }
          }
        ]
      });
    }
  };

  // js/modules/sales-pos.js
  init_formatters();
  init_export_service();
  init_toast();
  var MOSTRADOR_NIT = "222222222222";
  var SalesPosModule = {
    cart: [],
    selectedClientId: null,
    selectedPriceListId: null,
    selectedFreelancerId: null,
    currentReceipt: null,
    processing: false,
    _keysBound: false,
    _ctx: null,
    canAnnul() {
      const u = AuthServiceInstance.getCurrentUser();
      return AuthServiceInstance.isDeveloper() || u && u.rol === ROLES.GERENTE || AuthServiceInstance.hasPermission(PERMISSIONS.AUTORIZAR);
    },
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant.id;
      const [allProducts, clients, priceLists, currentShift, suppliers] = await Promise.all([
        DB.getAll(STORES.PRODUCTS, tenantId),
        DB.getAll(STORES.CUSTOMERS, tenantId),
        DB.getAll(STORES.PRICE_LISTS, tenantId),
        CashService.getCurrentShift(tenantId),
        DB.getAll(STORES.SUPPLIERS, tenantId)
      ]);
      priceLists.sort((a, b) => (a.orden || 0) - (b.orden || 0));
      const freelancers = suppliers.filter((s) => s.tipo === "FREELANCER" && s.estado === "ACTIVO");
      const products = allProducts.filter((p) => (p.tipoItem === "PRODUCTO_TERMINADO" || !p.tipoItem) && p.estado !== "INACTIVO");
      if (this._ctx && this._ctx.tenantId !== tenantId) {
        this.cart = [];
        this.selectedClientId = null;
        this.selectedPriceListId = null;
        this.selectedFreelancerId = null;
      }
      if (!this.selectedClientId || !clients.find((c) => c.id === this.selectedClientId)) {
        const mostrador = clients.find((c) => c.nitCc === MOSTRADOR_NIT);
        this.selectedClientId = mostrador ? mostrador.id : clients[0] ? clients[0].id : null;
        this.applyClientDefaults(clients, priceLists, freelancers);
      }
      if (!this.selectedPriceListId || !priceLists.find((pl) => pl.id === this.selectedPriceListId)) {
        this.selectedPriceListId = (PricingService.defaultList(priceLists) || {}).id || null;
      }
      this._ctx = { tenantId, tenant, products, clients, priceLists, freelancers, currentShift, container };
      const shiftSales = currentShift ? ["totalVentasEfectivo", "totalVentasTransferencia", "totalVentasNequiDaviplata", "totalVentasTarjeta"].reduce((a, k) => a + Number(currentShift[k] || 0), 0) : 0;
      container.innerHTML = `
      <div class="pos-kpi-bar">
        <div class="pos-kpi-card">
          <div class="pos-kpi-title">Ventas del turno</div>
          <div class="pos-kpi-amount" style="color: var(--text-main);">${Formatters.currency(shiftSales)}</div>
          <div class="text-xs" style="color: var(--text-secondary);">${currentShift ? `\u{1F7E2} Turno de ${esc(currentShift.usuarioNombre || "-")}` : "\u{1F534} Caja cerrada"}</div>
        </div>
        <div class="pos-kpi-card">
          <div class="pos-kpi-title">Efectivo esperado en caja</div>
          <div class="pos-kpi-amount text-financial">${Formatters.currency(currentShift ? currentShift.saldoEsperado : 0)}</div>
          <div class="text-xs" style="color: var(--text-secondary);">Base + ventas en efectivo + movimientos</div>
        </div>
        <div class="pos-kpi-card" style="cursor: pointer;" id="pos-open-history" title="Ver historial de ventas">
          <div class="pos-kpi-title">Historial de ventas</div>
          <div class="pos-kpi-amount" style="color: var(--brand-primary); font-size: 18px;">\u{1F4DC} Abrir</div>
          <div class="text-xs" style="color: var(--text-secondary);">Reimprimir, comprobantes, anular</div>
        </div>
      </div>

      ${currentShift ? "" : `
        <div class="alert alert-warning mb-3" style="font-size: 12.5px;">
          \u26A0\uFE0F No hay turno de caja abierto. Solo puede registrar <strong>cotizaciones</strong> y <strong>ventas a cr\xE9dito</strong>.
          <a href="#cash" style="font-weight: 700; margin-left: 6px;">Abrir caja \u2192</a>
        </div>`}

      <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px;" class="pos-layout">
        <div class="d-flex flex-col gap-3">
          <div class="card" style="margin-bottom: 0;">
            <div class="card-body" style="padding: 14px 16px;">
              <div class="form-row">
                <div class="form-group mb-0" style="flex: 2;">
                  <label class="form-label text-xs font-bold">BUSCAR PRODUCTO (SKU / C\xD3DIGO / NOMBRE) \u2014 F2</label>
                  <input type="text" id="pos-search-product" class="form-control" placeholder="Escriba o escanee y presione Enter..." autocomplete="off">
                </div>
                <div class="form-group mb-0">
                  <label class="form-label text-xs font-bold">LISTA DE PRECIOS</label>
                  <select class="form-select" id="pos-select-pricelist">
                    ${priceLists.map((pl) => `<option value="${esc(pl.id)}" ${pl.id === this.selectedPriceListId ? "selected" : ""}>${esc(pl.nombre)}${pl.incluyeIva ? " (IVA incl.)" : ""}</option>`).join("")}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div class="card" style="margin-bottom: 0; flex: 1;">
            <div class="card-header" style="padding: 10px 16px;">
              <div class="card-title" style="font-size: 13px;">\u26A1 Cat\xE1logo (${products.length})</div>
            </div>
            <div class="card-body" style="padding: 10px 12px;">
              <div id="pos-product-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; max-height: 420px; overflow-y: auto;"></div>
            </div>
          </div>
        </div>

        <div class="card d-flex flex-col" style="margin-bottom: 0;">
          <div class="card-header" style="padding: 10px 14px;">
            <div style="width: 100%;">
              <div class="d-flex justify-between items-center mb-1">
                <div class="card-title" style="font-size: 13px;">\u{1F6D2} Detalle de la venta</div>
                <div class="d-flex gap-1">
                  <button type="button" class="btn btn-secondary btn-sm" id="btn-clear-cart" style="padding: 2px 8px; font-size: 11px;">\u{1F5D1}\uFE0F Limpiar</button>
                  <button type="button" class="btn btn-secondary btn-sm" id="btn-pos-add-client" style="padding: 2px 8px; font-size: 11px;">+ Cliente</button>
                </div>
              </div>
              <select class="form-select mb-1" id="pos-select-client" style="font-size: 12px; font-weight: 700; padding: 4px 8px;">
                ${clients.map((c) => `<option value="${esc(c.id)}" ${c.id === this.selectedClientId ? "selected" : ""}>${esc(c.nombre)} (${esc(c.tipoCliente || "-")}) \xB7 Saldo ${Formatters.currency(c.saldoPendiente || 0)}</option>`).join("")}
              </select>
              <div class="d-flex justify-between items-center text-xs text-muted" style="font-size: 10.5px;">
                <span id="pos-client-credit"></span>
                <span id="pos-iva-status" class="badge badge-success"></span>
              </div>
            </div>
          </div>

          <div class="card-body p-0" style="flex: 1; max-height: 280px; overflow-y: auto;">
            <table class="table table-sm text-xs">
              <thead>
                <tr>
                  <th>\xCDtem</th>
                  <th class="text-center" style="width: 60px;">Cant</th>
                  <th class="text-right" style="width: 150px;">Precio</th>
                  <th class="text-right" style="width: 85px;">Total</th>
                  <th style="width: 30px;"></th>
                </tr>
              </thead>
              <tbody id="pos-cart-tbody"></tbody>
            </table>
          </div>

          <div class="card-footer" style="padding: 12px 14px;">
            <div class="d-flex justify-between text-xs mb-1"><span>Base (antes de IVA):</span><strong id="pos-lbl-subtotal">$ 0</strong></div>
            <div class="d-flex justify-between text-xs mb-1"><span>IVA:</span><span id="pos-lbl-iva">$ 0</span></div>
            <div class="d-flex justify-between mb-2" style="font-size: 16px; font-weight: 800; color: var(--brand-primary); border-top: 1px dashed var(--border-color); padding-top: 4px;">
              <span>TOTAL:</span><span id="pos-lbl-total">$ 0</span>
            </div>

            <div class="form-group mb-2">
              <label class="form-label text-xs font-bold">TIPO DE DOCUMENTO</label>
              <select class="form-select" id="pos-doc-type" style="padding: 4px 8px; font-size: 11.5px; font-weight: 700;">
                ${Object.entries(DOC_TYPES).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join("")}
              </select>
            </div>

            <div class="form-row mb-2" id="pos-payment-row">
              <div class="form-group mb-0" style="flex: 1.2;">
                <label class="form-label text-xs font-bold">M\xC9TODO DE PAGO</label>
                <select class="form-select" id="pos-payment-method" style="padding: 4px 8px; font-size: 11.5px;">
                  <option value="Efectivo">\u{1F4B5} Efectivo</option>
                  <option value="Nequi">\u{1F4F1} Nequi</option>
                  <option value="Daviplata">\u{1F4F1} Daviplata</option>
                  <option value="Transferencia">\u{1F3E6} Transferencia</option>
                  <option value="Tarjeta">\u{1F4B3} Tarjeta</option>
                </select>
              </div>
              <div class="form-group mb-0" id="pos-received-wrap">
                <label class="form-label text-xs font-bold">Recibido ($)</label>
                <input type="number" min="0" step="100" class="form-control" id="pos-inp-received" placeholder="= total" style="padding: 4px 8px; font-size: 11.5px;">
              </div>
            </div>
            <div class="d-flex justify-between items-center text-xs mb-2" id="pos-change-row" style="padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-color);">
              <span>Cambio:</span><strong class="text-success" id="pos-lbl-change">$ 0</strong>
            </div>

            <div id="pos-attachment-row" style="display: none; padding: 8px 10px; border-radius: 8px; border: 1px dashed var(--brand-primary); margin-bottom: 8px;">
              <div class="d-flex justify-between items-center mb-1">
                <span class="text-xs font-bold" style="color: var(--brand-primary);">\u{1F4F8} Comprobante de pago (opcional)</span>
              </div>
              <div class="d-flex gap-2 mb-1">
                <button type="button" class="btn btn-secondary btn-sm" id="pos-btn-upload-file" style="flex: 1; font-size: 11px;">\u{1F4C1} Subir imagen</button>
                <button type="button" class="btn btn-primary btn-sm" id="pos-btn-open-cam" style="flex: 1; font-size: 11px;">\u{1F4F7} Tomar foto</button>
                <input type="file" id="pos-inp-receipt-file" accept="image/*" style="display: none;">
              </div>
              <div id="pos-receipt-preview" style="display: none; align-items: center; justify-content: space-between; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-color); margin-top: 4px;">
                <div class="d-flex items-center gap-2">
                  <img id="pos-img-receipt-thumb" alt="Comprobante" style="width: 38px; height: 38px; object-fit: cover; border-radius: 4px; cursor: pointer;">
                  <span class="text-xs font-bold text-success">\u2713 Comprobante listo</span>
                </div>
                <button type="button" class="btn btn-danger btn-sm" id="pos-btn-remove-receipt" style="padding: 2px 6px; font-size: 11px;">\u{1F5D1}\uFE0F</button>
              </div>
            </div>

            <div class="form-group mb-2">
              <label class="form-label text-xs font-bold">\u{1F91D} VENDEDOR FREELANCE</label>
              <select class="form-select" id="pos-select-freelancer" style="font-size: 11.5px; padding: 4px 8px; font-weight: 700;">
                <option value="">\u2014 Venta directa (sin vendedor freelance) \u2014</option>
                ${freelancers.map((fl) => {
        const baseId = PricingService.freelanceBaseListId(priceLists, fl);
        const base = priceLists.find((pl) => pl.id === baseId);
        return `<option value="${esc(fl.id)}" ${fl.id === this.selectedFreelancerId ? "selected" : ""}>${esc(fl.nombre)} (${esc(fl.zona || "Freelance")}) \xB7 base ${esc(PricingService.codeOf(base) || "-")}</option>`;
      }).join("")}
              </select>
            </div>

            <div id="pos-comision-panel" style="display: none; background: rgba(79, 197, 138, 0.12); border: 1.5px solid #4FC58A; border-radius: 10px; padding: 8px 12px; margin-bottom: 10px;">
              <div class="d-flex justify-between items-center">
                <div class="font-bold text-xs" style="color: #2f9e6a;">\u{1F4B0} Comisi\xF3n del vendedor</div>
                <strong id="pos-lbl-comision" style="font-size: 18px; color: #2f9e6a;">$ 0</strong>
              </div>
              <div id="pos-comision-detalle" class="text-xs text-muted" style="margin-top: 4px;"></div>
            </div>

            <label class="d-flex items-center gap-2 text-xs mb-2" id="pos-shipping-wrap">
              <input type="checkbox" id="pos-chk-shipping"> Crear orden de despacho / r\xF3tulo de env\xEDo
            </label>

            <button class="btn btn-primary w-100" id="btn-process-sale" style="padding: 9px; font-size: 14px; font-weight: 700;">\u26A1 REGISTRAR (F4)</button>
          </div>
        </div>
      </div>
    `;
      this.bindEvents(container);
      this.renderProductGrid("");
      this.refreshClientInfo();
      this.updateDocTypeUI();
      this.bindKeys();
    },
    // ------------------------------------------------------------------ helpers de estado
    client() {
      return this._ctx ? this._ctx.clients.find((c) => c.id === this.selectedClientId) || null : null;
    },
    freelancer() {
      return this._ctx ? this._ctx.freelancers.find((f) => f.id === this.selectedFreelancerId) || null : null;
    },
    applyClientDefaults(clients, priceLists, freelancers) {
      const cli = clients.find((c) => c.id === this.selectedClientId);
      const listId = cli ? PricingService.resolveListId(priceLists, cli.listaPreciosId) : null;
      this.selectedPriceListId = listId || (PricingService.defaultList(priceLists) || {}).id || null;
      const fl = cli && cli.vendedorFreelanceId ? freelancers.find((f) => f.id === cli.vendedorFreelanceId) : null;
      this.selectedFreelancerId = fl ? fl.id : null;
    },
    /** Precio de un producto para el cliente/lista actuales. 0 = sin precio configurado. */
    priceFor(prod) {
      const cli = this.client();
      const esp = cli && cli.preciosEspeciales ? Number(cli.preciosEspeciales[prod.id]) : 0;
      if (esp > 0)
        return { price: esp, special: true };
      return { price: PricingService.priceFor(prod, this.selectedPriceListId), special: false };
    },
    repriceCart() {
      const { products } = this._ctx;
      this.cart.forEach((item) => {
        const prod = products.find((p) => p.id === item.productoId);
        if (!prod)
          return;
        const { price, special } = this.priceFor(prod);
        if (price > 0) {
          item.precioUnitario = price;
          item.precioEspecial = special;
        }
      });
    },
    // ------------------------------------------------------------------ catálogo
    renderProductGrid(query) {
      const { products, container } = this._ctx;
      const grid = container.querySelector("#pos-product-grid");
      const q = String(query || "").toLowerCase().trim();
      const list = q ? products.filter((p) => String(p.nombre).toLowerCase().includes(q) || String(p.sku || "").toLowerCase().includes(q) || String(p.codigoBarras || "").includes(q)) : products;
      grid.innerHTML = list.length ? list.map((p) => {
        const { price } = this.priceFor(p);
        const ok = Number(p.stock) > 0;
        return `
        <div class="pos-product-card card" data-product-id="${esc(p.id)}" style="cursor: ${ok ? "pointer" : "not-allowed"}; margin-bottom: 0; padding: 8px 10px; ${ok ? "" : "opacity: 0.55;"}">
          <div class="text-xs font-bold" style="color: var(--brand-primary); font-size: 11px;">${esc(p.sku || "-")}</div>
          <div class="font-bold text-xs" style="margin: 2px 0; line-height: 1.2; height: 26px; overflow: hidden; font-size: 11.5px; color: var(--text-main);">${esc(p.nombre)}</div>
          <div class="d-flex justify-between items-center mt-1">
            <span class="text-xs font-bold" style="color: ${price > 0 ? "var(--text-main)" : "var(--color-danger)"};">${price > 0 ? Formatters.currency(price) : "Sin precio"}</span>
            <span class="badge ${ok ? "badge-success" : "badge-danger"}" style="font-size: 9.5px; padding: 1px 5px;">${esc(p.stock)} un</span>
          </div>
        </div>`;
      }).join("") : '<div class="text-xs text-muted" style="padding: 16px;">Sin coincidencias.</div>';
    },
    addProductToCart(prodId) {
      const prod = this._ctx.products.find((p) => p.id === prodId);
      if (!prod)
        return;
      const isQuote = this._ctx.container.querySelector("#pos-doc-type").value === "COTIZACION";
      if (!isQuote && Number(prod.stock) <= 0) {
        Toast.warning(`${prod.nombre} est\xE1 agotado.`);
        return;
      }
      const { price, special } = this.priceFor(prod);
      if (!(price > 0)) {
        Toast.warning(`"${prod.nombre}" no tiene precio en la lista seleccionada. Config\xFArelo en Cat\xE1logo.`);
        return;
      }
      const existing = this.cart.find((i) => i.productoId === prod.id);
      if (existing) {
        if (!isQuote && existing.cantidad + 1 > Number(prod.stock)) {
          Toast.warning(`Solo hay ${prod.stock} unidades de ${prod.nombre}.`);
          return;
        }
        existing.cantidad += 1;
      } else {
        this.cart.push({ productoId: prod.id, sku: prod.sku, nombre: prod.nombre, precioUnitario: price, precioEspecial: special, cantidad: 1 });
      }
      this.updateCartView();
    },
    // ------------------------------------------------------------------ carrito y totales
    /** Tarifa de IVA del producto (19 % si no se definió). */
    ivaOf(productoId) {
      const p = (this._ctx.products || []).find((x) => x.id === productoId);
      const v = p && p.ivaPct !== void 0 && p.ivaPct !== null && p.ivaPct !== "" ? Number(p.ivaPct) : 19;
      return Number.isFinite(v) ? v : 19;
    },
    computeTotals() {
      const cli = this.client();
      const incl = PricingService.listIncludesIva(this._ctx.priceLists, this.selectedPriceListId);
      const items = this.cart.map((i) => ({ ...i, precioIncluyeIva: incl, ivaPct: this.ivaOf(i.productoId) }));
      return TaxService.calculateTotals(items, 0, { aplicaIva: !cli || cli.aplicaIva !== false });
    },
    updateCartView() {
      const { container, products, priceLists } = this._ctx;
      const tbody = container.querySelector("#pos-cart-tbody");
      const isQuote = container.querySelector("#pos-doc-type").value === "COTIZACION";
      const incl = PricingService.listIncludesIva(priceLists, this.selectedPriceListId);
      if (this.cart.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding: 24px;">Carrito vac\xEDo. Seleccione productos.</td></tr>';
      } else {
        tbody.innerHTML = this.cart.map((item, idx) => {
          const prod = products.find((p) => p.id === item.productoId) || {};
          const netUnit2 = incl ? item.precioUnitario / (1 + this.ivaOf(item.productoId) / 100) : item.precioUnitario;
          const bajoCosto = Number(prod.costoPromedio || 0) > 0 && netUnit2 < Number(prod.costoPromedio);
          const sinStock = !isQuote && item.cantidad > Number(prod.stock || 0);
          return `
          <tr>
            <td style="vertical-align: middle;">
              <div class="font-bold" style="font-size: 11.5px; line-height: 1.2;">${esc(item.nombre)}</div>
              <div class="text-xs text-muted" style="font-size: 10px;">
                ${esc(item.sku)} \xB7 stock ${esc(prod.stock)}
                ${item.precioEspecial ? '<span class="badge badge-info" style="font-size: 9px;">precio acordado</span>' : ""}
                ${bajoCosto ? '<span class="badge badge-danger" style="font-size: 9px;">bajo costo</span>' : ""}
                ${sinStock ? '<span class="badge badge-danger" style="font-size: 9px;">excede stock</span>' : ""}
              </div>
            </td>
            <td class="text-center" style="vertical-align: middle;">
              <input type="number" min="1" step="1" class="form-control pos-item-qty" data-idx="${idx}" value="${esc(item.cantidad)}" style="width: 52px; padding: 2px 4px; text-align: center; font-size: 11.5px; font-weight: 700;">
            </td>
            <td class="text-right" style="vertical-align: middle;">
              <div style="display: inline-flex; align-items: center; gap: 2px;">
                <button type="button" class="btn btn-secondary btn-sm pos-price-step" data-idx="${idx}" data-step="-100" title="- $100" style="padding: 1px 5px; font-size: 10px; font-weight: 800;">\u2212</button>
                <input type="number" min="0" step="100" class="form-control pos-item-price-input" data-idx="${idx}" value="${esc(item.precioUnitario)}" style="width: 82px; padding: 2px 3px; text-align: right; font-weight: 800; font-size: 11px;">
                <button type="button" class="btn btn-secondary btn-sm pos-price-step" data-idx="${idx}" data-step="100" title="+ $100" style="padding: 1px 5px; font-size: 10px; font-weight: 800;">+</button>
              </div>
            </td>
            <td class="text-right" style="vertical-align: middle;"><strong style="font-size: 12px;">${Formatters.currency(item.cantidad * item.precioUnitario)}</strong></td>
            <td class="text-right" style="vertical-align: middle;"><button class="btn btn-danger btn-sm pos-btn-remove" data-idx="${idx}" style="padding: 2px 6px;">&times;</button></td>
          </tr>`;
        }).join("");
      }
      this.updateTotals();
    },
    updateTotals() {
      const { container } = this._ctx;
      const t = this.computeTotals();
      container.querySelector("#pos-lbl-subtotal").textContent = Formatters.currency(t.baseGravable);
      container.querySelector("#pos-lbl-iva").textContent = t.aplicaIva ? Formatters.currency(t.totalIva) : "$ 0 (cliente sin IVA)";
      container.querySelector("#pos-lbl-total").textContent = Formatters.currency(t.total);
      const recInp = container.querySelector("#pos-inp-received");
      const received = recInp.value === "" ? t.total : Number(recInp.value);
      const change = received - t.total;
      const lbl = container.querySelector("#pos-lbl-change");
      lbl.textContent = change < 0 ? `Faltan ${Formatters.currency(-change)}` : Formatters.currency(change);
      lbl.className = change < 0 ? "text-danger" : "text-success";
      this.updateCommission();
    },
    updateCommission() {
      const { container, products, priceLists } = this._ctx;
      const panel = container.querySelector("#pos-comision-panel");
      const fl = this.freelancer();
      if (!fl) {
        panel.style.display = "none";
        return;
      }
      const incl = PricingService.listIncludesIva(priceLists, this.selectedPriceListId);
      const items = this.cart.map((i) => ({ ...i, precioIncluyeIva: incl, ivaPct: this.ivaOf(i.productoId) }));
      const com = SalesService.computeCommission(items, products, priceLists, fl, incl);
      panel.style.display = "block";
      container.querySelector("#pos-lbl-comision").textContent = Formatters.currency(com.comision);
      const base = priceLists.find((pl) => pl.id === com.baseListId);
      const sinBase = com.detalle.filter((d) => d.sinPrecioBase).map((d) => d.nombre);
      container.querySelector("#pos-comision-detalle").innerHTML = `${esc(fl.nombre)} \xB7 base ${esc(PricingService.label(base))} \xB7 calculada sin IVA` + (sinBase.length ? `<br><span class="text-danger">Sin precio base: ${esc(sinBase.join(", "))}</span>` : "");
    },
    refreshClientInfo() {
      const { container } = this._ctx;
      const cli = this.client();
      const cupo = Number(cli && cli.cupoCredito || 0);
      container.querySelector("#pos-client-credit").textContent = cli ? cupo > 0 ? `Cupo disponible: ${Formatters.currency(Math.max(0, cupo - Number(cli.saldoPendiente || 0)))}` : "Sin cupo de cr\xE9dito" : "";
      const aplica = !cli || cli.aplicaIva !== false;
      const iva = container.querySelector("#pos-iva-status");
      iva.textContent = aplica ? "Con IVA" : "Sin IVA";
      iva.className = aplica ? "badge badge-success" : "badge badge-warning";
      container.querySelector("#pos-chk-shipping").checked = !!(cli && cli.nitCc !== MOSTRADOR_NIT && cli.direccion);
    },
    updateDocTypeUI() {
      const { container } = this._ctx;
      const doc = container.querySelector("#pos-doc-type").value;
      const metodo = container.querySelector("#pos-payment-method").value;
      const contado = doc === "VENTA";
      container.querySelector("#pos-payment-row").style.display = contado ? "" : "none";
      container.querySelector("#pos-change-row").style.display = contado && metodo === "Efectivo" ? "" : "none";
      container.querySelector("#pos-received-wrap").style.display = contado && metodo === "Efectivo" ? "" : "none";
      container.querySelector("#pos-attachment-row").style.display = contado && metodo !== "Efectivo" ? "block" : "none";
      container.querySelector("#pos-shipping-wrap").style.display = doc === "COTIZACION" ? "none" : "";
      const labels = { VENTA: "\u26A1 REGISTRAR VENTA (F4)", VENTA_CREDITO: "\u{1F4D1} REGISTRAR VENTA A CR\xC9DITO (F4)", COTIZACION: "\u{1F4CB} GUARDAR COTIZACI\xD3N (F4)" };
      const btn = container.querySelector("#btn-process-sale");
      btn.textContent = labels[doc];
      btn.disabled = false;
      this.updateCartView();
    },
    setReceipt(dataUrl) {
      const { container } = this._ctx;
      this.currentReceipt = dataUrl;
      const wrap = container.querySelector("#pos-receipt-preview");
      if (dataUrl) {
        container.querySelector("#pos-img-receipt-thumb").src = dataUrl;
        wrap.style.display = "flex";
      } else {
        wrap.style.display = "none";
        container.querySelector("#pos-inp-receipt-file").value = "";
      }
    },
    // ------------------------------------------------------------------ eventos
    bindEvents(container) {
      const $ = (sel) => container.querySelector(sel);
      const ctx = this._ctx;
      const search = $("#pos-search-product");
      search.addEventListener("input", () => this.renderProductGrid(search.value));
      search.addEventListener("keydown", (e) => {
        if (e.key !== "Enter")
          return;
        e.preventDefault();
        const q = search.value.trim().toLowerCase();
        if (!q)
          return;
        const exact = ctx.products.find((p) => String(p.sku || "").toLowerCase() === q || String(p.codigoBarras || "").toLowerCase() === q);
        const matches = ctx.products.filter((p) => String(p.nombre).toLowerCase().includes(q) || String(p.sku || "").toLowerCase().includes(q));
        const target = exact || (matches.length === 1 ? matches[0] : null);
        if (target) {
          this.addProductToCart(target.id);
          search.value = "";
          this.renderProductGrid("");
        } else {
          Toast.info(matches.length ? "Varias coincidencias: elija en el cat\xE1logo." : "Sin coincidencias.");
        }
      });
      $("#pos-product-grid").addEventListener("click", (e) => {
        const card = e.target.closest(".pos-product-card");
        if (card)
          this.addProductToCart(card.getAttribute("data-product-id"));
      });
      $("#pos-select-pricelist").addEventListener("change", (e) => {
        this.selectedPriceListId = e.target.value;
        this.repriceCart();
        this.renderProductGrid(search.value);
        this.updateCartView();
      });
      $("#pos-select-client").addEventListener("change", (e) => {
        this.selectedClientId = e.target.value;
        this.applyClientDefaults(ctx.clients, ctx.priceLists, ctx.freelancers);
        $("#pos-select-pricelist").value = this.selectedPriceListId;
        $("#pos-select-freelancer").value = this.selectedFreelancerId || "";
        const cli = this.client();
        if (cli && cli.preciosEspeciales && Object.keys(cli.preciosEspeciales).length) {
          Toast.info("Cliente con precios acordados: se aplican autom\xE1ticamente.");
        }
        this.repriceCart();
        this.refreshClientInfo();
        this.renderProductGrid(search.value);
        this.updateCartView();
      });
      $("#pos-select-freelancer").addEventListener("change", (e) => {
        this.selectedFreelancerId = e.target.value || null;
        const fl = this.freelancer();
        if (fl) {
          const baseId = PricingService.freelanceBaseListId(ctx.priceLists, fl);
          if (baseId) {
            this.selectedPriceListId = baseId;
            $("#pos-select-pricelist").value = baseId;
            this.repriceCart();
            this.renderProductGrid(search.value);
            Toast.info(`Precios en la lista base de ${fl.nombre}. Suba el precio de venta para ver la comisi\xF3n.`);
          }
        }
        this.updateCartView();
      });
      $("#btn-pos-add-client").addEventListener("click", () => {
        ClientsModule.openClientModal(null, ctx.tenantId, ctx.priceLists, ctx.products, ctx.freelancers, async (newClient) => {
          if (newClient) {
            this.selectedClientId = newClient.id;
            this.applyClientDefaults([newClient], ctx.priceLists, ctx.freelancers);
          }
          await this.render(container);
        });
      });
      const tbody = $("#pos-cart-tbody");
      tbody.addEventListener("change", (e) => {
        const idx = Number(e.target.getAttribute("data-idx"));
        const item = this.cart[idx];
        if (!item)
          return;
        if (e.target.classList.contains("pos-item-qty")) {
          const qty = Math.floor(Number(e.target.value));
          item.cantidad = qty >= 1 ? qty : 1;
          const prod = ctx.products.find((p) => p.id === item.productoId);
          if ($("#pos-doc-type").value !== "COTIZACION" && prod && item.cantidad > Number(prod.stock)) {
            Toast.warning(`Solo hay ${prod.stock} unidades de ${prod.nombre}.`);
            item.cantidad = Math.max(1, Number(prod.stock));
          }
          this.updateCartView();
        }
        if (e.target.classList.contains("pos-item-price-input")) {
          const price = Math.round(Number(e.target.value));
          if (price > 0) {
            item.precioUnitario = price;
            item.precioEspecial = false;
          }
          this.updateCartView();
        }
      });
      tbody.addEventListener("click", (e) => {
        const rm = e.target.closest(".pos-btn-remove");
        if (rm) {
          this.cart.splice(Number(rm.getAttribute("data-idx")), 1);
          this.updateCartView();
          return;
        }
        const step = e.target.closest(".pos-price-step");
        if (step) {
          const item = this.cart[Number(step.getAttribute("data-idx"))];
          if (!item)
            return;
          item.precioUnitario = Math.max(100, Math.round((item.precioUnitario + Number(step.getAttribute("data-step"))) / 100) * 100);
          item.precioEspecial = false;
          this.updateCartView();
        }
      });
      $("#pos-inp-received").addEventListener("input", () => this.updateTotals());
      $("#pos-doc-type").addEventListener("change", () => this.updateDocTypeUI());
      $("#pos-payment-method").addEventListener("change", () => this.updateDocTypeUI());
      $("#btn-clear-cart").addEventListener("click", () => {
        this.cart = [];
        this.setReceipt(null);
        this.updateCartView();
      });
      $("#pos-btn-upload-file").addEventListener("click", () => $("#pos-inp-receipt-file").click());
      $("#pos-inp-receipt-file").addEventListener("change", (e) => {
        const f = e.target.files[0];
        if (f)
          this.compressImage(f, (b64) => {
            this.setReceipt(b64);
            Toast.success("Comprobante adjuntado.");
          });
      });
      $("#pos-btn-open-cam").addEventListener("click", () => this.openCameraCaptureModal((b64) => this.setReceipt(b64)));
      $("#pos-btn-remove-receipt").addEventListener("click", () => this.setReceipt(null));
      $("#pos-img-receipt-thumb").addEventListener("click", () => this.showImageModal("Comprobante (venta en curso)", this.currentReceipt));
      $("#pos-open-history").addEventListener("click", () => this.openSalesHistoryModal(ctx.tenantId));
      $("#btn-process-sale").addEventListener("click", () => this.confirmAndProcess());
    },
    /** Atajos F2/F4 registrados UNA sola vez; solo actúan con el POS en pantalla y sin modales abiertos */
    bindKeys() {
      if (this._keysBound)
        return;
      this._keysBound = true;
      window.addEventListener("keydown", (e) => {
        const ctx = this._ctx;
        if (!ctx || !document.body.contains(ctx.container.querySelector("#btn-process-sale")))
          return;
        if (document.querySelector(".modal-backdrop"))
          return;
        if (e.key === "F4") {
          e.preventDefault();
          this.confirmAndProcess();
        }
        if (e.key === "F2") {
          e.preventDefault();
          const s = ctx.container.querySelector("#pos-search-product");
          if (s)
            s.focus();
        }
      });
    },
    // ------------------------------------------------------------------ registrar
    confirmAndProcess() {
      const { container } = this._ctx;
      if (this.processing)
        return;
      if (this.cart.length === 0) {
        Toast.warning("El carrito est\xE1 vac\xEDo.");
        return;
      }
      const tipoDoc = container.querySelector("#pos-doc-type").value;
      const metodoPago = tipoDoc === "VENTA" ? container.querySelector("#pos-payment-method").value : "Cr\xE9dito";
      const t = this.computeTotals();
      const cli = this.client();
      const recInp = container.querySelector("#pos-inp-received");
      if (tipoDoc === "VENTA" && metodoPago === "Efectivo" && recInp.value !== "" && Number(recInp.value) < t.total) {
        Toast.warning("El valor recibido es menor que el total.");
        return;
      }
      const docLabel = DOC_TYPES[tipoDoc].short;
      Modal.confirm({
        title: `Confirmar ${docLabel.toLowerCase()}`,
        message: `${esc(docLabel)} a <strong>${esc(cli ? cli.nombre : "Cliente Mostrador")}</strong> por <strong>${Formatters.currency(t.total)}</strong>${tipoDoc === "VENTA" ? ` (${esc(metodoPago)})` : ""}.`,
        confirmText: "S\xED, registrar",
        cancelText: "Revisar",
        onConfirm: () => this.processSale(tipoDoc, metodoPago, recInp.value === "" ? t.total : Number(recInp.value))
      });
    },
    async processSale(tipoDoc, metodoPago, pagoRecibido) {
      const { container, tenantId } = this._ctx;
      if (this.processing)
        return;
      const btn = container.querySelector("#btn-process-sale");
      this.processing = true;
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Procesando...";
      }
      try {
        const sale = await SalesService.createSale({
          tenantId,
          tipoDoc,
          cliente: this.client(),
          items: this.cart.map((i) => ({ productoId: i.productoId, nombre: i.nombre, cantidad: i.cantidad, precioUnitario: i.precioUnitario })),
          listaPreciosId: this.selectedPriceListId,
          metodoPago,
          pagoRecibido,
          freelancer: this.freelancer(),
          crearDespacho: tipoDoc !== "COTIZACION" && container.querySelector("#pos-chk-shipping").checked,
          comprobanteDataUrl: tipoDoc === "VENTA" && metodoPago !== "Efectivo" ? this.currentReceipt : null
        });
        Toast.success(`${DOC_TYPES[tipoDoc].short} ${sale.consecutivo} registrada.`);
        this.cart = [];
        this.currentReceipt = null;
        this.processing = false;
        await this.render(container);
        this.showPostSaleModal(sale);
      } catch (err) {
        console.error(err);
        Toast.error(err.message || "No se pudo registrar la venta.");
        this.processing = false;
        if (btn && document.body.contains(btn))
          this.updateDocTypeUI();
      }
    },
    async showPostSaleModal(sale) {
      const shipping = sale.despachoId ? await DB.getById(STORES.ORDERS_SHIPPING, sale.despachoId) : null;
      const invoiceHtml = PrintTemplates.saleInvoice(sale, sale.items);
      const labelHtml = shipping ? PrintTemplates.shippingBoxLabel(shipping) : "";
      const nonCash = sale.tipoDoc === "VENTA" && sale.metodoPago !== "Efectivo";
      const buttons = [];
      if (shipping)
        buttons.push({ label: "\u{1F3F7}\uFE0F Imprimir r\xF3tulo", class: "btn-secondary", onClick: () => ExportService.printDocument(labelHtml, `Rotulo_${sale.consecutivo}`) });
      buttons.push({ label: "\u{1F5A8}\uFE0F Imprimir documento", class: "btn-primary", onClick: () => ExportService.printDocument(invoiceHtml, sale.consecutivo) });
      if (nonCash && !sale.comprobanteId)
        buttons.push({ label: "\u{1F4F7} Adjuntar comprobante", class: "btn-secondary", onClick: () => this.openAttachDialog(sale) });
      buttons.push({ label: "\u2728 Nueva venta", class: "btn-secondary", onClick: () => Modal.close() });
      Modal.show({
        title: `\u2705 ${DOC_TYPES[sale.tipoDoc] ? DOC_TYPES[sale.tipoDoc].short : "Documento"} ${sale.consecutivo}`,
        size: "lg",
        content: `
        <div class="d-flex justify-between items-center mb-3" style="flex-wrap: wrap; gap: 8px;">
          <div><span class="text-xs text-muted font-bold">TOTAL:</span> <strong style="font-size: 16px; color: var(--brand-primary);">${Formatters.currency(sale.total)}</strong>
            ${sale.cambio > 0 ? `<span class="badge badge-success" style="margin-left: 6px;">Cambio ${Formatters.currency(sale.cambio)}</span>` : ""}</div>
          <div class="text-xs">Cliente: <strong>${esc(sale.clienteNombre)}</strong></div>
        </div>
        <div style="max-height: 420px; overflow-y: auto; background: #fff; color: #1e293b; padding: 14px; border-radius: 8px; border: 1px solid var(--border-color);">${invoiceHtml}</div>
      `,
        footerButtons: buttons
      });
    },
    // ------------------------------------------------------------------ historial
    async openSalesHistoryModal(tenantId) {
      const sales = (await DB.getAll(STORES.SALES, tenantId)).sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
      const canAnnul = this.canAnnul();
      const dialog = Modal.show({
        title: "\u{1F4DC} Historial de ventas y cotizaciones",
        size: "xl",
        content: `
        <div class="d-flex gap-2 mb-3" style="flex-wrap: wrap;">
          <input type="text" id="hist-q" class="form-control form-control-sm" placeholder="\u{1F50D} N\xFAmero, cliente o NIT" style="flex: 2; min-width: 200px;">
          <select id="hist-estado" class="form-select form-select-sm" style="flex: 1; min-width: 150px;">
            <option value="">Todos los estados</option>
            <option value="PAGADA">Pagadas</option>
            <option value="CREDITO_PENDIENTE">Cr\xE9dito pendiente</option>
            <option value="COTIZACION">Cotizaciones</option>
            <option value="ANULADA">Anuladas</option>
          </select>
          <select id="hist-metodo" class="form-select form-select-sm" style="flex: 1; min-width: 150px;">
            <option value="">Todos los m\xE9todos</option>
            ${["Efectivo", "Nequi", "Daviplata", "Transferencia", "Tarjeta", "Cr\xE9dito"].map((m) => `<option>${m}</option>`).join("")}
          </select>
        </div>
        <div id="hist-summary" class="text-xs text-muted mb-2"></div>
        <div class="table-responsive" style="max-height: 440px; overflow-y: auto;">
          <table class="table table-sm text-xs" style="margin-bottom: 0;">
            <thead><tr><th>N\xFAmero</th><th>Fecha</th><th>Cliente</th><th>Pago</th><th class="text-right">Total</th><th class="text-right">Acciones</th></tr></thead>
            <tbody id="hist-tbody"></tbody>
          </table>
        </div>
      `,
        footerButtons: [{ label: "Cerrar", class: "btn-secondary", onClick: () => Modal.close() }]
      });
      const q = dialog.querySelector("#hist-q");
      const est = dialog.querySelector("#hist-estado");
      const met = dialog.querySelector("#hist-metodo");
      const tbody = dialog.querySelector("#hist-tbody");
      const summary = dialog.querySelector("#hist-summary");
      const badge = (s) => {
        const map = { PAGADA: "badge-success", CREDITO_PENDIENTE: "badge-warning", COTIZACION: "badge-info", ANULADA: "badge-danger" };
        return `<span class="badge ${map[s.estado] || "badge-neutral"}" style="font-size: 9px;">${esc(s.estado)}</span>${s.requiereRevision ? ` <span class="badge badge-danger" style="font-size: 9px;" title="${esc(s.requiereRevision)}">revisar</span>` : ""}`;
      };
      const draw = () => {
        const text = q.value.toLowerCase().trim();
        const list = sales.filter((s) => (!text || [s.consecutivo, s.clienteNombre, s.clienteNit].some((v) => String(v || "").toLowerCase().includes(text))) && (!est.value || s.estado === est.value) && (!met.value || s.metodoPago === met.value));
        const efectivas = list.filter((s) => SalesService.isEffectiveSale(s));
        summary.textContent = `${list.length} documentos \xB7 Ventas efectivas: ${efectivas.length} por ${Formatters.currency(efectivas.reduce((a, s) => a + Number(s.total || 0), 0))}`;
        tbody.innerHTML = list.length ? list.map((s) => `
        <tr>
          <td><strong style="color: var(--brand-primary);">${esc(s.consecutivo)}</strong><div>${badge(s)}</div></td>
          <td>${esc(Formatters.dateTime(s.fecha))}</td>
          <td><strong>${esc(s.clienteNombre || "Mostrador")}</strong><div class="text-muted" style="font-size: 10px;">${esc(s.clienteNit || "-")}</div></td>
          <td>${esc(s.metodoPago || "-")}</td>
          <td class="text-right font-bold">${Formatters.currency(s.total || 0)}</td>
          <td class="text-right" style="white-space: nowrap;">
            <button class="btn btn-secondary btn-sm h-act" data-act="print" data-id="${esc(s.id)}" title="Imprimir">\u{1F9FE}</button>
            <button class="btn btn-secondary btn-sm h-act" data-act="detail" data-id="${esc(s.id)}" title="Detalle">\u{1F441}\uFE0F</button>
            ${s.comprobanteId || s.comprobantePagoUrl ? `<button class="btn btn-secondary btn-sm h-act" data-act="voucher" data-id="${esc(s.id)}" title="Ver comprobante">\u{1F4F8}</button>` : SalesService.isEffectiveSale(s) && s.metodoPago !== "Efectivo" && s.metodoPago !== "Cr\xE9dito" ? `<button class="btn btn-secondary btn-sm h-act" data-act="attach" data-id="${esc(s.id)}" title="Adjuntar comprobante">\u{1F4F7}</button>` : ""}
            ${s.estado === "COTIZACION" ? `<button class="btn btn-secondary btn-sm h-act" data-act="load" data-id="${esc(s.id)}" title="Cargar al carrito">\u{1F6D2}</button>` : ""}
            ${canAnnul && s.estado !== "ANULADA" ? `<button class="btn btn-danger btn-sm h-act" data-act="annul" data-id="${esc(s.id)}" title="Anular">\u26D4</button>` : ""}
          </td>
        </tr>`).join("") : '<tr><td colspan="6" class="text-center text-muted p-4">Sin resultados.</td></tr>';
      };
      q.addEventListener("input", draw);
      est.addEventListener("change", draw);
      met.addEventListener("change", draw);
      tbody.addEventListener("click", async (e) => {
        const b = e.target.closest(".h-act");
        if (!b)
          return;
        const s = sales.find((x) => x.id === b.getAttribute("data-id"));
        if (!s)
          return;
        const act = b.getAttribute("data-act");
        if (act === "print")
          ExportService.printDocument(PrintTemplates.saleInvoice(s, s.items || []), s.consecutivo);
        if (act === "detail")
          this.showSaleDetail(s);
        if (act === "voucher")
          this.showImageModal(`Comprobante ${s.consecutivo}`, await SalesService.getReceipt(s));
        if (act === "attach")
          this.openAttachDialog(s);
        if (act === "load")
          this.loadQuoteIntoCart(s);
        if (act === "annul")
          this.openAnnulDialog(s);
      });
      draw();
    },
    showSaleDetail(s) {
      Modal.show({
        title: `Detalle ${s.consecutivo}`,
        size: "md",
        content: `
        <div class="text-xs mb-3">
          <div>Cliente: <strong>${esc(s.clienteNombre)}</strong> \xB7 ${esc(Formatters.dateTime(s.fecha))}</div>
          <div>Tipo: <strong>${esc((DOC_TYPES[s.tipoDoc] || {}).label || LEGACY_DOC_LABELS[s.tipoDoc] || s.tipoDoc)}</strong> \xB7 Estado: <strong>${esc(s.estado)}</strong></div>
          <div>Atendi\xF3: ${esc(s.vendedorNombre || "-")}${s.freelancerNombre ? ` \xB7 Freelance: ${esc(s.freelancerNombre)} (comisi\xF3n ${Formatters.currency(s.comisionFreelance)})` : ""}</div>
          ${s.anulacion ? `<div class="text-danger mt-1">Anulada por ${esc(s.anulacion.usuarioNombre)} \u2014 ${esc(s.anulacion.motivo)}${s.anulacion.notaCaja ? " \xB7 " + esc(s.anulacion.notaCaja) : ""}</div>` : ""}
          ${s.requiereRevision ? `<div class="text-danger mt-1">\u26A0\uFE0F ${esc(s.requiereRevision)}</div>` : ""}
        </div>
        <table class="table table-sm text-xs mb-3">
          <thead><tr><th>Producto</th><th class="text-center">Cant</th><th class="text-right">Unitario</th><th class="text-right">Total</th></tr></thead>
          <tbody>${(s.items || []).map((i) => `<tr><td>${esc(i.nombre)} <span class="text-muted">(${esc(i.sku)})</span></td><td class="text-center">${esc(i.cantidad)}</td><td class="text-right">${Formatters.currency(i.precioUnitario)}</td><td class="text-right">${Formatters.currency(i.total !== void 0 ? i.total : i.cantidad * i.precioUnitario)}</td></tr>`).join("")}</tbody>
        </table>
        <div class="d-flex justify-between text-xs"><span>Base</span><span>${Formatters.currency(s.subtotal)}</span></div>
        <div class="d-flex justify-between text-xs"><span>IVA</span><span>${Formatters.currency(s.impuestos)}</span></div>
        <div class="d-flex justify-between font-bold" style="font-size: 14px;"><span>Total</span><span>${Formatters.currency(s.total)}</span></div>
        ${s.costoTotal ? `<div class="d-flex justify-between text-xs text-muted mt-1"><span>Costo de la mercanc\xEDa</span><span>${Formatters.currency(s.costoTotal)}</span></div>` : ""}
      `,
        footerButtons: [{ label: "Cerrar", class: "btn-secondary", onClick: () => Modal.close() }]
      });
    },
    loadQuoteIntoCart(quote) {
      const ctx = this._ctx;
      this.cart = (quote.items || []).filter((i) => ctx.products.find((p) => p.id === i.productoId)).map((i) => ({
        productoId: i.productoId,
        sku: i.sku,
        nombre: i.nombre,
        cantidad: Number(i.cantidad),
        precioUnitario: Number(i.precioUnitario),
        precioEspecial: false
      }));
      if (quote.clienteId && ctx.clients.find((c) => c.id === quote.clienteId))
        this.selectedClientId = quote.clienteId;
      if (quote.listaPreciosId && ctx.priceLists.find((pl) => pl.id === quote.listaPreciosId))
        this.selectedPriceListId = quote.listaPreciosId;
      Modal.close();
      this.render(ctx.container).then(() => Toast.success(`Cotizaci\xF3n ${quote.consecutivo} cargada. Revise existencias antes de registrar la venta.`));
    },
    openAnnulDialog(sale) {
      const dialog = Modal.show({
        title: `Anular ${sale.consecutivo}`,
        size: "sm",
        content: `
        <p class="text-xs mb-2">Se devolver\xE1 el inventario, se revertir\xE1 la caja o la cartera y se anular\xE1n la comisi\xF3n y el despacho. Queda registrado en la auditor\xEDa y no se puede deshacer.</p>
        <div class="form-group"><label class="form-label">Motivo de la anulaci\xF3n</label>
          <textarea class="form-control" id="annul-reason" rows="3" placeholder="Ej: error en cantidades, el cliente devolvi\xF3 la mercanc\xEDa..."></textarea></div>
      `,
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: "Anular documento",
            class: "btn-danger",
            onClick: async (dlg, ev) => {
              const btn = ev.target;
              btn.disabled = true;
              try {
                const res = await SalesService.annulSale(sale.id, dialog.querySelector("#annul-reason").value);
                Modal.close();
                Toast.success(`${res.consecutivo} anulada. ${res.anulacion.notaCaja || ""}`);
                await this.render(this._ctx.container);
                this.openSalesHistoryModal(this._ctx.tenantId);
              } catch (err) {
                Toast.error(err.message);
                btn.disabled = false;
              }
            }
          }
        ]
      });
    },
    openAttachDialog(sale) {
      const dialog = Modal.show({
        title: `Comprobante de pago \xB7 ${sale.consecutivo}`,
        size: "sm",
        content: `
        <div class="d-flex flex-col gap-2">
          <button type="button" class="btn btn-secondary" id="att-file">\u{1F4C1} Subir imagen</button>
          <button type="button" class="btn btn-primary" id="att-cam">\u{1F4F7} Tomar foto</button>
          <input type="file" id="att-input" accept="image/*" style="display: none;">
        </div>`,
        footerButtons: [{ label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() }]
      });
      const save = async (b64) => {
        try {
          await SalesService.attachReceipt(sale.id, b64);
          Toast.success("Comprobante guardado.");
        } catch (err) {
          Toast.error(err.message);
        }
      };
      const inp = dialog.querySelector("#att-input");
      dialog.querySelector("#att-file").addEventListener("click", () => inp.click());
      inp.addEventListener("change", (e) => {
        const f = e.target.files[0];
        if (f)
          this.compressImage(f, (b64) => {
            Modal.close();
            save(b64);
          });
      });
      dialog.querySelector("#att-cam").addEventListener("click", () => this.openCameraCaptureModal(save));
    },
    showImageModal(title, dataUrl) {
      if (!dataUrl) {
        Toast.info("No hay imagen para mostrar.");
        return;
      }
      Modal.show({
        title,
        size: "md",
        content: `<div style="text-align: center; background: #1e293b; padding: 10px; border-radius: 8px;"><img src="${esc(dataUrl)}" alt="Comprobante" style="max-width: 100%; max-height: 460px; object-fit: contain;"></div>`,
        footerButtons: [
          { label: "\u{1F5A8}\uFE0F Imprimir", class: "btn-primary", onClick: () => ExportService.printDocument(`<div style="text-align:center;"><h3>${esc(title)}</h3><img src="${esc(dataUrl)}" style="max-width: 90%;"></div>`, title) },
          { label: "Cerrar", class: "btn-secondary", onClick: () => Modal.close() }
        ]
      });
    },
    // ------------------------------------------------------------------ cámara e imágenes
    openCameraCaptureModal(onCaptured) {
      const fallback = () => {
        const inp = document.createElement("input");
        inp.type = "file";
        inp.accept = "image/*";
        inp.setAttribute("capture", "environment");
        inp.onchange = (e) => {
          const f = e.target.files[0];
          if (f)
            this.compressImage(f, onCaptured);
        };
        inp.click();
      };
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        fallback();
        return;
      }
      let stream = null;
      let facing = "environment";
      const stop = () => {
        if (stream)
          stream.getTracks().forEach((t) => t.stop());
        stream = null;
      };
      const dialog = Modal.show({
        title: "\u{1F4F7} Foto del comprobante",
        size: "md",
        content: `
        <div style="text-align: center;">
          <div style="background: #000; border-radius: 10px; overflow: hidden;"><video id="cam-video" autoplay playsinline style="width: 100%; max-height: 380px; object-fit: contain;"></video></div>
          <div class="d-flex justify-between items-center mt-3">
            <button type="button" class="btn btn-secondary btn-sm" id="cam-switch">\u{1F504} Cambiar c\xE1mara</button>
            <button type="button" class="btn btn-primary btn-sm font-bold" id="cam-snap">\u{1F4F8} Capturar</button>
          </div>
        </div>`,
        footerButtons: [{ label: "Cancelar", class: "btn-secondary", onClick: () => {
          stop();
          Modal.close();
        } }],
        onClose: stop
      });
      const video = dialog.querySelector("#cam-video");
      const start = async () => {
        try {
          stop();
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
          video.srcObject = stream;
        } catch (err) {
          Modal.close();
          Toast.warning("No se pudo abrir la c\xE1mara. Seleccione una imagen.");
          fallback();
        }
      };
      start();
      dialog.querySelector("#cam-switch").addEventListener("click", () => {
        facing = facing === "environment" ? "user" : "environment";
        start();
      });
      dialog.querySelector("#cam-snap").addEventListener("click", () => {
        if (!video.videoWidth) {
          Toast.warning("Esperando la c\xE1mara...");
          return;
        }
        const b64 = this.scaleToJpeg(video, video.videoWidth, video.videoHeight);
        stop();
        Modal.close();
        onCaptured(b64);
      });
    },
    /** Escala a máximo 1200 px y JPEG al 70 % (≈100–200 KB por imagen) */
    scaleToJpeg(source, w, h, maxDim = 1200, quality = 0.7) {
      const ratio = Math.min(1, maxDim / Math.max(w, h));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
      canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", quality);
    },
    compressImage(file, callback) {
      if (!file.type || !file.type.startsWith("image/")) {
        Toast.warning("El archivo debe ser una imagen.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => callback(this.scaleToJpeg(img, img.width, img.height));
        img.onerror = () => Toast.error("No se pudo leer la imagen.");
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // js/modules/shipping.js
  init_formatters();
  init_toast();
  init_export_service();
  var SHIPPING_STATUSES = {
    RECIBIDO: { label: "Pedido Recibido", class: "badge-info", icon: "\u{1F4E5}" },
    PREPARACION: { label: "En Preparaci\xF3n", class: "badge-warning", icon: "\u{1F4E6}" },
    EMPACADO: { label: "Empacado / Zunchado", class: "badge-warning", icon: "\u{1F3F7}\uFE0F" },
    LISTO_DESPACHO: { label: "Listo p/ Despacho", class: "badge-primary", icon: "\u{1F69A}" },
    ENVIADO: { label: "En Ruta / Transportadora", class: "badge-info", icon: "\u{1F6E3}\uFE0F" },
    ENTREGADO: { label: "Entregado a Cliente", class: "badge-success", icon: "\u2713" },
    DEVUELTO: { label: "Devuelto a Planta", class: "badge-danger", icon: "\u21A9\uFE0F" },
    CANCELADO: { label: "Cancelado", class: "badge-danger", icon: "\u2715" }
  };
  var ShippingModule = {
    printQueue: [],
    // Cola para lote de rótulos
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const [shipments, clients] = await Promise.all([
        DB.getAll(STORES.ORDERS_SHIPPING, tenantId),
        DB.getAll(STORES.CUSTOMERS, tenantId)
      ]);
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Log\xEDstica de Pedidos & Env\xEDos</h1>
          <p>Control de despacho de mercanc\xEDa, transportadoras nacionales (Servientrega, Coordinadora, Envia) y estado de entrega</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-print-batch" style="background: var(--brand-accent); color: white;" ${this.printQueue.length === 0 ? "disabled" : ""}>
            \u{1F5A8}\uFE0F Imprimir Lote (${this.printQueue.length})
          </button>
          <button class="btn btn-primary btn-sm" id="btn-new-shipping">\u{1F4E6} Registrar Nuevo Env\xEDo</button>
        </div>
      </div>

      <!-- KANBAN SUMMARY DE CICLO LOG\xCDSTICO -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px;">
        ${Object.entries(SHIPPING_STATUSES).slice(0, 6).map(([key, meta]) => {
        const count = shipments.filter((s) => s.estadoCiclo === key).length;
        return `
            <div class="card" style="margin-bottom: 0; padding: 12px; border-left: 3px solid var(--brand-primary);">
              <div class="d-flex justify-between items-center">
                <span class="text-xs font-bold text-muted">${meta.label}</span>
                <span>${meta.icon}</span>
              </div>
              <div style="font-size: 20px; font-weight: 800; margin-top: 4px;">${count}</div>
            </div>
          `;
      }).join("")}
      </div>

      <div id="shipping-table-container"></div>
    `;
      new DataTable({
        containerId: "shipping-table-container",
        data: shipments,
        columns: [
          {
            key: "numeroGuia",
            title: "Gu\xEDa / Transportadora",
            render: (val, row) => `
            <div>
              <strong style="color: var(--brand-primary);">${esc(val || "POR ASIGNAR")}</strong>
              <div class="text-xs text-muted">${esc(row.transportadora)}</div>
            </div>
          `
          },
          {
            key: "clienteNombre",
            title: "Destinatario",
            render: (val, row) => `
            <div>
              <div class="font-bold">${esc(val)}</div>
              <div class="text-xs text-muted">\u{1F4CD} ${esc(row.direccion || "-")}</div>
            </div>
          `
          },
          {
            key: "estadoCiclo",
            title: "Estado del Env\xEDo",
            render: (val) => {
              const meta = SHIPPING_STATUSES[val] || { label: val, class: "badge-neutral", icon: "" };
              return `<span class="badge ${meta.class}">${meta.icon} ${meta.label}</span>`;
            }
          },
          {
            key: "fechaDespacho",
            title: "Fecha Despacho",
            render: (val) => Formatters.date(val)
          },
          {
            key: "fechaEntregaEstimada",
            title: "Fecha Estimada",
            render: (val) => Formatters.date(val)
          },
          {
            key: "costoEnvio",
            title: "Flete / Valor",
            render: (val) => Number(val) > 0 ? Formatters.currency(val) : '<span class="text-success">Gratis / Propio</span>'
          }
        ],
        actions: (row) => `
          <button class="btn btn-primary btn-sm btn-print-label" data-id="${esc(row.id)}" title="A\xF1adir a Cola de Impresi\xF3n">\u2795 Encolar</button>
          <button class="btn btn-secondary btn-sm btn-update-ship-status" data-id="${esc(row.id)}">\u{1F504} Estado</button>
        `
      });
      container.querySelector("#btn-new-shipping").addEventListener("click", () => {
        this.openNewShippingModal(tenantId, clients, () => this.render(container));
      });
      const btnBatch = container.querySelector("#btn-print-batch");
      if (btnBatch) {
        btnBatch.addEventListener("click", () => {
          if (this.printQueue.length > 0) {
            const html = PrintTemplates.batchShippingLabels(this.printQueue);
            ExportService.printDocument(html, `Lote_Rotulos_${(/* @__PURE__ */ new Date()).getTime()}`);
            this.printQueue = [];
            this.render(container);
          }
        });
      }
      if (!this._hasBoundClick) {
        this._hasBoundClick = true;
        bindOnce(container, "shipping-click", "click", (e) => {
          const printLabelBtn = e.target.closest(".btn-print-label");
          if (printLabelBtn) {
            const id = printLabelBtn.getAttribute("data-id");
            DB.getAll(STORES.ORDERS_SHIPPING, tenantId).then((ships) => {
              const ship = ships.find((s) => s.id === id);
              if (ship && !this.printQueue.find((s) => s.id === ship.id)) {
                this.printQueue.push(ship);
                window.dispatchEvent(new CustomEvent("toast", { detail: { message: "R\xF3tulo a\xF1adido a la cola de impresi\xF3n", type: "success" } }));
                const batchBtn = container.querySelector("#btn-print-batch");
                if (batchBtn) {
                  batchBtn.removeAttribute("disabled");
                  batchBtn.innerHTML = `\u{1F5A8}\uFE0F Imprimir Lote (${this.printQueue.length})`;
                }
              } else if (ship) {
                window.dispatchEvent(new CustomEvent("toast", { detail: { message: "El r\xF3tulo ya est\xE1 en la cola", type: "info" } }));
              }
            });
            return;
          }
          const updateBtn = e.target.closest(".btn-update-ship-status");
          if (updateBtn) {
            const id = updateBtn.getAttribute("data-id");
            DB.getAll(STORES.ORDERS_SHIPPING, tenantId).then((ships) => {
              const ship = ships.find((s) => s.id === id);
              this.openUpdateStatusModal(ship, () => this.render(container));
            });
          }
        });
      }
    },
    openNewShippingModal(tenantId, clients, onSaved) {
      const content = `
      <form id="shipping-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Cliente Destinatario</label>
            <select class="form-select" name="clienteId" id="ship-client-select" required>
              ${clients.map((c) => `<option value="${c.id}" data-addr="${esc(c.direccion || "")}">${esc(c.nombre)} (${esc(c.ciudad || "")})</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Transportadora / Operador</label>
            <select class="form-select" name="transportadora">
              <option value="Servientrega Mercanc\xEDa">Servientrega</option>
              <option value="Coordinadora Mercantil">Coordinadora</option>
              <option value="Envia Colvanes">Env\xEDa</option>
              <option value="TCC Carga">TCC</option>
              <option value="Flota Propia Rayo Pro">Flota Propia Rayo Pro (Medell\xEDn/\xC1rea Metro)</option>
              <option value="Recoge en Planta Mostrador">Recoge en Planta Mostrador</option>
            </select>
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">N\xFAmero de Gu\xEDa / Consecutivo</label>
            <input type="text" class="form-control" name="numeroGuia" value="" placeholder="N\xFAmero de gu\xEDa de la transportadora (ej: 21987364501)">
          </div>
          <div class="form-group">
            <label class="form-label">Costo Flete ($ COP)</label>
            <input type="number" class="form-control" name="costoEnvio" value="0">
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Direcci\xF3n Completa de Destino</label>
          <input type="text" class="form-control" id="ship-address" name="direccion" required value="${clients[0]?.direccion || ""}">
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Fecha de Despacho</label>
            <input type="date" class="form-control" name="fechaDespacho" value="${Formatters.toInputDate()}">
          </div>
          <div class="form-group">
            <label class="form-label">Estado Inicial</label>
            <select class="form-select" name="estadoCiclo">
              <option value="PREPARACION">En Preparaci\xF3n</option>
              <option value="EMPACADO">Empacado / Listo para Despacho</option>
              <option value="ENVIADO">Despachado / En Ruta</option>
            </select>
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Observaciones para el Conductor / Bodega</label>
          <textarea class="form-control" name="observaciones" rows="2" placeholder="Estiba zunchada con cajas rotuladas con l\xEDquido fr\xE1gil"></textarea>
        </div>
      </form>
    `;
      const dialog = Modal.show({
        title: "Generar Despacho y Gu\xEDa de Transporte",
        content,
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: "Registrar Despacho",
            class: "btn-primary",
            onClick: async () => {
              const form = dialog.querySelector("#shipping-form");
              if (!form.checkValidity()) {
                form.reportValidity();
                return;
              }
              const formData = new FormData(form);
              const client = clients.find((c) => c.id === formData.get("clienteId"));
              const payload = {
                tenantId,
                clienteId: client.id,
                clienteNombre: client.nombre,
                nitCc: client.nitCc || "",
                telefono: client.telefono || client.whatsapp || "",
                whatsapp: client.whatsapp || client.telefono || "",
                email: client.email || "",
                ciudad: client.ciudad || "Medell\xEDn",
                departamento: client.departamento || "Antioquia",
                barrio: client.barrio || "",
                direccion: formData.get("direccion") || client.direccion || "",
                transportadora: formData.get("transportadora"),
                numeroGuia: formData.get("numeroGuia"),
                costoEnvio: Number(formData.get("costoEnvio") || 0),
                fechaDespacho: formData.get("fechaDespacho"),
                fechaEntregaEstimada: new Date(Date.now() + 3 * 864e5).toISOString().split("T")[0],
                estadoCiclo: formData.get("estadoCiclo"),
                responsable: Session.userName(),
                cajasTotal: 1,
                contenidoDescripcion: "Productos de mantenimiento y embellecimiento automotriz",
                observaciones: formData.get("observaciones") || "Manejar con precauci\xF3n. Productos de mantenimiento y embellecimiento automotriz."
              };
              await DB.add(STORES.ORDERS_SHIPPING, payload);
              Toast.success("Despacho registrado correctamente.");
              Modal.close();
              if (onSaved)
                onSaved();
            }
          }
        ]
      });
      dialog.querySelector("#ship-client-select").addEventListener("change", (e) => {
        const selected = e.target.options[e.target.selectedIndex];
        dialog.querySelector("#ship-address").value = selected.getAttribute("data-addr") || "";
      });
    },
    openUpdateStatusModal(ship, onUpdated) {
      const content = `
      <div class="form-group mb-3">
        <label class="form-label">Gu\xEDa de Transporte: <strong>${esc(ship.numeroGuia)}</strong> (${esc(ship.transportadora)})</label>
        <div class="text-xs text-muted mb-2">Destinatario: ${esc(ship.clienteNombre)}</div>
      </div>
      <div class="form-group mb-3">
        <label class="form-label">Seleccionar Nuevo Estado del Ciclo:</label>
        <select class="form-select" id="new-ship-status">
          ${Object.entries(SHIPPING_STATUSES).map(([key, meta]) => `
            <option value="${key}" ${ship.estadoCiclo === key ? "selected" : ""}>${meta.icon} ${meta.label}</option>
          `).join("")}
        </select>
      </div>
    `;
      const dialog = Modal.show({
        title: "Actualizar Estado Log\xEDstico",
        content,
        size: "sm",
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: "Guardar Estado",
            class: "btn-primary",
            onClick: async () => {
              const newStatus = dialog.querySelector("#new-ship-status").value;
              ship.estadoCiclo = newStatus;
              if (newStatus === "ENTREGADO") {
                ship.fechaEntregaReal = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
              }
              await DB.update(STORES.ORDERS_SHIPPING, ship);
              Toast.success(`Estado actualizado a: ${SHIPPING_STATUSES[newStatus].label}`);
              Modal.close();
              if (onUpdated)
                onUpdated();
            }
          }
        ]
      });
    }
  };

  // js/modules/cash.js
  init_formatters();
  init_toast();

  // js/services/expense-service.js
  var CASH_EXPENSE_METHOD = "Efectivo Caja Menor";
  var ExpenseService = {
    async registerExpense({ tenantId, categoria, valor, concepto, proveedor, formaPago, observacion, fecha }) {
      const monto = Number(valor);
      if (!Number.isFinite(monto) || monto <= 0)
        throw new Error("El valor del gasto debe ser mayor a cero.");
      if (!concepto || !String(concepto).trim())
        throw new Error("Indique el concepto del gasto.");
      const afectaCaja = formaPago === CASH_EXPENSE_METHOD;
      const saved = await DB.runTransaction(
        [STORES.EXPENSES, STORES.CASH_SHIFTS, STORES.CASH_MOVEMENTS, STORES.AUDIT_LOGS],
        async (tx) => {
          let turno = null;
          if (afectaCaja) {
            const shifts = await tx.getAll(STORES.CASH_SHIFTS, tenantId);
            turno = shifts.find((s) => s.estado === "ABIERTA");
            if (!turno)
              throw new Error("Para pagar con efectivo de caja menor debe haber un turno de caja abierto.");
          }
          const exp = await tx.put(STORES.EXPENSES, {
            tenantId,
            fecha: fecha || (/* @__PURE__ */ new Date()).toISOString(),
            categoria: categoria || "Gastos Varios",
            valor: monto,
            concepto: String(concepto).trim(),
            proveedor: proveedor || "",
            formaPago: formaPago || "Otro",
            responsableId: Session.userId(),
            responsableNombre: Session.userName(),
            observacion: observacion || "",
            turnoId: turno ? turno.id : null
          });
          if (turno) {
            const mov = await CashService.applyMovementTx(tx, {
              tenantId,
              turnoId: turno.id,
              tipo: "GASTO",
              monto,
              concepto: `${exp.categoria}: ${exp.concepto}`,
              tercero: proveedor,
              refTipo: "GASTO",
              refId: exp.id
            });
            exp.movimientoCajaId = mov.id;
            await tx.put(STORES.EXPENSES, exp);
          }
          await AuditService.logTx(tx, {
            tenantId,
            modulo: "Gastos",
            accion: "CREAR",
            registroId: exp.id,
            campoModificado: exp.categoria,
            valorNuevo: `$ ${monto} - ${exp.concepto} (${exp.formaPago})`
          });
          return exp;
        }
      );
      if (afectaCaja)
        EventBus.emit("cash:shiftChanged");
      return saved;
    }
  };

  // js/modules/cash.js
  init_formatters();
  var CashModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const [currentShift, allShifts, movements] = await Promise.all([
        CashService.getCurrentShift(tenantId),
        DB.getAll(STORES.CASH_SHIFTS, tenantId),
        DB.getAll(STORES.CASH_MOVEMENTS, tenantId)
      ]);
      const shiftMovements = currentShift ? movements.filter((m) => m.turnoId === currentShift.id) : [];
      container.innerHTML = `
            <div class="view-header">
        <div class="view-title-wrap">
          <h1>Control de Caja & Arqueos</h1>
          <p>Manejo de turnos, efectivo f\xEDsico, ingresos, retiros a banco y diferencias de caja</p>
        </div>
        <div class="view-actions">
          ${currentShift ? `
            <button class="btn btn-secondary btn-sm" id="btn-cash-movement">\u2795 Movimiento de Caja</button>
            <button class="btn btn-danger btn-sm" id="btn-close-shift">\u{1F512} Cerrar Turno & Arqueo</button>
          ` : `
            <button class="btn btn-primary btn-sm" id="btn-open-shift">\u{1F513} Aperturar Turno de Caja</button>
          `}
        </div>
      </div>

      ${currentShift ? `
        <!-- RESUMEN DEL TURNO ACTIVO -->
        <div class="card mb-4" style="border-top: 4px solid var(--brand-primary);">
          <div class="card-header">
            <div>
              <div class="card-title">Turno de Caja Activo</div>
              <div class="card-subtitle">Aperturado el ${Formatters.dateTime(currentShift.fechaApertura)} por <strong>${esc(currentShift.usuarioNombre || "Cajero")}</strong></div>
            </div>
            <span class="badge badge-success">\u25CF TURNO ABIERTO</span>
          </div>
          <div class="card-body">
            <div class="kpi-grid mb-3">
              <div class="kpi-card">
                <div class="kpi-label">Base Inicial Apertura</div>
                <div class="kpi-value">${Formatters.currency(currentShift.montoApertura)}</div>
                <div class="kpi-footer">Efectivo inicial en gaveta</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Ventas en Efectivo</div>
                <div class="kpi-value text-success">${Formatters.currency(currentShift.totalVentasEfectivo || 0)}</div>
                <div class="kpi-footer">+ Efectivo sumado por ventas</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Ingresos / Otros</div>
                <div class="kpi-value">${Formatters.currency(currentShift.totalIngresos || 0)}</div>
                <div class="kpi-footer">+ Entradas manuales a caja</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Gastos Menores / Egresos</div>
                <div class="kpi-value text-danger">-${Formatters.currency((currentShift.totalGastos || 0) + (currentShift.totalEgresos || 0) + (currentShift.totalRetiros || 0))}</div>
                <div class="kpi-footer">- Salidas de efectivo</div>
              </div>
            </div>

            <div class="card" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); margin-bottom: 0;">
              <div class="card-body d-flex justify-between items-center" style="padding: 14px 20px;">
                <div>
                  <div class="text-xs font-bold text-muted">SALDO ESTIMADO EN EFECTIVO (ESPERADO EN GAVETA):</div>
                  <div style="font-size: 26px; font-weight: 800; color: var(--brand-primary);">${Formatters.currency(currentShift.saldoEsperado)}</div>
                </div>
                <div class="d-flex gap-2">
                  <div class="text-xs text-muted" style="text-align: right;">
                    <div>Nequi / Daviplata: <strong>${Formatters.currency(currentShift.totalVentasNequiDaviplata || 0)}</strong></div>
                    <div>Transferencias: <strong>${Formatters.currency(currentShift.totalVentasTransferencia || 0)}</strong></div>
                    <div>Tarjetas: <strong>${Formatters.currency(currentShift.totalVentasTarjeta || 0)}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- MOVIMIENTOS DEL TURNO ACTUAL -->
        <div class="card mb-4">
          <div class="card-header">
            <div class="card-title" style="font-size: 14px;">Movimientos Manuales del Turno (${shiftMovements.length})</div>
          </div>
          <div class="card-body" style="padding: 0;">
            <div class="table-responsive">
              <table class="data-table" style="font-size: 12px;">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Tipo</th>
                    <th>Concepto</th>
                    <th>Tercero</th>
                    <th class="text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  ${shiftMovements.length > 0 ? shiftMovements.map((m) => `
                    <tr>
                      <td>${Formatters.dateTime(m.fecha)}</td>
                      <td>
                        <span class="badge ${m.tipo === "INGRESO" ? "badge-success" : "badge-danger"}">${m.tipo}</span>
                      </td>
                      <td><strong>${esc(m.concepto)}</strong></td>
                      <td>${esc(m.tercero)}</td>
                      <td class="text-right font-bold ${m.tipo === "INGRESO" ? "text-success" : "text-danger"}">
                        ${m.tipo === "INGRESO" ? "+" : "-"}${Formatters.currency(m.monto)}
                      </td>
                    </tr>
                  `).join("") : `
                    <tr><td colspan="5" class="text-center text-muted" style="padding: 20px;">No hay movimientos manuales en este turno.</td></tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ` : `
        <div class="card mb-4" style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 48px; margin-bottom: 12px;">\u{1F512}</div>
          <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 6px;">No hay turno de caja abierto</h2>
          <p class="text-muted text-sm mb-4">Para comenzar a facturar en el punto de venta (POS) y recibir pagos en efectivo, abra un nuevo turno de caja indicando la base inicial.</p>
          <div>
            <button class="btn btn-primary" id="btn-open-shift-center">\u{1F513} Aperturar Turno con Base</button>
          </div>
        </div>
      `}

      <!-- HISTORIAL DE TURNOS ANTERIORES -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">Historial de Turnos de Caja</div>
        </div>
        <div class="card-body" style="padding: 0;">
          <div class="table-responsive">
            <table class="data-table" style="font-size: 12px;">
              <thead>
                <tr>
                  <th>Fecha Apertura</th>
                  <th>Fecha Cierre</th>
                  <th>Cajero</th>
                  <th class="text-right">Base</th>
                  <th class="text-right">Efectivo Ventas</th>
                  <th class="text-right">Saldo Esperado</th>
                  <th class="text-right">Saldo Contado</th>
                  <th class="text-right">Diferencia</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${allShifts.filter((s) => s.estado === "CERRADA").length > 0 ? allShifts.filter((s) => s.estado === "CERRADA").map((s) => {
        const dif = s.diferencia || 0;
        const difColor = dif === 0 ? "text-success" : dif > 0 ? "text-success" : "text-danger";
        return `
                    <tr>
                      <td>${Formatters.dateTime(s.fechaApertura)}</td>
                      <td>${Formatters.dateTime(s.fechaCierre)}</td>
                      <td><strong>${esc(s.usuarioNombre || "Cajero")}</strong></td>
                      <td class="text-right">${Formatters.currency(s.montoApertura)}</td>
                      <td class="text-right">${Formatters.currency(s.totalVentasEfectivo)}</td>
                      <td class="text-right">${Formatters.currency(s.saldoEsperado)}</td>
                      <td class="text-right"><strong>${Formatters.currency(s.saldoContado)}</strong></td>
                      <td class="text-right font-bold ${difColor}">${dif > 0 ? "+" : ""}${Formatters.currency(dif)}</td>
                      <td><span class="badge badge-neutral">Cerrada</span></td>
                    </tr>
                  `;
      }).join("") : `
                  <tr><td colspan="9" class="text-center text-muted" style="padding: 20px;">No hay turnos cerrados en el historial.</td></tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
      const handleOpenClick = () => {
        this.openShiftModal(tenantId, () => this.render(container));
      };
      const openBtn = container.querySelector("#btn-open-shift");
      if (openBtn)
        openBtn.addEventListener("click", handleOpenClick);
      const openCenterBtn = container.querySelector("#btn-open-shift-center");
      if (openCenterBtn)
        openCenterBtn.addEventListener("click", handleOpenClick);
      const movBtn = container.querySelector("#btn-cash-movement");
      if (movBtn) {
        movBtn.addEventListener("click", () => {
          this.openMovementModal(tenantId, currentShift.id, () => this.render(container));
        });
      }
      const closeBtn = container.querySelector("#btn-close-shift");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          this.openCloseShiftModal(currentShift, () => this.render(container));
        });
      }
    },
    openShiftModal(tenantId, onComplete) {
      const content = `
      <form id="open-shift-form">
        <div class="form-group mb-3">
          <label class="form-label">Base Inicial de Apertura ($ COP)</label>
          <input type="number" class="form-control" name="montoApertura" required value="200000" placeholder="Ej: 200000">
          <div class="form-help">Monto en billetes y monedas con que se inicia la gaveta de cobro.</div>
        </div>
        <div class="form-group mb-3">
          <label class="form-label">Observaciones de Apertura</label>
          <textarea class="form-control" name="observaciones" rows="2" placeholder="Turno de la ma\xF1ana o notas iniciales"></textarea>
        </div>
      </form>
    `;
      const dialog = Modal.show({
        title: "Apertura de Turno de Caja",
        content,
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: "Aperturar Caja",
            class: "btn-primary",
            onClick: async () => {
              const form = dialog.querySelector("#open-shift-form");
              const formData = new FormData(form);
              const montoApertura = Number(formData.get("montoApertura") || 0);
              const observaciones = formData.get("observaciones");
              try {
                await CashService.openShift({ tenantId, montoApertura, observaciones });
                Toast.success("Turno de caja aperturado correctamente.");
                Modal.close();
                if (onComplete)
                  onComplete();
              } catch (err) {
                Toast.error(err.message);
              }
            }
          }
        ]
      });
    },
    openMovementModal(tenantId, turnoId, onComplete) {
      const content = `
      <form id="cash-mov-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Tipo de Movimiento</label>
            <select class="form-select" name="tipo" required>
              <option value="INGRESO">Ingreso Extraordinario (+)</option>
              <option value="GASTO">Gasto Menor de Operaci\xF3n (-)</option>
              <option value="RETIRO">Retiro Parcial / Consignaci\xF3n a Banco (-)</option>
              <option value="EGRESO">Egreso de Caja (-)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Monto ($ COP)</label>
            <input type="number" class="form-control" name="monto" required min="1" step="any" placeholder="Ej: 50000">
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Concepto o Detalle</label>
          <input type="text" class="form-control" name="concepto" required placeholder="Ej: Pago de almuerzo personal o recarga de botell\xF3n de agua">
        </div>

        <div class="form-group mb-3" id="mov-cat-wrap" style="display: none;">
          <label class="form-label">Categor\xEDa del gasto</label>
          <select class="form-select" name="categoria">
            ${["Gastos Varios", "Combustible y Veh\xEDculos", "Transporte y Domicilios", "Aseo y Cafeter\xEDa", "Papeler\xEDa", "Mantenimiento", "Servicios P\xFAblicos"].map((c) => `<option>${c}</option>`).join("")}
          </select>
        </div>
        <div class="form-group mb-3">
          <label class="form-label">Tercero / Proveedor / Beneficiario</label>
          <input type="text" class="form-control" name="tercero" placeholder="Ej: Domicilios El Poblado">
        </div>
      </form>
    `;
      const dialog = Modal.show({
        title: "Registrar movimiento en caja",
        content,
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: "Registrar en Caja",
            class: "btn-primary",
            onClick: async () => {
              const form = dialog.querySelector("#cash-mov-form");
              if (!form.checkValidity()) {
                form.reportValidity();
                return;
              }
              const formData = new FormData(form);
              await CashService.addMovement({
                tenantId,
                turnoId,
                tipo: formData.get("tipo"),
                monto: Number(formData.get("monto")),
                concepto: formData.get("concepto"),
                tercero: formData.get("tercero")
              });
              Toast.success("Movimiento de caja registrado.");
              Modal.close();
              if (onComplete)
                onComplete();
            }
          }
        ]
      });
      const tipoSel = dialog.querySelector("select[name=tipo]");
      const catWrap = dialog.querySelector("#mov-cat-wrap");
      tipoSel.addEventListener("change", () => {
        catWrap.style.display = tipoSel.value === "GASTO" ? "" : "none";
      });
    },
    openCloseShiftModal(shift, onComplete) {
      const content = `
      <div class="mb-3" style="background: var(--brand-primary-light); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
        <div class="d-flex justify-between items-center text-xs">
          <span style="color: var(--text-main); font-weight: 600;">Saldo Te\xF3rico Esperado en Gaveta:</span>
          <strong style="font-size: 16px; color: var(--brand-primary);">${Formatters.currency(shift.saldoEsperado)}</strong>
        </div>
      </div>

      <form id="close-shift-form">
        <div class="form-group mb-3">
          <label class="form-label">Efectivo F\xEDsico Contado en el Arqueo ($ COP)</label>
          <input type="number" class="form-control" id="inp-cash-counted" name="saldoContado" required placeholder="Monto real que cont\xF3 en billetes y monedas">
        </div>

        <div class="card mb-3" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); padding: 12px;">
          <div class="d-flex justify-between items-center">
            <span class="text-xs font-bold">Diferencia de Caja:</span>
            <strong id="lbl-cash-diff" style="font-size: 16px;">$ 0</strong>
          </div>
          <div class="text-xs text-muted mt-1" id="lbl-cash-diff-desc">Ingrese el dinero contado para conciliar.</div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Observaciones del Cierre</label>
          <textarea class="form-control" name="observacionesCierre" rows="2" placeholder="Motivo de descuadre si lo hubiere o cierre sin novedades"></textarea>
        </div>
      </form>
    `;
      const dialog = Modal.show({
        title: "Cierre y Arqueo Final de Caja",
        content,
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: "Confirmar Cierre de Turno",
            class: "btn-danger",
            onClick: async () => {
              const form = dialog.querySelector("#close-shift-form");
              if (!form.checkValidity()) {
                form.reportValidity();
                return;
              }
              const formData = new FormData(form);
              const saldoContado = Number(formData.get("saldoContado"));
              const observacionesCierre = formData.get("observacionesCierre");
              const dif = saldoContado - shift.saldoEsperado;
              await CashService.closeShift({
                turnoId: shift.id,
                saldoContado,
                observacionesCierre
              });
              await BackupFolderService.backupEvent("CierreCaja");
              Toast.success("Turno de caja cerrado exitosamente.");
              Modal.close();
              if (onComplete)
                onComplete();
              this.openShiftCloseWhatsAppModal(shift, saldoContado, dif, observacionesCierre);
            }
          }
        ]
      });
      const inp = dialog.querySelector("#inp-cash-counted");
      const diffLbl = dialog.querySelector("#lbl-cash-diff");
      const descLbl = dialog.querySelector("#lbl-cash-diff-desc");
      inp.addEventListener("input", () => {
        const contado = Number(inp.value) || 0;
        const dif = contado - shift.saldoEsperado;
        diffLbl.textContent = Formatters.currency(dif);
        if (dif === 0) {
          diffLbl.style.color = "var(--color-success)";
          descLbl.textContent = "\u2713 Caja cuadrada con exactitud perfecta.";
        } else if (dif > 0) {
          diffLbl.style.color = "var(--color-success)";
          descLbl.textContent = `Sobrante de caja a favor de la empresa: ${Formatters.currency(dif)}`;
        } else {
          diffLbl.style.color = "var(--color-danger)";
          descLbl.textContent = `\u26A0\uFE0F Faltante de dinero en gaveta: ${Formatters.currency(Math.abs(dif))}`;
        }
      });
    },
    openShiftCloseWhatsAppModal(shift, saldoContado, dif, observaciones) {
      const diffStatus = dif === 0 ? "\u2705 CUADRE PERFECTO" : dif > 0 ? `\u{1F7E2} SOBRANTE (+${Formatters.currency(dif)})` : `\u{1F534} FALTANTE (-${Formatters.currency(Math.abs(dif))})`;
      const dateStr = (/* @__PURE__ */ new Date()).toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const timeStr = (/* @__PURE__ */ new Date()).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
      const defaultMsg = `\u{1F4CA} *REPORTE DE CIERRE DE CAJA*
\u{1F4C5} *Fecha:* ${dateStr}
\u23F0 *Hora:* ${timeStr}
\u{1F464} *Cajero:* ${shift.usuarioNombre || "-"}${shift.cerradoPorNombre && shift.cerradoPorNombre !== shift.usuarioNombre ? " (cerr\xF3: " + shift.cerradoPorNombre + ")" : ""}
----------------------------------------
\u{1F4B5} *Base inicial:* ${Formatters.currency(shift.montoApertura || 0)}
\u{1F4B0} *Ventas efectivo:* ${Formatters.currency(shift.totalVentasEfectivo || 0)}
\u{1F4B3} *Ventas tarjeta:* ${Formatters.currency(shift.totalVentasTarjeta || 0)}
\u{1F4F2} *Ventas transferencia:* ${Formatters.currency(shift.totalVentasTransferencia || 0)}
\u{1F4F1} *Ventas Nequi/Daviplata:* ${Formatters.currency(shift.totalVentasNequiDaviplata || 0)}
\u2795 *Ingresos manuales:* ${Formatters.currency(shift.totalIngresos || 0)}
\u2796 *Gastos, egresos y retiros:* ${Formatters.currency((shift.totalGastos || 0) + (shift.totalEgresos || 0) + (shift.totalRetiros || 0))}
----------------------------------------
\u{1F3AF} *Total Te\xF3rico Esperado en Gaveta:* ${Formatters.currency(shift.saldoEsperado || 0)}
\u{1F4B5} *Total Real F\xEDsico Contado:* ${Formatters.currency(saldoContado)}
\u2696\uFE0F *Resultado del Cuadre:* ${diffStatus}
` + (observaciones ? `\u{1F4DD} *Observaciones:* ${observaciones}
` : "") + `----------------------------------------
_Reporte generado autom\xE1ticamente desde Nexa Admin ERP._`;
      const content = `
      <div style="padding: 10px 0;">
        <p class="text-sm text-muted mb-3">
          El turno fue cerrado en el sistema. Puede enviar de inmediato este balance del cierre por <strong>WhatsApp Web</strong> a los socios o gerencia:
        </p>

        <div class="form-group mb-3">
          <label class="form-label font-bold">N\xFAmero de WhatsApp del Socio / Gerente:</label>
          <input type="text" class="form-control" id="inp-shift-wa-phone" placeholder="Ej: 3001234567" value="${esc(String((TenantServiceInstance.getActiveTenant() || {}).whatsappGerencia || "").replace(/\D/g, ""))}">
          <span class="text-xs text-muted">Prefijo +57 Colombia se aplicar\xE1 autom\xE1ticamente.</span>
        </div>

        <div class="form-group mb-3">
          <label class="form-label font-bold">Mensaje Pre-redactado:</label>
          <textarea class="form-control" id="txt-shift-wa-msg" rows="9" style="font-family: monospace; font-size: 11px; white-space: pre-wrap;">${esc(defaultMsg)}</textarea>
        </div>
      </div>
    `;
      const waModal = Modal.show({
        title: "\u{1F4F2} Enviar Balance de Cierre a Socios / Gerencia",
        content,
        footerButtons: [
          { label: "Omitir / Cerrar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: "\u{1F680} Abrir WhatsApp Web",
            class: "btn-success",
            onClick: () => {
              const phoneVal = (waModal.querySelector("#inp-shift-wa-phone").value || "").replace(/\D/g, "");
              const msgVal = waModal.querySelector("#txt-shift-wa-msg").value;
              if (!phoneVal) {
                Toast.warning("Ingrese un n\xFAmero de tel\xE9fono v\xE1lido.");
                return;
              }
              const cleanPhone = phoneVal.startsWith("57") ? phoneVal : "57" + phoneVal;
              const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msgVal)}`;
              window.open(waUrl, "_blank");
              Modal.close();
            }
          }
        ]
      });
    }
  };

  // js/modules/expenses.js
  init_formatters();
  init_toast();
  var EXPENSE_CATEGORIES = [
    "Transporte y Fletes",
    "Combustible y Veh\xEDculos",
    "Servicios P\xFAblicos",
    "N\xF3mina y Prestaciones",
    "Arriendo de Bodega / Local",
    "Materia Prima / Insumos Menores",
    "Empaque y Cajas",
    "Publicidad y Marketing Digital",
    "Mensajer\xEDa y Env\xEDos",
    "Mantenimiento de Maquinaria",
    "Impuestos y Tasas",
    "Comisiones de Ventas",
    "Otros Gastos Administrativos"
  ];
  var ExpensesModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const expenses = await DB.getAll(STORES.EXPENSES, tenantId);
      const totalGastos = expenses.reduce((acc, e) => acc + Number(e.valor || 0), 0);
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Gastos Operativos & Egresos</h1>
          <p>Control y categorizaci\xF3n de costos indirectos, n\xF3mina, log\xEDstica y gastos administrativos</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-primary btn-sm" id="btn-new-expense">\u{1F3F7}\uFE0F Registrar Gasto</button>
        </div>
      </div>

      <div class="kpi-grid mb-4">
        <div class="kpi-card">
          <div class="kpi-label">Total Gastos Registrados</div>
          <div class="kpi-value text-danger">${Formatters.currency(totalGastos)}</div>
          <div class="kpi-footer">${expenses.length} registros contables</div>
        </div>
      </div>

      <div id="expenses-table-container"></div>
    `;
      new DataTable({
        containerId: "expenses-table-container",
        data: expenses.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)),
        columns: [
          {
            key: "fecha",
            title: "Fecha",
            render: (val) => Formatters.date(val)
          },
          {
            key: "categoria",
            title: "Categor\xEDa",
            render: (val) => `<span class="badge badge-neutral font-bold">${esc(val)}</span>`
          },
          {
            key: "concepto",
            title: "Concepto / Detalle",
            render: (val, row) => `
            <div>
              <strong>${esc(val)}</strong>
              <div class="text-xs text-muted">Beneficiario: ${esc(row.proveedor || "-")}</div>
            </div>
          `
          },
          {
            key: "valor",
            title: "Valor Pagado",
            render: (val) => `<strong class="text-danger">-${Formatters.currency(val)}</strong>`
          },
          {
            key: "formaPago",
            title: "Medio de Pago",
            render: (val) => `<span class="badge badge-info">${esc(val || "-")}</span>`
          },
          {
            key: "responsableNombre",
            title: "Responsable",
            render: (val) => esc(val || "-")
          }
        ]
      });
      container.querySelector("#btn-new-expense").addEventListener("click", () => {
        this.openExpenseModal(tenantId, () => this.render(container));
      });
    },
    openExpenseModal(tenantId, onSaved) {
      const content = `
      <form id="expense-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Categor\xEDa del Gasto</label>
            <select class="form-select" name="categoria" required>
              ${EXPENSE_CATEGORIES.map((cat) => `<option value="${cat}">${cat}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Valor del Gasto ($ COP)</label>
            <input type="number" class="form-control" name="valor" required min="1" step="any" placeholder="Ej: 85000">
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Concepto o Descripci\xF3n</label>
          <input type="text" class="form-control" name="concepto" required placeholder="Ej: Factura de agua y luz o gasolina para camioneta de reparto">
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Beneficiario / Proveedor</label>
            <input type="text" class="form-control" name="proveedor" placeholder="Ej: EPM o Estaci\xF3n Primax">
          </div>
          <div class="form-group">
            <label class="form-label">Forma de Pago</label>
            <select class="form-select" name="formaPago">
              <option value="${CASH_EXPENSE_METHOD}">Efectivo de caja (descuenta la caja abierta)</option>
              <option value="Transferencia Bancolombia">Transferencia Bancolombia</option>
              <option value="Nequi / Daviplata">Nequi / Daviplata</option>
              <option value="Tarjeta Corporativa">Tarjeta Corporativa</option>
            </select>
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Observaciones / Soporte</label>
          <textarea class="form-control" name="observacion" rows="2" placeholder="No. de factura f\xEDsica o soporte de transferencia"></textarea>
        </div>
      </form>
    `;
      const dialog = Modal.show({
        title: "Registrar Nuevo Gasto Operativo",
        content,
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: "Guardar Gasto",
            class: "btn-primary",
            onClick: async () => {
              const form = dialog.querySelector("#expense-form");
              if (!form.checkValidity()) {
                form.reportValidity();
                return;
              }
              const formData = new FormData(form);
              try {
                await ExpenseService.registerExpense({
                  tenantId,
                  categoria: formData.get("categoria"),
                  valor: Number(formData.get("valor")),
                  concepto: formData.get("concepto"),
                  proveedor: formData.get("proveedor"),
                  formaPago: formData.get("formaPago"),
                  observacion: formData.get("observacion")
                });
              } catch (err) {
                Toast.error(err.message);
                return;
              }
              Toast.success("Gasto registrado exitosamente.");
              Modal.close();
              if (onSaved)
                onSaved();
            }
          }
        ]
      });
    }
  };

  // js/modules/cxc.js
  init_formatters();

  // js/services/payments-service.js
  var RECEIPT_METHODS = ["Efectivo", "Transferencia", "Nequi", "Daviplata", "Tarjeta", "Cheque"];
  var PAYOUT_METHODS = ["Transferencia bancaria", "Nequi / Daviplata", "Efectivo de caja", "Cheque"];
  var CASH_PAYOUT = "Efectivo de caja";
  var TX = [
    STORES.RECEIVABLES_CXC,
    STORES.PAYABLES_CXP,
    STORES.CUSTOMERS,
    STORES.SALES,
    STORES.SUPPLIERS,
    STORES.CASH_SHIFTS,
    STORES.CASH_MOVEMENTS,
    STORES.SYSTEM_PARAMS,
    STORES.ATTACHMENTS,
    STORES.AUDIT_LOGS
  ];
  async function openShift(tx, tenantId) {
    const t = (await tx.getAll(STORES.CASH_SHIFTS, tenantId)).find((s) => s.estado === "ABIERTA");
    if (!t)
      throw new Error("Para operaciones en efectivo debe haber un turno de caja abierto.");
    return t;
  }
  function validAmount(monto, saldo) {
    const v = Math.round(Number(monto) * 100) / 100;
    if (!Number.isFinite(v) || v <= 0)
      throw new Error("El valor debe ser mayor a cero.");
    if (v > Number(saldo) + 9e-3)
      throw new Error(`El valor supera el saldo pendiente (${saldo}).`);
    return v;
  }
  var PaymentsService = {
    /** Abono a una cuenta por cobrar */
    async receivePayment({ tenantId, cxcId, monto, metodo, referencia, comprobanteDataUrl }) {
      if (!RECEIPT_METHODS.includes(metodo))
        throw new Error("Seleccione un medio de pago v\xE1lido.");
      const res = await DB.runTransaction(TX, async (tx) => {
        const cxc = await tx.get(STORES.RECEIVABLES_CXC, cxcId);
        if (!cxc)
          throw new Error("Cuenta por cobrar no encontrada.");
        if (cxc.estado === "ANULADA")
          throw new Error("La cuenta por cobrar est\xE1 anulada.");
        const valor = validAmount(monto, cxc.saldo);
        const n = await tx.nextSequence(tenantId, "RECIBO_CAJA");
        const recibo = `RC-${String(n).padStart(6, "0")}`;
        let comprobanteId = null;
        if (comprobanteDataUrl) {
          const att = await tx.put(STORES.ATTACHMENTS, { tenantId, refTipo: "ABONO_CXC", refId: cxc.id, descripcion: `${recibo} ${cxc.documento}`, dataUrl: comprobanteDataUrl });
          comprobanteId = att.id;
        }
        let movId = null;
        if (metodo === "Efectivo") {
          const turno = await openShift(tx, tenantId);
          const mov = await CashService.applyMovementTx(tx, {
            tenantId,
            turnoId: turno.id,
            tipo: "INGRESO",
            monto: valor,
            concepto: `${recibo} abono ${cxc.documento}`,
            tercero: cxc.clienteNombre,
            refTipo: "ABONO_CXC",
            refId: cxc.id
          });
          movId = mov.id;
        }
        cxc.abonos = Number(cxc.abonos || 0) + valor;
        cxc.saldo = Math.max(0, Math.round((Number(cxc.saldo) - valor) * 100) / 100);
        if (cxc.saldo === 0)
          cxc.estado = "PAGADA";
        cxc.historialPagos = cxc.historialPagos || [];
        cxc.historialPagos.push({
          recibo,
          fecha: (/* @__PURE__ */ new Date()).toISOString(),
          monto: valor,
          metodo,
          observacion: referencia || "",
          comprobanteId,
          movimientoCajaId: movId,
          usuarioId: Session.userId(),
          usuarioNombre: Session.userName()
        });
        await tx.put(STORES.RECEIVABLES_CXC, cxc);
        const cli = cxc.clienteId ? await tx.get(STORES.CUSTOMERS, cxc.clienteId) : null;
        if (cli) {
          cli.saldoPendiente = Math.max(0, Number(cli.saldoPendiente || 0) - valor);
          await tx.put(STORES.CUSTOMERS, cli);
        }
        const sale = cxc.ventaId ? await tx.get(STORES.SALES, cxc.ventaId) : null;
        if (sale) {
          sale.saldoCredito = cxc.saldo;
          if (cxc.saldo === 0) {
            sale.estado = "PAGADA";
            sale.fechaPagoTotal = (/* @__PURE__ */ new Date()).toISOString();
          }
          await tx.put(STORES.SALES, sale);
        }
        await AuditService.logTx(tx, {
          tenantId,
          modulo: "Cartera",
          accion: "ABONO",
          registroId: cxc.documento,
          campoModificado: `${recibo} (${metodo})`,
          valorAnterior: `Saldo ${cxc.saldo + valor}`,
          valorNuevo: `Saldo ${cxc.saldo}`
        });
        return { cxc, recibo };
      });
      if (metodo === "Efectivo")
        EventBus.emit("cash:shiftChanged");
      return res;
    },
    /** Pago (total o parcial) de una cuenta por pagar */
    async payPayable({ tenantId, cxpId, monto, metodo, referencia }) {
      return (await this.payPayables({ tenantId, pagos: [{ cxpId, monto }], metodo, referencia }))[0];
    },
    /** Paga varias cuentas por pagar en una sola transacción (liquidación de comisiones) */
    async payPayables({ tenantId, pagos, metodo, referencia }) {
      if (!PAYOUT_METHODS.includes(metodo))
        throw new Error("Seleccione un medio de pago v\xE1lido.");
      if (!pagos || pagos.length === 0)
        throw new Error("No hay cuentas por pagar seleccionadas.");
      const res = await DB.runTransaction(TX, async (tx) => {
        const out = [];
        const turno = metodo === CASH_PAYOUT ? await openShift(tx, tenantId) : null;
        for (const p of pagos) {
          const cxp = await tx.get(STORES.PAYABLES_CXP, p.cxpId);
          if (!cxp)
            throw new Error("Cuenta por pagar no encontrada.");
          if (cxp.estado === "ANULADA")
            throw new Error(`La cuenta ${cxp.documento} est\xE1 anulada.`);
          const valor = validAmount(p.monto, cxp.saldo);
          const n = await tx.nextSequence(tenantId, "COMPROBANTE_EGRESO");
          const egreso = `CE-${String(n).padStart(6, "0")}`;
          let movId = null;
          if (turno) {
            const mov = await CashService.applyMovementTx(tx, {
              tenantId,
              turnoId: turno.id,
              tipo: "EGRESO",
              monto: valor,
              concepto: `${egreso} pago ${cxp.documento}`,
              tercero: cxp.proveedorNombre,
              refTipo: "PAGO_CXP",
              refId: cxp.id
            });
            movId = mov.id;
          }
          cxp.abonos = Number(cxp.abonos || 0) + valor;
          cxp.saldo = Math.max(0, Math.round((Number(cxp.saldo) - valor) * 100) / 100);
          if (cxp.saldo === 0)
            cxp.estado = "PAGADA";
          cxp.historialPagos = cxp.historialPagos || [];
          cxp.historialPagos.push({
            egreso,
            fecha: (/* @__PURE__ */ new Date()).toISOString(),
            monto: valor,
            metodo,
            referencia: referencia || "",
            movimientoCajaId: movId,
            usuarioId: Session.userId(),
            usuarioNombre: Session.userName()
          });
          await tx.put(STORES.PAYABLES_CXP, cxp);
          if (cxp.tipoDocumento === "COMISION_FREELANCE" && cxp.proveedorId) {
            const fl = await tx.get(STORES.SUPPLIERS, cxp.proveedorId);
            if (fl) {
              fl.comisionesTotalesPagadas = Number(fl.comisionesTotalesPagadas || 0) + valor;
              await tx.put(STORES.SUPPLIERS, fl);
            }
          }
          await AuditService.logTx(tx, {
            tenantId,
            modulo: "Cuentas por pagar",
            accion: "PAGO",
            registroId: cxp.documento,
            campoModificado: `${egreso} (${metodo})`,
            valorAnterior: `Saldo ${cxp.saldo + valor}`,
            valorNuevo: `Saldo ${cxp.saldo}`
          });
          out.push({ cxp, egreso });
        }
        return out;
      });
      if (metodo === CASH_PAYOUT)
        EventBus.emit("cash:shiftChanged");
      return res;
    }
  };

  // js/modules/cxc.js
  init_toast();
  var CxcModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const [receivables, clients] = await Promise.all([
        DB.getAll(STORES.RECEIVABLES_CXC, tenantId),
        DB.getAll(STORES.CUSTOMERS, tenantId)
      ]);
      const today2 = /* @__PURE__ */ new Date();
      receivables.forEach((r) => {
        if (r.fechaVencimiento && r.saldo > 0) {
          const dueDate = new Date(r.fechaVencimiento);
          const diffTime = today2.getTime() - dueDate.getTime();
          const diffDays = Math.floor(diffTime / (1e3 * 60 * 60 * 24));
          if (diffDays > 0) {
            r.diasMora = diffDays;
            r.estado = diffDays > 30 ? "MORA_CRITICA" : "VENCIDO";
          } else if (diffDays >= -5) {
            r.diasMora = 0;
            r.estado = "POR_VENCER";
          } else {
            r.diasMora = 0;
            r.estado = "AL_DIA";
          }
        }
      });
      const totalCartera = receivables.reduce((acc, r) => acc + Number(r.saldo || 0), 0);
      const carteraVencida = receivables.filter((r) => r.estado === "VENCIDO" || r.estado === "MORA_CRITICA").reduce((acc, r) => acc + Number(r.saldo || 0), 0);
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Cuentas por Cobrar (Cartera)</h1>
          <p>Control de deudas de clientes comerciales, plazos de pago y recaudo de cartera</p>
        </div>
      </div>

      <div class="kpi-grid mb-4">
        <div class="kpi-card">
          <div class="kpi-label">Cartera Total Activa</div>
          <div class="kpi-value text-warning">${Formatters.currency(totalCartera)}</div>
          <div class="kpi-footer">${receivables.filter((r) => r.saldo > 0).length} facturas con saldo</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Cartera en Mora Vencida</div>
          <div class="kpi-value text-danger">${Formatters.currency(carteraVencida)}</div>
          <div class="kpi-footer">Requiere cobro urgente</div>
        </div>
      </div>

      <div id="cxc-table-container"></div>
    `;
      new DataTable({
        containerId: "cxc-table-container",
        data: receivables.filter((r) => r.saldo > 0),
        columns: [
          {
            key: "documento",
            title: "Factura / Documento",
            render: (val) => `<strong style="color: var(--brand-primary);">${esc(val)}</strong>`
          },
          {
            key: "clienteNombre",
            title: "Cliente Deudor",
            render: (val) => `<strong>${esc(val)}</strong>`
          },
          {
            key: "fechaEmision",
            title: "Emisi\xF3n",
            render: (val) => Formatters.date(val)
          },
          {
            key: "fechaVencimiento",
            title: "Vencimiento",
            render: (val) => Formatters.date(val)
          },
          {
            key: "valorTotal",
            title: "Valor Total",
            render: (val) => Formatters.currency(val)
          },
          {
            key: "abonos",
            title: "Abonos Realizados",
            render: (val) => Formatters.currency(val || 0)
          },
          {
            key: "saldo",
            title: "Saldo Pendiente",
            render: (val) => `<strong class="text-danger">${Formatters.currency(val)}</strong>`
          },
          {
            key: "estado",
            title: "Estado / Mora",
            render: (val, row) => {
              const map = {
                AL_DIA: { label: "Al D\xEDa", class: "badge-success" },
                POR_VENCER: { label: "Pr\xF3ximo a Vencer", class: "badge-warning" },
                VENCIDO: { label: `Vencido (${row.diasMora} d)`, class: "badge-danger" },
                MORA_CRITICA: { label: `Mora Cr\xEDtica (${row.diasMora} d)`, class: "badge-danger" }
              };
              const meta = map[val] || { label: val, class: "badge-neutral" };
              return `<span class="badge ${meta.class}">${meta.label}</span>`;
            }
          }
        ],
        actions: (row) => `
        <div class="d-flex items-center gap-1 flex-wrap">
          <button class="btn btn-primary btn-sm btn-cxc-payment" data-id="${esc(row.id)}" title="Registrar Abono">\u{1F4B5} Abono</button>
          <button class="btn btn-sm btn-cxc-whatsapp" data-id="${esc(row.id)}" style="background: #25d366; border-color: #25d366; color: #ffffff; font-weight: 700; padding: 3px 8px; font-size: 11px;" title="Enviar cobro por WhatsApp">\u{1F4F2} WhatsApp</button>
          <button class="btn btn-secondary btn-sm btn-cxc-calendar" data-id="${esc(row.id)}" title="Programar recordatorio en Google Calendar">\u{1F4C5} Recordatorio</button>
        </div>
      `
      });
      bindOnce(container, "cxc-click", "click", (e) => {
        const payBtn = e.target.closest(".btn-cxc-payment");
        if (payBtn) {
          const id = payBtn.getAttribute("data-id");
          const cxcItem = receivables.find((r) => r.id === id);
          this.openPaymentModal(cxcItem, tenantId, clients, () => this.render(container));
          return;
        }
        const waBtn = e.target.closest(".btn-cxc-whatsapp");
        if (waBtn) {
          const id = waBtn.getAttribute("data-id");
          const cxcItem = receivables.find((r) => r.id === id);
          this.openWhatsAppModal(cxcItem, tenant, clients);
          return;
        }
        const calBtn = e.target.closest(".btn-cxc-calendar");
        if (calBtn) {
          const id = calBtn.getAttribute("data-id");
          const cxcItem = receivables.find((r) => r.id === id);
          this.scheduleGoogleCalendar(cxcItem, tenant, clients);
          return;
        }
      });
    },
    openPaymentModal(cxcItem, tenantId, clients, onSaved) {
      const content = `
      <div class="mb-3" style="background: var(--bg-surface-solid); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">
        <div class="text-xs text-muted">Abono a Documento: <strong>${esc(cxcItem.documento)}</strong></div>
        <div style="font-size: 16px; font-weight: 700; color: var(--text-main); margin: 2px 0;">${esc(cxcItem.clienteNombre)}</div>
        <div class="d-flex justify-between items-center text-xs mt-2">
          <span>Saldo Actual Pendiente:</span>
          <strong class="text-danger" style="font-size: 15px;">${Formatters.currency(cxcItem.saldo)}</strong>
        </div>
      </div>

      <form id="cxc-payment-form">
        <div class="form-group mb-3">
          <label class="form-label">Monto del Abono ($ COP)</label>
          <input type="number" step="any" min="1" max="${esc(cxcItem.saldo)}" class="form-control" name="montoAbono" value="${esc(cxcItem.saldo)}" required>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Forma de Pago del Recaudo</label>
          <select class="form-select" name="metodoPago">
            ${RECEIPT_METHODS.map((m) => `<option value="${m}">${m === "Efectivo" ? "Efectivo (ingresa a la caja abierta)" : m}</option>`).join("")}
          </select>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Comprobante / Observaci\xF3n</label>
          <input type="text" class="form-control" name="reciboCaja" placeholder="No. Recibo de Caja o Referencia de Transferencia">
        </div>
      </form>
    `;
      const dialog = Modal.show({
        title: "Recaudar Cartera / Registrar Abono",
        content,
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: "Procesar Abono",
            class: "btn-primary",
            onClick: async () => {
              const form = dialog.querySelector("#cxc-payment-form");
              if (!form.checkValidity()) {
                form.reportValidity();
                return;
              }
              const formData = new FormData(form);
              const abono = Number(formData.get("montoAbono"));
              let res;
              try {
                res = await PaymentsService.receivePayment({
                  tenantId,
                  cxcId: cxcItem.id,
                  monto: abono,
                  metodo: formData.get("metodoPago"),
                  referencia: formData.get("reciboCaja"),
                  comprobanteDataUrl: formData.get("comprobanteBase64") || null
                });
              } catch (err) {
                Toast.error(err.message);
                return;
              }
              Toast.success(`Abono ${res.recibo} por ${Formatters.currency(abono)} registrado.`);
              Modal.close();
              if (onSaved)
                onSaved();
            }
          }
        ]
      });
    },
    /**
     * Modal interactivo para enviar recordatorio de cobro directamente por WhatsApp Web
     */
    openWhatsAppModal(cxcItem, tenant, clients) {
      const client = clients.find((c) => c.id === cxcItem.clienteId || c.nombre === cxcItem.clienteNombre) || {};
      let rawPhone = (client.whatsapp || client.telefono || "").replace(/\D/g, "");
      if (rawPhone.length === 10)
        rawPhone = "57" + rawPhone;
      const esMora = cxcItem.estado === "VENCIDO" || cxcItem.estado === "MORA_CRITICA" || cxcItem.diasMora && cxcItem.diasMora > 0;
      let defaultMsg = "";
      if (esMora) {
        defaultMsg = `Hola *${cxcItem.clienteNombre}*, un cordial saludo de parte de *${tenant.nombreComercial}*.

Le escribimos para solicitar comedidamente la cancelaci\xF3n de su saldo pendiente por *${Formatters.currency(cxcItem.saldo)}*, correspondiente a la factura *${cxcItem.documento}*, la cual presenta *${cxcItem.diasMora || 0} d\xEDas de mora* (Venci\xF3: ${Formatters.date(cxcItem.fechaVencimiento)}).

Puede realizar su transferencia a nuestras cuentas oficiales:
\u{1F3E6} *Bancolombia Cta Ahorros:* 123-456789-01
\u{1F4F1} *Nequi / Daviplata:* ${tenant.telefono || "3124567890"}
*NIT:* ${tenant.nit}-${tenant.dv}

Le agradecemos enviarnos el comprobante por este medio para actualizar su estado de cuenta y mantener activo su cupo de cr\xE9dito para pr\xF3ximos despachos.

\xA1Muchas gracias por su atenci\xF3n!`;
      } else {
        defaultMsg = `Hola *${cxcItem.clienteNombre}*, un cordial saludo de parte de *${tenant.nombreComercial}*.

Le compartimos un recordatorio amable sobre su factura *${cxcItem.documento}* por valor de *${Formatters.currency(cxcItem.saldo)}*, cuya fecha de vencimiento es el *${Formatters.date(cxcItem.fechaVencimiento)}*.

Cuentas habilitadas para pago:
\u{1F3E6} *Bancolombia Cta Ahorros:* 123-456789-01
\u{1F4F1} *Nequi / Daviplata:* ${tenant.telefono || "3124567890"}

Quedamos a su entera disposici\xF3n para cualquier inquietud o para coordinar su pr\xF3ximo pedido.

\xA1Feliz d\xEDa!`;
      }
      const content = `
      <div class="mb-3" style="background: rgba(37, 211, 102, 0.08); border: 1px solid rgba(37, 211, 102, 0.25); border-radius: 8px; padding: 12px 14px;">
        <div style="font-size: 13px; font-weight: 700; color: #166534; margin-bottom: 2px;">
          \u{1F4AC} Cobranza Directa por WhatsApp Web
        </div>
        <div style="font-size: 11.5px; color: var(--text-secondary);">
          El mensaje se abrir\xE1 autom\xE1ticamente en su WhatsApp Web o aplicaci\xF3n de escritorio listo para enviar con 1 clic.
        </div>
      </div>

      <div class="form-group mb-3">
        <label class="form-label font-bold">N\xFAmero de WhatsApp del Cliente</label>
        <div class="d-flex items-center gap-2">
          <input type="text" class="form-control font-bold" id="inp-wa-phone" value="${rawPhone || "57"}" placeholder="Ej: 573124567890">
          <span class="badge ${rawPhone ? "badge-success" : "badge-warning"}" id="badge-wa-status">${rawPhone ? "\u2713 Registrado" : "\u26A0\uFE0F Sin registrar"}</span>
        </div>
        <span class="form-help">Incluya el c\xF3digo de pa\xEDs (Ej: 57 para Colombia seguido del celular).</span>
      </div>

      <div class="form-group mb-3">
        <label class="form-label font-bold">Mensaje Pre-redactado de Cobro</label>
        <textarea class="form-control" id="inp-wa-message" rows="8" style="font-size: 12px; font-family: monospace; line-height: 1.4;">${defaultMsg}</textarea>
        <span class="form-help">Puede personalizar cualquier texto antes de pulsar Enviar. Los asteriscos *texto* saldr\xE1n en negrita en WhatsApp.</span>
      </div>
    `;
      Modal.show({
        title: `\u{1F4F2} Cobro por WhatsApp - Factura ${cxcItem.documento}`,
        content,
        size: "md",
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: "\u{1F4AC} Abrir en WhatsApp Web y Enviar",
            class: "btn-primary",
            onClick: () => {
              const phoneEl = document.getElementById("inp-wa-phone");
              const msgEl = document.getElementById("inp-wa-message");
              const cleanPhone = (phoneEl ? phoneEl.value : rawPhone).replace(/\D/g, "");
              const finalMsg = msgEl ? msgEl.value : defaultMsg;
              if (!cleanPhone || cleanPhone.length < 10) {
                Toast.warning("Por favor ingrese un n\xFAmero de WhatsApp v\xE1lido.");
                return;
              }
              const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(finalMsg)}`;
              window.open(waUrl, "_blank");
              Toast.success("Abriendo WhatsApp Web con el mensaje pre-cargado...");
              Modal.close();
            }
          }
        ]
      });
    },
    /**
     * Programa recordatorio de vencimiento en Google Calendar
     */
    scheduleGoogleCalendar(cxcItem, tenant, clients) {
      const client = clients.find((c) => c.id === cxcItem.clienteId) || {};
      const dateRaw = cxcItem.fechaVencimiento || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const dateStr = dateRaw.replace(/-/g, "");
      const title = `Cobro Factura ${cxcItem.documento} - ${cxcItem.clienteNombre}`;
      const details = `Recordatorio de cobro de cartera en Nexa ERP (${tenant.nombreComercial})

Cliente: ${cxcItem.clienteNombre}
Factura: ${cxcItem.documento}
Saldo Pendiente: ${Formatters.currency(cxcItem.saldo)}
Fecha Vencimiento: ${Formatters.date(cxcItem.fechaVencimiento)}
Contacto: ${client.telefono || client.whatsapp || "No registrado"}`;
      const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dateStr}T140000Z/${dateStr}T143000Z&details=${encodeURIComponent(details)}`;
      window.open(gcalUrl, "_blank");
      Toast.info("Abriendo Google Calendar para programar el recordatorio...");
    }
  };

  // js/modules/cxp.js
  init_formatters();
  init_toast();
  var CxpModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const payables = await DB.getAll(STORES.PAYABLES_CXP, tenantId);
      const totalPasivo = payables.filter((p) => p.tipoDocumento !== "COMISION_FREELANCE").reduce((acc, p) => acc + Number(p.saldo || 0), 0);
      const totalComisiones = payables.filter((p) => p.tipoDocumento === "COMISION_FREELANCE").reduce((acc, p) => acc + Number(p.saldo || 0), 0);
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Cuentas por Pagar (Proveedores)</h1>
          <p>Control de compromisos comerciales por compra de materias primas y servicios</p>
        </div>
      </div>

      <div class="kpi-grid mb-4" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
        <div class="kpi-card">
          <div class="kpi-label">Pasivo Total Proveedores</div>
          <div class="kpi-value text-danger">${Formatters.currency(totalPasivo)}</div>
          <div class="kpi-footer">${payables.filter((p) => p.saldo > 0 && p.tipoDocumento !== "COMISION_FREELANCE").length} facturas pendientes</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Comisiones Freelance Pendientes</div>
          <div class="kpi-value" style="color: #7c3aed;">${Formatters.currency(totalComisiones)}</div>
          <div class="kpi-footer">${payables.filter((p) => p.saldo > 0 && p.tipoDocumento === "COMISION_FREELANCE").length} comisiones por liquidar</div>
        </div>
      </div>

      <div class="d-flex gap-2 mb-3" style="flex-wrap: wrap;">
        <button class="btn btn-secondary btn-sm btn-cxp-filter" data-filter="all" style="font-weight: 700;">Todas</button>
        <button class="btn btn-secondary btn-sm btn-cxp-filter" data-filter="proveedores">Facturas Proveedor</button>
        <button class="btn btn-secondary btn-sm btn-cxp-filter" data-filter="comisiones" style="background: rgba(124,58,237,0.1); color: #7c3aed; border-color: #7c3aed;">\u{1F91D} Comisiones Freelance</button>
      </div>

      <div id="cxp-table-container"></div>
    `;
      new DataTable({
        containerId: "cxp-table-container",
        data: payables.filter((p) => p.saldo > 0),
        columns: [
          {
            key: "documento",
            title: "Referencia",
            render: (val, row) => {
              const isComision = row.tipoDocumento === "COMISION_FREELANCE";
              return `<div>
              <strong style="color: ${isComision ? "#7c3aed" : "var(--brand-primary)"};">${esc(val)}</strong>
              ${isComision ? '<span class="badge" style="background: rgba(124,58,237,0.15); color: #7c3aed; font-size: 9px; margin-left: 4px;">\u{1F91D} Comisi\xF3n</span>' : ""}
              ${row.ventaConsecutivo ? '<div class="text-xs text-muted">Venta: ' + row.ventaConsecutivo + "</div>" : ""}
            </div>`;
            }
          },
          {
            key: "proveedorNombre",
            title: "Proveedor",
            render: (val) => `<strong>${esc(val)}</strong>`
          },
          {
            key: "fechaEmision",
            title: "Emisi\xF3n",
            render: (val) => Formatters.date(val)
          },
          {
            key: "fechaVencimiento",
            title: "Vencimiento",
            render: (val) => Formatters.date(val)
          },
          {
            key: "valorTotal",
            title: "Valor Total",
            render: (val) => Formatters.currency(val)
          },
          {
            key: "saldo",
            title: "Saldo Pendiente",
            render: (val) => `<strong class="text-danger">${Formatters.currency(val)}</strong>`
          },
          {
            key: "estado",
            title: "Estado",
            render: (val) => `<span class="badge ${val === "AL_DIA" ? "badge-success" : "badge-danger"}">${esc(val)}</span>`
          }
        ],
        actions: (row) => `
        <button class="btn btn-primary btn-sm btn-cxp-pay" data-id="${esc(row.id)}">\u{1F4B3} Pagar a Proveedor</button>
      `
      });
      let filtroActivo = "all";
      const renderTable = (filtro) => {
        filtroActivo = filtro;
        let data;
        if (filtro === "comisiones")
          data = payables.filter((p) => p.saldo > 0 && p.tipoDocumento === "COMISION_FREELANCE");
        else if (filtro === "proveedores")
          data = payables.filter((p) => p.saldo > 0 && p.tipoDocumento !== "COMISION_FREELANCE");
        else
          data = payables.filter((p) => p.saldo > 0);
        container.querySelector("#cxp-table-container").innerHTML = "";
        new DataTable({
          containerId: "cxp-table-container",
          data,
          columns: [
            { key: "documento", title: "Referencia", render: (val, row) => {
              const isComision = row.tipoDocumento === "COMISION_FREELANCE";
              return `<div><strong style="color: ${isComision ? "#7c3aed" : "var(--brand-primary)"};">${esc(val)}</strong>${isComision ? '<span class="badge" style="background: rgba(124,58,237,0.15); color: #7c3aed; font-size: 9px; margin-left: 4px;">\u{1F91D} Comisi\xF3n</span>' : ""}${row.ventaConsecutivo ? '<div class="text-xs text-muted">Venta: ' + row.ventaConsecutivo + "</div>" : ""}</div>`;
            } },
            { key: "proveedorNombre", title: "Proveedor / Vendedor", render: (val) => `<strong>${esc(val)}</strong>` },
            { key: "fechaEmision", title: "Emisi\xF3n", render: (val) => Formatters.date(val) },
            { key: "fechaVencimiento", title: "Vencimiento", render: (val) => Formatters.date(val) },
            { key: "valorTotal", title: "Valor Total", render: (val) => Formatters.currency(val) },
            { key: "saldo", title: "Saldo Pendiente", render: (val) => `<strong class="text-danger">${Formatters.currency(val)}</strong>` },
            { key: "estado", title: "Estado", render: (val) => `<span class="badge ${val === "AL_DIA" ? "badge-success" : "badge-danger"}">${esc(val)}</span>` }
          ],
          actions: (row) => `<button class="btn btn-primary btn-sm btn-cxp-pay" data-id="${esc(row.id)}">\u{1F4B3} Pagar</button>`
        });
        container.querySelectorAll(".btn-cxp-filter").forEach((b) => {
          b.style.fontWeight = b.getAttribute("data-filter") === filtro ? "700" : "400";
        });
      };
      container.querySelectorAll(".btn-cxp-filter").forEach((btn) => {
        btn.addEventListener("click", () => renderTable(btn.getAttribute("data-filter")));
      });
      bindOnce(container, "cxp-click", "click", (e) => {
        const payBtn = e.target.closest(".btn-cxp-pay");
        if (payBtn) {
          const id = payBtn.getAttribute("data-id");
          const cxpItem = payables.find((p) => p.id === id);
          this.openPaySupplierModal(cxpItem, () => this.render(container));
        }
      });
    },
    openPaySupplierModal(cxpItem, onSaved) {
      const content = `
      <div class="mb-3" style="background: var(--bg-surface-solid); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">
        <div class="text-xs text-muted">Pago a Proveedor: <strong>${esc(cxpItem.proveedorNombre)}</strong></div>
        <div style="font-size: 15px; font-weight: 700; margin: 2px 0;">Factura: ${esc(cxpItem.documento)}</div>
        <div class="text-xs text-danger font-bold mt-1">Saldo a Liquidar: ${Formatters.currency(cxpItem.saldo)}</div>
      </div>

      <form id="cxp-pay-form">
        <div class="form-group mb-3">
          <label class="form-label">Monto del Pago ($ COP)</label>
          <input type="number" step="any" min="1" max="${cxpItem.saldo}" class="form-control" name="monto" value="${cxpItem.saldo}" required>
        </div>
        <div class="form-group mb-3">
          <label class="form-label">Cuenta Bancaria de Origen / Medio</label>
          <select class="form-select" name="medio">
            ${PAYOUT_METHODS.map((m) => `<option value="${m}">${m === "Efectivo de caja" ? "Efectivo de caja (sale de la caja abierta)" : m}</option>`).join("")}
          </select>
        </div>
        <div class="form-group mb-3">
          <label class="form-label">N\xFAmero de Comprobante / Aprobaci\xF3n</label>
          <input type="text" class="form-control" name="comprobante" placeholder="Ej: n\xFAmero de transferencia (opcional)">
        </div>
      </form>
    `;
      const dialog = Modal.show({
        title: "Registrar Pago a Proveedor",
        content,
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: "Confirmar Pago",
            class: "btn-primary",
            onClick: async () => {
              const form = dialog.querySelector("#cxp-pay-form");
              if (!form.checkValidity()) {
                form.reportValidity();
                return;
              }
              const formData = new FormData(form);
              const pago = Number(formData.get("monto"));
              try {
                await PaymentsService.payPayable({
                  tenantId: cxpItem.tenantId,
                  cxpId: cxpItem.id,
                  monto: pago,
                  metodo: formData.get("medio"),
                  referencia: formData.get("comprobante")
                });
              } catch (err) {
                Toast.error(err.message);
                return;
              }
              Toast.success(`Pago por ${Formatters.currency(pago)} registrado con \xE9xito.`);
              Modal.close();
              if (onSaved)
                onSaved();
            }
          }
        ]
      });
    }
  };

  // js/modules/users.js
  init_formatters();
  init_toast();
  var ROLE_LIST = [ROLES.DEV, ROLES.GERENTE, ROLES.VENDEDOR, ROLES.BODEGA, ROLES.PRODUCCION, ROLES.CAJA];
  var DEFAULT_PERMS = {
    [ROLES.DEV]: Object.values(PERMISSIONS),
    [ROLES.GERENTE]: ["VER", "CREAR", "EDITAR", "ELIMINAR", "AUTORIZAR", "EXPORTAR", "FINANCIERO"],
    [ROLES.VENDEDOR]: ["VER", "CREAR"],
    [ROLES.BODEGA]: ["VER", "CREAR", "EDITAR"],
    [ROLES.PRODUCCION]: ["VER", "CREAR", "EDITAR"],
    [ROLES.CAJA]: ["VER", "CREAR"]
  };
  var UsersModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant.id;
      const allUsers = await DB.getAll(STORES.USERS);
      const users = allUsers.filter((u) => u.tenantId === tenantId || u.rol === ROLES.DEV);
      const currentUser = AuthServiceInstance.getCurrentUser();
      const isDev = AuthServiceInstance.isDeveloper();
      const hasRecovery = await AuthServiceInstance.hasRecoveryCode();
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Usuarios y Control de Accesos</h1>
          <p>Cuentas, roles y permisos. Cada usuario ingresa con un PIN de 4 d\xEDgitos.</p>
        </div>
        <div class="view-actions">
          ${isDev ? `
            <button class="btn btn-secondary btn-sm" id="btn-recovery-code">\u{1F511} ${hasRecovery ? "Regenerar" : "Generar"} c\xF3digo de recuperaci\xF3n</button>
            <button class="btn btn-primary btn-sm" id="btn-new-user">\u{1F464} Crear usuario</button>
          ` : '<span class="badge badge-warning" style="font-size: 11px; padding: 6px 12px;">\u{1F512} Edici\xF3n reservada al rol Desarrollador</span>'}
        </div>
      </div>

      ${isDev && !hasRecovery ? `<div class="alert alert-warning mb-3 text-xs">\u26A0\uFE0F No hay c\xF3digo de recuperaci\xF3n configurado. Si olvida su contrase\xF1a no podr\xE1 recuperar el acceso. Gen\xE9relo y gu\xE1rdelo en papel.</div>` : ""}

      <div class="card mb-3" style="padding: 12px 18px;">
        <span class="text-xs text-muted">Sesi\xF3n activa:</span>
        <strong>${esc(currentUser.nombre)}</strong> <span class="badge badge-info">${esc(currentUser.rol)}</span>
      </div>

      <div id="users-table-container"></div>
    `;
      new DataTable({
        containerId: "users-table-container",
        data: users,
        columns: [
          { key: "nombre", title: "Usuario", render: (val, row) => `<div><strong>${esc(val)}</strong><div class="text-xs text-muted">@${esc(row.usuario)}${row.email ? " \u2022 " + esc(row.email) : ""}</div></div>` },
          { key: "rol", title: "Rol", render: (val) => `<span class="badge ${val === ROLES.DEV ? "badge-primary" : "badge-info"} font-bold">${esc(val)}</span>` },
          { key: "permisos", title: "Permisos", render: (val) => (Array.isArray(val) ? val : []).map((p) => `<span class="badge badge-neutral" style="font-size: 10px; margin: 1px;">${esc(p)}</span>`).join(" ") },
          {
            key: "estado",
            title: "Estado",
            render: (val, row) => `
            <span class="badge ${val === "INACTIVO" ? "badge-danger" : "badge-success"}">${esc(val || "ACTIVO")}</span>
            ${row.sinClave || !row.claveHash ? '<span class="badge badge-warning" style="font-size: 10px;">sin PIN</span>' : ""}
            ${row.debeCambiarClave ? '<span class="badge badge-warning" style="font-size: 10px;">debe cambiar PIN</span>' : ""}`
          }
        ],
        actions: (row) => isDev ? `
        <button class="btn btn-secondary btn-sm btn-edit-user" data-id="${esc(row.id)}">\u270F\uFE0F Editar</button>
        ${row.id !== currentUser.id ? `<button class="btn btn-danger btn-sm btn-delete-user" data-id="${esc(row.id)}">\u{1F5D1}\uFE0F</button>` : ""}
      ` : '<span class="badge badge-neutral" style="font-size: 10px;">\u{1F512}</span>'
      });
      if (!isDev)
        return;
      container.querySelector("#btn-new-user").addEventListener("click", () => this.openUserModal(null, tenantId, users, () => this.render(container)));
      container.querySelector("#btn-recovery-code").addEventListener("click", () => {
        Modal.confirm({
          title: "C\xF3digo de recuperaci\xF3n",
          message: "Se generar\xE1 un c\xF3digo nuevo y el anterior dejar\xE1 de funcionar. \xBFContinuar?",
          confirmText: "Generar",
          onConfirm: async () => {
            try {
              const code = await AuthServiceInstance.regenerateRecoveryCode();
              await AuditService.log({ modulo: "Seguridad", accion: "MODIFICAR", registroId: "recuperacion", campoModificado: "C\xF3digo de recuperaci\xF3n", valorNuevo: "Regenerado" });
              Modal.show({
                title: "Nuevo c\xF3digo de recuperaci\xF3n",
                size: "sm",
                content: `<p class="text-xs mb-2">An\xF3telo en papel y gu\xE1rdelo fuera del computador. No se volver\xE1 a mostrar.</p><div class="recovery-code">${esc(code)}</div>`,
                footerButtons: [{ label: "Ya lo anot\xE9", class: "btn-primary", onClick: () => {
                  Modal.close();
                  this.render(container);
                } }]
              });
            } catch (err) {
              Toast.error(err.message);
            }
          }
        });
      });
      container.querySelector("#users-table-container").addEventListener("click", (e) => {
        const editBtn = e.target.closest(".btn-edit-user");
        const delBtn = e.target.closest(".btn-delete-user");
        if (editBtn) {
          const user = users.find((u) => u.id === editBtn.getAttribute("data-id"));
          this.openUserModal(user, tenantId, users, () => this.render(container));
        }
        if (delBtn) {
          const user = users.find((u) => u.id === delBtn.getAttribute("data-id"));
          if (!user || user.id === currentUser.id)
            return;
          const devs = allUsers.filter((u) => u.rol === ROLES.DEV && u.estado !== "INACTIVO");
          if (user.rol === ROLES.DEV && devs.length <= 1) {
            Toast.error("No se puede eliminar el \xFAnico Desarrollador activo.");
            return;
          }
          Modal.confirm({
            title: "Eliminar usuario",
            message: `\xBFEliminar permanentemente a <strong>${esc(user.nombre)}</strong>? Su historial en auditor\xEDa se conserva. Si solo quiere bloquear el acceso, ed\xEDtelo y m\xE1rquelo INACTIVO.`,
            confirmText: "S\xED, eliminar",
            isDanger: true,
            onConfirm: async () => {
              await DB.delete(STORES.USERS, user.id);
              await AuditService.log({ modulo: "Seguridad", accion: "ELIMINAR", registroId: user.id, campoModificado: "Usuario", valorAnterior: user.usuario });
              Toast.success("Usuario eliminado.");
              this.render(container);
            }
          });
        }
      });
    },
    openUserModal(user, tenantId, users, onSaved) {
      const isEdit = !!user;
      const allPerms = Object.values(PERMISSIONS);
      const userPerms = user ? user.permisos || [] : DEFAULT_PERMS[ROLES.VENDEDOR];
      const dialog = Modal.show({
        title: isEdit ? `Editar usuario: ${user.nombre}` : "Crear usuario",
        content: `
        <form id="user-form" autocomplete="off">
          <div class="form-row mb-3">
            <div class="form-group"><label class="form-label">Nombre completo</label>
              <input type="text" class="form-control" name="nombre" required value="${esc(user ? user.nombre : "")}"></div>
            <div class="form-group"><label class="form-label">Usuario (login)</label>
              <input type="text" class="form-control" name="usuario" required value="${esc(user ? user.usuario : "")}" autocomplete="off"></div>
          </div>
          <div class="form-row mb-3">
            <div class="form-group"><label class="form-label">Correo (opcional)</label>
              <input type="email" class="form-control" name="email" value="${esc(user ? user.email || "" : "")}"></div>
            <div class="form-group"><label class="form-label">Rol</label>
              <select class="form-select" name="rol" id="user-role-sel">
                ${ROLE_LIST.map((r) => `<option value="${esc(r)}" ${user && user.rol === r ? "selected" : ""}>${esc(r)}</option>`).join("")}
              </select></div>
          </div>
          <div class="form-row mb-3">
            <div class="form-group"><label class="form-label">${isEdit ? "Nuevo PIN (vac\xEDo = no cambiar)" : "PIN de 4 d\xEDgitos"}</label>
              <input type="password" class="form-control pin-input" name="clave" ${isEdit ? "" : "required"} inputmode="numeric" maxlength="4" pattern="\\d{4}" autocomplete="off">
              <div class="form-help">${esc(AuthServiceInstance.passwordRules())}</div></div>
            <div class="form-group"><label class="form-label">Estado</label>
              <select class="form-select" name="estado">
                <option value="ACTIVO" ${!user || user.estado !== "INACTIVO" ? "selected" : ""}>ACTIVO</option>
                <option value="INACTIVO" ${user && user.estado === "INACTIVO" ? "selected" : ""}>INACTIVO (sin acceso)</option>
              </select></div>
          </div>
          <label class="d-flex items-center gap-2 text-xs mb-3"><input type="checkbox" name="forzarCambio" ${!isEdit ? "checked" : ""}> Pedir que cambie el PIN en el pr\xF3ximo ingreso</label>
          <div class="card mb-0" style="border: 1px solid var(--border-color);">
            <div class="card-header" style="padding: 10px 14px;"><div class="card-title" style="font-size: 13px;">Permisos</div></div>
            <div class="card-body" style="padding: 12px;">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;" id="perm-grid">
                ${allPerms.map((p) => `
                  <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer;">
                    <input type="checkbox" name="permiso_${p}" value="${p}" ${userPerms.includes(p) ? "checked" : ""}>
                    <span>${p === "FINANCIERO" ? "VER INFORMACI\xD3N FINANCIERA" : p === "AUTORIZAR" ? "AUTORIZAR (anular ventas)" : p}</span>
                  </label>`).join("")}
              </div>
            </div>
          </div>
        </form>`,
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: isEdit ? "Guardar cambios" : "Crear usuario",
            class: "btn-primary",
            onClick: async () => {
              const form = dialog.querySelector("#user-form");
              if (!form.checkValidity()) {
                form.reportValidity();
                return;
              }
              const fd = new FormData(form);
              const usuario = String(fd.get("usuario")).trim().toLowerCase();
              if (!/^[a-z0-9._-]{3,30}$/.test(usuario)) {
                Toast.warning("El usuario debe tener 3-30 caracteres: letras, n\xFAmeros, punto, guion o guion bajo.");
                return;
              }
              const all = await DB.getAll(STORES.USERS);
              if (all.some((u) => String(u.usuario).toLowerCase() === usuario && (!user || u.id !== user.id))) {
                Toast.warning("Ya existe un usuario con ese nombre de acceso.");
                return;
              }
              const clave = String(fd.get("clave") || "");
              if (clave && !AuthServiceInstance.isStrongPassword(clave)) {
                Toast.warning(AuthServiceInstance.passwordRules());
                return;
              }
              const rol = fd.get("rol");
              const estado = fd.get("estado");
              if (isEdit && user.id === AuthServiceInstance.getCurrentUser().id && (estado === "INACTIVO" || rol !== user.rol)) {
                Toast.warning("No puede cambiar su propio rol ni desactivarse.");
                return;
              }
              const payload = {
                ...user || {},
                tenantId: user ? user.tenantId : tenantId,
                nombre: String(fd.get("nombre")).trim(),
                usuario,
                email: String(fd.get("email") || "").trim(),
                rol,
                estado,
                permisos: allPerms.filter((p) => fd.get(`permiso_${p}`)),
                debeCambiarClave: !!fd.get("forzarCambio") || (user ? !!user.debeCambiarClave && !clave : false)
              };
              delete payload.clave;
              if (clave) {
                payload.claveHash = await CryptoUtil.hashPassword(clave);
                delete payload.sinClave;
              }
              if (isEdit) {
                await DB.update(STORES.USERS, payload);
              } else {
                await DB.add(STORES.USERS, payload);
              }
              await AuditService.log({
                modulo: "Seguridad",
                accion: isEdit ? "MODIFICAR" : "CREAR",
                registroId: payload.id,
                campoModificado: "Usuario",
                valorNuevo: `${payload.usuario} (${payload.rol}, ${payload.estado})${clave ? " + clave" : ""}`
              });
              Toast.success(isEdit ? "Usuario actualizado." : "Usuario creado.");
              Modal.close();
              if (onSaved)
                onSaved();
            }
          }
        ]
      });
      const roleSel = dialog.querySelector("#user-role-sel");
      roleSel.addEventListener("change", () => {
        const perms = DEFAULT_PERMS[roleSel.value] || [];
        dialog.querySelectorAll("#perm-grid input[type=checkbox]").forEach((chk) => {
          chk.checked = perms.includes(chk.value);
        });
      });
    }
  };

  // js/modules/audit.js
  init_formatters();
  init_export_service();
  var AuditModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const logs = (await DB.getAll(STORES.AUDIT_LOGS, tenantId)).sort((a, b) => new Date(b.fechaCreacion || b.fecha) - new Date(a.fechaCreacion || a.fecha));
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Bit\xE1cora de Auditor\xEDa Transaccional</h1>
          <p>Trazabilidad estricta de cambios de precios, modificaciones de inventario, accesos y operaciones cr\xEDticas</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-export-audit">\u{1F4CA} Exportar Bit\xE1cora (CSV)</button>
        </div>
      </div>

      <div class="card mb-4" style="background: var(--bg-surface-solid); padding: 12px 16px; border: 1px solid var(--border-color);">
        <div class="text-xs text-muted">
          \u2139\uFE0F Todos los eventos son registrados de forma autom\xE1tica con marca de tiempo, usuario autenticado, valores anteriores y nuevos para cumplimiento normativo.
        </div>
      </div>

      <div id="audit-table-container"></div>
    `;
      new DataTable({
        containerId: "audit-table-container",
        data: logs,
        columns: [
          {
            key: "fecha",
            title: "Fecha y Hora",
            render: (val, row) => `
            <div>
              <strong>${Formatters.date(val)}</strong>
              <div class="text-xs text-muted">${esc(row.hora || "")}</div>
            </div>
          `
          },
          {
            key: "usuarioNombre",
            title: "Usuario Operador",
            render: (val) => `<strong>${esc(val || "Sistema")}</strong>`
          },
          {
            key: "modulo",
            title: "M\xF3dulo",
            render: (val) => `<span class="badge badge-info">${esc(val)}</span>`
          },
          {
            key: "accion",
            title: "Acci\xF3n",
            render: (val) => {
              const map = {
                CREAR: "badge-success",
                MODIFICAR: "badge-warning",
                ELIMINAR: "badge-danger",
                AUTORIZAR: "badge-primary",
                LOGIN: "badge-neutral"
              };
              return `<span class="badge ${map[val] || "badge-neutral"}">${esc(val)}</span>`;
            }
          },
          {
            key: "registroId",
            title: "Registro Afectado",
            render: (val) => `<code>${esc(val || "-")}</code>`
          },
          {
            key: "campoModificado",
            title: "Detalle / Campo",
            render: (val) => `<strong>${esc(val || "-")}</strong>`
          },
          {
            key: "valorAnterior",
            title: "Valor Anterior",
            render: (val) => `<span class="text-muted" style="text-decoration: line-through;">${esc(val || "-")}</span>`
          },
          {
            key: "valorNuevo",
            title: "Valor Nuevo",
            render: (val) => `<strong class="text-primary">${esc(val || "-")}</strong>`
          }
        ]
      });
      container.querySelector("#btn-export-audit").addEventListener("click", () => {
        ExportService.exportToCSV(logs, "Bitacora_Auditoria", {
          fecha: "Fecha",
          hora: "Hora",
          usuarioNombre: "Usuario",
          modulo: "M\xF3dulo",
          accion: "Acci\xF3n",
          registroId: "Registro",
          campoModificado: "Detalle",
          valorAnterior: "Valor Anterior",
          valorNuevo: "Valor Nuevo"
        });
      });
    }
  };

  // js/modules/reports.js
  init_formatters();
  init_export_service();
  var ReportsModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const [sales, products, expenses, customers, cxc, purchases] = await Promise.all([
        DB.getAll(STORES.SALES, tenantId),
        DB.getAll(STORES.PRODUCTS, tenantId),
        DB.getAll(STORES.EXPENSES, tenantId),
        DB.getAll(STORES.CUSTOMERS, tenantId),
        DB.getAll(STORES.RECEIVABLES_CXC, tenantId),
        DB.getAll(STORES.PURCHASES, tenantId)
      ]);
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Centro de Reportes Gerenciales</h1>
          <p>Generaci\xF3n de balances operativos, rentabilidad, inventario y exportaci\xF3n oficial en CSV, Excel y PDF</p>
        </div>
      </div>

      <!-- RENTABILIDAD POR PRODUCTO -->
      <div class="card mb-3" id="profit-card">
        <div class="pricing-toolbar">
          <strong>Rentabilidad por producto</strong>
          <select class="form-select" id="profit-period" style="max-width: 180px;">
            <option value="mes">Mes actual</option>
            <option value="mesAnt">Mes anterior</option>
            <option value="anio">A\xF1o actual</option>
            <option value="todo">Todo</option>
          </select>
          <span class="text-xs text-muted">Ventas sin IVA, sin cotizaciones ni anuladas. Costo = costo de producci\xF3n o compra registrado al vender.</span>
          <button class="btn btn-secondary btn-sm" id="btn-export-profit" style="margin-left: auto;">Exportar CSV</button>
        </div>
        <div class="table-responsive" id="profit-table"></div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
        
        <!-- REPORTE 1: VENTAS Y FACTURACI\xD3N -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div>
              <div class="card-title">\u{1F4C8} Reporte Detallado de Ventas</div>
              <div class="card-subtitle">${sales.length} facturas registradas</div>
            </div>
            <span class="badge badge-success">Ventas</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3">Historial de facturaci\xF3n con desglose de subtotal, IVA, formas de pago y clientes.</p>
            <div class="d-flex gap-2">
              <button class="btn btn-secondary btn-sm" id="btn-export-sales-csv">\u{1F4E5} Exportar CSV</button>
              <button class="btn btn-secondary btn-sm" id="btn-export-sales-excel">\u{1F4CA} Exportar Excel</button>
            </div>
          </div>
        </div>

        <!-- REPORTE 2: INVENTARIO VALORIZADO -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div>
              <div class="card-title">\u{1F4E6} Inventario Valorizado & Kardex</div>
              <div class="card-subtitle">${products.length} productos e insumos</div>
            </div>
            <span class="badge badge-info">Stock</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3">Existencias actuales, costos promedio ponderados, valor total en bodega y alertas de m\xEDnimos.</p>
            <div class="d-flex gap-2">
              <button class="btn btn-secondary btn-sm" id="btn-export-inv-csv">\u{1F4E5} Exportar CSV</button>
              <button class="btn btn-secondary btn-sm" id="btn-export-inv-excel">\u{1F4CA} Exportar Excel</button>
            </div>
          </div>
        </div>

        <!-- REPORTE 3: CARTERA Y EDADES DE VENCIMIENTO -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div>
              <div class="card-title">\u{1F465} Estado de Cartera de Clientes</div>
              <div class="card-subtitle">${cxc.filter((c) => c.saldo > 0).length} cuentas pendientes</div>
            </div>
            <span class="badge badge-warning">Cobranzas</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3">Antig\xFCedad de saldos por cliente, d\xEDas de mora cr\xEDtica y fechas de vencimiento.</p>
            <div class="d-flex gap-2">
              <button class="btn btn-secondary btn-sm" id="btn-export-cxc-csv">\u{1F4E5} Exportar CSV</button>
              <button class="btn btn-secondary btn-sm" id="btn-export-cxc-excel">\u{1F4CA} Exportar Excel</button>
            </div>
          </div>
        </div>

        <!-- REPORTE 4: GASTOS Y COSTOS OPERATIVOS -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div>
              <div class="card-title">\u{1F3F7}\uFE0F Consolidado de Gastos</div>
              <div class="card-subtitle">${expenses.length} egresos</div>
            </div>
            <span class="badge badge-danger">Egresos</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3">Gastos por categor\xEDa contable (Servicios, N\xF3mina, Combustible, Publicidad, Arriendo).</p>
            <div class="d-flex gap-2">
              <button class="btn btn-secondary btn-sm" id="btn-export-exp-csv">\u{1F4E5} Exportar CSV</button>
              <button class="btn btn-secondary btn-sm" id="btn-export-exp-excel">\u{1F4CA} Exportar Excel</button>
            </div>
          </div>
        </div>

        <!-- REPORTE 5: CLIENTES PRINCIPALES -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div>
              <div class="card-title">\u2B50 Clientes Principales & Volumen</div>
              <div class="card-subtitle">${customers.length} terceros activos</div>
            </div>
            <span class="badge badge-primary">Comercial</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3">Ranking de clientes por total comprado acumulado, frecuencia y ticket promedio.</p>
            <div class="d-flex gap-2">
              <button class="btn btn-secondary btn-sm" id="btn-export-clients-csv">\u{1F4E5} Exportar CSV</button>
              <button class="btn btn-secondary btn-sm" id="btn-export-clients-excel">\u{1F4CA} Exportar Excel</button>
            </div>
          </div>
        </div>

        <!-- REPORTE 6: ESTADO FINANCIERO EJECUTIVO (PDF) -->
        <div class="card" style="margin-bottom: 0; border: 1px solid var(--brand-primary); background: #f0f9ff;">
          <div class="card-header" style="background: transparent;">
            <div>
              <div class="card-title">\u{1F4C4} Informe Ejecutivo Resumido</div>
              <div class="card-subtitle">Balance consolidado mensual</div>
            </div>
            <span class="badge badge-info">PDF</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3">Genera el reporte ejecutivo membretado con indicadores de ventas, costos, gastos y margen para gerencia.</p>
            <button class="btn btn-primary btn-sm" id="btn-print-executive-report">\u{1F5A8}\uFE0F Generar Informe PDF</button>
          </div>
        </div>

      </div>
    `;
      let profitRows = [];
      const renderProfit = () => {
        const now = /* @__PURE__ */ new Date();
        const per = FinanceService.periods(now);
        const sel = container.querySelector("#profit-period").value;
        const range = sel === "mes" ? per.mes : sel === "anio" ? per.anio : sel === "mesAnt" ? { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 1) } : { from: null, to: null };
        profitRows = FinanceService.byProduct(sales, products, range.from, range.to);
        const tot = profitRows.reduce((a, r) => ({ u: a.u + r.unidades, v: a.v + r.ventasNetas, c: a.c + r.costo, g: a.g + r.utilidad }), { u: 0, v: 0, c: 0, g: 0 });
        const mg = (m) => m === null ? "\u2014" : `<span class="mg ${m < 10 ? "mg-bad" : m < 20 ? "mg-warn" : "mg-ok"}">${m}%</span>`;
        container.querySelector("#profit-table").innerHTML = profitRows.length ? `
        <table class="table pricing-table">
          <thead><tr><th>Producto</th><th class="text-right">Unidades</th><th class="text-right">Ventas netas</th><th class="text-right">Costo vendido</th><th class="text-right">Utilidad bruta</th><th class="text-right">Margen</th></tr></thead>
          <tbody>
            ${profitRows.map((r) => `<tr>
              <td><strong>${esc(r.nombre)}</strong> <span class="text-xs text-muted">${esc(r.sku)}</span>${r.costoEstimado ? ' <span class="text-xs text-warning" title="Ventas antiguas sin costo guardado: se us\xF3 el costo promedio actual">costo estimado</span>' : ""}</td>
              <td class="text-right">${Formatters.number(r.unidades, Number.isInteger(r.unidades) ? 0 : 2)}</td>
              <td class="text-right">${Formatters.currency(r.ventasNetas)}</td>
              <td class="text-right">${Formatters.currency(r.costo)}</td>
              <td class="text-right ${r.utilidad < 0 ? "text-danger" : ""}"><strong>${Formatters.currency(r.utilidad)}</strong></td>
              <td class="text-right">${mg(r.margenPct)}</td></tr>`).join("")}
            <tr><td><strong>Total</strong></td><td class="text-right">${Formatters.number(tot.u, Number.isInteger(tot.u) ? 0 : 2)}</td><td class="text-right"><strong>${Formatters.currency(tot.v)}</strong></td><td class="text-right"><strong>${Formatters.currency(tot.c)}</strong></td><td class="text-right"><strong>${Formatters.currency(tot.g)}</strong></td><td class="text-right">${mg(tot.v > 0 ? Math.round(tot.g / tot.v * 1e3) / 10 : null)}</td></tr>
          </tbody>
        </table>` : '<div class="p-4 text-center text-muted">No hay ventas en este periodo.</div>';
      };
      container.querySelector("#profit-period").addEventListener("change", renderProfit);
      container.querySelector("#btn-export-profit").addEventListener("click", () => {
        ExportService.exportToCSV(profitRows, "Rentabilidad_por_producto", {
          sku: "SKU",
          nombre: "Producto",
          unidades: "Unidades",
          ventasNetas: "Ventas netas (sin IVA)",
          costo: "Costo vendido",
          utilidad: "Utilidad bruta",
          margenPct: "Margen %"
        });
      });
      renderProfit();
      container.querySelector("#btn-export-sales-csv").addEventListener("click", () => {
        ExportService.exportToCSV(sales, "Ventas_Facturacion", {
          consecutivo: "Consecutivo",
          fecha: "Fecha",
          clienteNombre: "Cliente",
          clienteNit: "NIT",
          metodoPago: "Forma Pago",
          subtotal: "Subtotal",
          impuestos: "IVA",
          total: "Total Venta"
        });
      });
      container.querySelector("#btn-export-sales-excel").addEventListener("click", () => {
        ExportService.exportToCSV(sales, "Ventas_Facturacion_Excel");
      });
      container.querySelector("#btn-export-inv-csv").addEventListener("click", () => {
        ExportService.exportToCSV(products, "Inventario_Valorizado", {
          sku: "SKU",
          nombre: "Producto",
          categoria: "Categor\xEDa",
          tipoItem: "Tipo",
          unidadMedida: "Unidad",
          stock: "Existencias",
          costoPromedio: "Costo Promedio",
          stockMinimo: "Stock M\xEDnimo"
        });
      });
      container.querySelector("#btn-export-inv-excel").addEventListener("click", () => {
        ExportService.exportToCSV(products, "Inventario_Valorizado_Excel");
      });
      container.querySelector("#btn-export-cxc-csv").addEventListener("click", () => {
        ExportService.exportToCSV(cxc, "Cartera_Cuentas_Cobrar", {
          documento: "Documento",
          clienteNombre: "Cliente",
          fechaEmision: "Emisi\xF3n",
          fechaVencimiento: "Vencimiento",
          valorTotal: "Total",
          abonos: "Abonos",
          saldo: "Saldo Pendiente",
          diasMora: "D\xEDas Mora",
          estado: "Estado"
        });
      });
      container.querySelector("#btn-export-cxc-excel").addEventListener("click", () => {
        ExportService.exportToCSV(cxc, "Cartera_Cuentas_Cobrar_Excel");
      });
      container.querySelector("#btn-export-exp-csv").addEventListener("click", () => {
        ExportService.exportToCSV(expenses, "Gastos_Operativos");
      });
      container.querySelector("#btn-export-exp-excel").addEventListener("click", () => {
        ExportService.exportToCSV(expenses, "Gastos_Operativos_Excel");
      });
      container.querySelector("#btn-export-clients-csv").addEventListener("click", () => {
        ExportService.exportToCSV(customers, "Clientes_Directorio");
      });
      container.querySelector("#btn-export-clients-excel").addEventListener("click", () => {
        ExportService.exportToCSV(customers, "Clientes_Directorio_Excel");
      });
      container.querySelector("#btn-print-executive-report").addEventListener("click", () => {
        const P = FinanceService.periods();
        const periodo = P.anio;
        const fin = FinanceService.summarize({ sales, expenses, products, from: periodo.from, to: periodo.to });
        const totalVentas = fin.ventasNetas;
        const totalGastos = fin.gastos;
        const invValorizado = products.reduce((a, p) => a + Number(p.stock || 0) * Number(p.costoPromedio || 0), 0);
        const carteraActiva = cxc.filter((c) => c.estado !== "ANULADA").reduce((a, c) => a + Number(c.saldo || 0), 0);
        const margenEst = fin.utilidadOperativa;
        const header = PrintTemplates.getHeader("INFORME EJECUTIVO DE GESTI\xD3N", `INF-${(/* @__PURE__ */ new Date()).getFullYear()}`, (/* @__PURE__ */ new Date()).toISOString());
        const maxVal = Math.max(totalVentas, totalGastos, carteraActiva, 1);
        const wVentas = Math.round(totalVentas / maxVal * 100);
        const wGastos = Math.round(totalGastos / maxVal * 100);
        const wCartera = Math.round(carteraActiva / maxVal * 100);
        const reportHtml = `
          ${header}

          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 15px;">Resumen Ejecutivo del Per\xEDodo</h3>
            <p style="margin: 0; color: #475569; font-size: 13px;">Consolidado contable de operaciones, ingresos de venta, flujo de inventario y estado financiero para <strong>${esc(tenant.nombreComercial)}</strong>.</p>
          </div>

          <!-- GR\xC1FICO GERENCIAL INCRUSTADO (HTML/CSS Puro) -->
          <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e5e5ea; border-radius: 8px;">
            <h4 style="margin: 0 0 15px 0; font-size: 13px; color: #1d1d1f; border-bottom: 1px solid #eee; padding-bottom: 8px;">Indicadores Financieros - Gr\xE1fico Comparativo</h4>
            
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <div style="width: 120px; font-size: 12px; font-weight: bold; color: #0284c7;">Ventas netas</div>
              <div style="flex: 1; background: #e2e8f0; height: 16px; border-radius: 8px; overflow: hidden; margin: 0 10px;">
                <div style="width: ${wVentas}%; background: #0284c7; height: 100%;"></div>
              </div>
              <div style="width: 100px; text-align: right; font-size: 12px; font-weight: bold;">${Formatters.currency(totalVentas)}</div>
            </div>

            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <div style="width: 120px; font-size: 12px; font-weight: bold; color: #ef4444;">Gastos</div>
              <div style="flex: 1; background: #e2e8f0; height: 16px; border-radius: 8px; overflow: hidden; margin: 0 10px;">
                <div style="width: ${wGastos}%; background: #ef4444; height: 100%;"></div>
              </div>
              <div style="width: 100px; text-align: right; font-size: 12px; font-weight: bold;">${Formatters.currency(totalGastos)}</div>
            </div>

            <div style="display: flex; align-items: center;">
              <div style="width: 120px; font-size: 12px; font-weight: bold; color: #f59e0b;">Cartera CXC</div>
              <div style="flex: 1; background: #e2e8f0; height: 16px; border-radius: 8px; overflow: hidden; margin: 0 10px;">
                <div style="width: ${wCartera}%; background: #f59e0b; height: 100%;"></div>
              </div>
              <div style="width: 100px; text-align: right; font-size: 12px; font-weight: bold;">${Formatters.currency(carteraActiva)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Indicador Clave de Gesti\xF3n</th>
                <th class="text-right">Valor Consolidado (COP)</th>
                <th>Detalle Operativo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Ventas netas (sin IVA)</strong></td>
                <td class="text-right font-bold" style="color: #0284c7;">${Formatters.currency(totalVentas)}</td>
                <td>${fin.n} ventas del a\xF1o (excluye cotizaciones y anuladas). IVA generado: ${Formatters.currency(fin.iva)}</td>
              </tr>
              <tr>
                <td><strong>Costo de la mercanc\xEDa vendida</strong></td>
                <td class="text-right font-bold" style="color: #ef4444;">-${Formatters.currency(fin.costoVentas)}</td>
                <td>${fin.costoEstimado ? "Incluye ventas antiguas con costo estimado al costo promedio actual" : "Costo registrado en Kardex al momento de cada venta"}</td>
              </tr>
              <tr>
                <td><strong>Comisiones freelance</strong></td>
                <td class="text-right font-bold" style="color: #ef4444;">-${Formatters.currency(fin.comisiones)}</td>
                <td>Causadas en ventas del a\xF1o</td>
              </tr>
              <tr>
                <td><strong>Gastos Operativos & Administrativos</strong></td>
                <td class="text-right font-bold" style="color: #ef4444;">-${Formatters.currency(totalGastos)}</td>
                <td>Gastos registrados en el a\xF1o</td>
              </tr>
              <tr>
                <td><strong>Inventario F\xEDsico Valorizado</strong></td>
                <td class="text-right font-bold">${Formatters.currency(invValorizado)}</td>
                <td>${products.length} referencias en bodegas activas</td>
              </tr>
              <tr>
                <td><strong>Cartera Comercial Pendiente (CXC)</strong></td>
                <td class="text-right font-bold" style="color: #f59e0b;">${Formatters.currency(carteraActiva)}</td>
                <td>Cr\xE9ditos comerciales vigentes</td>
              </tr>
              <tr style="background: ${margenEst >= 0 ? "#ecfdf5" : "#fef2f2"};">
                <td><strong>Utilidad operativa del a\xF1o</strong></td>
                <td class="text-right font-bold" style="color: ${margenEst >= 0 ? "#059669" : "#dc2626"}; font-size: 15px;">${Formatters.currency(margenEst)}</td>
                <td>Ventas netas \u2212 costo \u2212 comisiones \u2212 gastos${fin.margenBrutoPct !== null ? ` \xB7 margen bruto ${fin.margenBrutoPct.toFixed(1)}%` : ""}</td>
              </tr>
            </tbody>
          </table>

          <div class="doc-footer" style="margin-top: 40px;">
          <p>Informe generado confidencialmente para la junta directiva y gerencia general.</p>
          <p style="margin-top: 4px; font-size: 10px;">Cifras de gesti\xF3n interna; no reemplazan los estados financieros elaborados por el contador.</p>
        </div>
      `;
        ExportService.printDocument(reportHtml, "Informe_Ejecutivo_Nexa");
      });
    }
  };

  // js/modules/settings.js
  init_formatters();
  init_toast();
  var SettingsModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const allTenants = await TenantServiceInstance.getAllTenants();
      const priceLists = await DB.getAll(STORES.PRICE_LISTS, tenant.id);
      const warehouses = await DB.getAll(STORES.WAREHOUSES, tenant.id);
      const isDev = AuthServiceInstance.isDeveloper();
      container.innerHTML = `
            <div class="view-header">
        <div class="view-title-wrap">
          <h1>Configuraci\xF3n General & Multiempresa</h1>
          <p>Identidad visual, datos tributarios DIAN, paleta de colores corporativos y par\xE1metros del sistema</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-primary btn-sm" id="btn-save-settings">\u{1F4BE} Guardar Configuraci\xF3n</button>
        </div>
      </div>

      <!-- SWITCHER DE EMPRESA MULTITENANT ACTIVA & GESTI\xD3N MASTER -->
      <div class="card mb-4" style="background: var(--bg-surface); border: 1px solid var(--border-color); padding: 16px 20px;">
        <div class="d-flex justify-between items-center flex-wrap gap-3">
          <div>
            <div class="text-xs font-bold text-muted">EMPRESA ACTIVA ACTUAL:</div>
            <div style="font-size: 16px; font-weight: 800; color: var(--brand-primary); margin-top: 2px;">
              ${esc(tenant.nombreComercial)} (NIT: ${esc(tenant.nit)}-${tenant.dv})
            </div>
          </div>
          <div class="d-flex items-center gap-2 flex-wrap">
            ${isDev ? `
            <label class="text-xs font-bold text-muted">CONMUTAR EMPRESA:</label>
            <select class="form-select" id="sel-switch-tenant" style="width: auto; font-size: 13px; font-weight: 600;">
              ${allTenants.map((t) => `
                <option value="${t.id}" ${t.id === tenant.id ? "selected" : ""}>
                  ${esc(t.nombreComercial)} (${esc(t.ciudad)})
                </option>
              `).join("")}
            </select>
            ` : ""}
            ${isDev ? `
              <button type="button" class="btn btn-secondary btn-sm" id="btn-create-tenant" title="Crear nueva organizaci\xF3n">
                \u{1F3E2} + Nueva Empresa
              </button>
            ` : `
              <span class="badge badge-warning text-xs" title="Creaci\xF3n de empresas restringida al Desarrollador">
                \u{1F512} Multiempresa Protegida
              </span>
            `}
          </div>
        </div>
      </div>

      <form id="settings-form">
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
          
          <!-- COLUMNA IZQUIERDA: DATOS CORPORATIVOS Y TRIBUTARIOS -->
          <div class="d-flex flex-col gap-4">
            
            <!-- DATOS GENERALES Y DIAN -->
            <div class="card" style="margin-bottom: 0;">
              <div class="card-header">
                <div class="card-title">Datos Empresariales & Tributarios (Colombia)</div>
              </div>
              <div class="card-body">
                <div class="form-row mb-3">
                  <div class="form-group">
                    <label class="form-label">Nombre Comercial de la Empresa</label>
                    <input type="text" class="form-control" name="nombreComercial" required value="${esc(tenant.nombreComercial)}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Raz\xF3n Social Legal</label>
                    <input type="text" class="form-control" name="razonSocial" required value="${esc(tenant.razonSocial)}">
                  </div>
                </div>

                <div class="form-row mb-3">
                  <div class="form-group">
                    <label class="form-label">NIT (Sin d\xEDgito de verificaci\xF3n)</label>
                    <input type="text" class="form-control" id="inp-tenant-nit" name="nit" required value="${esc(tenant.nit)}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">D\xEDgito de Verificaci\xF3n (DV DIAN)</label>
                    <input type="text" class="form-control" id="inp-tenant-dv" name="dv" readonly value="${esc(tenant.dv)}" style="font-weight: bold;">
                  </div>
                </div>

                <div class="form-row mb-3">
                  <div class="form-group">
                    <label class="form-label">R\xE9gimen Tributario</label>
                    <select class="form-select" name="regimen">
                      <option value="Responsable de IVA" ${tenant.regimen === "Responsable de IVA" ? "selected" : ""}>Responsable de IVA (Com\xFAn)</option>
                      <option value="No Responsable de IVA" ${tenant.regimen === "No Responsable de IVA" ? "selected" : ""}>No Responsable de IVA (Simplificado)</option>
                      <option value="R\xE9gimen Simple de Tributaci\xF3n (RST)" ${tenant.regimen === "R\xE9gimen Simple de Tributaci\xF3n (RST)" ? "selected" : ""}>R\xE9gimen Simple de Tributaci\xF3n (RST)</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Moneda Principal</label>
                    <input type="text" class="form-control" readonly value="COP (Peso Colombiano)" style="">
                  </div>
                </div>

                <div class="form-row mb-3">
                  <div class="form-group">
                    <label class="form-label">Direcci\xF3n Fiscal / Sede Principal</label>
                    <input type="text" class="form-control" name="direccion" value="${esc(tenant.direccion || "")}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Ciudad</label>
                    <input type="text" class="form-control" name="ciudad" value="${esc(tenant.ciudad || "")}">
                  </div>
                </div>

                <div class="form-row mb-3">
                  <div class="form-group">
                    <label class="form-label">Departamento</label>
                    <input type="text" class="form-control" name="departamento" value="${esc(tenant.departamento || "Antioquia")}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Tel\xE9fono Fijo / PBX</label>
                    <input type="text" class="form-control" name="telefono" value="${esc(tenant.telefono || "")}">
                  </div>
                </div>

                <div class="form-row mb-3">
                  <div class="form-group">
                    <label class="form-label">WhatsApp Comercial</label>
                    <input type="text" class="form-control" name="whatsapp" value="${esc(tenant.whatsapp || "")}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Correo Electr\xF3nico Oficial</label>
                    <input type="email" class="form-control" name="email" value="${esc(tenant.email || "")}">
                  </div>
                </div>

                <div class="form-row mb-3">
                  <div class="form-group">
                    <label class="form-label">Prefijo de ventas</label>
                    <input type="text" class="form-control" name="prefijoVenta" maxlength="6" value="${esc(tenant.prefijoVenta || "")}" placeholder="Ej: RP">
                    <div class="form-help">Numeraci\xF3n: ${esc(tenant.prefijoVenta || "V")}-000001</div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Prefijo de cotizaciones</label>
                    <input type="text" class="form-control" name="prefijoCotizacion" maxlength="6" value="${esc(tenant.prefijoCotizacion || "COT")}">
                  </div>
                </div>
                <div class="form-row mb-3">
                  <div class="form-group">
                    <label class="form-label">WhatsApp de gerencia (reportes de cierre)</label>
                    <input type="text" class="form-control" name="whatsappGerencia" value="${esc(tenant.whatsappGerencia || "")}" placeholder="Ej: 3001234567">
                  </div>
                  <div class="form-group">
                    <label class="form-label">D\xEDas de validez de cotizaciones</label>
                    <input type="number" min="1" class="form-control" name="diasValidezCotizacion" value="${esc(tenant.diasValidezCotizacion || 15)}">
                  </div>
                </div>
                <div class="form-row mb-3">
                  <div class="form-group">
                    <label class="form-label">Firma en \xF3rdenes de producci\xF3n: nombre</label>
                    <input type="text" class="form-control" name="firmaNombre" value="${esc(tenant.firmaNombre || "")}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Cargo</label>
                    <input type="text" class="form-control" name="firmaCargo" value="${esc(tenant.firmaCargo || "")}">
                  </div>
                </div>
                <div class="form-group mb-3">
                  <label class="form-label">Pie de p\xE1gina de documentos</label>
                  <input type="text" class="form-control" name="piePaginaDocumentos" value="${esc(tenant.piePaginaDocumentos || "")}" placeholder="Ej: Gracias por su compra. Garant\xEDa de 30 d\xEDas.">
                </div>
                <div class="alert alert-info text-xs mb-0">
                  Los documentos de venta se imprimen como <strong>documento interno</strong>. La facturaci\xF3n electr\xF3nica requiere un proveedor tecnol\xF3gico autorizado por la DIAN (pendiente de integraci\xF3n); por eso no se configura aqu\xED una resoluci\xF3n de facturaci\xF3n.
                </div>
              </div>
            </div>

            <!-- IDENTIDAD VISUAL, LOGOS & MEMBRETE MULTIEMPRESA -->
            <div class="card" style="margin-bottom: 0;">
              <div class="card-header">
                <div class="card-title">\u{1F5BC}\uFE0F Identidad Visual, Logos & Membretes Oficiales</div>
              </div>
              <div class="card-body">
                <p class="text-xs text-muted mb-3">
                  Adjunte los logos y membretes para personalizar la aplicaci\xF3n y los documentos impresos. Si no adjunta ning\xFAn archivo, el sistema generar\xE1 autom\xE1ticamente un isotipo o membrete vectorial con las iniciales y colores de su empresa.
                </p>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px;">
                  
                  <!-- 1. ISOTIPO CUADRADO (MODO CLARO) -->
                  <div class="card p-3" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); margin-bottom: 0;">
                    <div class="d-flex justify-between items-center mb-1">
                      <strong class="text-xs">Isotipo (Modo Claro)</strong>
                      <span class="badge ${tenant.isotipoLightUrl ? "badge-info" : "badge-neutral"}" id="badge-status-isotipo-light">
                        ${tenant.isotipoLightUrl ? "Personalizado" : "\u2728 Autom\xE1tico"}
                      </span>
                    </div>
                    <div class="text-xs text-muted mb-2">Esquina superior izq. en Modo Claro</div>
                    <div class="d-flex items-center gap-3">
                      <div style="width: 60px; height: 60px; border-radius: 12px; background: #ffffff; border: 1px solid rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; box-shadow: var(--shadow-xs);">
                        <img id="prev-isotipo-light" src="${TenantServiceInstance.getIsotipo(tenant, false)}" alt="Isotipo Claro" style="width: 100%; height: 100%; object-fit: contain;">
                      </div>
                      <div class="d-flex flex-col gap-1 flex-1">
                        <input type="file" id="file-isotipo-light" accept="image/*" style="display: none;">
                        <button type="button" class="btn btn-secondary btn-sm" id="btn-upload-isotipo-light">\u{1F4CE} Adjuntar</button>
                        <button type="button" class="btn btn-secondary btn-sm text-xs" id="btn-auto-isotipo-light">\u2728 Autom\xE1tico</button>
                      </div>
                    </div>
                  </div>

                  <!-- 2. ISOTIPO CUADRADO (MODO OSCURO) -->
                  <div class="card p-3" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); margin-bottom: 0;">
                    <div class="d-flex justify-between items-center mb-1">
                      <strong class="text-xs">Isotipo (Modo Oscuro)</strong>
                      <span class="badge ${tenant.isotipoDarkUrl ? "badge-info" : "badge-neutral"}" id="badge-status-isotipo-dark">
                        ${tenant.isotipoDarkUrl ? "Personalizado" : "\u2728 Autom\xE1tico"}
                      </span>
                    </div>
                    <div class="text-xs text-muted mb-2">Esquina superior izq. en Modo Oscuro</div>
                    <div class="d-flex items-center gap-3">
                      <div style="width: 60px; height: 60px; border-radius: 12px; background: #000000; border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; box-shadow: var(--shadow-xs);">
                        <img id="prev-isotipo-dark" src="${TenantServiceInstance.getIsotipo(tenant, true)}" alt="Isotipo Oscuro" style="width: 100%; height: 100%; object-fit: contain;">
                      </div>
                      <div class="d-flex flex-col gap-1 flex-1">
                        <input type="file" id="file-isotipo-dark" accept="image/*" style="display: none;">
                        <button type="button" class="btn btn-secondary btn-sm" id="btn-upload-isotipo-dark">\u{1F4CE} Adjuntar</button>
                        <button type="button" class="btn btn-secondary btn-sm text-xs" id="btn-auto-isotipo-dark">\u2728 Autom\xE1tico</button>
                      </div>
                    </div>
                  </div>

                  <!-- 3. LOGO HORIZONTAL COMPLETO -->
                  <div class="card p-3" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); margin-bottom: 0;">
                    <div class="d-flex justify-between items-center mb-1">
                      <strong class="text-xs">Logotipo Horizontal</strong>
                      <span class="badge ${tenant.logoHorizontalLightUrl ? "badge-info" : "badge-neutral"}" id="badge-status-logo-horizontal">
                        ${tenant.logoHorizontalLightUrl ? "Personalizado" : "\u2728 Autom\xE1tico"}
                      </span>
                    </div>
                    <div class="text-xs text-muted mb-2">Facturas, Cotizaciones y R\xF3tulos</div>
                    <div class="d-flex items-center gap-3">
                      <div style="width: 110px; height: 60px; border-radius: 8px; background: #ffffff; border: 1px solid rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; padding: 4px;">
                        <img id="prev-logo-horizontal" src="${TenantServiceInstance.getHorizontalLogo(tenant, false)}" alt="Logo Horizontal" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                      </div>
                      <div class="d-flex flex-col gap-1 flex-1">
                        <input type="file" id="file-logo-horizontal" accept="image/*" style="display: none;">
                        <button type="button" class="btn btn-secondary btn-sm" id="btn-upload-logo-horizontal">\u{1F4CE} Adjuntar</button>
                        <button type="button" class="btn btn-secondary btn-sm text-xs" id="btn-auto-logo-horizontal">\u2728 Autom\xE1tico</button>
                      </div>
                    </div>
                  </div>

                  <!-- 4. MEMBRETE / ENCABEZADO DE DOCUMENTO -->
                  <div class="card p-3" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); margin-bottom: 0;">
                    <div class="d-flex justify-between items-center mb-1">
                      <strong class="text-xs">Membrete de Documentos</strong>
                      <span class="badge ${tenant.membreteUrl ? "badge-info" : "badge-neutral"}" id="badge-status-membrete">
                        ${tenant.membreteUrl ? "Personalizado" : "\u2728 Autom\xE1tico"}
                      </span>
                    </div>
                    <div class="text-xs text-muted mb-2">Banner superior oficial (opcional)</div>
                    <div class="d-flex items-center gap-3">
                      <div style="width: 110px; height: 60px; border-radius: 8px; background: #ffffff; border: 1px solid rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; padding: 2px;">
                        <img id="prev-membrete" src="${tenant.membreteUrl || TenantServiceInstance.generateAutoMembrete(tenant)}" alt="Membrete" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                      </div>
                      <div class="d-flex flex-col gap-1 flex-1">
                        <input type="file" id="file-membrete" accept="image/*" style="display: none;">
                        <button type="button" class="btn btn-secondary btn-sm" id="btn-upload-membrete">\u{1F4CE} Adjuntar</button>
                        <button type="button" class="btn btn-secondary btn-sm text-xs" id="btn-auto-membrete">\u2728 Autom\xE1tico</button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <!-- NOMBRES CONFIGURABLES DE LAS 5 LISTAS DE PRECIOS -->
            <div class="card" style="margin-bottom: 0;">
              <div class="card-header">
                <div class="card-title">Listas de precios</div>
              </div>
              <div class="card-body">
                <p class="text-xs text-muted mb-3">Nombre de cada lista y si sus precios <strong>ya incluyen IVA</strong> (el cliente paga el precio de lista y el IVA se discrimina dentro) o si el IVA se <strong>suma</strong> al precio.</p>
                <div class="d-flex flex-col gap-2">
                  ${[...priceLists].sort((a, b) => (a.orden || 0) - (b.orden || 0)).map((pl) => `
                    <div class="form-row" style="align-items: center;">
                      <div style="font-weight: 700; font-size: 12px; color: var(--brand-primary); width: 40px;">${esc(PricingService.codeOf(pl) || "-")}</div>
                      <input type="text" class="form-control" name="plist_name_${esc(pl.id)}" value="${esc(pl.nombre)}" required style="flex: 1;">
                      <label class="d-flex items-center gap-1 text-xs" style="white-space: nowrap;"><input type="checkbox" name="plist_iva_${esc(pl.id)}" ${pl.incluyeIva ? "checked" : ""}> IVA incluido</label>
                    </div>
                  `).join("")}
                </div>
              </div>
            </div>

          </div>

          <!-- COLUMNA DERECHA: IDENTIDAD VISUAL Y COLORES DIN\xC1MICOS -->
          <div class="d-flex flex-col gap-4">
            
            <div class="card" style="margin-bottom: 0;">
              <div class="card-header">
                <div class="card-title">Paleta de Colores Corporativos</div>
              </div>
              <div class="card-body">
                <p class="text-xs text-muted mb-3">El cambio de colores se aplica inmediatamente a toda la aplicaci\xF3n en tiempo real sin recargar.</p>

                <div class="form-group mb-3">
                  <label class="form-label">Color Principal / Primario</label>
                  <div class="d-flex items-center gap-2">
                    <input type="color" class="form-control" id="inp-color-primary" name="colorPrimary" value="${tenant.colores?.primary || "#0284c7"}" style="width: 50px; height: 38px; padding: 2px;">
                    <input type="text" class="form-control text-xs font-bold" id="inp-color-primary-text" value="${tenant.colores?.primary || "#0284c7"}" readonly>
                  </div>
                </div>

                <div class="form-group mb-3">
                  <label class="form-label">Color Secundario / Acento</label>
                  <div class="d-flex items-center gap-2">
                    <input type="color" class="form-control" id="inp-color-secondary" name="colorSecondary" value="${tenant.colores?.secondary || "#f59e0b"}" style="width: 50px; height: 38px; padding: 2px;">
                    <input type="text" class="form-control text-xs font-bold" id="inp-color-secondary-text" value="${tenant.colores?.secondary || "#f59e0b"}" readonly>
                  </div>
                </div>

                <div class="card p-3" style="background: var(--bg-app); border: 1px solid var(--border-color); text-align: center;">
                  <div class="text-xs font-bold text-muted mb-2">VISTA PREVIA DEL BOT\xD3N:</div>
                  <button type="button" class="btn btn-primary btn-sm mb-2" style="margin: 0 auto;">Bot\xF3n de Muestra</button>
                  <div class="text-xs text-muted">Se adapta al color primario seleccionado</div>
                </div>
              </div>
            </div>

            <!-- BODEGAS REGISTRADAS -->
            <div class="card" style="margin-bottom: 0;">
              <div class="card-header">
                <div class="card-title">Bodegas Configuradas</div>
              </div>
              <div class="card-body" style="padding: 10px 14px;">
                <div class="d-flex flex-col gap-2">
                  ${warehouses.map((w) => `
                    <div class="d-flex justify-between items-center text-xs" style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
                      <div>
                        <strong>${esc(w.nombre)}</strong>
                        <div class="text-muted">${esc(w.codigo)}</div>
                      </div>
                      <span class="badge ${w.esPrincipal ? "badge-info" : "badge-neutral"}">${w.esPrincipal ? "Principal" : "Secundaria"}</span>
                    </div>
                  `).join("")}
                </div>
              </div>
            </div>

          </div>

        </div>
      </form>
    `;
      const selTenant = container.querySelector("#sel-switch-tenant");
      if (selTenant)
        selTenant.addEventListener("change", async (e) => {
          await TenantServiceInstance.switchTenant(e.target.value);
          Toast.success("Empresa conmutada con \xE9xito. Tema e identidad actualizados.");
          this.render(container);
        });
      const btnCreateTenant = container.querySelector("#btn-create-tenant");
      if (btnCreateTenant) {
        btnCreateTenant.addEventListener("click", () => {
          if (!AuthServiceInstance.isDeveloper()) {
            Toast.error("La creaci\xF3n de empresas est\xE1 reservada al Desarrollador del software.");
            return;
          }
          this.openCreateTenantModal(() => this.render(container));
        });
      }
      const nitInput = container.querySelector("#inp-tenant-nit");
      const dvInput = container.querySelector("#inp-tenant-dv");
      nitInput.addEventListener("input", (e) => {
        const clean = e.target.value.replace(/\D/g, "");
        const dv = DianDV.calculate(clean);
        dvInput.value = dv !== null ? dv : "-";
      });
      const colPrim = container.querySelector("#inp-color-primary");
      const colPrimTxt = container.querySelector("#inp-color-primary-text");
      colPrim.addEventListener("input", (e) => {
        colPrimTxt.value = e.target.value;
        document.documentElement.style.setProperty("--brand-primary", e.target.value);
      });
      const colSec = container.querySelector("#inp-color-secondary");
      const colSecTxt = container.querySelector("#inp-color-secondary-text");
      colSec.addEventListener("input", (e) => {
        colSecTxt.value = e.target.value;
        document.documentElement.style.setProperty("--brand-secondary", e.target.value);
      });
      const setupImageUploader = (fileInpId, btnUploadId, btnAutoId, prevImgId, badgeId, fieldName, autoGenFn) => {
        const fileInp = container.querySelector(fileInpId);
        const btnUpload = container.querySelector(btnUploadId);
        const btnAuto = container.querySelector(btnAutoId);
        const prevImg = container.querySelector(prevImgId);
        const badge = container.querySelector(badgeId);
        if (!fileInp || !btnUpload || !btnAuto || !prevImg || !badge)
          return;
        btnUpload.addEventListener("click", () => fileInp.click());
        fileInp.addEventListener("change", (e) => {
          const file = e.target.files[0];
          if (!file)
            return;
          if (!file.type.startsWith("image/")) {
            Toast.error("Por favor seleccione un archivo de imagen v\xE1lido (PNG, JPG, SVG, WEBP).");
            return;
          }
          const reader = new FileReader();
          reader.onload = async (ev) => {
            const dataUrl = ev.target.result;
            tenant[fieldName] = dataUrl;
            if (fieldName === "logoHorizontalLightUrl") {
              tenant.logoUrl = dataUrl;
            }
            prevImg.src = dataUrl;
            badge.className = "badge badge-info";
            badge.textContent = "Personalizado";
            await TenantServiceInstance.updateTenant(tenant);
            Toast.success("Imagen adjuntada y aplicada exitosamente.");
          };
          reader.readAsDataURL(file);
        });
        btnAuto.addEventListener("click", async () => {
          tenant[fieldName] = "";
          if (fieldName === "logoHorizontalLightUrl") {
            tenant.logoUrl = "";
          }
          prevImg.src = autoGenFn();
          badge.className = "badge badge-neutral";
          badge.textContent = "\u2728 Autom\xE1tico";
          await TenantServiceInstance.updateTenant(tenant);
          Toast.info("Se activ\xF3 el dise\xF1o autom\xE1tico con identidad corporativa.");
        });
      };
      setupImageUploader(
        "#file-isotipo-light",
        "#btn-upload-isotipo-light",
        "#btn-auto-isotipo-light",
        "#prev-isotipo-light",
        "#badge-status-isotipo-light",
        "isotipoLightUrl",
        () => TenantServiceInstance.generateAutoIsotipo(tenant, false)
      );
      setupImageUploader(
        "#file-isotipo-dark",
        "#btn-upload-isotipo-dark",
        "#btn-auto-isotipo-dark",
        "#prev-isotipo-dark",
        "#badge-status-isotipo-dark",
        "isotipoDarkUrl",
        () => TenantServiceInstance.generateAutoIsotipo(tenant, true)
      );
      setupImageUploader(
        "#file-logo-horizontal",
        "#btn-upload-logo-horizontal",
        "#btn-auto-logo-horizontal",
        "#prev-logo-horizontal",
        "#badge-status-logo-horizontal",
        "logoHorizontalLightUrl",
        () => TenantServiceInstance.generateAutoHorizontalLogo(tenant, false)
      );
      setupImageUploader(
        "#file-membrete",
        "#btn-upload-membrete",
        "#btn-auto-membrete",
        "#prev-membrete",
        "#badge-status-membrete",
        "membreteUrl",
        () => TenantServiceInstance.generateAutoMembrete(tenant)
      );
      container.querySelector("#btn-save-settings").addEventListener("click", async () => {
        const form = container.querySelector("#settings-form");
        const formData = new FormData(form);
        const cleanNit = formData.get("nit").replace(/\D/g, "");
        const dv = DianDV.calculate(cleanNit);
        const updatedTenant = {
          ...tenant,
          nombreComercial: formData.get("nombreComercial"),
          razonSocial: formData.get("razonSocial"),
          nit: cleanNit,
          dv: dv !== null ? dv : 0,
          regimen: formData.get("regimen"),
          direccion: formData.get("direccion"),
          ciudad: formData.get("ciudad"),
          departamento: formData.get("departamento"),
          telefono: formData.get("telefono"),
          whatsapp: formData.get("whatsapp"),
          email: formData.get("email"),
          prefijoVenta: String(formData.get("prefijoVenta") || tenant.prefijoVenta || "V").trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "V",
          prefijoCotizacion: String(formData.get("prefijoCotizacion") || "COT").trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "COT",
          whatsappGerencia: String(formData.get("whatsappGerencia") || "").replace(/\D/g, ""),
          diasValidezCotizacion: Number(formData.get("diasValidezCotizacion")) || 15,
          firmaNombre: formData.get("firmaNombre"),
          firmaCargo: formData.get("firmaCargo"),
          piePaginaDocumentos: formData.get("piePaginaDocumentos"),
          colores: {
            primary: formData.get("colorPrimary"),
            primaryHover: formData.get("colorPrimary"),
            secondary: formData.get("colorSecondary"),
            accent: formData.get("colorPrimary")
          },
          isotipoLightUrl: tenant.isotipoLightUrl || "",
          isotipoDarkUrl: tenant.isotipoDarkUrl || "",
          logoHorizontalLightUrl: tenant.logoHorizontalLightUrl || "",
          logoHorizontalDarkUrl: tenant.logoHorizontalDarkUrl || "",
          membreteUrl: tenant.membreteUrl || "",
          logoUrl: tenant.logoHorizontalLightUrl || tenant.logoUrl || ""
        };
        await TenantServiceInstance.updateTenant(updatedTenant);
        for (const pl of priceLists) {
          const newName = formData.get(`plist_name_${pl.id}`);
          const incl = !!formData.get(`plist_iva_${pl.id}`);
          if (newName && newName !== pl.nombre || incl !== !!pl.incluyeIva) {
            const antes = `${pl.nombre} (${pl.incluyeIva ? "IVA incluido" : "+IVA"})`;
            pl.nombre = newName || pl.nombre;
            pl.incluyeIva = incl;
            await DB.update(STORES.PRICE_LISTS, pl);
            await AuditService.log({ modulo: "Configuraci\xF3n", accion: "MODIFICAR", registroId: pl.id, campoModificado: "Lista de precios", valorAnterior: antes, valorNuevo: `${pl.nombre} (${incl ? "IVA incluido" : "+IVA"})` });
          }
        }
        Toast.success("Configuraci\xF3n empresarial y listas de precios guardadas exitosamente.");
        this.render(container);
      });
    },
    openCreateTenantModal(onSaved) {
      const content = `
      <form id="new-tenant-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Nombre Comercial</label>
            <input type="text" class="form-control" name="nombreComercial" required placeholder="Ej: Nova Brillo SAS">
          </div>
          <div class="form-group">
            <label class="form-label">Raz\xF3n Social</label>
            <input type="text" class="form-control" name="razonSocial" required placeholder="Ej: Nova Brillo Colombia S.A.S.">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">NIT (Sin DV)</label>
            <input type="text" class="form-control" id="modal-tenant-nit" name="nit" required placeholder="Ej: 901889977">
          </div>
          <div class="form-group">
            <label class="form-label">DV Calculado</label>
            <input type="text" class="form-control" id="modal-tenant-dv" name="dv" readonly value="-" style="font-weight: bold;">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Ciudad Principal</label>
            <input type="text" class="form-control" name="ciudad" required value="Medell\xEDn" placeholder="Ej: Medell\xEDn">
          </div>
          <div class="form-group">
            <label class="form-label">Departamento</label>
            <input type="text" class="form-control" name="departamento" required value="Antioquia" placeholder="Ej: Antioquia">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Direcci\xF3n Comercial</label>
            <input type="text" class="form-control" name="direccion" required placeholder="Ej: Calle 10 # 43A - 15">
          </div>
          <div class="form-group">
            <label class="form-label">Tel\xE9fono / Celular</label>
            <input type="text" class="form-control" name="telefono" required placeholder="Ej: (604) 444 1234">
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Color Primario de Marca</label>
          <div class="d-flex items-center gap-2">
            <input type="color" class="form-control" name="colorPrimary" value="#0071e3" style="width: 50px; height: 38px; padding: 2px;">
            <span class="text-xs text-muted">Se aplicar\xE1 a los botones, encabezados e interfaces de la nueva empresa</span>
          </div>
        </div>
      </form>
    `;
      const dialog = Modal.show({
        title: "\u{1F3E2} Crear Nueva Organizaci\xF3n Multiempresa",
        content,
        size: "md",
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: "Crear Organizaci\xF3n",
            class: "btn-primary",
            onClick: async () => {
              const form = dialog.querySelector("#new-tenant-form");
              if (!form.checkValidity()) {
                form.reportValidity();
                return;
              }
              const formData = new FormData(form);
              const cleanNit = formData.get("nit").replace(/\D/g, "");
              const dv = DianDV.calculate(cleanNit);
              const colorPrim = formData.get("colorPrimary") || "#0071e3";
              const newTenant = {
                nombreComercial: formData.get("nombreComercial"),
                razonSocial: formData.get("razonSocial"),
                nit: cleanNit,
                dv: dv !== null ? dv : 0,
                regimen: "Responsable de IVA",
                direccion: formData.get("direccion"),
                ciudad: formData.get("ciudad"),
                departamento: formData.get("departamento"),
                telefono: formData.get("telefono"),
                whatsapp: formData.get("telefono"),
                email: "",
                colores: {
                  primary: colorPrim,
                  primaryHover: colorPrim,
                  secondary: "#f59e0b",
                  accent: colorPrim
                },
                resolucionFacturacion: "",
                moneda: "COP",
                esDemo: false
              };
              const created = await TenantServiceInstance.createTenant(newTenant);
              await TenantServiceInstance.switchTenant(created.id);
              Toast.success(`\xA1Empresa "${created.nombreComercial}" creada con \xE9xito! Se ha activado la nueva organizaci\xF3n.`);
              Modal.close();
              if (onSaved)
                onSaved();
            }
          }
        ]
      });
      if (dialog) {
        const nitInp = dialog.querySelector("#modal-tenant-nit");
        const dvInp = dialog.querySelector("#modal-tenant-dv");
        if (nitInp && dvInp) {
          nitInp.addEventListener("input", (e) => {
            const clean = e.target.value.replace(/\D/g, "");
            const dv = DianDV.calculate(clean);
            dvInp.value = dv !== null ? dv : "-";
          });
        }
      }
    }
  };

  // js/modules/backup.js
  init_toast();
  init_formatters();
  var fmtSize = (b) => b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
  var BackupModule = {
    async render(container) {
      await BackupFolderService.load();
      const lastBackup = await DB.getParam("ultimo_respaldo", null);
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Respaldo y Restauraci\xF3n</h1>
          <p>Copia autom\xE1tica en una carpeta del computador y copias manuales en formato JSON</p>
        </div>
      </div>

      <div class="card mb-3" id="auto-backup-card">${await this.autoCardHtml()}</div>

      <div class="alert alert-info mb-3" style="font-size: 12px; line-height: 1.5;">
        NexaAdmin guarda la informaci\xF3n <strong>solo en este navegador de este equipo</strong>. Si borra los datos de navegaci\xF3n o formatea el equipo,
        la \xFAnica copia es la carpeta de respaldo o los archivos descargados. Los respaldos contienen datos de clientes: tr\xE1telos como informaci\xF3n confidencial
        y <strong>no los guarde dentro de la carpeta del programa</strong> (se subir\xEDan a GitHub).
        ${lastBackup ? `<br>\xDAltimo respaldo manual descargado: <strong>${esc(Formatters.dateTime(lastBackup))}</strong>` : ""}
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div class="card-title">\u{1F4BE} Descargar respaldo completo</div>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-4" style="line-height: 1.5;">
              Incluye clientes, cat\xE1logo, inventario, recetas, ventas, caja, cartera, cuentas por pagar, comprobantes y auditor\xEDa.
              Las contrase\xF1as viajan como hash (no legibles).
            </p>
            <button class="btn btn-primary" id="btn-export-backup" style="width: 100%; padding: 12px;">\u2B07\uFE0F Descargar respaldo (.json)</button>
          </div>
        </div>

        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div class="card-title">\u{1F4E5} Restaurar desde un archivo</div>
            <span class="badge badge-danger">Reemplaza todo</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3" style="line-height: 1.5;">
              <strong>Toda la informaci\xF3n actual de este equipo se reemplazar\xE1</strong> por la del archivo. Antes de hacerlo se guarda
              un respaldo del estado actual. \xDAselo para pasar la operaci\xF3n a otro computador o recuperar informaci\xF3n.
            </p>
            <div class="form-group mb-3">
              <input type="file" id="inp-restore-file" accept=".json,application/json" class="form-control" style="font-size: 12px;">
            </div>
            <div id="restore-summary" class="text-xs mb-3"></div>
            <button class="btn btn-danger" id="btn-restore-backup" style="width: 100%; padding: 12px;" disabled>\u{1F504} Restaurar (reemplazar informaci\xF3n)</button>
          </div>
        </div>
      </div>
    `;
      this.bindAutoCard(container);
      container.querySelector("#btn-export-backup").addEventListener("click", async () => {
        const ok = await DB.downloadAutoBackup(`Manual_${AuthServiceInstance.getCurrentUser()?.usuario || "usuario"}`);
        if (ok) {
          await DB.setParam("ultimo_respaldo", (/* @__PURE__ */ new Date()).toISOString());
          await AuditService.log({ modulo: "Respaldo", accion: "EXPORTAR", campoModificado: "Respaldo completo", valorNuevo: "Descargado" });
          Toast.success("Respaldo descargado.");
          this.render(container);
        } else {
          Toast.error("No se pudo generar el respaldo.");
        }
      });
      const fileInp = container.querySelector("#inp-restore-file");
      const restoreBtn = container.querySelector("#btn-restore-backup");
      const summary = container.querySelector("#restore-summary");
      let parsed = null;
      fileInp.addEventListener("change", () => {
        parsed = null;
        restoreBtn.disabled = true;
        summary.innerHTML = "";
        const file = fileInp.files[0];
        if (!file)
          return;
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            DB.validateBackup(data);
            parsed = data;
            summary.innerHTML = `<div class="card p-2" style="margin: 0;">${this.summaryHtml(data)}</div>`;
            restoreBtn.disabled = false;
          } catch (err) {
            summary.innerHTML = `<span class="text-danger">Archivo inv\xE1lido: ${esc(err.message)}</span>`;
          }
        };
        reader.readAsText(file);
      });
      restoreBtn.addEventListener("click", () => {
        if (parsed)
          this.confirmRestore(parsed);
      });
    },
    summaryHtml(data) {
      const info = DB.validateBackup(data);
      const t = data.stores;
      return `
      <div>Fecha del respaldo: <strong>${esc(data.timestamp ? Formatters.dateTime(data.timestamp) : "desconocida")}</strong> \xB7 versi\xF3n ${esc(data.version || "?")}</div>
      <div>${info.registros} registros en ${info.tablas.length} tablas \xB7 Empresas: ${(t[STORES.TENANTS] || []).length} \xB7 Productos: ${(t[STORES.PRODUCTS] || []).length} \xB7 Ventas: ${(t[STORES.SALES] || []).length} \xB7 Usuarios: ${(t[STORES.USERS] || []).length}</div>`;
    },
    // ---------------------------------------------------------------- respaldo automático
    async autoCardHtml() {
      const s = BackupFolderService;
      const st = s.state;
      const header = `
      <div class="card-header">
        <div class="card-title">\u{1F5C2}\uFE0F Respaldo autom\xE1tico en carpeta</div>
        <span class="badge ${st === "ok" ? "badge-success" : st === "error" ? "badge-danger" : "badge-warning"}" id="auto-backup-state">${esc({
        ok: "Activo",
        "needs-permission": "Falta permiso",
        "no-folder": "Sin carpeta",
        unsupported: "No disponible en este navegador",
        error: "Con error",
        disabled: "Apagado"
      }[st] || st)}</span>
      </div>`;
      if (!s.isSupported()) {
        const brave = s.isBrave();
        return `${header}
        <div class="card-body text-xs" style="line-height: 1.6;">
          ${brave ? `
            <p class="mb-2"><strong>Brave trae esta funci\xF3n desactivada.</strong> Para activarla (una sola vez):</p>
            <ol class="mb-3" style="padding-left: 18px;">
              <li>Copie esta direcci\xF3n en la barra de Brave: <code id="brave-flag-url">brave://flags/#file-system-access-api</code>
                <button class="btn btn-secondary btn-sm" id="btn-copy-flag" style="margin-left: 6px;">Copiar</button></li>
              <li>En <strong>File System Access API</strong> elija <strong>Enabled</strong>.</li>
              <li>Pulse <strong>Relaunch</strong> (Brave se reinicia) y vuelva a esta pantalla.</li>
            </ol>` : `
            <p class="mb-3">Este navegador no permite guardar en una carpeta. Use Google Chrome o Microsoft Edge para el respaldo autom\xE1tico.</p>`}
          <label class="flex items-center gap-2"><input type="checkbox" id="chk-download-fallback" ${s.settings.downloadFallback ? "checked" : ""}>
            Mientras tanto, descargar un respaldo diario a la carpeta Descargas (al entrar por primera vez cada d\xEDa)</label>
        </div>`;
      }
      const lastOk = s.lastOk ? Formatters.dateTime(s.lastOk) : "todav\xEDa no";
      const folder = s.handle ? s.folderName() || "carpeta seleccionada" : null;
      return `${header}
      <div class="card-body text-xs" style="line-height: 1.6;">
        ${folder ? `
          <div class="mb-2">Carpeta: <strong>${esc(folder)}</strong> \xB7 \xDAltima copia: <strong id="auto-backup-last">${esc(lastOk)}</strong></div>
          ${s.lastError ? `<div class="alert alert-danger mb-2">${esc(s.lastError)}</div>` : ""}
          ${st === "needs-permission" ? `<div class="alert alert-warning mb-2">El navegador pide confirmar el permiso de la carpeta en cada sesi\xF3n. Pulse <strong>Dar permiso</strong> (o el aviso de la barra superior). Si aparece la opci\xF3n <em>Permitir en cada visita</em>, el\xEDjala.</div>` : ""}
        ` : `
          <p class="mb-2">Elija una carpeta y NexaAdmin guardar\xE1 ah\xED una copia completa <strong>autom\xE1ticamente</strong>: cada pocos minutos si hubo cambios,
          al cerrar la caja y al cerrar la pesta\xF1a. Recomendado: una carpeta dentro de <strong>OneDrive</strong> (queda copia en la nube) o en <strong>Documentos</strong>,
          por ejemplo <em>Documentos\\NexaAdmin_Respaldos</em>.</p>`}

        <div class="flex gap-2 mb-3" style="flex-wrap: wrap;">
          <button class="btn btn-primary btn-sm" id="btn-choose-folder">${folder ? "Cambiar carpeta" : "Elegir carpeta de respaldo"}</button>
          ${folder && st === "needs-permission" ? '<button class="btn btn-primary btn-sm" id="btn-grant-folder">Dar permiso</button>' : ""}
          ${folder ? '<button class="btn btn-secondary btn-sm" id="btn-backup-now">Respaldar ahora</button>' : ""}
          ${folder ? '<button class="btn btn-secondary btn-sm" id="btn-forget-folder">Dejar de usar esta carpeta</button>' : ""}
        </div>

        <div class="flex gap-3 mb-3" style="flex-wrap: wrap; align-items: center;">
          <label class="flex items-center gap-2"><input type="checkbox" id="chk-auto-enabled" ${s.settings.enabled ? "checked" : ""}> Respaldo autom\xE1tico activo</label>
          <label>Cada <select id="sel-auto-interval" class="form-control" style="display: inline-block; width: auto; padding: 2px 6px;">
            ${[1, 5, 15, 30].map((m) => `<option value="${m}" ${Number(s.settings.intervalMin) === m ? "selected" : ""}>${m} min</option>`).join("")}
          </select> si hubo cambios</label>
          <label>Conservar copias diarias <select id="sel-auto-keep" class="form-control" style="display: inline-block; width: auto; padding: 2px 6px;">
            ${[7, 30, 90, 365].map((d) => `<option value="${d}" ${Number(s.settings.keepDays) === d ? "selected" : ""}>${d} d\xEDas</option>`).join("")}
          </select></label>
        </div>

        ${folder && st !== "needs-permission" ? '<div id="folder-files" class="backup-file-list"><span class="text-muted">Cargando archivos\u2026</span></div>' : ""}
      </div>`;
    },
    async refreshAutoCard(container) {
      const card = container.querySelector("#auto-backup-card");
      if (!card)
        return;
      card.innerHTML = await this.autoCardHtml();
      this.bindAutoCard(container);
    },
    bindAutoCard(container) {
      const s = BackupFolderService;
      const $ = (sel) => container.querySelector(sel);
      $("#btn-copy-flag")?.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText("brave://flags/#file-system-access-api");
          Toast.success("Direcci\xF3n copiada. P\xE9guela en la barra de Brave.");
        } catch (e) {
          Toast.info("Seleccione y copie la direcci\xF3n manualmente.");
        }
      });
      $("#chk-download-fallback")?.addEventListener("change", (e) => s.saveSettings({ downloadFallback: e.target.checked }));
      $("#chk-auto-enabled")?.addEventListener("change", async (e) => {
        await s.saveSettings({ enabled: e.target.checked });
        this.refreshAutoCard(container);
      });
      $("#sel-auto-interval")?.addEventListener("change", (e) => s.saveSettings({ intervalMin: Number(e.target.value) }));
      $("#sel-auto-keep")?.addEventListener("change", (e) => s.saveSettings({ keepDays: Number(e.target.value) }));
      $("#btn-choose-folder")?.addEventListener("click", async () => {
        let info;
        try {
          info = await s.chooseFolder();
        } catch (e) {
          if (e && e.name === "AbortError")
            return;
          Toast.error(e.message || "No se pudo usar esa carpeta.");
          return;
        }
        await this.afterFolderChosen(container, info);
      });
      $("#btn-grant-folder")?.addEventListener("click", async () => {
        if (await s.checkPermission(true) === "granted") {
          await s.backupNow();
          Toast.success("Permiso concedido. Respaldo autom\xE1tico activo.");
        } else {
          Toast.warning("Sin permiso no se puede guardar en la carpeta.");
        }
        this.refreshAutoCard(container);
      });
      $("#btn-backup-now")?.addEventListener("click", async (ev) => {
        ev.target.disabled = true;
        const ok = await s.backupNow("Manual");
        if (ok)
          Toast.success("Respaldo guardado en la carpeta.");
        else
          Toast.error(s.lastError || "No se pudo guardar el respaldo.");
        this.refreshAutoCard(container);
      });
      $("#btn-forget-folder")?.addEventListener("click", () => {
        Modal.confirm({
          title: "Dejar de usar la carpeta",
          message: "NexaAdmin dejar\xE1 de guardar copias autom\xE1ticas. Los archivos que ya est\xE1n en la carpeta NO se borran.",
          confirmText: "Dejar de usar",
          onConfirm: async () => {
            await s.forgetFolder();
            this.refreshAutoCard(container);
          }
        });
      });
      if ($("#folder-files"))
        this.renderFolderFiles(container);
    },
    /** Si la carpeta ya tiene un respaldo con más información que la base actual, ofrece restaurarlo. */
    async afterFolderChosen(container, info) {
      const s = BackupFolderService;
      if (s.permission !== "granted") {
        Toast.warning("Sin permiso de escritura no se puede usar esa carpeta.");
        this.refreshAutoCard(container);
        return;
      }
      if (info && info.records > info.currentRecords) {
        Modal.show({
          title: "La carpeta ya tiene un respaldo",
          size: "sm",
          content: `
          <p class="text-xs mb-2">En <strong>${esc(s.folderName())}</strong> hay un respaldo del
          <strong>${esc(info.timestamp ? Formatters.dateTime(info.timestamp) : "fecha desconocida")}</strong> con
          <strong>${info.records}</strong> registros. La base de este navegador tiene <strong>${info.currentRecords}</strong>.</p>
          <p class="text-xs">Si borr\xF3 los datos del navegador o cambi\xF3 de equipo, restaure ese respaldo.
          Si elige guardar, el archivo <em>NexaAdmin_ultimo.json</em> se reemplazar\xE1 (las copias diarias anteriores se conservan).</p>`,
          footerButtons: [
            { label: "Restaurar ese respaldo", class: "btn-danger", onClick: () => {
              Modal.close();
              this.confirmRestore(info.data);
            } },
            {
              label: "Guardar la base actual",
              class: "btn-secondary",
              onClick: async () => {
                Modal.close();
                await s.backupNow("CambioCarpeta", { force: true });
                this.refreshAutoCard(container);
              }
            }
          ]
        });
        return;
      }
      const ok = await s.backupNow();
      if (ok)
        Toast.success(`Respaldo autom\xE1tico activo en "${s.folderName()}".`);
      else
        Toast.error(s.lastError || "No se pudo guardar el respaldo.");
      this.refreshAutoCard(container);
    },
    async renderFolderFiles(container) {
      const box = container.querySelector("#folder-files");
      if (!box)
        return;
      let files = [];
      try {
        files = await BackupFolderService.listFiles();
      } catch (e) {
        box.innerHTML = `<span class="text-danger">${esc(e.message)}</span>`;
        return;
      }
      if (!files.length) {
        box.innerHTML = '<span class="text-muted">La carpeta a\xFAn no tiene respaldos de NexaAdmin.</span>';
        return;
      }
      box.innerHTML = `
      <table class="table" style="width: 100%;">
        <thead><tr><th>Archivo</th><th>Fecha</th><th>Tama\xF1o</th><th></th></tr></thead>
        <tbody>${files.map((f) => `
          <tr>
            <td>${esc(f.name)}</td>
            <td>${esc(Formatters.dateTime(new Date(f.modified).toISOString()))}</td>
            <td>${fmtSize(f.size)}</td>
            <td style="text-align: right;"><button class="btn btn-secondary btn-sm btn-restore-from-folder" data-name="${esc(f.name)}">Restaurar</button></td>
          </tr>`).join("")}
        </tbody>
      </table>`;
      box.querySelectorAll(".btn-restore-from-folder").forEach((btn) => btn.addEventListener("click", async () => {
        try {
          const data = await BackupFolderService.readFile(btn.dataset.name);
          DB.validateBackup(data);
          this.confirmRestore(data);
        } catch (e) {
          Toast.error("No se pudo leer el archivo: " + e.message);
        }
      }));
    },
    // ---------------------------------------------------------------- restauración
    confirmRestore(data) {
      Modal.show({
        title: "Confirmar restauraci\xF3n",
        size: "sm",
        content: `
        <div class="text-xs mb-2">${this.summaryHtml(data)}</div>
        <p class="text-xs mb-2">Se reemplazar\xE1 <strong>toda</strong> la informaci\xF3n actual por la de este respaldo.
        Primero se guardar\xE1 un respaldo del estado actual.</p>
        <p class="text-xs mb-2">Escriba <strong>RESTAURAR</strong> para confirmar:</p>
        <input class="form-control" id="restore-confirm-text" autocomplete="off">
        <p class="text-xs text-muted mt-2">Despu\xE9s de restaurar deber\xE1 iniciar sesi\xF3n con un usuario del respaldo.</p>`,
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: "Restaurar",
            class: "btn-danger",
            onClick: async (dlg, ev) => {
              if (dlg.querySelector("#restore-confirm-text").value.trim().toUpperCase() !== "RESTAURAR") {
                Toast.warning("Escriba RESTAURAR para confirmar.");
                return;
              }
              ev.target.disabled = true;
              const pre = await BackupFolderService.backupEvent("AntesDeRestaurar");
              if (!pre) {
                Toast.error("No se pudo guardar el respaldo previo. Restauraci\xF3n cancelada.");
                ev.target.disabled = false;
                return;
              }
              try {
                await DB.restoreBackup(data);
                await BackupFolderService.resetShrinkGuard();
                localStorage.removeItem("nexa_session");
                Toast.success("Informaci\xF3n restaurada. Recargando...");
                setTimeout(() => window.location.reload(), 1200);
              } catch (err) {
                Toast.error("Error al restaurar (no se modific\xF3 nada): " + err.message);
                ev.target.disabled = false;
              }
            }
          }
        ]
      });
    }
  };

  // js/modules/importer.js
  init_formatters();

  // js/utils/csv.js
  function parseCSV(text) {
    const src = String(text || "").replace(/^﻿/, "");
    const firstLine = src.split(/\r?\n/, 1)[0] || "";
    const delim = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ";" : ",";
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (inQuotes) {
        if (c === '"') {
          if (src[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === delim) {
        row.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && src[i + 1] === "\n")
          i++;
        row.push(field);
        field = "";
        if (row.some((v) => v.trim() !== ""))
          rows.push(row);
        row = [];
      } else {
        field += c;
      }
    }
    row.push(field);
    if (row.some((v) => v.trim() !== ""))
      rows.push(row);
    if (rows.length === 0)
      return { headers: [], rows: [] };
    const headers = rows[0].map((h) => h.trim());
    const data = rows.slice(1).map((cols) => {
      const o = {};
      headers.forEach((h, i) => {
        o[h] = (cols[i] !== void 0 ? cols[i] : "").trim();
      });
      return o;
    });
    return { headers, rows: data, delimiter: delim };
  }
  function parseNumber(v) {
    if (v === null || v === void 0 || v === "")
      return 0;
    let s = String(v).replace(/[^\d,.-]/g, "");
    if (s.includes(",") && s.includes("."))
      s = s.replace(/\./g, "").replace(",", ".");
    else if (s.includes(","))
      s = s.replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  }

  // js/modules/importer.js
  init_toast();
  var ImporterModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Importaci\xF3n Masiva de Datos (CSV)</h1>
          <p>Carga \xE1gil de cat\xE1logos maestros de clientes, productos y proveedores mediante hojas de c\xE1lculo</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;" class="mb-4">
        
        <!-- IMPORTAR CLIENTES -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div class="card-title">\u{1F465} Importar Clientes</div>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3">Cargue masivamente el directorio de clientes con NIT, raz\xF3n social, tel\xE9fonos, ciudad y cupos.</p>
            <div class="d-flex flex-col gap-2">
              <button class="btn btn-secondary btn-sm" id="btn-dl-template-clients">\u{1F4E5} Descargar Plantilla Modelo (CSV)</button>
              <input type="file" id="inp-csv-clients" accept=".csv" class="form-control" style="font-size: 12px;">
              <button class="btn btn-primary btn-sm" id="btn-process-clients" disabled>\u2699\uFE0F Procesar e Importar Clientes</button>
            </div>
          </div>
        </div>

        <!-- IMPORTAR PRODUCTOS -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div class="card-title">\u{1F4E6} Importar Productos & Insumos</div>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3">Cargue inventario inicial, SKU, nombre, categor\xEDa, costos y listas de precios de venta.</p>
            <div class="d-flex flex-col gap-2">
              <button class="btn btn-secondary btn-sm" id="btn-dl-template-products">\u{1F4E5} Descargar Plantilla Modelo (CSV)</button>
              <input type="file" id="inp-csv-products" accept=".csv" class="form-control" style="font-size: 12px;">
              <button class="btn btn-primary btn-sm" id="btn-process-products" disabled>\u2699\uFE0F Procesar e Importar Productos</button>
            </div>
          </div>
        </div>

        <!-- IMPORTAR PROVEEDORES -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div class="card-title">\u{1F6CD}\uFE0F Importar Proveedores</div>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3">Cargue proveedores de materias primas qu\xEDmicas, envases pl\xE1sticos y suministros.</p>
            <div class="d-flex flex-col gap-2">
              <button class="btn btn-secondary btn-sm" id="btn-dl-template-suppliers">\u{1F4E5} Descargar Plantilla Modelo (CSV)</button>
              <input type="file" id="inp-csv-suppliers" accept=".csv" class="form-control" style="font-size: 12px;">
              <button class="btn btn-primary btn-sm" id="btn-process-suppliers" disabled>\u2699\uFE0F Procesar e Importar Proveedores</button>
            </div>
          </div>
        </div>

      </div>

      <!-- \xC1REA DE PREVISUALIZACI\xD3N DE ARCHIVO CARGADO -->
      <div class="card" id="importer-preview-card" style="display: none;">
        <div class="card-header">
          <div class="card-title" id="importer-preview-title">Previsualizaci\xF3n de Datos a Importar</div>
          <button class="btn btn-success btn-sm" id="btn-confirm-import">\u2713 Confirmar Inserci\xF3n en Base de Datos</button>
        </div>
        <div class="card-body" style="padding: 0;">
          <div class="table-responsive" style="max-height: 350px; overflow-y: auto;">
            <table class="data-table" style="font-size: 11px;" id="importer-preview-table">
              <thead></thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      </div>
    `;
      let pendingImportType = null;
      let pendingImportRows = [];
      const downloadCSVTemplate = (filename, headers, sampleRow) => {
        const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
        const csv = "\uFEFF" + headers.map(q).join(";") + "\r\n" + sampleRow.map(q).join(";") + "\r\n";
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };
      container.querySelector("#btn-dl-template-clients").addEventListener("click", () => {
        downloadCSVTemplate(
          "Plantilla_Clientes_Nexa",
          ["Codigo", "Nombre", "NIT_CC", "TipoCliente", "Telefono", "Ciudad", "Direccion", "CupoCredito", "DiasCredito"],
          ["CLI-101", "AutoLavado El Diamante", "901234567", "Taller / Detailing", "3001234567", "Medell\xEDn", "Carrera 50 # 30-20", "3000000", "30"]
        );
      });
      container.querySelector("#btn-dl-template-products").addEventListener("click", () => {
        downloadCSVTemplate(
          "Plantilla_Productos_Nexa",
          ["SKU", "Nombre", "TipoItem", "Categoria", "UnidadMedida", "CostoPromedio", "Precio1", "Precio2", "Precio3", "Precio4", "Precio5", "StockInicial", "StockMinimo"],
          ["RAYO-LIMP-500", "Limpiador Cristales Antiempa\xF1ante 500ml", "PRODUCTO_TERMINADO", "Visibilidad", "Unidad", "6500", "18000", "16000", "14000", "12500", "", "40", "10"]
        );
      });
      container.querySelector("#btn-dl-template-suppliers").addEventListener("click", () => {
        downloadCSVTemplate(
          "Plantilla_Proveedores_Nexa",
          ["Codigo", "RazonSocial", "NIT", "Contacto", "Telefono", "Ciudad", "Categoria", "DiasCredito"],
          ["PROV-050", "Envases Qu\xEDmicos de Antioquia SAS", "900444555", "Pedro Restrepo", "4441234", "Itag\xFC\xED", "Material de Empaque", "30"]
        );
      });
      const setupFileInput = (inputId, btnId, type) => {
        const input = container.querySelector(inputId);
        const btn = container.querySelector(btnId);
        input.addEventListener("change", () => {
          btn.disabled = !input.files || input.files.length === 0;
        });
        btn.addEventListener("click", () => {
          const file = input.files[0];
          if (!file)
            return;
          const reader = new FileReader();
          reader.onload = (e) => {
            const parsed = parseCSV(e.target.result);
            const headers = parsed.headers;
            const rows = parsed.rows;
            if (rows.length === 0) {
              Toast.warning("El archivo seleccionado no contiene filas de datos.");
              return;
            }
            pendingImportType = type;
            pendingImportRows = rows;
            showPreview(headers, rows, type);
          };
          reader.readAsText(file);
        });
      };
      setupFileInput("#inp-csv-clients", "#btn-process-clients", "CUSTOMERS");
      setupFileInput("#inp-csv-products", "#btn-process-products", "PRODUCTS");
      setupFileInput("#inp-csv-suppliers", "#btn-process-suppliers", "SUPPLIERS");
      const showPreview = (headers, rows, type) => {
        const card = container.querySelector("#importer-preview-card");
        const thead = container.querySelector("#importer-preview-table thead");
        const tbody = container.querySelector("#importer-preview-table tbody");
        const title = container.querySelector("#importer-preview-title");
        title.textContent = `Previsualizaci\xF3n de Importaci\xF3n: ${rows.length} registros listos (${type})`;
        thead.innerHTML = `<tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>`;
        tbody.innerHTML = rows.slice(0, 10).map((r) => `
        <tr>${headers.map((h) => `<td>${esc(r[h] || "-")}</td>`).join("")}</tr>
      `).join("");
        card.style.display = "block";
        card.scrollIntoView({ behavior: "smooth" });
      };
      container.querySelector("#btn-confirm-import").addEventListener("click", async () => {
        if (!pendingImportType || pendingImportRows.length === 0)
          return;
        const btnConfirm = container.querySelector("#btn-confirm-import");
        btnConfirm.disabled = true;
        try {
          let inserted = 0;
          const skipped = [];
          if (pendingImportType === "CUSTOMERS") {
            const existing = await DB.getAll(STORES.CUSTOMERS, tenantId);
            const nits = new Set(existing.map((c) => String(c.nitCc || "").replace(/\D/g, "")).filter(Boolean));
            for (const r of pendingImportRows) {
              const cleanNit = (r.NIT_CC || "").replace(/\D/g, "");
              if (!r.Nombre) {
                skipped.push("fila sin nombre");
                continue;
              }
              if (cleanNit && nits.has(cleanNit)) {
                skipped.push(`${r.Nombre} (NIT ya existe)`);
                continue;
              }
              await DB.add(STORES.CUSTOMERS, {
                tenantId,
                codigo: r.Codigo || "",
                nombre: r.Nombre,
                nitCc: cleanNit,
                dv: DianDV.calculate(cleanNit),
                tipoCliente: r.TipoCliente || "Consumidor Final",
                telefono: r.Telefono || "",
                ciudad: r.Ciudad || "",
                direccion: r.Direccion || "",
                cupoCredito: parseNumber(r.CupoCredito),
                diasCredito: parseNumber(r.DiasCredito),
                saldoPendiente: 0,
                estado: "ACTIVO"
              });
              if (cleanNit)
                nits.add(cleanNit);
              inserted++;
            }
          } else if (pendingImportType === "PRODUCTS") {
            const existing = await DB.getAll(STORES.PRODUCTS, tenantId);
            const priceLists = await DB.getAll(STORES.PRICE_LISTS, tenantId);
            const skus = new Set(existing.map((p) => String(p.sku || "").toLowerCase()));
            for (const r of pendingImportRows) {
              const sku = String(r.SKU || "").trim();
              if (!sku || !r.Nombre) {
                skipped.push(`${r.Nombre || sku || "fila"} (falta SKU o nombre)`);
                continue;
              }
              if (skus.has(sku.toLowerCase())) {
                skipped.push(`${sku} (SKU ya existe)`);
                continue;
              }
              const precios = {};
              [1, 2, 3, 4, 5].forEach((n) => {
                const pl = PricingService.findByCode(priceLists, `P${n}`);
                const v = parseNumber(r[`Precio${n}`]);
                if (pl && v > 0)
                  precios[pl.id] = v;
              });
              const prod = await DB.add(STORES.PRODUCTS, {
                tenantId,
                sku,
                codigoInterno: sku,
                nombre: r.Nombre,
                tipoItem: r.TipoItem || "PRODUCTO_TERMINADO",
                categoria: r.Categoria || "General",
                unidadMedida: r.UnidadMedida || "Unidad",
                costoPromedio: parseNumber(r.CostoPromedio),
                stock: 0,
                stockMinimo: parseNumber(r.StockMinimo),
                precios,
                estado: "ACTIVO"
              });
              const stockInicial = parseNumber(r.StockInicial);
              if (stockInicial > 0) {
                await KardexService.registerMovement({
                  tenantId,
                  productoId: prod.id,
                  documentoTipo: "AJUSTE_POS",
                  documentoNumero: "INV-INICIAL",
                  cantidad: stockInicial,
                  costoUnitario: prod.costoPromedio,
                  observacion: "Inventario inicial (importaci\xF3n CSV)"
                });
              }
              skus.add(sku.toLowerCase());
              inserted++;
            }
          } else if (pendingImportType === "SUPPLIERS") {
            const existing = await DB.getAll(STORES.SUPPLIERS, tenantId);
            const nits = new Set(existing.map((c) => String(c.nitCc || "").replace(/\D/g, "")).filter(Boolean));
            for (const r of pendingImportRows) {
              const cleanNit = (r.NIT || "").replace(/\D/g, "");
              if (!r.RazonSocial) {
                skipped.push("fila sin raz\xF3n social");
                continue;
              }
              if (cleanNit && nits.has(cleanNit)) {
                skipped.push(`${r.RazonSocial} (NIT ya existe)`);
                continue;
              }
              await DB.add(STORES.SUPPLIERS, {
                tenantId,
                codigo: r.Codigo || "",
                razonSocial: r.RazonSocial,
                nitCc: cleanNit,
                dv: DianDV.calculate(cleanNit),
                contacto: r.Contacto || "",
                telefono: r.Telefono || "",
                ciudad: r.Ciudad || "",
                categoria: r.Categoria || "Materias Primas",
                diasCredito: parseNumber(r.DiasCredito) || 30,
                estado: "ACTIVO"
              });
              if (cleanNit)
                nits.add(cleanNit);
              inserted++;
            }
          }
          await AuditService.log({ modulo: "Importador", accion: "CREAR", campoModificado: pendingImportType, valorNuevo: `${inserted} importados, ${skipped.length} omitidos` });
          if (skipped.length)
            Toast.warning(`Omitidos ${skipped.length}: ${skipped.slice(0, 5).join("; ")}${skipped.length > 5 ? "\u2026" : ""}`);
          Toast.success(`Se importaron ${inserted} registros.`);
          container.querySelector("#importer-preview-card").style.display = "none";
          pendingImportRows = [];
        } catch (err) {
          Toast.error("Error durante la importaci\xF3n: " + err.message);
        } finally {
          btnConfirm.disabled = false;
        }
      });
    }
  };

  // js/modules/integrations.js
  init_toast();
  var IntegrationsModule = {
    render(container) {
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Integraciones & Servicios Externos</h1>
          <p>Ecosistema de conectividad para Facturaci\xF3n Electr\xF3nica DIAN, WhatsApp Cloud API, Transportadoras y Pasarelas</p>
        </div>
      </div>

      <div class="alert alert-info mb-4" style="font-size: 13px;">
        \u2139\uFE0F <strong>Transparencia de Integraci\xF3n:</strong> Este sistema cuenta con la estructura de datos lista para interoperar mediante API REST y Webhooks. Los m\xF3dulos que requieran credenciales del operador o habilitaci\xF3n oficial muestran el estado real sin simulaciones ficticias.
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px;">
        
        <!-- 1. FACTURACI\xD3N ELECTR\xD3NICA DIAN -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div>
              <div class="card-title">\u{1F1E8}\u{1F1F4} Facturaci\xF3n Electr\xF3nica DIAN</div>
              <div class="card-subtitle">Emisi\xF3n de XML UBL 2.1, CUFE y QR oficial</div>
            </div>
            <span class="badge badge-warning">Pendiente Configuraci\xF3n</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3" style="line-height: 1.5;">
              Permite transmitir las facturas comerciales a los servidores de la DIAN mediante Proveedor Tecnol\xF3gico autorizado o Software Propio.
            </p>
            <div class="card mb-3" style="padding: 12px; font-size: 12px; border: 1px solid var(--border-color);">
              <div><strong>Estado:</strong> No integrado. Los documentos actuales son internos.</div>
              <div class="mt-1"><strong>Estado Habilitaci\xF3n DIAN:</strong> <span class="text-warning font-bold">Pendiente de Configuraci\xF3n</span></div>
              <div class="mt-1 text-muted text-xs">Requiere: Certificado Digital .pfx y Set de Pruebas DIAN.</div>
            </div>
            <button class="btn btn-secondary btn-sm w-100" id="btn-config-dian">\u2699\uFE0F Par\xE1metros DIAN / Proveedor Tecnol\xF3gico</button>
          </div>
        </div>

        <!-- 2. WHATSAPP BUSINESS CLOUD API -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div>
              <div class="card-title">\u{1F4AC} WhatsApp Business API</div>
              <div class="card-subtitle">Env\xEDo autom\xE1tico de remisiones, facturas y cobros</div>
            </div>
            <span class="badge badge-neutral">No Conectado</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3" style="line-height: 1.5;">
              Env\xEDo de enlaces de pago, PDF de facturas y notificaciones de despacho de transportadora directo al WhatsApp del cliente.
            </p>
            <div class="form-group mb-3">
              <label class="form-label text-xs">WhatsApp Business Token / Meta API:</label>
              <input type="password" class="form-control" placeholder="Token Meta Graph API..." value="" disabled title="Integraci\xF3n no implementada a\xFAn">
            </div>
            <button class="btn btn-secondary btn-sm w-100">\u{1F517} Vincular N\xFAmero WhatsApp</button>
          </div>
        </div>

        <!-- 3. TRANSPORTADORAS Y LOG\xCDSTICA -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div>
              <div class="card-title">\u{1F69A} Transportadoras Nacionales</div>
              <div class="card-subtitle">Generaci\xF3n de gu\xEDas con Servientrega / Coordinadora</div>
            </div>
            <span class="badge badge-neutral">Manual / Listo API</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3" style="line-height: 1.5;">
              Generaci\xF3n de r\xF3tulos con c\xF3digo de barras y cotizaci\xF3n de fletes en tiempo real conectando el webservice log\xEDstico.
            </p>
            <div class="d-flex flex-col gap-2">
              <div class="d-flex justify-between items-center text-xs">
                <span>Servientrega Webservice:</span>
                <span class="badge badge-warning">Configuraci\xF3n Pendiente</span>
              </div>
              <div class="d-flex justify-between items-center text-xs">
                <span>Coordinadora API:</span>
                <span class="badge badge-warning">Configuraci\xF3n Pendiente</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. PASARELAS DE PAGO (WOMPI / NEQUI / BOLD) -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div>
              <div class="card-title">\u{1F4B3} Pasarelas de Pago Digital</div>
              <div class="card-subtitle">Cobros QR Nequi, PSE y Tarjetas en l\xEDnea</div>
            </div>
            <span class="badge badge-neutral">No Configurado</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3" style="line-height: 1.5;">
              Generaci\xF3n de links de cobro para clientes a trav\xE9s de Wompi Bancolombia, Bold o PayU Colombia.
            </p>
            <button class="btn btn-secondary btn-sm w-100">\u2699\uFE0F Configurar Llaves de Integraci\xF3n</button>
          </div>
        </div>

        <!-- 5. BACKEND REMOTO & CLOUD SYNC -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div>
              <div class="card-title">\u2601\uFE0F Sincronizaci\xF3n Backend Cloud</div>
              <div class="card-subtitle">Conexi\xF3n a base de datos central PostgreSQL / REST</div>
            </div>
            <span class="badge badge-info">Modo Local IndexedDB</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3" style="line-height: 1.5;">
              La capa de servicios (<code>db-service.js</code>) est\xE1 completamente desacoplada para admitir sincronizaci\xF3n bidireccional con backend Node.js, Supabase o Spring Boot.
            </p>
            <div class="form-group mb-2">
              <label class="form-label text-xs">URL Endpoint Backend Remoto:</label>
              <input type="text" class="form-control" placeholder="https://api.rayopro.com/v1" readonly>
            </div>
            <span class="badge badge-success">Persistencia Local Segura Activa</span>
          </div>
        </div>

      </div>
    `;
      container.querySelector("#btn-config-dian").addEventListener("click", () => {
        Toast.info("La facturaci\xF3n electr\xF3nica requiere contratar un proveedor tecnol\xF3gico autorizado por la DIAN. La integraci\xF3n a\xFAn no est\xE1 implementada.");
      });
    }
  };

  // js/modules/documents.js
  init_formatters();
  init_export_service();
  var DocumentsModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const [sales, orders, shipments] = await Promise.all([
        DB.getAll(STORES.SALES, tenantId),
        DB.getAll(STORES.PRODUCTION_ORDERS, tenantId),
        DB.getAll(STORES.ORDERS_SHIPPING, tenantId)
      ]);
      const sampleSale = sales[0] || {
        consecutivo: "RP-10026",
        fecha: (/* @__PURE__ */ new Date()).toISOString(),
        clienteNombre: "Cliente Convenio Flotas (Demo)",
        clienteNit: "1000000001-0",
        vendedorNombre: "Juan Pablo (Gerente)",
        metodoPago: "Transferencia Bancaria",
        subtotal: 18e5,
        descuentos: 0,
        impuestos: 342e3,
        total: 2142e3,
        items: [
          { sku: "DESENG-1L", nombre: "Desengrasante Automotriz 1L (Caja x 12)", cantidad: 10, precioUnitario: 114e3, total: 114e4 },
          { sku: "SHAMP-1L", nombre: "Shampoo Desincrustante 1L (Caja x 12)", cantidad: 7, precioUnitario: 143e3, total: 1002e3 }
        ]
      };
      const sampleOrder = orders[0] || {
        numeroLote: "LOT-2026-0912",
        productoNombre: "Desengrasante Automotriz 1 Litro (Cajas x 12)",
        cantidadPlanificada: 120,
        unidadMedida: "Botellas (10 Cajas x 12)",
        fechaPlanificada: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        responsable: "Juan Pablo (Gerente Operativo)",
        estado: "EN_PROCESO",
        insumos: [
          { materiaPrimaNombre: "Base Alcalina Concentrada", cantidadRequerida: 36, unidadMedida: "Kg", costoUnitario: 9200, costoTotal: 331200 },
          { materiaPrimaNombre: "Botella PEAD 1 Litro Blanca", cantidadRequerida: 120, unidadMedida: "Unidad", costoUnitario: 1100, costoTotal: 132e3 },
          { materiaPrimaNombre: "Caja Corrugada Rayo Pro x 12", cantidadRequerida: 10, unidadMedida: "Unidad", costoUnitario: 2200, costoTotal: 22e3 }
        ]
      };
      const sampleShipping = shipments[0] || {
        numeroGuia: "77092184531",
        transportadora: "Coordinadora Mercantil Carga",
        clienteNombre: "Cliente Convenio Flotas (Demo)",
        nitCc: "1000000001-0",
        telefono: "3000000001",
        whatsapp: "+57 301 710 0508",
        email: "flotas.demo@example.com",
        direccion: "Direcci\xF3n de ejemplo",
        barrio: "La Estaci\xF3n",
        ciudad: "La Tebaida",
        departamento: "Quind\xEDo",
        contenidoDescripcion: "17 CAJAS X 12 (Productos de mantenimiento y embellecimiento automotriz)",
        cajasTotal: 17,
        observaciones: "Entregar en porter\xEDa principal talleres Cano Trucks. Manejar con cuidado."
      };
      let activeDocType = "INVOICE";
      const getPreviewHtml = (type) => {
        if (type === "INVOICE") {
          return PrintTemplates.saleInvoice({ ...sampleSale, tipoDoc: "POS" }, sampleSale.items);
        } else if (type === "QUOTE") {
          return PrintTemplates.commercialQuote({ ...sampleSale, consecutivo: "COT-2026-088" }, sampleSale.items);
        } else if (type === "SHIPPING_NOTE") {
          return PrintTemplates.saleInvoice({ ...sampleSale, tipoDoc: "REMISION", consecutivo: "REM-2026-015" }, sampleSale.items);
        } else if (type === "PRODUCTION") {
          return PrintTemplates.productionOrder(sampleOrder);
        } else if (type === "SHIPPING_LABEL") {
          return PrintTemplates.shippingBoxLabel(sampleShipping);
        } else if (type === "SHIPPING_BATCH") {
          return PrintTemplates.batchShippingLabels([sampleShipping, sampleShipping, sampleShipping, sampleShipping]);
        }
        return "";
      };
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Visor de Documentos & Plantillas Membretadas</h1>
          <p>Plantillas din\xE1micas que adoptan autom\xE1ticamente la identidad corporativa de <strong>${esc(tenant.nombreComercial)}</strong></p>
        </div>
        <div class="view-actions">
          <button class="btn btn-primary btn-sm" id="btn-print-active-doc">\u{1F5A8}\uFE0F Imprimir / Descargar PDF</button>
        </div>
      </div>

      <!-- SELECTOR DE PLANTILLAS TIPO IOS SEGMENTED CONTROL -->
      <div class="mb-4 d-flex items-center gap-3 flex-wrap">
        <span class="text-xs font-bold text-muted">DOCUMENTO:</span>
        <div class="ios-segmented-control" id="doc-segmented-tabs">
          <button class="ios-segment-btn active doc-tab-btn" data-doc="INVOICE">\u{1F9FE} Factura / POS</button>
          <button class="ios-segment-btn doc-tab-btn" data-doc="QUOTE">\u{1F4D1} Cotizaci\xF3n Comercial</button>
          <button class="ios-segment-btn doc-tab-btn" data-doc="SHIPPING_LABEL">\u{1F3F7}\uFE0F R\xF3tulo Env\xEDo (1x)</button>
          <button class="ios-segment-btn doc-tab-btn" data-doc="SHIPPING_BATCH">\u{1F5A8}\uFE0F Lote R\xF3tulos (4x)</button>
          <button class="ios-segment-btn doc-tab-btn" data-doc="SHIPPING_NOTE">\u{1F69A} Remisi\xF3n de Entrega</button>
          <button class="ios-segment-btn doc-tab-btn" data-doc="PRODUCTION">\u2699\uFE0F Orden con Firma</button>
        </div>
      </div>

      <!-- VISTA PREVIA DEL DOCUMENTO EN HOJA TIPO CARTA -->
      <div class="card" style="background: rgba(0, 0, 0, 0.06); padding: 14px; display: flex; justify-content: center; overflow-x: auto; border: 1px solid var(--border-color);">
        <div id="doc-sheet-preview" style="background: #ffffff; color: #000000; width: 100%; max-width: 800px; min-height: 700px; padding: 24px; box-shadow: var(--shadow-md); border-radius: 6px; font-size: 13px;">
          ${getPreviewHtml("INVOICE")}
        </div>
      </div>
    `;
      container.querySelectorAll(".doc-tab-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          container.querySelectorAll(".doc-tab-btn").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          activeDocType = btn.getAttribute("data-doc");
          container.querySelector("#doc-sheet-preview").innerHTML = getPreviewHtml(activeDocType);
        });
      });
      container.querySelector("#btn-print-active-doc").addEventListener("click", () => {
        const html = getPreviewHtml(activeDocType);
        ExportService.printDocument(html, `Documento_${activeDocType}_${esc(tenant.nombreComercial)}`);
      });
    }
  };

  // js/modules/formulas-vault.js
  init_formatters();
  init_toast();
  var mpCost = (mp) => Number(mp && (mp.costoPromedio || mp.costo || mp.precioCompra) || 0);
  function normalizeRecipe(r) {
    return {
      ...r,
      nombreFormula: r.nombreFormula || r.nombreReceta || "Receta",
      cantidadProducir: Number(r.cantidadProducir || r.rendimientoLote) || 1,
      unidadMedida: r.unidadMedida || r.unidadMedidaLote || "Unidades",
      volumenTanda: Number(r.volumenTanda) || (/^(litros|galones|kilos)$/i.test(r.unidadMedida || "") ? Number(r.cantidadProducir || r.rendimientoLote) || 0 : 0),
      unidadTanda: r.unidadTanda || (/^(litros|galones|kilos)$/i.test(r.unidadMedida || "") ? r.unidadMedida : "Litros"),
      insumos: (r.insumos || []).map((i) => ({ ...i, productoId: i.productoId || i.materiaPrimaId, mermaEsperada: Number(i.mermaEsperada) || 0 }))
    };
  }
  var FormulasVaultModule = {
    _pin: null,
    // PIN en memoria mientras la bóveda está abierta (nunca se guarda en claro)
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      if (!this._pin) {
        const hasPin = !!await DB.getParam(this.pinParam(tenantId), null);
        this.renderLockScreen(container, tenantId, hasPin);
        return;
      }
      await this.renderVault(container, tenantId);
    },
    pinParam(tenantId) {
      return `vault_pin_${tenantId}`;
    },
    /** Cifra el texto secreto (protocolo de mezcla y especificaciones) de una receta */
    async sealRecipe(r, pin) {
      const secret = { instruccionesFases: r.instruccionesFases || "", especificaciones: r.especificaciones || {} };
      const out = { ...r, secreto: await CryptoUtil.encryptJSON(secret, pin) };
      delete out.instruccionesFases;
      delete out.especificaciones;
      return out;
    },
    /** Descifra en memoria (no modifica la BD) */
    async openRecipe(r, pin) {
      if (!r.secreto)
        return r;
      const sec = await CryptoUtil.decryptJSON(r.secreto, pin);
      return { ...r, instruccionesFases: sec.instruccionesFases, especificaciones: sec.especificaciones };
    },
    /** Cifra recetas que aún tengan el secreto en texto plano (datos de versiones anteriores) */
    async sealLegacy(tenantId, pin) {
      const recipes = await DB.getAll(STORES.RECIPES_BOM, tenantId);
      for (const r of recipes) {
        if (!r.secreto && (r.instruccionesFases || r.especificaciones)) {
          await DB.update(STORES.RECIPES_BOM, await this.sealRecipe(r, pin));
        }
      }
    },
    renderLockScreen(container, tenantId, hasPin) {
      container.innerHTML = `
      <div class="d-flex items-center justify-center" style="min-height: 70vh;">
        <div class="card" style="max-width: 440px; width: 100%; padding: 32px; text-align: center; border-radius: 16px;">
          <div style="font-size: 40px; margin-bottom: 12px;">\u{1F512}</div>
          <h2 style="font-size: 20px; font-weight: 800; color: var(--text-main); margin-bottom: 4px;">B\xF3veda de recetas</h2>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 18px; line-height: 1.45;">
            ${hasPin ? "El protocolo de mezcla y las especificaciones est\xE1n cifrados. Ingrese la clave de la b\xF3veda." : "Defina la clave de la b\xF3veda. Con ella se cifran el protocolo de mezcla y las especificaciones de cada receta."}
          </p>
          <form id="vault-pin-form" autocomplete="off">
            <input type="password" id="vault-pin-inp" class="form-control text-center font-bold mb-2" placeholder="${hasPin ? "PIN de la b\xF3veda" : "Nuevo PIN (4 d\xEDgitos)"}" inputmode="numeric" maxlength="4" required autofocus style="font-size: 16px; height: 44px;">
            ${hasPin ? "" : '<input type="password" id="vault-pin-inp2" class="form-control text-center font-bold mb-2" placeholder="Repetir PIN" inputmode="numeric" maxlength="4" required style="font-size: 16px; height: 44px;">'}
            <div id="vault-pin-err" class="alert alert-danger mb-3 text-xs" style="display: none; padding: 8px;"></div>
            ${hasPin ? "" : '<div class="alert alert-warning text-xs mb-3" style="text-align: left;">\u26A0\uFE0F Si olvida esta clave, el texto cifrado de las recetas <strong>no se puede recuperar</strong> (ni siquiera el desarrollador). An\xF3tela en un lugar seguro. Las cantidades de insumos no se cifran porque Producci\xF3n las necesita.</div>'}
            <button type="submit" class="btn btn-primary w-100 font-bold" style="height: 42px;">${hasPin ? "\u{1F513} Abrir b\xF3veda" : "\u{1F510} Crear clave y abrir"}</button>
          </form>
        </div>
      </div>
    `;
      const form = container.querySelector("#vault-pin-form");
      const err = container.querySelector("#vault-pin-err");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        err.style.display = "none";
        const val = container.querySelector("#vault-pin-inp").value;
        try {
          if (hasPin) {
            const stored = await DB.getParam(this.pinParam(tenantId), null);
            if (!await CryptoUtil.verifyPassword(val, stored))
              throw new Error("Clave incorrecta.");
          } else {
            if (!/^\d{4}$/.test(val))
              throw new Error("El PIN de la b\xF3veda debe tener 4 d\xEDgitos num\xE9ricos.");
            if (val !== container.querySelector("#vault-pin-inp2").value)
              throw new Error("Las claves no coinciden.");
            await DB.setParam(this.pinParam(tenantId), await CryptoUtil.hashPassword(val), tenantId);
            await AuditService.log({ modulo: "B\xF3veda", accion: "CREAR", campoModificado: "Clave de b\xF3veda", valorNuevo: "Definida" });
          }
          this._pin = val;
          await this.sealLegacy(tenantId, val);
          Toast.success("B\xF3veda abierta.");
          this.render(container);
        } catch (ex) {
          err.textContent = ex.message;
          err.style.display = "block";
        }
      });
    },
    async renderVault(container, tenantId) {
      const [sealed, rawMaterials, finishedGoods] = await Promise.all([
        DB.getAll(STORES.RECIPES_BOM, tenantId),
        (await DB.getAll(STORES.PRODUCTS, tenantId)).filter((p) => p.tipoItem === "MATERIA_PRIMA"),
        (await DB.getAll(STORES.PRODUCTS, tenantId)).filter((p) => p.tipoItem === "PRODUCTO_TERMINADO")
      ]);
      const recipes = [];
      for (const r of sealed) {
        try {
          recipes.push(await this.openRecipe(r, this._pin));
        } catch (e) {
          recipes.push({ ...r, instruccionesFases: "\u26A0\uFE0F No se pudo descifrar con la clave actual." });
        }
      }
      recipes.forEach((r, i) => {
        recipes[i] = normalizeRecipe(r);
      });
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>B\xF3veda de f\xF3rmulas <span class="badge badge-success" style="vertical-align: middle;">Abierta</span></h1>
          <p>${recipes.length} f\xF3rmula(s). El protocolo de mezcla y las especificaciones se guardan cifrados.</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-lock-now">Cerrar b\xF3veda</button>
          <button class="btn btn-secondary btn-sm" id="btn-change-pin">Cambiar PIN</button>
          <button class="btn btn-primary btn-sm" id="btn-nueva-receta-asistente">Nueva f\xF3rmula</button>
        </div>
      </div>

      <div class="d-flex flex-col gap-3">
        ${recipes.length === 0 ? `
          <div class="card text-center p-5 text-muted">
            <strong>A\xFAn no hay f\xF3rmulas en la b\xF3veda.</strong>
            <p class="text-xs mt-1">Cree la primera con el bot\xF3n <em>Nueva f\xF3rmula</em>.</p>
            <button class="btn btn-primary btn-sm mt-2" id="btn-receta-vacia">Nueva f\xF3rmula</button>
          </div>
        ` : recipes.map((r) => {
        const fg = finishedGoods.find((p) => p.id === r.productoTerminadoId) || {};
        let costoTanda = 0;
        let sumaPorcentajes = 0;
        let conPorcentaje = false;
        const insumosConCosto = r.insumos.map((ins) => {
          const mp = rawMaterials.find((m) => m.id === ins.productoId) || {};
          const costoUnit = mpCost(mp);
          const cant = Number(ins.cantidad || 0) * (1 + Number(ins.mermaEsperada || 0) / 100);
          const sub = cant * costoUnit;
          costoTanda += sub;
          if (ins.porcentaje) {
            conPorcentaje = true;
            sumaPorcentajes += Number(ins.porcentaje);
          }
          return { ...ins, mp, costoUnit, sub, unidad: ins.unidadMedida || mp.unidadMedida || "" };
        });
        costoTanda += Number(r.costosIndirectosEstimados || 0);
        const lote = r.cantidadProducir;
        const costoUnidad = lote > 0 ? costoTanda / lote : costoTanda;
        const sinCosto = insumosConCosto.some((i) => !(i.costoUnit > 0));
        return `
            <div class="card recipe-card">
              <div class="recipe-head">
                <div>
                  <h3 class="recipe-title">${esc(r.nombreFormula)}</h3>
                  <div class="text-xs text-muted">Producto: <strong>${esc(fg.nombre || "sin vincular")}</strong> \xB7 Rinde: <strong>${esc(lote)} ${esc(fg.unidadMedida || r.unidadMedida)}</strong> por lote${r.volumenTanda ? ` \xB7 tanda ${esc(r.volumenTanda)} ${esc(r.unidadTanda)}` : ""}</div>
                </div>
                <div class="recipe-costs">
                  <div><span class="ps-label">Costo del lote</span><strong>${Formatters.currency(costoTanda)}</strong></div>
                  <div><span class="ps-label">Costo por unidad</span><strong>${Formatters.currency(costoUnidad)}</strong></div>
                  ${conPorcentaje ? `<div><span class="ps-label">Suma de %</span><strong class="${Math.abs(sumaPorcentajes - 100) < 0.5 ? "text-success" : "text-warning"}">${sumaPorcentajes.toFixed(1)}%</strong></div>` : ""}
                </div>
                <div class="recipe-actions">
                  ${r.productoTerminadoId ? `<button class="btn btn-secondary btn-sm btn-calcular-precios" data-id="${esc(r.id)}">Precios</button>` : ""}
                  <button class="btn btn-secondary btn-sm btn-editar-receta" data-id="${esc(r.id)}">Editar</button>
                </div>
              </div>
              ${sinCosto ? '<div class="text-xs text-warning mt-1">Alg\xFAn insumo no tiene costo todav\xEDa (registre una compra); el costo del lote est\xE1 incompleto.</div>' : ""}
              <details class="recipe-details">
                <summary>Ingredientes (${insumosConCosto.length})${r.instruccionesFases ? " y protocolo de mezcla" : ""}</summary>
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead><tr><th>Insumo</th><th>Momento</th>${conPorcentaje ? '<th class="text-right">%</th>' : ""}<th class="text-right">Cantidad en el lote</th><th class="text-right">Costo</th></tr></thead>
                    <tbody>
                      ${insumosConCosto.map((i) => `
                        <tr>
                          <td><strong>${esc(i.mp.nombre || "Insumo no encontrado")}</strong> <span class="text-muted text-xs">${esc(i.mp.sku || "")}</span></td>
                          <td class="text-xs">${esc(i.fase || "\u2014")}</td>
                          ${conPorcentaje ? `<td class="text-right">${i.porcentaje ? esc(i.porcentaje) + "%" : "\u2014"}</td>` : ""}
                          <td class="text-right">${esc(i.cantidad)} ${esc(i.unidad)}</td>
                          <td class="text-right">${Formatters.currency(i.sub)}</td>
                        </tr>`).join("")}
                      ${Number(r.costosIndirectosEstimados || 0) > 0 ? `<tr><td colspan="${conPorcentaje ? 4 : 3}" class="text-muted">Costos indirectos del lote</td><td class="text-right">${Formatters.currency(r.costosIndirectosEstimados)}</td></tr>` : ""}
                    </tbody>
                  </table>
                </div>
                ${r.instruccionesFases ? `<div class="recipe-protocol"><strong>Protocolo de mezcla</strong><div>${esc(r.instruccionesFases)}</div></div>` : ""}
              </details>
            </div>`;
      }).join("")}
      </div>
    `;
      container.querySelector("#btn-lock-now").addEventListener("click", () => {
        this._pin = null;
        Toast.info("B\xF3veda cerrada");
        this.render(container);
      });
      container.querySelector("#btn-change-pin").addEventListener("click", () => {
        this.openChangePin(tenantId, () => this.render(container));
      });
      const btnNew = container.querySelector("#btn-nueva-receta-asistente");
      if (btnNew)
        btnNew.addEventListener("click", () => {
          this.openFormulaWizard(null, tenantId, finishedGoods, rawMaterials, () => this.render(container));
        });
      const btnEmpty = container.querySelector("#btn-receta-vacia");
      if (btnEmpty)
        btnEmpty.addEventListener("click", () => {
          this.openFormulaWizard(null, tenantId, finishedGoods, rawMaterials, () => this.render(container));
        });
      container.querySelectorAll(".btn-editar-receta").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const r = recipes.find((rec) => rec.id === id);
          this.openFormulaWizard(r, tenantId, finishedGoods, rawMaterials, () => this.render(container));
        });
      });
      container.querySelectorAll(".btn-calcular-precios").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const r = recipes.find((rec) => rec.id === id);
          if (r) {
            const { instruccionesFases, especificaciones, secreto, ...publica } = r;
            sessionStorage.setItem("nexa_target_pricing_formula", JSON.stringify(publica));
            window.location.hash = "#pricing-calculator";
          }
        });
      });
    },
    /**
     * ASISTENTE MODAL GUIADO PASO A PASO (WIZARD DE BÓVEDA)
     */
    openFormulaWizard(existingRecipe, tenantId, finishedGoods, rawMaterials, onSaved) {
      const wiz = {
        step: 1,
        id: existingRecipe ? existingRecipe.id : "rec_" + Date.now(),
        nombreFormula: existingRecipe?.nombreFormula || "",
        productoTerminadoId: existingRecipe?.productoTerminadoId || "",
        cantidadProducir: existingRecipe?.cantidadProducir || 200,
        unidadMedida: "Unidades",
        volumenTanda: Number(existingRecipe?.volumenTanda) || 0,
        unidadTanda: existingRecipe?.unidadTanda || "Litros",
        ph: existingRecipe?.especificaciones?.ph || "",
        cif: Number(existingRecipe?.costosIndirectosEstimados || 0),
        insumos: existingRecipe?.insumos ? JSON.parse(JSON.stringify(existingRecipe.insumos)) : [
          { productoId: "", fase: "Paso 1 (Al inicio)", porcentaje: 0, cantidad: 0, mermaEsperada: 0 }
        ],
        instruccionesFases: existingRecipe?.instruccionesFases || ""
      };
      const dialog = Modal.show({
        title: existingRecipe ? "\u270F\uFE0F Asistente: Editar Receta Maestra" : "\u2728 Asistente Guiado: Crear Nueva Receta",
        size: "lg",
        content: '<div id="wizard-formula-container"></div>',
        footerButtons: []
      });
      const root = dialog.querySelector("#wizard-formula-container");
      const calcTotals = () => {
        let costoTanda = 0;
        let sumaPct = 0;
        wiz.insumos.forEach((i) => {
          const mp = rawMaterials.find((m) => m.id === i.productoId) || {};
          costoTanda += Number(i.cantidad || 0) * (1 + (Number(i.mermaEsperada) || 0) / 100) * mpCost(mp);
          sumaPct += Number(i.porcentaje || 0);
        });
        const batch = Number(wiz.cantidadProducir) || 1;
        return { costoTanda, sumaPct, costoPorLitro: batch > 0 ? Math.round(costoTanda / batch) : costoTanda };
      };
      const unidadSingular = () => String(wiz.unidadMedida || "unidad").replace(/es$/i, "").replace(/s$/i, "").toLowerCase();
      const balanceHtml = (sumaPct) => wiz.insumos.some((i) => Number(i.porcentaje) > 0) ? `<span class="badge ${Math.abs(sumaPct - 100) < 0.5 ? "badge-success" : "badge-warning"} font-bold">${sumaPct.toFixed(1)}% ${Math.abs(sumaPct - 100) < 0.5 ? "\u2713" : `(faltan o sobran ${(100 - sumaPct).toFixed(1)}%)`}</span>` : '<span class="text-xs text-muted">Opcional: escriba el % de cada insumo para calcular la cantidad autom\xE1ticamente.</span>';
      const renderStep = () => {
        const stepperHtml = `
        <div class="wizard-stepper">
          <div class="wizard-step-item ${wiz.step === 1 ? "active" : wiz.step > 1 ? "completed" : ""}">
            <div class="step-circle">${wiz.step > 1 ? "\u2713" : "1"}</div>
            <span>1. Producto & Tanda</span>
          </div>
          <div class="wizard-step-item ${wiz.step === 2 ? "active" : wiz.step > 2 ? "completed" : ""}">
            <div class="step-circle">${wiz.step > 2 ? "\u2713" : "2"}</div>
            <span>2. Reactivos Qu\xEDmicos</span>
          </div>
          <div class="wizard-step-item ${wiz.step === 3 ? "active" : wiz.step > 3 ? "completed" : ""}">
            <div class="step-circle">${wiz.step > 3 ? "\u2713" : "3"}</div>
            <span>3. Protocolo de Mezcla</span>
          </div>
          <div class="wizard-step-item ${wiz.step === 4 ? "active" : ""}">
            <div class="step-circle">4</div>
            <span>4. Ficha & Guardado</span>
          </div>
        </div>
      `;
        const { costoTanda, sumaPct, costoPorLitro } = calcTotals();
        let bodyHtml = "";
        if (wiz.step === 1) {
          bodyHtml = `
          <div class="wizard-helper-box">
            <strong>Paso 1 de 4:</strong> Nombra tu receta y define el tama\xF1o est\xE1ndar de la tanda que preparas en tus tanques o recipientes.
          </div>

          <div class="nexa-grid-2 mb-3">
            <div>
              <label class="font-bold text-xs">Nombre de la Receta Maestra:</label>
              <input type="text" id="wiz-rec-name" class="form-control font-bold" value="${esc(wiz.nombreFormula)}" placeholder="Ej: Desengrasante Pesado Industrial" required>
            </div>
            <div>
              <label class="font-bold text-xs">\xBFA qu\xE9 Producto Terminado corresponde?</label>
              <select class="form-select font-bold" id="wiz-rec-prod">
                <option value="">-- Sin vincular a\xFAn (Solo f\xF3rmula) --</option>
                ${finishedGoods.map((fg) => `
                  <option value="${fg.id}" ${wiz.productoTerminadoId === fg.id ? "selected" : ""}>
                    ${esc(fg.nombre)} (${esc(fg.sku || "-")})
                  </option>
                `).join("")}
              </select>
            </div>
          </div>

          <div class="nexa-grid-2 mb-3">
            <div>
              <label class="font-bold text-xs">Rendimiento: \xBFcu\xE1ntas unidades del producto salen de un lote?</label>
              <input type="number" step="any" min="1" id="wiz-rec-batch" class="form-control font-bold" value="${wiz.cantidadProducir}" required>
              <div class="text-xs text-muted mt-1">En la unidad del producto (botellas, galones envasados, garrafas). Producci\xF3n descuenta los insumos en esa proporci\xF3n.</div>
            </div>
            <div>
              <label class="font-bold text-xs">Tama\xF1o de la tanda (opcional, para calcular con %):</label>
              <div class="d-flex gap-2">
                <input type="number" step="any" min="0" id="wiz-rec-vol" class="form-control" value="${wiz.volumenTanda || ""}" placeholder="Ej: 100">
                <select class="form-select" id="wiz-rec-unit" style="max-width: 120px;">
                  ${["Litros", "Galones", "Kilos"].map((u) => `<option value="${u}" ${wiz.unidadTanda === u ? "selected" : ""}>${u}</option>`).join("")}
                </select>
              </div>
            </div>
            <div>
              <label class="font-bold text-xs">pH esperado (Opcional):</label>
              <input type="text" id="wiz-rec-ph" class="form-control" value="${wiz.ph}" placeholder="Ej: 11 a 12 (Alcalino)">
            </div>
            <div>
              <label class="font-bold text-xs">Costos indirectos por lote (opcional):</label>
              <input type="number" min="0" step="100" id="wiz-rec-cif" class="form-control" value="${wiz.cif || ""}" placeholder="Mano de obra, energ\xEDa, agua\u2026">
            </div>
          </div>
        `;
        } else if (wiz.step === 2) {
          bodyHtml = `
          <div class="wizard-helper-box">
            <strong>Paso 2 de 4:</strong> Agregue todos los insumos del lote (qu\xEDmicos, envases, cajas) con la cantidad que usa.
            El costo se calcula al instante con el costo promedio de cada insumo.
          </div>

          <div class="d-flex justify-between items-center mb-2">
            <div>
              <span class="text-xs font-bold text-muted">LISTA DE REACTIVOS DE LA RECETA:</span>
            </div>
            <button type="button" class="btn btn-secondary btn-sm font-bold" id="wiz-btn-add-ing">
              + Agregar Reactivo
            </button>
          </div>

          <div class="table-responsive mb-2" style="max-height: 240px; overflow-y: auto;">
            <table class="table table-sm text-xs" style="margin-bottom: 0;">
              <thead>
                <tr>
                  <th>Materia Prima</th>
                  <th style="width: 140px;">Momento</th>
                  <th style="width: 90px;" class="text-center">%</th>
                  <th style="width: 110px;" class="text-center">Cantidad en el lote</th>
                  <th style="width: 60px;">Unidad</th>
                  <th style="width: 80px;" class="text-center" title="P\xE9rdida esperada del insumo en el proceso">Merma %</th>
                  <th style="width: 40px;"></th>
                </tr>
              </thead>
              <tbody id="wiz-tbody-ings">
                ${wiz.insumos.map((item, idx) => `
                  <tr data-idx="${idx}">
                    <td>
                      <select class="form-select form-select-sm sel-mp font-bold">
                        <option value="" disabled ${!item.productoId ? "selected" : ""}>Elegir insumo...</option>
                        ${rawMaterials.map((rm) => `
                          <option value="${rm.id}" ${item.productoId === rm.id ? "selected" : ""}>
                            ${esc(rm.nombre)} (${Formatters.currency(mpCost(rm))}/${esc(rm.unidadMedida || "u")})
                          </option>
                        `).join("")}
                      </select>
                    </td>
                    <td>
                      <select class="form-select form-select-sm sel-fase">
                        <option value="Paso 1 (Al inicio)" ${item.fase === "Paso 1 (Al inicio)" ? "selected" : ""}>Paso 1 (Al inicio)</option>
                        <option value="Paso 2 (En el medio)" ${item.fase === "Paso 2 (En el medio)" ? "selected" : ""}>Paso 2 (En el medio)</option>
                        <option value="Paso 3 (Al final)" ${item.fase === "Paso 3 (Al final)" ? "selected" : ""}>Paso 3 (Al final)</option>
                      </select>
                    </td>
                    <td>
                      <input type="number" step="0.1" min="0" max="100" class="form-control form-control-sm text-center font-bold inp-pct" value="${item.porcentaje || ""}" placeholder="%"
                        ${!(wiz.volumenTanda > 0) || /^(unidad|unidades|und)$/i.test((rawMaterials.find((m) => m.id === item.productoId) || {}).unidadMedida || "") ? 'disabled title="El % aplica solo a qu\xEDmicos y requiere el tama\xF1o de la tanda (paso 1)"' : ""}>
                    </td>
                    <td>
                      <input type="number" step="any" min="0" class="form-control form-control-sm text-center font-bold inp-qty" value="${item.cantidad || ""}" placeholder="Cantidad">
                    </td>
                    <td class="text-xs text-muted">${esc((rawMaterials.find((m) => m.id === item.productoId) || {}).unidadMedida || "")}</td>
                    <td><input type="number" step="0.5" min="0" max="50" class="form-control form-control-sm text-center inp-merma" value="${item.mermaEsperada || ""}" placeholder="0"></td>
                    <td>
                      <button type="button" class="btn btn-secondary btn-sm btn-del-row" style="padding: 1px 6px; color: var(--danger-color);">&times;</button>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <!-- Barra de Balance y Costo en Vivo -->
          <div class="p-3 card mb-0" style="background: var(--bg-surface-solid); border-radius: 8px;">
            <div class="d-flex justify-between items-center">
              <div>
                <span class="text-xs text-muted font-bold">Proporciones (%):</span>
                <div class="d-flex items-center gap-2 mt-1" id="wiz-sum-balance">${balanceHtml(sumaPct)}</div>
              </div>

              <div class="text-right">
                <span class="text-xs text-muted font-bold">Costo de insumos por ${esc(unidadSingular())}:</span>
                <div style="font-size: 18px; font-weight: 900; color: var(--brand-primary);" id="wiz-sum-unit">${Formatters.currency(costoPorLitro)}</div>
                <span class="text-xs text-muted" id="wiz-sum-total">Total del lote: ${Formatters.currency(costoTanda)}</span>
              </div>
            </div>
          </div>
        `;
        } else if (wiz.step === 3) {
          bodyHtml = `
          <div class="wizard-helper-box">
            <strong>Paso 3 de 4:</strong> Escribe las instrucciones de mezclado paso a paso para que cualquier operario 
            prepare la f\xF3rmula exactamente con la misma calidad.
          </div>

          <div class="form-group mb-2">
            <div class="d-flex justify-between items-center mb-1">
              <label class="font-bold text-xs">Instrucciones de Preparaci\xF3n (Paso a Paso):</label>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-plantilla-mezcla" style="font-size: 10.5px; padding: 2px 8px;">
                Insertar Plantilla Gu\xEDa
              </button>
            </div>
            <textarea id="wiz-rec-steps" rows="6" class="form-control text-xs" style="font-size: 12px; line-height: 1.4;" placeholder="Paso 1: Llenar el tanque con el agua base y encender el agitador a media velocidad...&#10;Paso 2: Agregar el qu\xEDmico activo lentamente para evitar salpicaduras...&#10;Paso 3: Incorporar el color y la fragancia hasta homogenizar...&#10;Paso 4: Tomar muestra de pH antes del envasado.">${esc(wiz.instruccionesFases)}</textarea>
          </div>
        `;
        } else if (wiz.step === 4) {
          const prodAsoc = finishedGoods.find((p) => p.id === wiz.productoTerminadoId);
          bodyHtml = `
          <div class="wizard-helper-box">
            <strong>Paso 4 de 4:</strong> Ficha t\xE9cnica consolidada lista para registrar en tu B\xF3veda Privada.
          </div>

          <div class="card p-3 mb-3" style="background: var(--bg-surface-solid); border-radius: 10px;">
            <div class="d-flex justify-between items-start mb-2">
              <div>
                <h4 style="font-size: 15px; font-weight: 800; margin: 0; color: var(--text-main);">\u{1F9EA} ${esc(wiz.nombreFormula)}</h4>
                <div class="text-xs text-muted">
                  Producto Asociado: <strong>${prodAsoc ? prodAsoc.nombre : "Sin vincular"}</strong> | Rinde: <strong>${esc(wiz.cantidadProducir)} unidades por lote</strong>${wiz.volumenTanda ? ` (tanda de ${esc(wiz.volumenTanda)} ${esc(wiz.unidadTanda)})` : ""}
                </div>
              </div>
              <span class="badge badge-success font-bold">100% Confidencial</span>
            </div>

            <div class="nexa-grid-3 mt-2">
              <div class="p-2" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); border-radius: 6px;">
                <div class="text-xs text-muted font-bold">Reactivos en la mezcla:</div>
                <strong style="font-size: 14px; color: var(--text-main);">${wiz.insumos.length} ingredientes</strong>
              </div>
              <div class="p-2" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); border-radius: 6px;">
                <div class="text-xs text-muted font-bold">Costo Total Tanda:</div>
                <strong style="font-size: 14px; color: #047857;">${Formatters.currency(costoTanda)}</strong>
              </div>
              <div class="p-2" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); border-radius: 6px;">
                <div class="text-xs text-muted font-bold">Costo L\xEDquido x Litro:</div>
                <strong style="font-size: 14px; color: #0284c7;">${Formatters.currency(costoPorLitro)} / L</strong>
              </div>
            </div>
          </div>

          <div class="p-3 card mb-0" style="background: rgba(0, 113, 227, 0.04); border: 1px solid var(--brand-primary); border-radius: 8px;">
            <div class="d-flex justify-between items-center">
              <div>
                <strong style="font-size: 13px; color: var(--brand-primary);">\xBFDeseas fijar precios de venta con este costo qu\xEDmico?</strong>
                <p class="text-xs text-muted mb-0">Podemos transferir autom\xE1ticamente los <strong>${Formatters.currency(costoPorLitro)}</strong> a la Calculadora de Precios.</p>
              </div>
              <button type="button" class="btn btn-primary btn-sm font-bold" id="wiz-btn-save-and-pricing">
                \u{1F4A1} Guardar e Ir a Precios
              </button>
            </div>
          </div>
        `;
        }
        const footerHtml = `
        <div class="wizard-footer">
          <div>
            ${wiz.step > 1 ? `
              <button type="button" class="btn btn-secondary btn-sm font-bold" id="wiz-rec-prev">
                \u2B05\uFE0F Atr\xE1s
              </button>
            ` : `
              <button type="button" class="btn btn-secondary btn-sm" id="wiz-rec-cancel">
                Cancelar
              </button>
            `}
          </div>

          <div>
            ${wiz.step < 4 ? `
              <button type="button" class="btn btn-primary btn-sm font-bold" id="wiz-rec-next">
                Siguiente \u2794
              </button>
            ` : `
              <button type="button" class="btn btn-success btn-sm font-bold" id="wiz-rec-save" style="padding: 6px 18px; font-size: 13px;">
                \u{1F512} Guardar Receta en B\xF3veda
              </button>
            `}
          </div>
        </div>
      `;
        root.innerHTML = `
        <div class="wizard-body">
          <div class="wizard-step-content">
            ${stepperHtml}
            ${bodyHtml}
          </div>
          ${footerHtml}
        </div>
      `;
        const btnCancel = root.querySelector("#wiz-rec-cancel");
        if (btnCancel)
          btnCancel.addEventListener("click", () => Modal.close());
        const btnPrev = root.querySelector("#wiz-rec-prev");
        if (btnPrev)
          btnPrev.addEventListener("click", () => {
            wiz.step = Math.max(1, wiz.step - 1);
            renderStep();
          });
        const btnNext = root.querySelector("#wiz-rec-next");
        if (btnNext)
          btnNext.addEventListener("click", () => {
            if (wiz.step === 1 && !wiz.nombreFormula.trim()) {
              Toast.warning("Escribe un nombre para la receta.");
              return;
            }
            wiz.step = Math.min(4, wiz.step + 1);
            renderStep();
          });
        if (wiz.step === 1) {
          const inpN = root.querySelector("#wiz-rec-name");
          const selP = root.querySelector("#wiz-rec-prod");
          const inpB = root.querySelector("#wiz-rec-batch");
          const selU = root.querySelector("#wiz-rec-unit");
          const inpPh = root.querySelector("#wiz-rec-ph");
          inpN.addEventListener("input", () => {
            wiz.nombreFormula = inpN.value;
          });
          selP.addEventListener("change", () => {
            wiz.productoTerminadoId = selP.value;
          });
          inpB.addEventListener("input", () => {
            wiz.cantidadProducir = Number(inpB.value) || 1;
          });
          selU.addEventListener("change", () => {
            wiz.unidadTanda = selU.value;
          });
          const inpV = root.querySelector("#wiz-rec-vol");
          inpV.addEventListener("input", () => {
            wiz.volumenTanda = Number(inpV.value) || 0;
          });
          inpPh.addEventListener("input", () => {
            wiz.ph = inpPh.value;
          });
          const inpCif = root.querySelector("#wiz-rec-cif");
          inpCif.addEventListener("input", () => {
            wiz.cif = Number(inpCif.value) || 0;
          });
        }
        if (wiz.step === 2) {
          const tbody = root.querySelector("#wiz-tbody-ings");
          const updateSummary = () => {
            const t = calcTotals();
            const bal = root.querySelector("#wiz-sum-balance");
            if (bal)
              bal.innerHTML = balanceHtml(t.sumaPct);
            const u = root.querySelector("#wiz-sum-unit");
            if (u)
              u.textContent = Formatters.currency(t.costoPorLitro);
            const tot = root.querySelector("#wiz-sum-total");
            if (tot)
              tot.textContent = `Total del lote: ${Formatters.currency(t.costoTanda)}`;
          };
          const syncRows = (rerender = true) => {
            wiz.insumos = [];
            tbody.querySelectorAll("tr").forEach((tr) => {
              const selMp = tr.querySelector(".sel-mp");
              const selFase = tr.querySelector(".sel-fase");
              const inpPct = tr.querySelector(".inp-pct");
              const inpQty = tr.querySelector(".inp-qty");
              const inpMer = tr.querySelector(".inp-merma");
              if (selMp && selMp.value) {
                wiz.insumos.push({
                  productoId: selMp.value,
                  fase: selFase.value,
                  porcentaje: inpPct.disabled ? 0 : Number(inpPct.value) || 0,
                  cantidad: Number(inpQty.value) || 0,
                  mermaEsperada: Number(inpMer.value) || 0
                });
              }
            });
            if (rerender)
              renderStep();
            else
              updateSummary();
          };
          tbody.querySelectorAll("tr").forEach((tr) => {
            const selMp = tr.querySelector(".sel-mp");
            const selFase = tr.querySelector(".sel-fase");
            const inpPct = tr.querySelector(".inp-pct");
            const inpQty = tr.querySelector(".inp-qty");
            const btnDel = tr.querySelector(".btn-del-row");
            btnDel.addEventListener("click", () => {
              tr.remove();
              syncRows();
            });
            inpPct.addEventListener("input", () => {
              const p = Number(inpPct.value) || 0;
              const b = Number(wiz.volumenTanda) || 0;
              if (b > 0 && p > 0)
                inpQty.value = (b * p / 100).toFixed(2);
              syncRows(false);
            });
            selMp.addEventListener("change", syncRows);
            selFase.addEventListener("change", syncRows);
            inpQty.addEventListener("input", () => syncRows(false));
            tr.querySelector(".inp-merma").addEventListener("input", () => syncRows(false));
          });
          const btnAdd = root.querySelector("#wiz-btn-add-ing");
          btnAdd.addEventListener("click", () => {
            wiz.insumos.push({ productoId: "", fase: "Paso 2 (En el medio)", porcentaje: 0, cantidad: 0, mermaEsperada: 0 });
            renderStep();
          });
        }
        if (wiz.step === 3) {
          const txt = root.querySelector("#wiz-rec-steps");
          txt.addEventListener("input", () => {
            wiz.instruccionesFases = txt.value;
          });
          const btnTpl = root.querySelector("#btn-plantilla-mezcla");
          if (btnTpl)
            btnTpl.addEventListener("click", () => {
              txt.value = "Paso 1: Llenar el tanque con el 80% del agua requerida y encender el agitador a 400 RPM.\nPaso 2: Adicionar los tensoactivos lentamente para evitar formaci\xF3n excesiva de espuma.\nPaso 3: Incorporar los agentes secuestrantes y niveladores de pH.\nPaso 4: Agregar la fragancia y el colorante disuelto previamente en agua tibia.\nPaso 5: Completar con agua al 100%, agitar por 15 minutos y verificar pH en laboratorio.";
              wiz.instruccionesFases = txt.value;
              Toast.info("Plantilla insertada");
            });
        }
        if (wiz.step === 4) {
          const doSave = async (goToPricing = false) => {
            const existing = await DB.getById(STORES.RECIPES_BOM, wiz.id) || {};
            const nombre = wiz.nombreFormula.trim() || "F\xF3rmula sin nombre";
            const lote = Number(wiz.cantidadProducir) || 1;
            const recData = {
              ...existing,
              id: wiz.id,
              tenantId,
              nombreFormula: nombre,
              nombreReceta: nombre,
              productoTerminadoId: wiz.productoTerminadoId,
              cantidadProducir: lote,
              rendimientoLote: lote,
              unidadMedida: "Unidades",
              unidadMedidaLote: "Unidades",
              volumenTanda: Number(wiz.volumenTanda) || 0,
              unidadTanda: wiz.unidadTanda,
              instruccionesFases: wiz.instruccionesFases,
              especificaciones: { ph: wiz.ph },
              costosIndirectosEstimados: Number(wiz.cif) || 0,
              insumos: wiz.insumos.map((i) => ({ ...i, materiaPrimaId: i.productoId, unidadMedida: i.unidadMedida || (rawMaterials.find((m) => m.id === i.productoId) || {}).unidadMedida || "" })),
              estado: existing.estado || "ACTIVO"
            };
            if (!this._pin) {
              Toast.error("La b\xF3veda se cerr\xF3. \xC1brala de nuevo para guardar.");
              return;
            }
            await DB.update(STORES.RECIPES_BOM, await this.sealRecipe(recData, this._pin));
            Toast.success(`\xA1Receta "${recData.nombreFormula}" guardada en B\xF3veda!`);
            Modal.close();
            if (goToPricing) {
              const { instruccionesFases, especificaciones, ...publica } = recData;
              sessionStorage.setItem("nexa_target_pricing_formula", JSON.stringify(publica));
              window.location.hash = "#pricing-calculator";
            } else if (onSaved) {
              onSaved();
            }
          };
          const btnSave = root.querySelector("#wiz-rec-save");
          if (btnSave)
            btnSave.addEventListener("click", () => doSave(false));
          const btnSavePricing = root.querySelector("#wiz-btn-save-and-pricing");
          if (btnSavePricing)
            btnSavePricing.addEventListener("click", () => doSave(true));
        }
      };
      renderStep();
    },
    openChangePin(tenantId, onDone) {
      const dialog = Modal.show({
        title: "Cambiar clave de la b\xF3veda",
        size: "sm",
        content: `
        <form id="vault-change-form" autocomplete="off">
          <div class="form-group mb-3"><label class="font-bold text-xs">Clave actual</label>
            <input type="password" name="cur" class="form-control" required></div>
          <div class="form-group mb-3"><label class="font-bold text-xs">Nuevo PIN (4 d\xEDgitos)</label>
            <input type="password" name="n1" class="form-control" required></div>
          <div class="form-group mb-3"><label class="font-bold text-xs">Repetir nueva clave</label>
            <input type="password" name="n2" class="form-control" required></div>
          <p class="text-xs text-muted">Todas las recetas se volver\xE1n a cifrar con la nueva clave.</p>
        </form>`,
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: "Guardar clave",
            class: "btn-primary",
            onClick: async (dlg, ev) => {
              const fd = new FormData(dialog.querySelector("#vault-change-form"));
              const cur = fd.get("cur");
              const n1 = fd.get("n1");
              const stored = await DB.getParam(this.pinParam(tenantId), null);
              if (!await CryptoUtil.verifyPassword(cur, stored)) {
                Toast.error("La clave actual no es correcta.");
                return;
              }
              if (!/^\d{4}$/.test(n1)) {
                Toast.warning("El PIN debe tener 4 d\xEDgitos num\xE9ricos.");
                return;
              }
              if (n1 !== fd.get("n2")) {
                Toast.warning("Las claves no coinciden.");
                return;
              }
              ev.target.disabled = true;
              try {
                const recipes = await DB.getAll(STORES.RECIPES_BOM, tenantId);
                const resealed = [];
                for (const r of recipes)
                  resealed.push(r.secreto ? await this.sealRecipe(await this.openRecipe(r, cur), n1) : r);
                const hash = await CryptoUtil.hashPassword(n1);
                await DB.runTransaction([STORES.RECIPES_BOM, STORES.SYSTEM_PARAMS], async (tx) => {
                  for (const r of resealed)
                    await tx.put(STORES.RECIPES_BOM, r);
                  const row = await tx.get(STORES.SYSTEM_PARAMS, this.pinParam(tenantId)) || { id: this.pinParam(tenantId), tenantId };
                  row.valor = hash;
                  await tx.put(STORES.SYSTEM_PARAMS, row);
                });
                this._pin = n1;
                await AuditService.log({ modulo: "B\xF3veda", accion: "MODIFICAR", campoModificado: "Clave de b\xF3veda", valorNuevo: "Cambiada" });
                Toast.success("Clave actualizada y recetas cifradas de nuevo.");
                Modal.close();
                if (onDone)
                  onDone();
              } catch (err) {
                Toast.error(err.message);
                ev.target.disabled = false;
              }
            }
          }
        ]
      });
    }
  };

  // js/modules/pricing-calculator.js
  init_formatters();
  init_toast();
  var DEFAULT_MARGINS = { P1: 50, P2: 38, P3: 28, P4: 18, P5: 15 };
  var LOW_MARGIN = 10;
  var WARN_MARGIN = 20;
  var money = (v) => Formatters.currency(Math.round(Number(v) || 0));
  var ceil100 = (v) => Math.ceil((Number(v) || 0) / 100) * 100;
  var round100 = (v) => Math.round((Number(v) || 0) / 100) * 100;
  var PricingCalculatorModule = {
    tenantId: null,
    products: [],
    // vendibles (no materia prima)
    lists: [],
    // listas de precios ordenadas P1..P5
    recipesByProduct: {},
    filter: "ALL",
    query: "",
    // ------------------------------------------------------------------ cálculos puros
    ivaRate(p) {
      const pct = p && p.ivaPct !== void 0 && p.ivaPct !== null && p.ivaPct !== "" ? Number(p.ivaPct) : TAX_RATES.GENERAL * 100;
      return Number.isFinite(pct) ? pct / 100 : TAX_RATES.GENERAL;
    },
    costOf(p) {
      return Number(p.costoPromedio || p.costoEstimadoCalculadora || 0);
    },
    netOf(p, list, price) {
      const v = Number(price) || 0;
      return list.incluyeIva ? v / (1 + this.ivaRate(p)) : v;
    },
    marginPct(p, list, price, cost = this.costOf(p)) {
      const net = this.netOf(p, list, price);
      if (!(net > 0) || !(cost > 0))
        return null;
      return (net - cost) / net * 100;
    },
    suggest(p, list, cost, marginPct) {
      const m = Math.min(95, Math.max(0, Number(marginPct) || 0)) / 100;
      if (!(cost > 0))
        return 0;
      const net = cost / (1 - m);
      return ceil100(list.incluyeIva ? net * (1 + this.ivaRate(p)) : net);
    },
    targetMargin(list) {
      const v = Number(list.margenObjetivo);
      return Number.isFinite(v) && v > 0 ? v : DEFAULT_MARGINS[PricingService.codeOf(list)] ?? 30;
    },
    marginClass(m) {
      if (m === null)
        return "mg-none";
      if (m < LOW_MARGIN)
        return "mg-bad";
      if (m < WARN_MARGIN)
        return "mg-warn";
      return "mg-ok";
    },
    marginLabel(m) {
      return m === null ? "\u2014" : `${Math.round(m)}%`;
    },
    // ------------------------------------------------------------------ carga
    async load() {
      const tenant = TenantServiceInstance.getActiveTenant();
      this.tenantId = tenant ? tenant.id : null;
      const [products, recipes, lists] = await Promise.all([
        DB.getAll(STORES.PRODUCTS, this.tenantId),
        DB.getAll(STORES.RECIPES_BOM, this.tenantId),
        DB.getAll(STORES.PRICE_LISTS, this.tenantId)
      ]);
      this.products = products.filter((p) => p.tipoItem !== "MATERIA_PRIMA" && p.estado !== "INACTIVO").sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)));
      this.lists = lists.filter((l) => PricingService.codeOf(l)).sort((a, b) => String(PricingService.codeOf(a)).localeCompare(String(PricingService.codeOf(b))));
      this.recipesByProduct = {};
      recipes.filter((r) => r.productoTerminadoId && r.estado !== "INACTIVO").forEach((r) => {
        if (!this.recipesByProduct[r.productoTerminadoId])
          this.recipesByProduct[r.productoTerminadoId] = r;
      });
    },
    async render(container) {
      await this.load();
      this.renderMainView(container);
      const incomingRaw = sessionStorage.getItem("nexa_target_pricing_formula");
      if (incomingRaw) {
        sessionStorage.removeItem("nexa_target_pricing_formula");
        try {
          const formula = JSON.parse(incomingRaw);
          const prod = this.products.find((p) => p.id === formula.productoTerminadoId) || null;
          this.openCalculator(container, prod, formula);
        } catch (e) {
          console.error(e);
        }
      }
    },
    rowStatus(p) {
      const cost = this.costOf(p);
      const margins = this.lists.map((l) => this.marginPct(p, l, PricingService.priceFor(p, l.id), cost));
      const missing = this.lists.some((l) => !PricingService.priceFor(p, l.id));
      const low = margins.some((m) => m !== null && m < LOW_MARGIN);
      return { missing, low, margins };
    },
    visibleProducts() {
      const q = this.query.trim().toLowerCase();
      return this.products.filter((p) => {
        if (q && !`${p.nombre} ${p.sku || ""}`.toLowerCase().includes(q))
          return false;
        if (this.filter === "MISSING")
          return this.rowStatus(p).missing;
        if (this.filter === "LOW")
          return this.rowStatus(p).low;
        if (this.filter === "NOCOST")
          return !(this.costOf(p) > 0);
        return true;
      });
    },
    // ------------------------------------------------------------------ vista principal
    renderMainView(container) {
      const status = this.products.map((p) => this.rowStatus(p));
      const missing = status.filter((s) => s.missing).length;
      const low = status.filter((s) => s.low).length;
      const noCost = this.products.filter((p) => !(this.costOf(p) > 0)).length;
      const p1 = this.lists[0];
      const p1Margins = p1 ? this.products.map((p) => this.marginPct(p, p1, PricingService.priceFor(p, p1.id))).filter((m) => m !== null) : [];
      const avgP1 = p1Margins.length ? Math.round(p1Margins.reduce((a, b) => a + b, 0) / p1Margins.length) : null;
      const chip = (key, label, n) => `<button type="button" class="chip-filter ${this.filter === key ? "active" : ""}" data-filter="${key}">${label}${n !== void 0 ? ` <span class="chip-count">${n}</span>` : ""}</button>`;
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Precios y m\xE1rgenes</h1>
          <p>Edite un precio y guarde la fila, o use <strong>Calcular</strong> para sugerir los precios de todas las listas seg\xFAn el margen.</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-pricing-bulk">Ajuste masivo %</button>
          <button class="btn btn-primary btn-sm" id="btn-pricing-simulate">Simular un precio</button>
        </div>
      </div>

      <div class="pricing-summary mb-3">
        <div><span class="ps-value">${this.products.length}</span><span class="ps-label">productos a la venta</span></div>
        <div><span class="ps-value ${missing ? "text-warning" : ""}">${missing}</span><span class="ps-label">con alguna lista sin precio</span></div>
        <div><span class="ps-value ${low ? "text-danger" : ""}">${low}</span><span class="ps-label">con margen menor a ${LOW_MARGIN}%</span></div>
        <div><span class="ps-value">${avgP1 === null ? "\u2014" : avgP1 + "%"}</span><span class="ps-label">margen promedio ${esc(p1 ? PricingService.codeOf(p1) : "")}</span></div>
      </div>

      <div class="card">
        <div class="pricing-toolbar">
          <input type="search" class="form-control" id="pricing-search" placeholder="Buscar producto o SKU\u2026" value="${esc(this.query)}" style="max-width: 280px;">
          <div class="chip-group">
            ${chip("ALL", "Todos")}
            ${chip("MISSING", "Sin precio", missing)}
            ${chip("LOW", "Margen bajo", low)}
            ${chip("NOCOST", "Sin costo", noCost)}
          </div>
          <span class="text-xs text-muted pricing-legend">Margen = ganancia \xF7 precio sin IVA \xB7
            <span class="mg mg-ok">\u2265${WARN_MARGIN}%</span> <span class="mg mg-warn">${LOW_MARGIN}\u2013${WARN_MARGIN}%</span> <span class="mg mg-bad">&lt;${LOW_MARGIN}%</span></span>
        </div>
        <div class="table-responsive">
          <table class="table pricing-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th class="text-right">Costo unit.</th>
                ${this.lists.map((l) => `<th class="text-right" title="${esc(l.nombre)}">${esc(PricingService.codeOf(l))}<span class="th-sub">${l.incluyeIva ? "con IVA" : "sin IVA"}</span></th>`).join("")}
                <th></th>
              </tr>
            </thead>
            <tbody id="pricing-tbody"></tbody>
          </table>
        </div>
      </div>
    `;
      this.renderRows(container);
      container.querySelector("#pricing-search").addEventListener("input", (e) => {
        this.query = e.target.value;
        this.renderRows(container);
      });
      container.querySelectorAll(".chip-filter").forEach((b) => b.addEventListener("click", () => {
        this.filter = b.dataset.filter;
        this.renderMainView(container);
      }));
      container.querySelector("#btn-pricing-simulate").addEventListener("click", () => this.openCalculator(container, null));
      container.querySelector("#btn-pricing-bulk").addEventListener("click", () => this.openBulkAdjust(container));
    },
    renderRows(container) {
      const tbody = container.querySelector("#pricing-tbody");
      const rows = this.visibleProducts();
      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="${this.lists.length + 3}" class="text-center text-muted p-4">No hay productos con este filtro.</td></tr>`;
        return;
      }
      tbody.innerHTML = rows.map((p) => {
        const cost = this.costOf(p);
        return `
        <tr data-pid="${esc(p.id)}">
          <td>
            <div class="pt-name">${esc(p.nombre)}</div>
            <div class="text-xs text-muted">${esc(p.sku || "")}${this.recipesByProduct[p.id] ? " \xB7 con receta" : ""}</div>
          </td>
          <td class="text-right">${cost > 0 ? money(cost) : '<span class="mg mg-warn" title="Sin costo: registre una compra o una producci\xF3n">sin costo</span>'}</td>
          ${this.lists.map((l) => {
          const price = PricingService.priceFor(p, l.id);
          const m = this.marginPct(p, l, price, cost);
          return `<td class="text-right">
              <input type="number" min="0" step="100" class="price-cell" data-list="${esc(l.id)}" value="${price || ""}" placeholder="\u2014" aria-label="${esc(l.nombre)}">
              <span class="mg ${this.marginClass(m)}">${this.marginLabel(m)}</span>
            </td>`;
        }).join("")}
          <td class="text-right nowrap">
            <button class="btn btn-primary btn-sm btn-row-save" hidden>Guardar</button>
            <button class="btn btn-secondary btn-sm btn-row-calc">Calcular</button>
          </td>
        </tr>`;
      }).join("");
      tbody.querySelectorAll("tr[data-pid]").forEach((tr) => {
        const p = this.products.find((x) => x.id === tr.dataset.pid);
        const saveBtn = tr.querySelector(".btn-row-save");
        tr.querySelectorAll(".price-cell").forEach((inp) => {
          inp.addEventListener("input", () => {
            const l = this.lists.find((x) => x.id === inp.dataset.list);
            const m = this.marginPct(p, l, Number(inp.value));
            const badge = inp.nextElementSibling;
            badge.className = `mg ${this.marginClass(m)}`;
            badge.textContent = this.marginLabel(m);
            inp.classList.add("dirty");
            saveBtn.hidden = false;
          });
          inp.addEventListener("keydown", (e) => {
            if (e.key === "Enter")
              saveBtn.click();
          });
        });
        saveBtn.addEventListener("click", async () => {
          const changes = {};
          tr.querySelectorAll(".price-cell.dirty").forEach((inp) => {
            changes[inp.dataset.list] = Math.max(0, Math.round(Number(inp.value) || 0));
          });
          await this.savePrices(p.id, changes);
          Toast.success(`Precios de "${p.nombre}" guardados.`);
          await this.load();
          this.renderMainView(container);
        });
        tr.querySelector(".btn-row-calc").addEventListener("click", () => this.openCalculator(container, p));
      });
    },
    /** Guarda precios por id de lista (0 = quitar precio). */
    async savePrices(productId, changes, extra = {}) {
      const fresh = await DB.getById(STORES.PRODUCTS, productId);
      const antes = JSON.stringify(fresh.precios || {});
      const precios = { ...fresh.precios || {} };
      Object.entries(changes).forEach(([listId, v]) => {
        if (v > 0)
          precios[listId] = v;
        else
          delete precios[listId];
      });
      Object.assign(fresh, extra, { precios });
      await DB.update(STORES.PRODUCTS, fresh);
      await AuditService.log({ modulo: "Precios", accion: "MODIFICAR", registroId: fresh.sku || fresh.id, campoModificado: "Precios por lista", valorAnterior: antes, valorNuevo: JSON.stringify(precios) });
      return fresh;
    },
    // ------------------------------------------------------------------ calculadora (una sola ventana)
    async openCalculator(container, product, formula = null) {
      const p = product || { nombre: "", ivaPct: void 0, precios: {} };
      const recipe = formula || (product ? this.recipesByProduct[product.id] : null);
      let recipeCost = 0;
      if (recipe && recipe.id) {
        try {
          const lote = Number(recipe.rendimientoLote || recipe.cantidadProducir) || 1;
          recipeCost = (await ProductionService.calculateEstimatedCost(recipe.id, lote)).costoUnitarioEstimado || 0;
        } catch (e) {
          recipeCost = 0;
        }
      }
      const avgCost = product ? Number(product.costoPromedio || 0) : 0;
      const st = {
        base: formula && recipeCost ? recipeCost : avgCost || Number(p.costoEstimadoCalculadora || 0) || recipeCost || 0,
        otros: 0,
        merma: 0,
        margins: Object.fromEntries(this.lists.map((l) => [l.id, this.targetMargin(l)])),
        apply: Object.fromEntries(this.lists.map((l) => [l.id, true]))
      };
      const total = () => ((Number(st.base) || 0) + (Number(st.otros) || 0)) * (1 + (Number(st.merma) || 0) / 100);
      const dialog = Modal.show({
        title: product ? `Calcular precios \xB7 ${product.nombre}` : "Simular un precio (no se guarda)",
        size: "lg",
        content: `
        <div class="calc-grid">
          <div class="calc-costs">
            <div class="form-group mb-2">
              <label class="form-label">Costo base por unidad</label>
              <input type="number" min="0" step="any" class="form-control" id="calc-base" value="${Math.round(st.base) || ""}" placeholder="0">
              <div class="calc-quick">
                ${avgCost > 0 ? `<button type="button" class="btn btn-secondary btn-sm" data-cost="${avgCost}">Costo promedio ${money(avgCost)}</button>` : ""}
                ${recipeCost > 0 ? `<button type="button" class="btn btn-secondary btn-sm" data-cost="${recipeCost}">Receta ${money(recipeCost)}</button>` : ""}
              </div>
            </div>
            <div class="form-group mb-2">
              <label class="form-label">Otros costos por unidad <span class="text-muted">(opcional)</span></label>
              <input type="number" min="0" step="any" class="form-control" id="calc-otros" placeholder="Empaque, mano de obra, transporte\u2026">
            </div>
            <div class="form-group mb-2">
              <label class="form-label">Merma % <span class="text-muted">(opcional)</span></label>
              <input type="number" min="0" max="50" step="0.5" class="form-control" id="calc-merma" placeholder="0">
            </div>
            <div class="calc-total">
              <span>Costo total por unidad</span>
              <strong id="calc-total"></strong>
            </div>
          </div>
          <div class="calc-lists">
            <table class="table calc-table">
              <thead><tr>${product ? "<th></th>" : ""}<th>Lista</th><th class="text-right">Margen %</th><th class="text-right">Sugerido</th>${product ? '<th class="text-right">Actual</th>' : ""}</tr></thead>
              <tbody>
                ${this.lists.map((l) => `
                  <tr data-list="${esc(l.id)}">
                    ${product ? `<td><input type="checkbox" class="calc-apply" checked aria-label="Aplicar ${esc(l.nombre)}"></td>` : ""}
                    <td><strong>${esc(PricingService.codeOf(l))}</strong> <span class="text-xs text-muted">${esc(String(l.nombre).replace(/^P\d\s*-\s*/, ""))}</span>
                      <div class="text-xs text-muted">${l.incluyeIva ? "precio con IVA" : "precio sin IVA"}</div></td>
                    <td class="text-right"><input type="number" min="0" max="95" step="1" class="calc-margin" value="${st.margins[l.id]}"></td>
                    <td class="text-right"><strong class="calc-sug"></strong></td>
                    ${product ? `<td class="text-right calc-cur"></td>` : ""}
                  </tr>`).join("")}
              </tbody>
            </table>
            <p class="text-xs text-muted mb-0">Margen = ganancia \xF7 precio sin IVA. Los sugeridos se redondean hacia arriba a $100.
              Los m\xE1rgenes que escriba quedan como objetivo de cada lista.</p>
          </div>
        </div>`,
        footerButtons: [
          { label: product ? "Cancelar" : "Cerrar", class: "btn-secondary", onClick: () => Modal.close() },
          ...product ? [{
            label: "Aplicar precios",
            class: "btn-primary",
            onClick: async (dlg, ev) => {
              const cost = total();
              if (!(cost > 0)) {
                Toast.warning("Escriba el costo por unidad.");
                return;
              }
              ev.target.disabled = true;
              const changes = {};
              this.lists.forEach((l) => {
                if (st.apply[l.id])
                  changes[l.id] = this.suggest(p, l, cost, st.margins[l.id]);
              });
              if (!Object.keys(changes).length) {
                Toast.warning("Marque al menos una lista.");
                ev.target.disabled = false;
                return;
              }
              await this.savePrices(product.id, changes, { costoEstimadoCalculadora: Math.round(cost * 100) / 100 });
              for (const l of this.lists) {
                if (Number(l.margenObjetivo) !== Number(st.margins[l.id])) {
                  const fresh = await DB.getById(STORES.PRICE_LISTS, l.id);
                  if (fresh) {
                    fresh.margenObjetivo = Number(st.margins[l.id]);
                    await DB.update(STORES.PRICE_LISTS, fresh);
                  }
                }
              }
              Modal.close();
              Toast.success(`Precios de "${product.nombre}" actualizados.`);
              await this.load();
              this.renderMainView(container);
            }
          }] : []
        ]
      });
      const $ = (s) => dialog.querySelector(s);
      const refresh = () => {
        const cost = total();
        $("#calc-total").textContent = cost > 0 ? money(cost) : "\u2014";
        dialog.querySelectorAll(".calc-table tbody tr").forEach((tr) => {
          const l = this.lists.find((x) => x.id === tr.dataset.list);
          const sug = this.suggest(p, l, cost, st.margins[l.id]);
          tr.querySelector(".calc-sug").textContent = sug ? money(sug) : "\u2014";
          const cur = tr.querySelector(".calc-cur");
          if (cur) {
            const price = PricingService.priceFor(p, l.id);
            const m = this.marginPct(p, l, price, cost);
            cur.innerHTML = price ? `${money(price)} <span class="mg ${this.marginClass(m)}">${this.marginLabel(m)}</span>` : '<span class="text-muted">\u2014</span>';
          }
        });
      };
      $("#calc-base").addEventListener("input", (e) => {
        st.base = Number(e.target.value) || 0;
        refresh();
      });
      $("#calc-otros").addEventListener("input", (e) => {
        st.otros = Number(e.target.value) || 0;
        refresh();
      });
      $("#calc-merma").addEventListener("input", (e) => {
        st.merma = Number(e.target.value) || 0;
        refresh();
      });
      dialog.querySelectorAll(".calc-quick [data-cost]").forEach((b) => b.addEventListener("click", () => {
        st.base = Number(b.dataset.cost);
        $("#calc-base").value = Math.round(st.base);
        refresh();
      }));
      dialog.querySelectorAll(".calc-table tbody tr").forEach((tr) => {
        tr.querySelector(".calc-margin").addEventListener("input", (e) => {
          st.margins[tr.dataset.list] = Number(e.target.value) || 0;
          refresh();
        });
        const chk = tr.querySelector(".calc-apply");
        if (chk)
          chk.addEventListener("change", () => {
            st.apply[tr.dataset.list] = chk.checked;
          });
      });
      refresh();
    },
    // ------------------------------------------------------------------ ajuste masivo
    openBulkAdjust(container) {
      if (!this.lists.length) {
        Toast.warning("No hay listas de precios configuradas.");
        return;
      }
      const visible = this.visibleProducts();
      const dialog = Modal.show({
        title: "Ajuste masivo de precios",
        size: "md",
        content: `
        <div class="form-group mb-2">
          <label class="form-label">Lista</label>
          <select class="form-select" id="bulk-list">${this.lists.map((l) => `<option value="${esc(l.id)}">${esc(l.nombre)}</option>`).join("")}</select>
        </div>
        <div class="form-group mb-2">
          <label class="form-label">Cambio en % (use negativo para bajar)</label>
          <input type="number" step="0.5" class="form-control" id="bulk-pct" value="5">
        </div>
        <div class="form-group mb-2">
          <label class="form-label">Aplicar a</label>
          <select class="form-select" id="bulk-scope">
            <option value="visible">Productos que se ven en la tabla (${visible.length})</option>
            <option value="all">Todos los productos a la venta (${this.products.length})</option>
          </select>
        </div>
        <p class="text-xs text-muted">Solo cambian los productos que ya tienen precio en esa lista. Se redondea a $100.</p>
        <div id="bulk-preview" class="text-xs"></div>`,
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: "Aplicar",
            class: "btn-primary",
            onClick: async (dlg, ev) => {
              const { listId, changes } = plan();
              if (!changes.length) {
                Toast.warning("No hay precios para cambiar.");
                return;
              }
              ev.target.disabled = true;
              await DB.runTransaction([STORES.PRODUCTS], async (tx) => {
                for (const c of changes) {
                  const prod = await tx.get(STORES.PRODUCTS, c.id);
                  if (!prod)
                    continue;
                  prod.precios = { ...prod.precios || {}, [listId]: c.nuevo };
                  await tx.put(STORES.PRODUCTS, prod);
                }
              });
              await AuditService.log({ modulo: "Precios", accion: "MODIFICAR", registroId: listId, campoModificado: "Ajuste masivo", valorNuevo: `${dlg.querySelector("#bulk-pct").value}% en ${changes.length} productos` });
              Modal.close();
              Toast.success(`${changes.length} precios actualizados.`);
              await this.load();
              this.renderMainView(container);
            }
          }
        ]
      });
      const plan = () => {
        const listId = dialog.querySelector("#bulk-list").value;
        const pct = Number(dialog.querySelector("#bulk-pct").value) || 0;
        const scope = dialog.querySelector("#bulk-scope").value === "all" ? this.products : visible;
        const changes = scope.map((p) => ({ id: p.id, nombre: p.nombre, actual: PricingService.priceFor(p, listId) })).filter((c) => c.actual > 0).map((c) => ({ ...c, nuevo: Math.max(100, round100(c.actual * (1 + pct / 100))) })).filter((c) => c.nuevo !== c.actual);
        return { listId, changes };
      };
      const preview = () => {
        const { changes } = plan();
        dialog.querySelector("#bulk-preview").innerHTML = changes.length ? `<strong>${changes.length} precios cambiar\xE1n.</strong> Ejemplos:<br>${changes.slice(0, 4).map((c) => `${esc(c.nombre)}: ${money(c.actual)} \u2192 <strong>${money(c.nuevo)}</strong>`).join("<br>")}` : "Ning\xFAn precio cambia con estos valores.";
      };
      dialog.querySelectorAll("#bulk-list, #bulk-pct, #bulk-scope").forEach((el) => el.addEventListener("input", preview));
      preview();
    }
  };

  // js/modules/freelancers.js
  init_formatters();
  init_toast();
  var FreelancersModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const [allSuppliers, allSales, allCxp] = await Promise.all([
        DB.getAll(STORES.SUPPLIERS, tenantId),
        DB.getAll(STORES.SALES, tenantId),
        DB.getAll(STORES.PAYABLES_CXP, tenantId)
      ]);
      const freelancers = allSuppliers.filter((s) => s.tipo === "FREELANCER");
      const freelanceSales = allSales.filter((s) => s.esVentaFreelance);
      const now = /* @__PURE__ */ new Date();
      const mesActual = now.getMonth();
      const anioActual = now.getFullYear();
      const salesMes = freelanceSales.filter((s) => {
        const d = new Date(s.fecha);
        return d.getMonth() === mesActual && d.getFullYear() === anioActual;
      });
      const comisionesPendientes = allCxp.filter((c) => c.tipoDocumento === "COMISION_FREELANCE" && c.saldo > 0).reduce((acc, c) => acc + Number(c.saldo || 0), 0);
      const totalFacturadoMes = salesMes.reduce((acc, s) => acc + Number(s.total || 0), 0);
      const vendedorMes = (() => {
        const counts = {};
        salesMes.forEach((s) => {
          if (s.freelancerId) {
            counts[s.freelancerId] = counts[s.freelancerId] || { nombre: s.vendedorNombre, total: 0 };
            counts[s.freelancerId].total += s.total || 0;
          }
        });
        const sorted = Object.values(counts).sort((a, b) => b.total - a.total);
        return sorted[0] ? sorted[0].nombre : "\u2014";
      })();
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>\u{1F91D} Red de Vendedores Freelance</h1>
          <p>Gesti\xF3n de vendedores independientes, comisiones autom\xE1ticas y liquidaciones</p>
        </div>
        <div class="view-actions">
          <a href="#clients" class="btn btn-secondary btn-sm" style="text-decoration: none;">\u{1F465} Directorio Clientes</a>
          <button class="btn btn-primary" id="btn-nuevo-freelancer">+ Registrar Vendedor</button>
        </div>
      </div>

      <div class="kpi-grid mb-4" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
        <div class="kpi-card">
          <div class="kpi-label">Vendedores Activos</div>
          <div class="kpi-value" style="color: var(--brand-primary);">${freelancers.filter((f) => f.estado === "ACTIVO").length}</div>
          <div class="kpi-footer">de ${freelancers.length} registrados</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Comisiones Pendientes</div>
          <div class="kpi-value text-danger">${Formatters.currency(comisionesPendientes)}</div>
          <div class="kpi-footer">por liquidar este per\xEDodo</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Ventas via Freelance (mes)</div>
          <div class="kpi-value text-success">${Formatters.currency(totalFacturadoMes)}</div>
          <div class="kpi-footer">${salesMes.length} transacciones</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Top Vendedor del Mes</div>
          <div class="kpi-value" style="font-size: 18px; color: var(--text-main);">\u{1F3C6}</div>
          <div class="kpi-footer" style="font-weight: 700; color: var(--brand-primary);">${vendedorMes}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">Directorio de Vendedores Freelance</div>
        </div>
        <div class="card-body p-0">
          ${freelancers.length === 0 ? `
            <div class="text-center text-muted" style="padding: 40px;">
              <div style="font-size: 40px; margin-bottom: 12px;">\u{1F91D}</div>
              <p style="font-weight: 600; margin-bottom: 8px;">No hay vendedores registrados</p>
              <p class="text-xs">Haz clic en "Registrar Vendedor" para comenzar tu red de ventas freelance.</p>
            </div>
          ` : `
            <div style="overflow-x: auto;">
              <table class="table" style="margin: 0;">
                <thead>
                  <tr>
                    <th>Vendedor</th>
                    <th>Zona</th>
                    <th>Precio Base</th>
                    <th>Ventas este mes</th>
                    <th>Comisi\xF3n ganada</th>
                    <th>Pendiente de pago</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${freelancers.map((f) => {
        const fSales = freelanceSales.filter((s) => s.freelancerId === f.id);
        const fSalesMes = fSales.filter((s) => {
          const d = new Date(s.fecha);
          return d.getMonth() === mesActual && d.getFullYear() === anioActual;
        });
        const ganada = fSales.reduce((acc, s) => acc + Number(s.comisionFreelance || 0), 0);
        const pendiente = allCxp.filter((c) => c.tipoDocumento === "COMISION_FREELANCE" && c.proveedorId === f.id && c.saldo > 0).reduce((acc, c) => acc + Number(c.saldo || 0), 0);
        return `
                      <tr>
                        <td>
                          <div class="font-bold">${esc(f.nombre)}</div>
                          <div class="text-xs text-muted">${f.nitCc ? "CC: " + f.nitCc : ""} ${f.telefono ? "\xB7 " + f.telefono : ""}</div>
                        </td>
                        <td><span class="badge badge-neutral" style="font-size: 10px;">${esc(f.zona || "\u2014")}</span></td>
                        <td>
                          <span class="badge badge-info" style="font-size: 10.5px; font-weight: 700;">
                            ${f.precioBaseId === "plist_2" ? "P2 - Taller" : f.precioBaseId === "plist_4" ? "P4 - Distribuidor" : "P3 - Mayorista"}
                          </span>
                        </td>
                        <td>
                          <strong>${fSalesMes.length}</strong> ventas
                          <div class="text-xs text-muted">${Formatters.currency(fSalesMes.reduce((a, s) => a + s.total, 0))}</div>
                        </td>
                        <td class="font-bold text-success">${Formatters.currency(ganada)}</td>
                        <td>
                          ${pendiente > 0 ? `<strong class="text-danger">${Formatters.currency(pendiente)}</strong>` : `<span class="badge badge-success">Al d\xEDa</span>`}
                        </td>
                        <td>
                          <span class="badge ${f.estado === "ACTIVO" ? "badge-success" : "badge-danger"}">
                            ${esc(f.estado || "ACTIVO")}
                          </span>
                        </td>
                        <td>
                          <div class="d-flex gap-2">
                            <button class="btn btn-secondary btn-sm btn-ver-freelancer" data-id="${f.id}" title="Ver Ficha">\u{1F441}\uFE0F Ver</button>
                            <button class="btn btn-secondary btn-sm btn-edit-freelancer" data-id="${f.id}" title="Editar Datos">\u270F\uFE0F Editar</button>
                            ${pendiente > 0 ? `<button class="btn btn-primary btn-sm btn-liquidar-freelancer" data-id="${f.id}" data-nombre="${esc(f.nombre)}" data-pendiente="${pendiente}">\u{1F4B8} Liquidar</button>` : ""}
                          </div>
                        </td>
                      </tr>
                    `;
      }).join("")}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;
      container.querySelector("#btn-nuevo-freelancer").addEventListener("click", () => {
        this.openFreelancerWizard(null, tenantId, () => this.render(container));
      });
      container.querySelectorAll(".btn-ver-freelancer").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const f = freelancers.find((x) => x.id === id);
          if (f)
            this.openFreelancerDetail(f, freelanceSales, allCxp, tenantId, () => this.render(container));
        });
      });
      container.querySelectorAll(".btn-edit-freelancer").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const f = freelancers.find((x) => x.id === id);
          if (f)
            this.openFreelancerWizard(f, tenantId, () => this.render(container));
        });
      });
      container.querySelectorAll(".btn-liquidar-freelancer").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-id");
          const nombre = btn.getAttribute("data-nombre");
          const pendiente = Number(btn.getAttribute("data-pendiente"));
          const cxpItems = allCxp.filter((c) => c.tipoDocumento === "COMISION_FREELANCE" && c.proveedorId === id && c.saldo > 0);
          this.openLiquidarModal(id, nombre, pendiente, cxpItems, () => this.render(container));
        });
      });
    },
    openFreelancerWizard(freelancer, tenantId, onSaved) {
      const isEdit = !!freelancer;
      const f = freelancer || {};
      const content = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div class="card" style="margin: 0; background: var(--bg-surface-solid); border: 1px solid var(--border-color);">
          <div class="card-body" style="padding: 16px;">
            <div class="font-bold text-xs text-muted mb-3" style="text-transform: uppercase; letter-spacing: 0.5px;">Datos Personales</div>
            <div class="form-row" style="gap: 12px;">
              <div class="form-group mb-3" style="flex: 1;">
                <label class="form-label">Nombre Completo *</label>
                <input type="text" class="form-control" id="fl-nombre" value="${esc(f.nombre || "")}" placeholder="Ej: Carlos Mendoza" required>
              </div>
              <div class="form-group mb-3" style="flex: 1;">
                <label class="form-label">C\xE9dula / NIT</label>
                <input type="text" class="form-control" id="fl-cedula" value="${esc(f.nitCc || "")}" placeholder="Ej: 1234567890">
              </div>
            </div>
            <div class="form-row" style="gap: 12px;">
              <div class="form-group mb-3" style="flex: 1;">
                <label class="form-label">Tel\xE9fono / WhatsApp</label>
                <input type="text" class="form-control" id="fl-telefono" value="${esc(f.telefono || "")}" placeholder="3001234567">
              </div>
              <div class="form-group mb-3" style="flex: 1;">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" id="fl-email" value="${esc(f.email || "")}" placeholder="correo@gmail.com">
              </div>
            </div>
            <div class="form-row" style="gap: 12px;">
              <div class="form-group mb-3" style="flex: 1;">
                <label class="form-label">Zona de Ventas</label>
                <input type="text" class="form-control" id="fl-zona" value="${esc(f.zona || "")}" placeholder="Ej: Medell\xEDn Norte, Eje Cafetero...">
              </div>
              <div class="form-group mb-3" style="flex: 1;">
                <label class="form-label">Estado</label>
                <select class="form-select" id="fl-estado">
                  <option value="ACTIVO" ${!f.estado || f.estado === "ACTIVO" ? "selected" : ""}>Activo</option>
                  <option value="INACTIVO" ${f.estado === "INACTIVO" ? "selected" : ""}>Inactivo</option>
                </select>
              </div>
            </div>
            <div class="form-group mb-0">
              <label class="form-label font-bold" style="color: var(--brand-primary);">\u{1F3F7}\uFE0F Lista de Precios Base (Costo de F\xE1brica del Vendedor)</label>
              <select class="form-select" id="fl-precio-base" style="font-weight: 700; color: #4C7DFF;">
                <option value="plist_3" ${!f.precioBaseId || f.precioBaseId === "plist_3" ? "selected" : ""}>P3 - Precio Mayorista (Predeterminado Oficial)</option>
                <option value="plist_2" ${f.precioBaseId === "plist_2" ? "selected" : ""}>P2 - Precio Taller / Detailing</option>
                <option value="plist_4" ${f.precioBaseId === "plist_4" ? "selected" : ""}>P4 - Precio Distribuidor</option>
                <option value="plist_1" ${f.precioBaseId === "plist_1" ? "selected" : ""}>P1 - Precio P\xFAblico M\xE1ximo</option>
              </select>
              <span class="text-xs text-muted" style="display: block; margin-top: 4px;">
                Base sobre la que se liquida la comisi\xF3n. El vendedor tiene un rango de venta libre desde <strong>Precio 3</strong> hasta <strong>Precio 1</strong>. La diferencia en $$ es su ganancia libre.
              </span>
            </div>
          </div>
        </div>

        <div class="card" style="margin: 0; background: var(--bg-surface-solid); border: 1px solid var(--border-color);">
          <div class="card-body" style="padding: 16px;">
            <div class="font-bold text-xs text-muted mb-3" style="text-transform: uppercase; letter-spacing: 0.5px;">Datos Bancarios (para pago de comisiones)</div>
            <div class="form-row" style="gap: 12px;">
              <div class="form-group mb-3" style="flex: 1;">
                <label class="form-label">Banco</label>
                <select class="form-select" id="fl-banco">
                  <option value="">Seleccione banco...</option>
                  <option value="Bancolombia" ${(f.datosBancarios || {}).banco === "Bancolombia" ? "selected" : ""}>Bancolombia</option>
                  <option value="Davivienda" ${(f.datosBancarios || {}).banco === "Davivienda" ? "selected" : ""}>Davivienda</option>
                  <option value="Banco de Bogot\xE1" ${(f.datosBancarios || {}).banco === "Banco de Bogot\xE1" ? "selected" : ""}>Banco de Bogot\xE1</option>
                  <option value="BBVA" ${(f.datosBancarios || {}).banco === "BBVA" ? "selected" : ""}>BBVA</option>
                  <option value="Nequi" ${(f.datosBancarios || {}).banco === "Nequi" ? "selected" : ""}>Nequi</option>
                  <option value="Daviplata" ${(f.datosBancarios || {}).banco === "Daviplata" ? "selected" : ""}>Daviplata</option>
                  <option value="Otro" ${(f.datosBancarios || {}).banco === "Otro" ? "selected" : ""}>Otro</option>
                </select>
              </div>
              <div class="form-group mb-3" style="flex: 1;">
                <label class="form-label">Tipo de Cuenta</label>
                <select class="form-select" id="fl-tipo-cuenta">
                  <option value="Ahorros" ${(f.datosBancarios || {}).tipoCuenta === "Ahorros" ? "selected" : ""}>Ahorros</option>
                  <option value="Corriente" ${(f.datosBancarios || {}).tipoCuenta === "Corriente" ? "selected" : ""}>Corriente</option>
                </select>
              </div>
            </div>
            <div class="form-group mb-0">
              <label class="form-label">N\xFAmero de Cuenta</label>
              <input type="text" class="form-control" id="fl-num-cuenta" value="${(f.datosBancarios || {}).numeroCuenta || ""}" placeholder="Ej: 12345678901">
            </div>
          </div>
        </div>

        <div class="card" style="margin: 0; background: rgba(0,113,227,0.04); border: 1px dashed var(--brand-primary);">
          <div class="card-body" style="padding: 12px 16px;">
            <div class="text-xs" style="color: var(--brand-primary);">
              \u{1F4A1} <strong>\xBFC\xF3mo funciona la comisi\xF3n?</strong> El precio base del vendedor es <strong>Precio 3</strong>.
              Puede vender entre Precio 3 y Precio 1. Su comisi\xF3n = precio vendido \u2212 Precio 3 por unidad.
              Se registra autom\xE1ticamente en Cuentas por Pagar al finalizar cada venta.
            </div>
          </div>
        </div>
      </div>
    `;
      const dialog = Modal.show({
        title: isEdit ? "Editar Vendedor Freelance" : "Registrar Nuevo Vendedor Freelance",
        content,
        size: "lg",
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: isEdit ? "Guardar Cambios" : "Registrar Vendedor",
            class: "btn-primary",
            onClick: async () => {
              const nombre = dialog.querySelector("#fl-nombre").value.trim();
              if (!nombre) {
                Toast.warning("El nombre es obligatorio.");
                return;
              }
              const payload = {
                ...f.id ? { id: f.id } : {},
                tenantId,
                nombre,
                nitCc: dialog.querySelector("#fl-cedula").value.trim(),
                telefono: dialog.querySelector("#fl-telefono").value.trim(),
                email: dialog.querySelector("#fl-email").value.trim(),
                zona: dialog.querySelector("#fl-zona").value.trim(),
                estado: dialog.querySelector("#fl-estado").value,
                tipo: "FREELANCER",
                precioBaseId: dialog.querySelector("#fl-precio-base") ? dialog.querySelector("#fl-precio-base").value : "plist_3",
                datosBancarios: {
                  banco: dialog.querySelector("#fl-banco").value,
                  tipoCuenta: dialog.querySelector("#fl-tipo-cuenta").value,
                  numeroCuenta: dialog.querySelector("#fl-num-cuenta").value.trim()
                },
                comisionesTotalesGanadas: f.comisionesTotalesGanadas || 0,
                comisionesTotalesPagadas: f.comisionesTotalesPagadas || 0,
                creadoEn: f.creadoEn || (/* @__PURE__ */ new Date()).toISOString()
              };
              if (isEdit) {
                await DB.update(STORES.SUPPLIERS, payload);
                Toast.success(`Vendedor "${nombre}" actualizado.`);
              } else {
                await DB.add(STORES.SUPPLIERS, payload);
                Toast.success(`Vendedor "${nombre}" registrado en la red freelance.`);
              }
              Modal.close();
              if (onSaved)
                onSaved();
            }
          }
        ]
      });
    },
    openFreelancerDetail(f, allSales, allCxp, tenantId, onSaved) {
      const fSales = allSales.filter((s) => s.freelancerId === f.id);
      const fCxp = allCxp.filter((c) => c.tipoDocumento === "COMISION_FREELANCE" && c.proveedorId === f.id);
      const totalGanado = fSales.reduce((acc, s) => acc + Number(s.comisionFreelance || 0), 0);
      const totalPendiente = fCxp.filter((c) => c.saldo > 0).reduce((acc, c) => acc + Number(c.saldo || 0), 0);
      const content = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 0;">
          <div class="kpi-card" style="padding: 12px;">
            <div class="kpi-label">Total Ventas</div>
            <div class="kpi-value" style="font-size: 22px; color: var(--brand-primary);">${fSales.length}</div>
          </div>
          <div class="kpi-card" style="padding: 12px;">
            <div class="kpi-label">Comisi\xF3n Ganada</div>
            <div class="kpi-value text-success" style="font-size: 18px;">${Formatters.currency(totalGanado)}</div>
          </div>
          <div class="kpi-card" style="padding: 12px;">
            <div class="kpi-label">Por Cobrar</div>
            <div class="kpi-value text-danger" style="font-size: 18px;">${Formatters.currency(totalPendiente)}</div>
          </div>
        </div>

        <div style="background: var(--bg-surface-solid); border-radius: 8px; border: 1px solid var(--border-color); padding: 12px;">
          <div class="font-bold text-xs text-muted mb-2" style="text-transform: uppercase;">Datos de Contacto</div>
          <div class="text-xs" style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
            <div>\u{1F4F1} ${esc(f.telefono || "\u2014")}</div>
            <div>\u{1F4E7} ${esc(f.email || "\u2014")}</div>
            <div>\u{1FAAA} CC: ${esc(f.nitCc || "\u2014")}</div>
            <div>\u{1F4CD} Zona: ${esc(f.zona || "\u2014")}</div>
            <div>\u{1F3E6} ${(f.datosBancarios || {}).banco || "\u2014"} ${(f.datosBancarios || {}).tipoCuenta || ""}</div>
            <div>Cta: ${(f.datosBancarios || {}).numeroCuenta || "\u2014"}</div>
          </div>
        </div>

        <div>
          <div class="font-bold text-xs text-muted mb-2" style="text-transform: uppercase;">\xDAltimas 5 Ventas</div>
          ${fSales.length === 0 ? '<div class="text-xs text-muted text-center" style="padding: 12px;">Sin ventas registradas a\xFAn.</div>' : `<table class="table table-sm text-xs" style="margin:0;">
              <thead><tr><th>Factura</th><th>Cliente</th><th>Total</th><th>Comisi\xF3n</th><th>Fecha</th></tr></thead>
              <tbody>
                ${fSales.slice(-5).reverse().map((s) => `
                  <tr>
                    <td><strong style="color: var(--brand-primary);">${esc(s.consecutivo)}</strong></td>
                    <td>${esc(s.clienteNombre)}</td>
                    <td>${Formatters.currency(s.total)}</td>
                    <td class="font-bold text-success">${Formatters.currency(s.comisionFreelance || 0)}</td>
                    <td>${Formatters.date(s.fecha)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>`}
        </div>
      </div>
    `;
      Modal.show({
        title: `\u{1F91D} Ficha de ${f.nombre}`,
        content,
        size: "lg",
        footerButtons: [
          { label: "Cerrar", class: "btn-secondary", onClick: () => Modal.close() },
          { label: "\u270F\uFE0F Editar Datos", class: "btn-secondary", onClick: () => {
            Modal.close();
            this.openFreelancerWizard(f, tenantId, onSaved);
          } },
          ...totalPendiente > 0 ? [{
            label: `\u{1F4B8} Liquidar ${Formatters.currency(totalPendiente)}`,
            class: "btn-primary",
            onClick: () => {
              const cxpItems = allCxp.filter((c) => c.tipoDocumento === "COMISION_FREELANCE" && c.proveedorId === f.id && c.saldo > 0);
              Modal.close();
              this.openLiquidarModal(f.id, f.nombre, totalPendiente, cxpItems, onSaved);
            }
          }] : []
        ]
      });
    },
    async openLiquidarModal(freelancerId, nombre, totalPendiente, cxpItems, onSaved) {
      const content = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <div style="background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 12px;">
          <div class="text-xs text-muted">Liquidaci\xF3n de comisiones a:</div>
          <div style="font-size: 16px; font-weight: 700; margin: 4px 0;">${nombre}</div>
          <div style="font-size: 20px; font-weight: 800; color: var(--danger);">Total a pagar: ${Formatters.currency(totalPendiente)}</div>
        </div>

        <div class="text-xs text-muted font-bold" style="text-transform: uppercase;">Desglose de comisiones pendientes:</div>
        <div style="max-height: 160px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 6px;">
          <table class="table table-sm text-xs" style="margin:0;">
            <thead><tr><th>Referencia</th><th>Venta</th><th>Comisi\xF3n</th></tr></thead>
            <tbody>
              ${cxpItems.map((c) => `
                <tr>
                  <td><strong>${esc(c.documento)}</strong></td>
                  <td>${esc(c.ventaConsecutivo || "\u2014")}</td>
                  <td class="font-bold text-danger">${Formatters.currency(c.saldo)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <form id="liquidar-form">
          <div class="form-group mb-3">
            <label class="form-label">Medio de Pago</label>
            <select class="form-select" name="medio">
              ${PAYOUT_METHODS.map((m) => `<option value="${m}">${m}</option>`).join("")}
            </select>
          </div>
          <div class="form-group mb-0">
            <label class="form-label">N\xFAmero de Comprobante</label>
            <input type="text" class="form-control" name="comprobante" placeholder="Referencia (opcional)">
          </div>
        </form>
      </div>
    `;
      const dialog = Modal.show({
        title: `\u{1F4B8} Liquidar Comisiones \u2014 ${nombre}`,
        content,
        size: "md",
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: `Confirmar Pago de ${Formatters.currency(totalPendiente)}`,
            class: "btn-primary",
            onClick: async () => {
              const form = dialog.querySelector("#liquidar-form");
              if (!form.checkValidity()) {
                form.reportValidity();
                return;
              }
              const fd = new FormData(form);
              const tenant = TenantServiceInstance.getActiveTenant();
              try {
                await PaymentsService.payPayables({
                  tenantId: tenant.id,
                  pagos: cxpItems.map((c) => ({ cxpId: c.id, monto: c.saldo })),
                  metodo: fd.get("medio"),
                  referencia: fd.get("comprobante")
                });
              } catch (err) {
                Toast.error(err.message);
                return;
              }
              Toast.success(`Liquidaci\xF3n de ${Formatters.currency(totalPendiente)} a ${nombre} registrada.`);
              Modal.close();
              if (onSaved)
                onSaved();
            }
          }
        ]
      });
    }
  };

  // js/app.js
  function showFatal(title, detail) {
    if (typeof window.__nexaBootMessage === "function")
      window.__nexaBootMessage(title, detail, true);
  }
  window.addEventListener("error", (e) => {
    console.error("Nexa Global Error:", e.error || e.message);
    if (!window.__nexaReady)
      showFatal("Error al iniciar NexaAdmin", `${e.message || "Error desconocido"} (${e.filename || ""}:${e.lineno || ""})`);
  });
  window.addEventListener("unhandledrejection", (e) => {
    console.error("Nexa Unhandled Promise Rejection:", e.reason);
    const msg = e.reason && (e.reason.message || String(e.reason)) || "Error desconocido";
    if (!window.__nexaReady)
      showFatal("Error al iniciar NexaAdmin", msg);
    else
      Toast.error(msg);
  });
  var MODULES = {
    dashboard: DashboardModule,
    clients: ClientsModule,
    products: ProductsModule,
    inventory: InventoryModule,
    production: ProductionModule,
    purchases: PurchasesModule,
    "sales-pos": SalesPosModule,
    shipping: ShippingModule,
    cash: CashModule,
    expenses: ExpensesModule,
    cxc: CxcModule,
    cxp: CxpModule,
    users: UsersModule,
    audit: AuditModule,
    reports: ReportsModule,
    settings: SettingsModule,
    backup: BackupModule,
    importer: ImporterModule,
    integrations: IntegrationsModule,
    documents: DocumentsModule,
    "formulas-vault": FormulasVaultModule,
    "pricing-calculator": PricingCalculatorModule,
    "freelancers": FreelancersModule
  };
  var MACRO_CATEGORIES = {
    commercial: {
      sidebarRoute: "sales-pos",
      routes: ["sales-pos", "shipping"],
      tabs: [
        { route: "sales-pos", label: "Terminal POS", icon: "\u{1F6D2}" },
        { route: "shipping", label: "Pedidos & Env\xEDos", icon: "\u{1F69A}" }
      ]
    },
    inventory: {
      sidebarRoute: "inventory",
      routes: ["inventory", "products", "production", "formulas-vault", "pricing-calculator"],
      tabs: [
        { route: "products", label: "Cat\xE1logo", icon: "\u{1F4E6}" },
        { route: "inventory", label: "Inventario & Kardex", icon: "\u{1F4D1}" },
        { route: "production", label: "Producci\xF3n & BOM", icon: "\u2699\uFE0F" },
        { route: "formulas-vault", label: "B\xF3veda F\xF3rmulas", icon: "\u{1F512}" },
        { route: "pricing-calculator", label: "Precios & M\xE1rgenes", icon: "\u{1F3F7}\uFE0F" }
      ]
    },
    finance: {
      sidebarRoute: "cash",
      routes: ["cash", "purchases", "expenses", "cxc", "cxp"],
      tabs: [
        { route: "cash", label: "Caja & Turnos", icon: "\u{1F4B5}" },
        { route: "purchases", label: "Compras & Proveedores", icon: "\u{1F6CD}\uFE0F" },
        { route: "expenses", label: "Gastos Operativos", icon: "\u{1F3F7}\uFE0F" },
        { route: "cxc", label: "Cartera CXC", icon: "\u{1F4C8}" },
        { route: "cxp", label: "Cuentas por Pagar CXP", icon: "\u{1F4C9}" }
      ]
    },
    clients: {
      sidebarRoute: "clients",
      routes: ["clients", "freelancers"],
      tabs: [
        { route: "clients", label: "Directorio Clientes", icon: "\u{1F465}" },
        { route: "freelancers", label: "Red Freelance", icon: "\u{1F91D}" }
      ]
    },
    settings: {
      sidebarRoute: "settings",
      routes: ["dashboard", "settings", "users", "backup", "importer", "reports", "audit", "integrations", "documents"],
      tabs: [
        { route: "dashboard", label: "Dashboard", icon: "\u{1F4CA}" },
        { route: "settings", label: "Par\xE1metros & Empresa", icon: "\u2699\uFE0F" },
        { route: "users", label: "Usuarios & Roles", icon: "\u{1F6E1}\uFE0F" },
        { route: "backup", label: "Respaldo BD", icon: "\u{1F4BE}" },
        { route: "importer", label: "Importador Masivo", icon: "\u{1F4E5}" },
        { route: "reports", label: "Reportes", icon: "\u{1F4C8}" },
        { route: "audit", label: "Auditor\xEDa", icon: "\u{1F4CB}" }
      ]
    }
  };
  var NexaApp = class {
    constructor() {
      this.contentContainer = null;
      this.currentRoute = "dashboard";
    }
    async init() {
      this.contentContainer = document.getElementById("view-container");
      const step = (t) => {
        window.__nexaLastStep = t;
        const el = document.getElementById("boot-status");
        if (el)
          el.textContent = t;
        console.info("[NexaAdmin] " + t);
      };
      window.__nexaStep = step;
      try {
        step("Abriendo base de datos\u2026");
        await DB.init();
        step("Aplicando migraciones y cargando empresa\u2026");
        const tenant = await TenantServiceInstance.init();
        step("Verificando usuarios\u2026");
        const currentUser = await AuthServiceInstance.init();
        window.__nexaReady = true;
        if (window.__nexaBootDone)
          window.__nexaBootDone();
        if (AuthServiceInstance.needsSetup) {
          this.renderAuthScreen("setup", tenant);
          return;
        }
        if (!currentUser) {
          this.renderAuthScreen("login", tenant);
          return;
        }
        this.startAuthenticatedApp(tenant);
        window.__nexaReady = true;
        if (window.__nexaBootDone)
          window.__nexaBootDone();
        console.log("\u26A1 Nexa ERP inicializado correctamente para:", tenant.nombreComercial);
      } catch (err) {
        console.error("Error al inicializar Nexa ERP:", err);
        showFatal("Error al iniciar NexaAdmin", err.message || String(err));
        if (this.contentContainer) {
          this.contentContainer.innerHTML = `
          <div class="alert alert-danger">
            <strong>Error al inicializar el sistema:</strong> ${esc(err.message)}
          </div>
        `;
        }
      }
    }
    startAuthenticatedApp(tenant) {
      this.initShellUI(tenant);
      this.setupRouter();
      EventBus.on("tenant:changed", (newTenant) => {
        this.updateBrandUI(newTenant);
        this.updateCashIndicator();
        this.loadCurrentRoute();
      });
      EventBus.on("auth:userChanged", (newUser) => {
        this.updateUserUI(newUser);
      });
      EventBus.on("backup:status", () => this.updateBackupIndicator());
      const backupBadge = document.getElementById("topbar-backup-badge");
      if (backupBadge) {
        backupBadge.addEventListener("click", async () => {
          if (BackupFolderService.state === "needs-permission") {
            if (await BackupFolderService.checkPermission(true) === "granted") {
              const ok = await BackupFolderService.backupNow();
              if (ok)
                Toast.success("Respaldo autom\xE1tico activo.");
            } else {
              Toast.warning("Sin permiso no se puede guardar el respaldo en la carpeta.");
            }
            return;
          }
          window.location.hash = "#backup";
        });
      }
      BackupFolderService.start().catch((e) => console.warn("[Respaldo] no se pudo iniciar:", e));
      this.loadCurrentRoute();
    }
    updateBackupIndicator() {
      const el = document.getElementById("topbar-backup-badge");
      if (!el)
        return;
      const s = BackupFolderService;
      const hhmm = s.lastOk ? new Date(s.lastOk).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "";
      const map = {
        ok: ["badge-success", `\u25CF Respaldo ${hhmm}`, `Copia autom\xE1tica en la carpeta "${s.folderName()}". \xDAltima: ${s.lastOk ? new Date(s.lastOk).toLocaleString("es-CO") : "-"}`],
        "needs-permission": ["badge-warning", "\u26A0 Activar respaldo", "Haga clic para permitir que NexaAdmin guarde en la carpeta de respaldo."],
        "no-folder": ["badge-warning", "\u26A0 Sin respaldo", "Configure una carpeta de respaldo autom\xE1tico."],
        unsupported: ["badge-neutral", "Respaldo diario", "Este navegador no permite carpetas: se descarga un respaldo diario a Descargas."],
        error: ["badge-danger", "\u2715 Respaldo fall\xF3", s.lastError || "Error en el respaldo"],
        disabled: ["badge-neutral", "Respaldo apagado", "El respaldo autom\xE1tico est\xE1 desactivado."]
      };
      const [cls, txt, title] = map[s.state] || map.disabled;
      el.className = `badge ${cls} backup-badge`;
      el.textContent = txt;
      el.title = title;
    }
    /**
     * Pantallas de acceso: 'setup' (primer arranque), 'login', 'change' (cambio obligatorio),
     * 'recover' (código de recuperación) y 'code' (mostrar código de recuperación nuevo).
     */
    async renderAuthScreen(mode, tenant, ctx = {}) {
      const loginUsers = mode === "login" ? await AuthServiceInstance.listLoginUsers() : [];
      const hasRecovery = mode === "login" ? await AuthServiceInstance.hasRecoveryCode() : false;
      const initialTheme = localStorage.getItem("nexa_theme") || "dark";
      document.body.classList.toggle("dark-mode", initialTheme === "dark");
      const rules = AuthServiceInstance.passwordRules();
      const forms = {
        setup: `
        <h2 class="auth-title">Configuraci\xF3n inicial</h2>
        <p class="auth-sub">No hay usuarios en este equipo. Cree la cuenta de administrador (rol Desarrollador).</p>
        <form id="auth-form" autocomplete="off">
          <div class="form-group mb-3"><label class="form-label">Nombre</label>
            <input class="form-control" name="nombre" required placeholder="Ej: Alexander G\xF3mez"></div>
          <div class="form-group mb-3"><label class="form-label">Usuario</label>
            <input class="form-control" name="usuario" required value="admin" autocomplete="username"></div>
          <div class="form-group mb-3"><label class="form-label">PIN de 4 d\xEDgitos</label>
            <input type="password" class="form-control pin-input" name="pass1" required inputmode="numeric" pattern="\\d{4}" maxlength="4" autocomplete="off" placeholder="\u2022\u2022\u2022\u2022">
            <div class="form-help">${esc(rules)}</div></div>
          <div class="form-group mb-4"><label class="form-label">Repetir PIN</label>
            <input type="password" class="form-control pin-input" name="pass2" required inputmode="numeric" pattern="\\d{4}" maxlength="4" autocomplete="off" placeholder="\u2022\u2022\u2022\u2022"></div>
          <button type="submit" class="btn btn-primary w-100 auth-btn">Crear administrador</button>
        </form>`,
        login: `
        <h2 class="auth-title">Iniciar sesi\xF3n</h2>
        <p class="auth-sub">Seleccione su usuario e ingrese su PIN.</p>
        <form id="auth-form" autocomplete="off">
          <div class="form-group mb-3"><label class="form-label">Usuario</label>
            <select class="form-select" name="usuario" required>
              ${loginUsers.length > 1 ? '<option value="">\u2014 Seleccione \u2014</option>' : ""}
              ${loginUsers.map((u) => `<option value="${esc(u.usuario)}">${esc(u.nombre)} \xB7 ${esc(u.rol)}</option>`).join("")}
            </select></div>
          <div class="form-group mb-4"><label class="form-label">PIN</label>
            <input type="password" class="form-control pin-input" name="password" required inputmode="numeric" pattern="\\d{4}" maxlength="4" autocomplete="off" placeholder="\u2022\u2022\u2022\u2022" autofocus></div>
          <button type="submit" class="btn btn-primary w-100 auth-btn">Ingresar</button>
        </form>
        ${hasRecovery ? '<div class="text-center mt-3"><a href="#" id="link-recover" class="text-xs">\xBFOlvid\xF3 su PIN? Usar c\xF3digo de recuperaci\xF3n</a></div>' : '<div class="text-center mt-3 text-xs text-muted">\xBFOlvid\xF3 su PIN? El administrador puede asignarle uno nuevo en Usuarios.</div>'}`,
        change: `
        <h2 class="auth-title">Defina su PIN</h2>
        <p class="auth-sub">Hola <strong>${esc(ctx.user ? ctx.user.nombre : "")}</strong>. El administrador pidi\xF3 que defina un PIN nuevo para continuar.</p>
        <form id="auth-form" autocomplete="off">
          <div class="form-group mb-3"><label class="form-label">Nuevo PIN</label>
            <input type="password" class="form-control pin-input" name="pass1" required inputmode="numeric" pattern="\\d{4}" maxlength="4" autocomplete="off" placeholder="\u2022\u2022\u2022\u2022" autofocus>
            <div class="form-help">${esc(rules)}</div></div>
          <div class="form-group mb-4"><label class="form-label">Repetir PIN</label>
            <input type="password" class="form-control pin-input" name="pass2" required inputmode="numeric" pattern="\\d{4}" maxlength="4" autocomplete="off" placeholder="\u2022\u2022\u2022\u2022"></div>
          <button type="submit" class="btn btn-primary w-100 auth-btn">Guardar y continuar</button>
        </form>`,
        recover: `
        <h2 class="auth-title">Recuperar acceso</h2>
        <p class="auth-sub">Use el c\xF3digo de recuperaci\xF3n que se mostr\xF3 al configurar el sistema. Despu\xE9s de usarlo se genera uno nuevo.</p>
        <form id="auth-form" autocomplete="off">
          <div class="form-group mb-3"><label class="form-label">Usuario a recuperar</label>
            <input class="form-control" name="usuario" required></div>
          <div class="form-group mb-3"><label class="form-label">C\xF3digo de recuperaci\xF3n</label>
            <input class="form-control" name="code" required placeholder="XXXX-XXXX-XXXX-XXXX" style="font-family: monospace; letter-spacing: 1px;"></div>
          <div class="form-group mb-3"><label class="form-label">Nuevo PIN</label>
            <input type="password" class="form-control pin-input" name="pass1" required inputmode="numeric" pattern="\\d{4}" maxlength="4" autocomplete="off" placeholder="\u2022\u2022\u2022\u2022">
            <div class="form-help">${esc(rules)}</div></div>
          <div class="form-group mb-4"><label class="form-label">Repetir PIN</label>
            <input type="password" class="form-control pin-input" name="pass2" required inputmode="numeric" pattern="\\d{4}" maxlength="4" autocomplete="off" placeholder="\u2022\u2022\u2022\u2022"></div>
          <button type="submit" class="btn btn-primary w-100 auth-btn">Restablecer PIN</button>
        </form>
        <div class="text-center mt-3"><a href="#" id="link-back-login" class="text-xs">Volver al inicio de sesi\xF3n</a></div>`,
        code: `
        <h2 class="auth-title">Guarde su c\xF3digo de recuperaci\xF3n</h2>
        <p class="auth-sub">Es la \xDANICA forma de recuperar el acceso si olvida su contrase\xF1a. Se muestra una sola vez: an\xF3telo en papel y gu\xE1rdelo en un lugar seguro (no en este computador).</p>
        <div class="recovery-code" id="recovery-code">${esc(ctx.code || "")}</div>
        <button type="button" class="btn btn-secondary w-100 mb-2" id="btn-copy-code">Copiar c\xF3digo</button>
        <label class="d-flex items-center gap-2 text-xs mb-3"><input type="checkbox" id="chk-code-saved"> Ya anot\xE9 el c\xF3digo en un lugar seguro</label>
        <button type="button" class="btn btn-primary w-100 auth-btn" id="btn-code-continue" disabled>Continuar</button>`
      };
      document.body.innerHTML = `
      <div class="auth-wrap">
        <div class="auth-box">
          <div class="text-center mb-4">
            <h1 class="auth-brand">NexaAdmin ERP</h1>
            <div class="text-xs text-muted">${esc(tenant ? tenant.nombreComercial : "")}</div>
          </div>
          <div class="card auth-card">
            <div id="auth-error" class="alert alert-danger" style="display: none; font-size: 13px; margin-bottom: 15px;"></div>
            ${forms[mode]}
          </div>
          <div class="text-center mt-4 text-xs text-muted">
            &copy; ${(/* @__PURE__ */ new Date()).getFullYear()} NexaAdmin ERP \xB7 Los intentos de acceso quedan registrados en la auditor\xEDa.
          </div>
        </div>
      </div>
    `;
      const errBox = document.getElementById("auth-error");
      const showError = (msg) => {
        errBox.textContent = msg;
        errBox.style.display = "block";
      };
      const form = document.getElementById("auth-form");
      const submitBtn = form ? form.querySelector("button[type=submit]") : null;
      const busy = (on) => {
        if (submitBtn)
          submitBtn.disabled = on;
      };
      const recoverLink = document.getElementById("link-recover");
      if (recoverLink)
        recoverLink.addEventListener("click", (e) => {
          e.preventDefault();
          this.renderAuthScreen("recover", tenant);
        });
      const backLink = document.getElementById("link-back-login");
      if (backLink)
        backLink.addEventListener("click", (e) => {
          e.preventDefault();
          this.renderAuthScreen("login", tenant);
        });
      if (mode === "code") {
        const chk = document.getElementById("chk-code-saved");
        const btn = document.getElementById("btn-code-continue");
        chk.addEventListener("change", () => {
          btn.disabled = !chk.checked;
        });
        document.getElementById("btn-copy-code").addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(ctx.code);
            Toast.success("C\xF3digo copiado.");
          } catch (e) {
            Toast.warning("No se pudo copiar; an\xF3telo manualmente.");
          }
        });
        btn.addEventListener("click", () => window.location.reload());
        return;
      }
      form.querySelectorAll(".pin-input").forEach((inp) => inp.addEventListener("input", () => {
        inp.value = inp.value.replace(/\D/g, "").slice(0, 4);
        if (mode === "login" && inp.value.length === 4 && form.querySelector("[name=usuario]").value)
          form.requestSubmit();
      }));
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        errBox.style.display = "none";
        const fd = new FormData(form);
        const pass1 = fd.get("pass1");
        if (pass1 !== null && pass1 !== fd.get("pass2")) {
          showError("Los PIN no coinciden.");
          return;
        }
        busy(true);
        try {
          if (mode === "setup") {
            await AuthServiceInstance.createInitialAdmin({
              nombre: fd.get("nombre"),
              usuario: fd.get("usuario"),
              password: pass1,
              tenantId: tenant ? tenant.id : null
            });
            window.location.reload();
          } else if (mode === "login") {
            const res = await AuthServiceInstance.login(fd.get("usuario"), fd.get("password"));
            if (res.mustChange) {
              await this.renderAuthScreen("change", tenant, { user: res.user, currentPassword: fd.get("password") });
            } else {
              window.location.reload();
            }
          } else if (mode === "change") {
            await AuthServiceInstance.changePassword(ctx.user.id, ctx.currentPassword, pass1);
            window.location.reload();
          } else if (mode === "recover") {
            const code = await AuthServiceInstance.recoverWithCode(fd.get("usuario"), fd.get("code"), pass1);
            this.renderAuthScreen("code", tenant, { code });
          }
        } catch (err) {
          showError(err.message || "No fue posible completar la operaci\xF3n.");
          busy(false);
          form.querySelectorAll(".pin-input").forEach((i) => {
            i.value = "";
          });
          const first = form.querySelector(".pin-input");
          if (first)
            first.focus();
        }
      });
    }
    setupRouter() {
      window.addEventListener("hashchange", () => {
        this.loadCurrentRoute();
      });
      document.addEventListener("click", (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (link) {
          const href = link.getAttribute("href");
          if (href && href.startsWith("#")) {
            e.preventDefault();
            const targetHash = href.replace("#", "") || "dashboard";
            if (window.location.hash === `#${targetHash}`) {
              this.loadCurrentRoute();
            } else {
              window.location.hash = `#${targetHash}`;
            }
          }
        }
      });
      window.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
          e.preventDefault();
          this.openGlobalSearch();
        }
      });
    }
    async loadCurrentRoute() {
      let hash = window.location.hash.replace("#", "") || "dashboard";
      if (!AuthServiceInstance.canAccessRoute(hash)) {
        const defaultRoute = AuthServiceInstance.getDefaultRoute();
        if (MODULES[hash])
          Toast.warning(`El m\xF3dulo "${hash}" no est\xE1 habilitado para su rol.`);
        window.location.hash = `#${defaultRoute}`;
        return;
      }
      this.currentRoute = hash;
      let activeMacroKey = null;
      for (const [key, macro] of Object.entries(MACRO_CATEGORIES)) {
        if (macro.routes.includes(hash)) {
          activeMacroKey = key;
          break;
        }
      }
      const currentMacro = activeMacroKey ? MACRO_CATEGORIES[activeMacroKey] : null;
      const targetSidebarRoute = currentMacro ? currentMacro.sidebarRoute : hash;
      document.querySelectorAll(".nav-item").forEach((item) => {
        const route = item.getAttribute("data-route");
        if (route === targetSidebarRoute || route === hash) {
          item.classList.add("active");
        } else {
          item.classList.remove("active");
        }
      });
      const subnavBar = document.getElementById("macro-subnav-bar");
      if (subnavBar) {
        if (currentMacro && currentMacro.tabs && currentMacro.tabs.length > 0) {
          subnavBar.style.display = "block";
          subnavBar.innerHTML = `
          <div class="sub-nav-tabs" style="margin-bottom: 0;">
            ${currentMacro.tabs.filter((tab) => AuthServiceInstance.canAccessRoute(tab.route)).map((tab) => `
              <a href="#${tab.route}" class="sub-nav-tab ${tab.route === hash ? "active" : ""}">
                <span>${tab.icon}</span>
                <span>${tab.label}</span>
              </a>
            `).join("")}
          </div>
        `;
        } else {
          subnavBar.style.display = "none";
          subnavBar.innerHTML = "";
        }
      }
      const sidebar = document.getElementById("app-sidebar");
      const overlay = document.getElementById("sidebar-overlay");
      if (sidebar)
        sidebar.classList.remove("open");
      if (overlay)
        overlay.classList.remove("active");
      const module = MODULES[hash] || DashboardModule;
      if (this.contentContainer) {
        const fresh = this.contentContainer.cloneNode(false);
        this.contentContainer.replaceWith(fresh);
        this.contentContainer = fresh;
        try {
          this.contentContainer.innerHTML = '<div class="text-center text-muted" style="padding: 40px;">Cargando m\xF3dulo...</div>';
          await module.render(this.contentContainer);
        } catch (modErr) {
          console.error(`Error renderizando m\xF3dulo ${hash}:`, modErr);
          this.contentContainer.innerHTML = `
          <div class="alert alert-danger m-4">
            <h4 style="margin: 0 0 8px 0; font-size: 16px;">\u26A0\uFE0F Error al cargar el m\xF3dulo "${hash}"</h4>
            <p style="margin: 0; font-size: 13px;">${esc(modErr.message || modErr)}</p>
            <pre style="margin-top: 10px; font-size: 11px; background: rgba(0,0,0,0.05); padding: 8px; border-radius: 6px; white-space: pre-wrap;">${esc(modErr.stack || "")}</pre>
          </div>
        `;
        }
      }
    }
    initShellUI(tenant) {
      this.updateBrandUI(tenant);
      this.initTheme();
      const currentUser = AuthServiceInstance.getCurrentUser();
      this.updateUserUI(currentUser);
      const toggleBtn = document.getElementById("btn-toggle-sidebar");
      const sidebar = document.getElementById("app-sidebar");
      const overlay = document.getElementById("sidebar-overlay");
      if (toggleBtn && sidebar && overlay) {
        toggleBtn.addEventListener("click", () => {
          sidebar.classList.toggle("open");
          overlay.classList.toggle("active");
        });
        overlay.addEventListener("click", () => {
          sidebar.classList.remove("open");
          overlay.classList.remove("active");
        });
      }
      const tenantSelector = document.getElementById("topbar-tenant-selector");
      if (tenantSelector) {
        tenantSelector.addEventListener("click", async () => {
          if (!AuthServiceInstance.canManageTenants()) {
            Toast.info("El cambio de empresa est\xE1 reservado al rol Desarrollador.");
            return;
          }
          const tenants = await TenantServiceInstance.getAllTenants();
          const activeTenant = TenantServiceInstance.getActiveTenant();
          Modal.show({
            title: "Seleccionar Empresa Multi-tenant",
            content: `
            <p class="text-xs text-muted mb-3">Conmute entre organizaciones en tiempo real sin recargar c\xF3digo ni reiniciar sesi\xF3n:</p>
            <div class="d-flex flex-col gap-2">
              ${tenants.map((t) => `
                <div class="card p-3 tenant-pick-card" data-id="${esc(t.id)}" style="cursor: pointer; margin-bottom: 0; border: 1px solid ${t.id === activeTenant.id ? "var(--brand-primary)" : "var(--border-color)"};">
                  <div class="d-flex justify-between items-center">
                    <div>
                      <strong style="font-size: 14px; color: ${t.id === activeTenant.id ? "var(--brand-primary)" : "var(--text-main)"};">${esc(t.nombreComercial)}</strong>
                      <div class="text-xs text-muted">NIT: ${esc(t.nit)}-${esc(t.dv)} \u2022 ${esc(t.ciudad)}</div>
                    </div>
                    ${t.id === activeTenant.id ? '<span class="badge badge-success">Activa</span>' : ""}
                  </div>
                </div>
              `).join("")}
            </div>
          `,
            footerButtons: [
              { label: "Cerrar", class: "btn-secondary", onClick: () => Modal.close() }
            ]
          });
          document.querySelectorAll(".tenant-pick-card").forEach((card) => {
            card.addEventListener("click", async () => {
              const id = card.getAttribute("data-id");
              await TenantServiceInstance.switchTenant(id);
              Modal.close();
              Toast.success("Empresa cambiada exitosamente.");
            });
          });
        });
      }
      const quickSaleBtn = document.getElementById("btn-topbar-quick-sale");
      if (quickSaleBtn) {
        quickSaleBtn.addEventListener("click", () => {
          window.location.hash = "#sales-pos";
        });
      }
      const globalSearchInput = document.getElementById("topbar-global-search");
      if (globalSearchInput) {
        globalSearchInput.addEventListener("click", () => {
          this.openGlobalSearch();
        });
      }
      const userMenuBtn = document.getElementById("topbar-user-menu-btn");
      if (userMenuBtn) {
        userMenuBtn.addEventListener("click", () => {
          this.openUserRoleModal();
        });
      }
      const themeBtn = document.getElementById("btn-theme-toggle");
      if (themeBtn) {
        themeBtn.addEventListener("click", () => {
          this.toggleTheme();
        });
      }
      this.updateCashIndicator();
      EventBus.on("cash:shiftChanged", () => this.updateCashIndicator());
    }
    initTheme() {
      const savedTheme = localStorage.getItem("nexa_theme") || "dark";
      const icon = document.getElementById("theme-toggle-icon");
      if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        if (icon)
          icon.textContent = "\u2600\uFE0F";
      } else {
        document.body.classList.remove("dark-mode");
        if (icon)
          icon.textContent = "\u{1F319}";
      }
      this.updateBrandUI(TenantServiceInstance.getActiveTenant());
    }
    toggleTheme() {
      const isDark = document.body.classList.toggle("dark-mode");
      const icon = document.getElementById("theme-toggle-icon");
      if (isDark) {
        localStorage.setItem("nexa_theme", "dark");
        if (icon)
          icon.textContent = "\u2600\uFE0F";
        Toast.info("Modo Oscuro activado");
      } else {
        localStorage.setItem("nexa_theme", "light");
        if (icon)
          icon.textContent = "\u{1F319}";
        Toast.info("Modo Claro activado");
      }
      this.updateBrandUI(TenantServiceInstance.getActiveTenant());
    }
    async updateCashIndicator() {
      const tenant = TenantServiceInstance.getActiveTenant();
      if (!tenant)
        return;
      const shift = await CashService.getCurrentShift(tenant.id);
      const ind = document.getElementById("topbar-cash-badge");
      if (ind) {
        if (shift) {
          ind.className = "badge badge-success";
          ind.textContent = "\u25CF Caja Abierta";
          ind.title = `Turno abierto por ${esc(shift.usuarioNombre || "-")}`;
        } else {
          ind.className = "badge badge-warning";
          ind.textContent = "\u25CB Caja Cerrada";
          ind.title = "Sin turno de caja activo";
        }
      }
    }
    updateBrandUI(tenant) {
      if (!tenant)
        return;
      const isDark = document.body.classList.contains("dark-mode");
      const isotipoSrc = TenantServiceInstance.getIsotipo(tenant, isDark);
      const brandNameEl = document.getElementById("sidebar-brand-name");
      const brandNitEl = document.getElementById("sidebar-brand-nit");
      const topbarBrandEl = document.getElementById("topbar-brand-name");
      const brandIconEl = document.getElementById("sidebar-brand-icon");
      const topbarBrandIconEl = document.getElementById("topbar-brand-icon");
      if (brandNameEl)
        brandNameEl.textContent = tenant.nombreComercial;
      if (brandNitEl)
        brandNitEl.textContent = `NIT: ${esc(tenant.nit)}-${tenant.dv}`;
      if (topbarBrandEl)
        topbarBrandEl.textContent = tenant.nombreComercial;
      if (brandIconEl) {
        brandIconEl.innerHTML = `<img src="${esc(isotipoSrc)}" alt="${esc(tenant.nombreComercial)}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px; display: block;">`;
        brandIconEl.style.background = isDark ? "#000000" : "#ffffff";
        brandIconEl.style.borderColor = isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.08)";
      }
      if (topbarBrandIconEl) {
        topbarBrandIconEl.innerHTML = `<img src="${esc(isotipoSrc)}" alt="${esc(tenant.nombreComercial)}" style="width: 18px; height: 18px; object-fit: contain; border-radius: 4px; display: block;">`;
      }
    }
    updateUserUI(user) {
      if (!user)
        return;
      const nameEl = document.getElementById("topbar-user-name");
      const roleEl = document.getElementById("topbar-user-role");
      const avatarEl = document.getElementById("topbar-user-avatar");
      if (nameEl)
        nameEl.textContent = user.nombre;
      if (roleEl)
        roleEl.textContent = `${user.rol} \u25BE`;
      if (avatarEl)
        avatarEl.textContent = user.nombre.charAt(0).toUpperCase();
      this.filterSidebarForUser();
    }
    filterSidebarForUser() {
      const allowedModules = AuthServiceInstance.getAllowedModules();
      const isSuperAdmin = AuthServiceInstance.isDeveloper();
      document.querySelectorAll(".nav-item").forEach((item) => {
        const route = item.getAttribute("data-route");
        const macro = Object.values(MACRO_CATEGORIES).find((m) => m.sidebarRoute === route);
        const candidates = macro ? [route, ...macro.tabs.map((t) => t.route)] : [route];
        const firstAllowed = candidates.find((r) => isSuperAdmin || allowedModules.includes(r));
        if (firstAllowed) {
          item.style.display = "flex";
          item.setAttribute("href", `#${firstAllowed}`);
        } else {
          item.style.display = "none";
        }
      });
      const nav = document.querySelector(".sidebar-nav");
      if (!nav)
        return;
      let currentSectionTitle = null;
      let sectionHasVisibleItems = false;
      Array.from(nav.children).forEach((el) => {
        if (el.classList.contains("nav-section-title")) {
          if (currentSectionTitle && !sectionHasVisibleItems) {
            currentSectionTitle.style.display = "none";
          }
          currentSectionTitle = el;
          sectionHasVisibleItems = false;
          el.style.display = "";
        } else if (el.classList.contains("nav-item")) {
          if (el.style.display !== "none") {
            sectionHasVisibleItems = true;
          }
        }
      });
      if (currentSectionTitle && !sectionHasVisibleItems) {
        currentSectionTitle.style.display = "none";
      }
    }
    async openUserRoleModal() {
      const currentUser = AuthServiceInstance.getCurrentUser();
      const isDev = AuthServiceInstance.isDeveloper();
      const users = isDev ? (await DB.getAll(STORES.USERS)).filter((u) => u.estado !== "INACTIVO") : [currentUser];
      const dialog = Modal.show({
        title: "Perfil de usuario",
        content: `
        <p class="text-xs text-muted mb-3">
          ${isDev ? "Modo Desarrollador: puede cambiar a otro perfil para soporte o pruebas (queda registrado en auditor\xEDa)." : "Para cambiar de usuario cierre la sesi\xF3n."}
        </p>
        <div class="d-flex flex-col gap-2">
          ${users.map((u) => `
            <div class="card p-3 user-switch-card" data-id="${esc(u.id)}" style="cursor: ${isDev && u.id !== currentUser.id ? "pointer" : "default"}; margin-bottom: 0; border: 1px solid ${u.id === currentUser.id ? "var(--brand-primary)" : "var(--border-color)"};">
              <div class="d-flex justify-between items-center">
                <div class="d-flex items-center gap-3">
                  <div class="user-avatar" style="width: 36px; height: 36px; font-size: 14px;">${esc((u.nombre || "?").charAt(0).toUpperCase())}</div>
                  <div>
                    <strong style="font-size: 14px;">${esc(u.nombre)}</strong>
                    <div class="text-xs text-muted">${esc(u.usuario)} \u2022 ${esc(u.rol)}</div>
                  </div>
                </div>
                ${u.id === currentUser.id ? '<span class="badge badge-success">Activo</span>' : '<span class="badge badge-neutral">Cambiar</span>'}
              </div>
            </div>
          `).join("")}
        </div>
      `,
        footerButtons: [
          { label: "Cerrar sesi\xF3n", class: "btn-danger", onClick: () => {
            Modal.close();
            AuthServiceInstance.logout();
          } },
          { label: "Cambiar mi PIN", class: "btn-secondary", onClick: () => this.openChangeOwnPasswordModal() },
          { label: "Cerrar", class: "btn-secondary", onClick: () => Modal.close() }
        ]
      });
      if (!isDev)
        return;
      dialog.querySelectorAll(".user-switch-card").forEach((card) => {
        card.addEventListener("click", async () => {
          const id = card.getAttribute("data-id");
          if (id === currentUser.id)
            return;
          try {
            const u = await AuthServiceInstance.switchUser(id);
            Modal.close();
            Toast.success(`Perfil cambiado a ${u.nombre}`);
            window.location.hash = "#" + AuthServiceInstance.getDefaultRoute();
            window.location.reload();
          } catch (err) {
            Toast.error(err.message);
          }
        });
      });
    }
    openChangeOwnPasswordModal() {
      const user = AuthServiceInstance.getCurrentUser();
      const dialog = Modal.show({
        title: "Cambiar mi PIN",
        size: "sm",
        content: `
        <form id="own-pass-form" autocomplete="off">
          <div class="form-group mb-3"><label class="form-label">PIN actual</label>
            <input type="password" class="form-control pin-input" name="cur" required autocomplete="off"></div>
          <div class="form-group mb-3"><label class="form-label">Nuevo PIN</label>
            <input type="password" class="form-control pin-input" name="p1" required inputmode="numeric" maxlength="4" pattern="\\d{4}" autocomplete="off">
            <div class="form-help">${esc(AuthServiceInstance.passwordRules())}</div></div>
          <div class="form-group mb-3"><label class="form-label">Repetir nuevo PIN</label>
            <input type="password" class="form-control pin-input" name="p2" required inputmode="numeric" maxlength="4" pattern="\\d{4}" autocomplete="off"></div>
        </form>`,
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: "Guardar",
            class: "btn-primary",
            onClick: async () => {
              const fd = new FormData(dialog.querySelector("#own-pass-form"));
              if (fd.get("p1") !== fd.get("p2")) {
                Toast.warning("Los PIN no coinciden.");
                return;
              }
              try {
                await AuthServiceInstance.changePassword(user.id, fd.get("cur"), fd.get("p1"));
                Modal.close();
                Toast.success("PIN actualizado.");
              } catch (err) {
                Toast.error(err.message);
              }
            }
          }
        ]
      });
    }
    openGlobalSearch() {
      const dialog = Modal.show({
        title: "B\xFAsqueda global (Ctrl + K)",
        content: `
        <div class="form-group mb-3">
          <input type="text" id="inp-modal-global-search" class="form-control" placeholder="Cliente, NIT, SKU, producto o n\xFAmero de venta..." autofocus>
        </div>
        <div class="d-flex flex-col gap-2" id="global-search-results" style="max-height: 300px; overflow-y: auto;">
          <div class="text-xs text-muted text-center" style="padding: 20px;">Escriba al menos 2 caracteres.</div>
        </div>
      `,
        footerButtons: [{ label: "Cerrar (Esc)", class: "btn-secondary", onClick: () => Modal.close() }]
      });
      const inp = dialog.querySelector("#inp-modal-global-search");
      const res = dialog.querySelector("#global-search-results");
      setTimeout(() => inp.focus(), 50);
      const allowed = (r) => AuthServiceInstance.canAccessRoute(r);
      let timer = null;
      inp.addEventListener("input", () => {
        clearTimeout(timer);
        timer = setTimeout(async () => {
          const q = inp.value.toLowerCase().trim();
          if (q.length < 2) {
            res.innerHTML = '<div class="text-xs text-muted text-center" style="padding: 20px;">Escriba al menos 2 caracteres.</div>';
            return;
          }
          const tenant = TenantServiceInstance.getActiveTenant();
          const [prods, clients, sales] = await Promise.all([
            allowed("products") ? DB.getAll(STORES.PRODUCTS, tenant.id) : [],
            allowed("clients") ? DB.getAll(STORES.CUSTOMERS, tenant.id) : [],
            allowed("sales-pos") ? DB.getAll(STORES.SALES, tenant.id) : []
          ]);
          const has = (v) => String(v || "").toLowerCase().includes(q);
          const results = [
            ...prods.filter((p) => has(p.nombre) || has(p.sku)).slice(0, 8).map((p) => ({ route: "products", icon: "\u{1F4E6}", title: p.nombre, sub: p.sku })),
            ...clients.filter((c) => has(c.nombre) || has(c.nitCc)).slice(0, 8).map((c) => ({ route: "clients", icon: "\u{1F464}", title: c.nombre, sub: `NIT/CC: ${c.nitCc || "-"}` })),
            ...sales.filter((s) => has(s.consecutivo) || has(s.clienteNombre)).slice(0, 8).map((s) => ({ route: "sales-pos", icon: "\u{1F9FE}", title: s.consecutivo, sub: `${s.clienteNombre || ""} \xB7 ${s.estado || ""}` }))
          ];
          res.innerHTML = results.length ? results.map((r) => `
          <div class="card p-2 mb-1 global-search-hit" data-route="${esc(r.route)}" style="cursor: pointer;">
            <div class="d-flex justify-between items-center text-xs">
              <strong>${r.icon} ${esc(r.title)}</strong>
              <span class="text-muted">${esc(r.sub)}</span>
            </div>
          </div>`).join("") : '<div class="text-xs text-muted text-center" style="padding: 20px;">Sin coincidencias.</div>';
          res.querySelectorAll(".global-search-hit").forEach((el) => el.addEventListener("click", () => {
            Modal.close();
            window.location.hash = "#" + el.getAttribute("data-route");
          }));
        }, 200);
      });
    }
  };
  function startApp() {
    const app = new NexaApp();
    app.init();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp);
  } else {
    startApp();
  }
})();
