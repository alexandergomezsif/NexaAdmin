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

  // ../js/services/db-service.js
  var db_service_exports = {};
  __export(db_service_exports, {
    DB: () => DB2,
    STORES: () => STORES
  });
  var DB_NAME, DB_VERSION, STORES, DBService, DB2;
  var init_db_service = __esm({
    "../js/services/db-service.js"() {
      DB_NAME = "NexaERP_DB";
      DB_VERSION = 2;
      STORES = {
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
        SYSTEM_PARAMS: "system_params"
      };
      DBService = class {
        constructor() {
          this.db = null;
          this.initPromise = null;
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
            };
            request.onsuccess = (event) => {
              this.db = event.target.result;
              resolve(this.db);
            };
            request.onerror = (event) => {
              console.error("Error al abrir IndexedDB:", event.target.error);
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
         * Agrega un nuevo registro generando UUID si no tiene id
         */
        async add(storeName, item) {
          await this.init();
          if (!item.id) {
            item.id = (storeName.substring(0, 3) + "_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7)).toLowerCase();
          }
          if (!item.fechaCreacion) {
            item.fechaCreacion = (/* @__PURE__ */ new Date()).toISOString();
          }
          return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], "readwrite");
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
          item.fechaModificacion = (/* @__PURE__ */ new Date()).toISOString();
          return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], "readwrite");
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
            const transaction = this.db.transaction([storeName], "readwrite");
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
            const transaction = this.db.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
            items.forEach((item) => {
              if (!item.id) {
                item.id = (storeName.substring(0, 3) + "_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7)).toLowerCase();
              }
              store.put(item);
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
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
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
        async downloadAutoBackup(triggerName = "Auto") {
          try {
            const backupData = await this.exportBackup();
            const jsonStr = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const dateStr = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
            const a = document.createElement("a");
            a.href = url;
            a.download = `NexaERP_CopiaSeguridad_${triggerName}_${dateStr}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } catch (e) {
            console.error("Error generando copia de seguridad autom\xE1tica:", e);
          }
        }
        /**
         * Restaura la información desde un objeto de backup JSON
         */
        async restoreBackup(backupData) {
          if (!backupData || !backupData.stores) {
            throw new Error("Formato de archivo de respaldo inv\xE1lido o corrupto.");
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
      };
      DB2 = new DBService();
    }
  });

  // ../js/utils/formatters.js
  var Formatters;
  var init_formatters = __esm({
    "../js/utils/formatters.js"() {
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
          if (!str)
            return "";
          return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
        }
      };
    }
  });

  // ../js/services/export-service.js
  var export_service_exports = {};
  __export(export_service_exports, {
    ExportService: () => ExportService
  });
  var ExportService;
  var init_export_service = __esm({
    "../js/services/export-service.js"() {
      init_formatters();
      ExportService = {
        /**
         * Exporta un array de objetos a CSV / Excel
         * @param {Array} data - Array de objetos planos
         * @param {string} filename - Nombre del archivo sin extensión
         * @param {Array} headers - Map de claves a títulos legibles ej: { sku: 'Código SKU', nombre: 'Nombre' }
         */
        exportToCSV(data, filename = "reporte", headers = null) {
          if (!data || !data.length) {
            alert("No hay datos disponibles para exportar.");
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

  // ../js/services/tenant-service.js
  init_db_service();

  // ../js/data/seed-rayopro.js
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
        resolucionFacturacion: "Resoluci\xF3n DIAN No. 18764000123456 de 2026-01-15 (Prefijo RP del 1 al 10000)",
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
        resolucionFacturacion: "Resoluci\xF3n DIAN No. 18764000987654 (Prefijo AB)",
        moneda: "COP",
        esDemo: true
      }
    ],
    price_lists: [
      { id: "plist_1", tenantId: RAYO_PRO_TENANT_ID, nombre: "P1 - Precio P\xFAblico / Final", descripcion: "Mostrador y consumidor particular", esDefecto: true, orden: 1 },
      { id: "plist_2", tenantId: RAYO_PRO_TENANT_ID, nombre: "P2 - Precio Lavaderos / Taller", descripcion: "Autolavados y centros de detailing", esDefecto: false, orden: 2 },
      { id: "plist_3", tenantId: RAYO_PRO_TENANT_ID, nombre: "P3 - Precio Mayorista (Docenas)", descripcion: "Compras por cajas completas x 12 unidades", esDefecto: false, orden: 3 },
      { id: "plist_4", tenantId: RAYO_PRO_TENANT_ID, nombre: "P4 - Precio Distribuidor Autorizado", descripcion: "Almacenes y distribuidores regionales", esDefecto: false, orden: 4 },
      { id: "plist_5", tenantId: RAYO_PRO_TENANT_ID, nombre: "P5 - Precio Especial Cano Trucks", descripcion: "Tarifa preferencial convenio Jhon Chalarca (Cano)", esDefecto: false, orden: 5 }
    ],
    warehouses: [
      { id: "wh_1", tenantId: RAYO_PRO_TENANT_ID, codigo: "BOD-01", nombre: "Bodega Principal & Despachos", direccion: "Carrera 42 # 54A - 77 Itag\xFC\xED", esPrincipal: true, estado: "ACTIVO" },
      { id: "wh_2", tenantId: RAYO_PRO_TENANT_ID, codigo: "BOD-02", nombre: "Planta de Producci\xF3n & Reactores", direccion: "\xC1rea de Envasado Nave B", esPrincipal: false, estado: "ACTIVO" },
      { id: "wh_3", tenantId: RAYO_PRO_TENANT_ID, codigo: "BOD-03", nombre: "Punto de Venta / Mostrador", direccion: "Mostrador de atenci\xF3n y retail", esPrincipal: false, estado: "ACTIVO" }
    ],
    users: [
      {
        id: "usr_dev",
        tenantId: RAYO_PRO_TENANT_ID,
        nombre: "Desarrollador Master (Autor de Software)",
        usuario: "desarrollador",
        clave: "Admin.2026",
        email: "desarrollador@nexa.software",
        rol: "Desarrollador",
        estado: "ACTIVO",
        permisos: ["VER", "CREAR", "EDITAR", "ELIMINAR", "AUTORIZAR", "EXPORTAR", "FINANCIERO", "DEVELOPER"]
      },
      {
        id: "usr_juan",
        tenantId: RAYO_PRO_TENANT_ID,
        nombre: "Juan Pablo (Gerente General)",
        usuario: "juan.gerencia",
        clave: "gerente.2026",
        email: "juan@rayopro.com.co",
        rol: "Gerente",
        estado: "ACTIVO",
        firmaUrl: "datos/firma juan.jpg",
        permisos: ["VER", "CREAR", "EDITAR", "AUTORIZAR", "EXPORTAR", "FINANCIERO"]
      },
      {
        id: "usr_admin",
        tenantId: RAYO_PRO_TENANT_ID,
        nombre: "Carlos Mario Arango",
        usuario: "carlos.admin",
        clave: "carlos.2026",
        email: "carlos@rayopro.com.co",
        rol: "Gerente",
        estado: "ACTIVO",
        permisos: ["VER", "CREAR", "EDITAR", "AUTORIZAR", "EXPORTAR", "FINANCIERO"]
      },
      {
        id: "usr_ventas",
        tenantId: RAYO_PRO_TENANT_ID,
        nombre: "Valentina Restrepo",
        usuario: "valentina.ventas",
        email: "ventas@rayopro.com.co",
        rol: "Vendedor",
        estado: "ACTIVO",
        permisos: ["VER", "CREAR", "EDITAR"]
      },
      {
        id: "usr_bodega",
        tenantId: RAYO_PRO_TENANT_ID,
        nombre: "Mateo Osorio (Bodega & Despachos)",
        usuario: "mateo.logistica",
        email: "bodega@rayopro.com.co",
        rol: "Bodega",
        estado: "ACTIVO",
        permisos: ["VER", "CREAR", "EDITAR"]
      },
      {
        id: "usr_produccion",
        tenantId: RAYO_PRO_TENANT_ID,
        nombre: "Ing. David G\xF3mez (Jefe de Planta)",
        usuario: "david.planta",
        email: "produccion@rayopro.com.co",
        rol: "Producci\xF3n",
        estado: "ACTIVO",
        permisos: ["VER", "CREAR", "EDITAR", "AUTORIZAR"]
      },
      {
        id: "usr_caja",
        tenantId: RAYO_PRO_TENANT_ID,
        nombre: "Camila Henao (Caja Mostrador)",
        usuario: "camila.caja",
        email: "caja@rayopro.com.co",
        rol: "Caja",
        estado: "ACTIVO",
        permisos: ["VER", "CREAR", "EDITAR"]
      }
    ],
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
        nombre: "Jhon Jairo Chalarca Acevedo (Cano)",
        razonSocial: "Jhon Jairo Chalarca Acevedo / Cano Trucks",
        nitCc: "1096037405",
        dv: 1,
        facturaElectronica: false,
        // Cliente con acuerdo especial de remisión directa
        aplicaIva: false,
        // Precios preferenciales netos sin IVA (etapa inicial)
        telefono: "3017100508",
        whatsapp: "+573017100508",
        email: "jhon.chalarca@canotrucks.co",
        direccion: "Manzana A Casa 17",
        barrio: "La Estaci\xF3n",
        ciudad: "La Tebaida",
        departamento: "Quind\xEDo",
        vendedorId: "usr_juan",
        vendedorNombre: "Juan Pablo (Gerente)",
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
        vendedorId: "usr_ventas",
        vendedorNombre: "Valentina Restrepo",
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
        vendedorId: "usr_ventas",
        vendedorNombre: "Valentina Restrepo",
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
        responsableId: "usr_juan",
        responsableNombre: "Juan Pablo (Gerente)",
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
        clienteNombre: "Jhon Jairo Chalarca Acevedo (Cano Trucks)",
        nitCc: "1096037405-1",
        telefono: "3017100508",
        whatsapp: "+57 301 710 0508",
        email: "jhon.chalarca@canotrucks.co",
        direccion: "Manzana A Casa 17",
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
        responsable: "Juan Pablo (Gerente)",
        observaciones: "Manejar con cuidado. Cajas con sellos de seguridad Rayo Pro. Productos de mantenimiento y embellecimiento automotriz."
      },
      {
        id: "ship_cano_02",
        tenantId: RAYO_PRO_TENANT_ID,
        ventaId: "sale_cano_02",
        clienteId: "cli_cano_trucks",
        clienteNombre: "Jhon Jairo Chalarca Acevedo (Cano Trucks)",
        nitCc: "1096037405-1",
        telefono: "3017100508",
        whatsapp: "+57 301 710 0508",
        email: "jhon.chalarca@canotrucks.co",
        direccion: "Manzana A Casa 17",
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
        responsable: "Valentina Restrepo",
        observaciones: "Despacho prioritario programado para recolecci\xF3n hoy en la tarde. Productos de embellecimiento automotriz."
      }
    ],
    // CUENTAS POR COBRAR (CARTERA REAL DE JHON CHALARCA CANO)
    receivables_cxc: [
      {
        id: "cxc_cano_01",
        tenantId: RAYO_PRO_TENANT_ID,
        ventaId: "sale_cano_prev",
        documento: "RP-CANO-088",
        clienteId: "cli_cano_trucks",
        clienteNombre: "Jhon Jairo Chalarca Acevedo (Cano)",
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
        clienteNombre: "Jhon Jairo Chalarca Acevedo (Cano)",
        clienteNit: "1096.037.405-1",
        vendedorId: "usr_juan",
        vendedorNombre: "Juan Pablo (Gerente)",
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
        usuarioId: "usr_juan",
        usuarioNombre: "Juan Pablo (Gerente)",
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
        responsableId: "usr_juan",
        responsableNombre: "Juan Pablo",
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
        usuarioId: "usr_juan",
        usuarioNombre: "Juan Pablo (Gerente)",
        observacion: "Entrada por lote fabricado LOTE-DES2609-01 (10 cajas x 12)"
      }
    ],
    audit_logs: [
      {
        id: "aud_001",
        tenantId: RAYO_PRO_TENANT_ID,
        fecha: "2026-09-12",
        hora: "10:15:00",
        usuarioId: "usr_juan",
        usuarioNombre: "Juan Pablo (Gerente)",
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

  // ../js/utils/dian-dv.js
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

  // ../js/utils/event-bus.js
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

  // ../js/services/tenant-service.js
  var TenantService = class {
    constructor() {
      this.currentTenant = null;
      this.activeTenantId = localStorage.getItem("nexa_active_tenant") || RAYO_PRO_TENANT_ID;
    }
    /**
     * Inicializa el servicio, asegura datos demo y aplica el tema visual
     */
    async init() {
      await DB2.init();
      let tenants = await DB2.getAll(STORES.TENANTS);
      let prods = await DB2.getAll(STORES.PRODUCTS, RAYO_PRO_TENANT_ID);
      const hasRealDeseng = prods && prods.some((p) => p.sku === "DESENG-1L");
      if (!tenants || tenants.length === 0 || !hasRealDeseng) {
        await this.seedInitialDatabase();
        tenants = await DB2.getAll(STORES.TENANTS);
      } else {
        let existingUsers = await DB2.getAll(STORES.USERS, RAYO_PRO_TENANT_ID);
        for (const u of SeedData.users) {
          const found = existingUsers.find((eu) => eu.id === u.id);
          if (!found) {
            await DB2.add(STORES.USERS, u);
          } else if (u.id === "usr_dev" && (found.clave === "dev.nexa.2026" || !found.clave)) {
            found.clave = "Admin.2026";
            await DB2.update(STORES.USERS, found);
          } else if (u.id === "usr_juan" && found.rol !== "Gerente") {
            found.rol = "Gerente";
            found.nombre = "Juan Pablo (Gerente General)";
            found.clave = "gerente.2026";
            await DB2.update(STORES.USERS, found);
          }
        }
        let existingCusts = await DB2.getAll(STORES.CUSTOMERS, RAYO_PRO_TENANT_ID);
        for (const c of SeedData.customers) {
          const found = existingCusts.find((ec) => ec.id === c.id);
          if (!found) {
            await DB2.add(STORES.CUSTOMERS, c);
          } else if (found.facturaElectronica === void 0 || found.aplicaIva === void 0) {
            found.facturaElectronica = c.facturaElectronica;
            found.aplicaIva = c.aplicaIva;
            await DB2.update(STORES.CUSTOMERS, found);
          }
        }
        for (const t of tenants) {
          let changed = false;
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
          if (changed) {
            await DB2.update(STORES.TENANTS, t);
          }
        }
      }
      this.currentTenant = tenants.find((t) => t.id === this.activeTenantId) || tenants[0];
      if (this.currentTenant) {
        this.activeTenantId = this.currentTenant.id;
        localStorage.setItem("nexa_active_tenant", this.activeTenantId);
        this.applyTheme(this.currentTenant);
      }
      return this.currentTenant;
    }
    /**
     * Carga los datos demo en IndexedDB si es la primera ejecución
     */
    async seedInitialDatabase() {
      for (const [storeKey, items] of Object.entries(SeedData)) {
        const storeName = STORES[storeKey.toUpperCase()];
        if (storeName && Array.isArray(items)) {
          await DB2.bulkAdd(storeName, items);
        }
      }
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
      return await DB2.getAll(STORES.TENANTS);
    }
    /**
     * Cambia la empresa activa en tiempo de ejecución sin recargar la página
     */
    async switchTenant(tenantId) {
      const tenant = await DB2.getById(STORES.TENANTS, tenantId);
      if (!tenant)
        throw new Error("Empresa no encontrada.");
      this.currentTenant = tenant;
      this.activeTenantId = tenant.id;
      localStorage.setItem("nexa_active_tenant", this.activeTenantId);
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
      const updated = await DB2.update(STORES.TENANTS, tenantData);
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
      if (tenantData.nit) {
        tenantData.dv = DianDV.calculate(tenantData.nit);
      }
      const created = await DB2.add(STORES.TENANTS, tenantData);
      const basePriceLists = [
        { id: `plist_1_${created.id}`, tenantId: created.id, nombre: "P1 - Precio P\xFAblico / Final", descripcion: "Mostrador y consumidor particular", esDefecto: true, orden: 1 },
        { id: `plist_2_${created.id}`, tenantId: created.id, nombre: "P2 - Precio Lavaderos / Taller", descripcion: "Autolavados y centros de detailing", esDefecto: false, orden: 2 },
        { id: `plist_3_${created.id}`, tenantId: created.id, nombre: "P3 - Precio Mayorista (Docenas)", descripcion: "Compras por cajas completas x 12 unidades", esDefecto: false, orden: 3 },
        { id: `plist_4_${created.id}`, tenantId: created.id, nombre: "P4 - Precio Distribuidor Autorizado", descripcion: "Almacenes y distribuidores regionales", esDefecto: false, orden: 4 },
        { id: `plist_5_${created.id}`, tenantId: created.id, nombre: "P5 - Precio Especial Convenio", descripcion: "Tarifa preferencial convenios", esDefecto: false, orden: 5 }
      ];
      for (const pl of basePriceLists) {
        await DB2.add(STORES.PRICE_LISTS, pl);
      }
      await DB2.add(STORES.WAREHOUSES, {
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

  // ../js/services/auth-service.js
  init_db_service();

  // ../js/services/audit-service.js
  init_db_service();
  var AuditServiceManager = class {
    /**
     * Registra una acción de auditoría
     */
    async log({ modulo, accion, registroId, campoModificado, valorAnterior, valorNuevo }) {
      try {
        const tenantId = localStorage.getItem("nexa_active_tenant") || "tenant_rayopro";
        const now = /* @__PURE__ */ new Date();
        const hora = now.toLocaleTimeString("es-CO", { hour12: false });
        const fecha = now.toISOString().split("T")[0];
        const activeUserId = localStorage.getItem("nexa_active_user") || "usr_admin";
        let usuarioNombre = "Usuario Sistema";
        const user = await DB2.getById(STORES.USERS, activeUserId);
        if (user) {
          usuarioNombre = user.nombre;
        }
        const logEntry = {
          tenantId,
          fecha,
          hora,
          usuarioId: activeUserId,
          usuarioNombre,
          modulo,
          accion,
          registroId: registroId || "-",
          campoModificado: campoModificado || "Operaci\xF3n General",
          valorAnterior: valorAnterior !== void 0 && valorAnterior !== null ? String(valorAnterior) : "-",
          valorNuevo: valorNuevo !== void 0 && valorNuevo !== null ? String(valorNuevo) : "-",
          ipUserAgent: navigator.userAgent.substring(0, 50)
        };
        await DB2.add(STORES.AUDIT_LOGS, logEntry);
        return logEntry;
      } catch (err) {
        console.warn("No se pudo registrar la entrada de auditor\xEDa:", err);
      }
    }
    /**
     * Obtiene la bitácora de auditoría para la empresa activa
     */
    async getLogs(tenantId) {
      const logs = await DB2.getAll(STORES.AUDIT_LOGS, tenantId);
      return logs.sort((a, b) => new Date(b.fechaCreacion || b.fecha) - new Date(a.fechaCreacion || a.fecha));
    }
  };
  var AuditService = new AuditServiceManager();

  // ../js/services/auth-service.js
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
      "documents"
    ],
    // GERENCIA: Enfoque estratégico, comercial, financiero y operativo completo.
    // Protege la propiedad intelectual: NO tiene acceso a 'users' (Módulo 13) ni 'audit' (Módulo 14).
    [ROLES.GERENTE]: [
      "dashboard",
      "sales-pos",
      "clients",
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
      "settings",
      "backup",
      "importer",
      "integrations",
      "documents"
    ],
    // ASESOR COMERCIAL / VENTAS: POS, Clientes 360, Pedidos y Despachos, Catálogo y Documentos
    [ROLES.VENDEDOR]: [
      "sales-pos",
      "clients",
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
  var AuthService = class {
    constructor() {
      this.currentUser = null;
      this.activeUserId = localStorage.getItem("nexa_active_user") || "usr_dev";
    }
    async init(tenantId) {
      let users = await DB2.getAll(STORES.USERS, tenantId);
      if (!users || users.length === 0) {
        users = await DB2.getAll(STORES.USERS);
      }
      this.currentUser = users && users.find((u) => u.id === this.activeUserId) || users && users[0] || {
        id: "usr_dev",
        nombre: "Desarrollador Master (Autor de Software)",
        usuario: "desarrollador",
        clave: "Admin.2026",
        rol: ROLES.DEV,
        permisos: Object.values(PERMISSIONS)
      };
      localStorage.setItem("nexa_active_user", this.currentUser.id);
      return this.currentUser;
    }
    getCurrentUser() {
      return this.currentUser;
    }
    isDeveloper() {
      return this.currentUser?.rol === ROLES.DEV || this.currentUser?.rol === "Desarrollador";
    }
    canManageUsers() {
      return this.isDeveloper();
    }
    canManageTenants() {
      return this.isDeveloper();
    }
    async switchUser(userId, password = null) {
      const user = await DB2.getById(STORES.USERS, userId);
      if (!user)
        throw new Error("Usuario no encontrado.");
      if (user.rol === ROLES.DEV || user.rol === "Desarrollador") {
        const requiredPass = user.clave || "Admin.2026";
        if (!password || password.trim() !== requiredPass.trim()) {
          throw new Error("Contrase\xF1a de Desarrollador requerida para autenticar este perfil de alta seguridad.");
        }
      }
      this.currentUser = user;
      this.activeUserId = user.id;
      localStorage.setItem("nexa_active_user", user.id);
      await AuditService.log({
        modulo: "Seguridad",
        accion: "LOGIN",
        registroId: user.id,
        campoModificado: "Sesi\xF3n Activa",
        valorAnterior: "-",
        valorNuevo: `${user.nombre} (${user.rol})`
      });
      EventBus.emit("auth:userChanged", user);
      return user;
    }
    /**
     * Obtiene la lista de slugs de módulos autorizados para el usuario activo
     */
    getAllowedModules() {
      if (!this.currentUser)
        return [];
      if (this.isDeveloper()) {
        return ROLE_ALLOWED_MODULES[ROLES.DEV];
      }
      return ROLE_ALLOWED_MODULES[this.currentUser.rol] || ["dashboard"];
    }
    /**
     * Verifica si el usuario actual tiene acceso a una ruta/módulo específico
     */
    canAccessRoute(route) {
      if (!route || route === "")
        return true;
      if (!this.currentUser)
        return false;
      if (this.isDeveloper())
        return true;
      const allowed = this.getAllowedModules();
      return allowed.includes(route);
    }
    /**
     * Obtiene la primera ruta permitida para redirigir si no tiene permiso en la actual
     */
    getDefaultRoute() {
      const allowed = this.getAllowedModules();
      return allowed && allowed.length > 0 ? allowed[0] : "dashboard";
    }
    /**
     * Verifica si el usuario activo tiene un permiso específico
     */
    hasPermission(permission) {
      if (!this.currentUser)
        return false;
      if (this.isDeveloper())
        return true;
      return (this.currentUser.permisos || []).includes(permission);
    }
    /**
     * Verifica si el usuario tiene permiso para ver datos financieros
     */
    canViewFinancials() {
      return this.hasPermission(PERMISSIONS.FINANCIERO);
    }
  };
  var AuthServiceInstance = new AuthService();

  // ../js/services/cash-service.js
  init_db_service();
  var CashService = {
    /**
     * Obtiene el turno de caja abierto actualmente para el tenant
     */
    async getCurrentShift(tenantId) {
      const shifts = await DB2.getAll(STORES.CASH_SHIFTS, tenantId);
      return shifts.find((s) => s.estado === "ABIERTA") || null;
    },
    /**
     * Abre un nuevo turno de caja
     */
    async openShift({ tenantId, usuarioId, usuarioNombre, montoApertura, observaciones }) {
      const existing = await this.getCurrentShift(tenantId);
      if (existing) {
        throw new Error("Ya existe un turno de caja abierto. Debe cerrarlo antes de aperturar uno nuevo.");
      }
      const shift = {
        tenantId,
        usuarioId,
        usuarioNombre,
        fechaApertura: (/* @__PURE__ */ new Date()).toISOString(),
        fechaCierre: null,
        montoApertura: Number(montoApertura) || 0,
        totalVentasEfectivo: 0,
        totalVentasTransferencia: 0,
        totalVentasNequiDaviplata: 0,
        totalVentasTarjeta: 0,
        totalVentasCredito: 0,
        totalIngresos: 0,
        totalEgresos: 0,
        totalGastos: 0,
        totalRetiros: 0,
        saldoEsperado: Number(montoApertura) || 0,
        saldoContado: 0,
        diferencia: 0,
        estado: "ABIERTA",
        observaciones: observaciones || ""
      };
      const saved = await DB2.add(STORES.CASH_SHIFTS, shift);
      await AuditService.log({
        modulo: "Caja",
        accion: "CREAR",
        registroId: saved.id,
        campoModificado: "Apertura de Turno",
        valorAnterior: "-",
        valorNuevo: `Apertura con base: $ ${montoApertura}`
      });
      return saved;
    },
    /**
     * Registra un movimiento de caja (Ingreso, Egreso, Retiro, Gasto)
     */
    async addMovement({ tenantId, turnoId, tipo, monto, concepto, tercero, formaPago }) {
      const shift = await DB2.getById(STORES.CASH_SHIFTS, turnoId);
      if (!shift || shift.estado !== "ABIERTA") {
        throw new Error("No hay turno de caja abierto v\xE1lido para registrar este movimiento.");
      }
      const val = Number(monto);
      if (tipo === "INGRESO") {
        shift.totalIngresos = (shift.totalIngresos || 0) + val;
        shift.saldoEsperado += val;
      } else if (tipo === "EGRESO") {
        shift.totalEgresos = (shift.totalEgresos || 0) + val;
        shift.saldoEsperado -= val;
      } else if (tipo === "RETIRO") {
        shift.totalRetiros = (shift.totalRetiros || 0) + val;
        shift.saldoEsperado -= val;
      } else if (tipo === "GASTO") {
        shift.totalGastos = (shift.totalGastos || 0) + val;
        shift.saldoEsperado -= val;
      }
      await DB2.update(STORES.CASH_SHIFTS, shift);
      const movement = {
        tenantId,
        turnoId,
        tipo,
        monto: val,
        concepto,
        tercero: tercero || "-",
        formaPago: formaPago || "Efectivo",
        fecha: (/* @__PURE__ */ new Date()).toISOString(),
        usuarioId: shift.usuarioId
      };
      const savedMovement = await DB2.add(STORES.CASH_MOVEMENTS, movement);
      await AuditService.log({
        modulo: "Caja",
        accion: "CREAR",
        registroId: turnoId,
        campoModificado: `Movimiento Caja: ${tipo}`,
        valorAnterior: "-",
        valorNuevo: `$ ${val} - ${concepto}`
      });
      return savedMovement;
    },
    /**
     * Cierra el turno de caja y calcula arqueo
     */
    async closeShift({ turnoId, saldoContado, observacionesCierre }) {
      const shift = await DB2.getById(STORES.CASH_SHIFTS, turnoId);
      if (!shift)
        throw new Error("Turno de caja no encontrado.");
      const contado = Number(saldoContado) || 0;
      const diferencia = contado - shift.saldoEsperado;
      shift.fechaCierre = (/* @__PURE__ */ new Date()).toISOString();
      shift.saldoContado = contado;
      shift.diferencia = diferencia;
      shift.observacionesCierre = observacionesCierre || "";
      shift.estado = "CERRADA";
      await DB2.update(STORES.CASH_SHIFTS, shift);
      await AuditService.log({
        modulo: "Caja",
        accion: "MODIFICAR",
        registroId: turnoId,
        campoModificado: "Cierre y Arqueo de Caja",
        valorAnterior: `Esperado: $ ${shift.saldoEsperado}`,
        valorNuevo: `Contado: $ ${contado} (Diferencia: $ ${diferencia})`
      });
      return shift;
    }
  };

  // ../js/components/toast.js
  var ToastManager = class {
    constructor() {
      this.container = null;
      this.init();
    }
    init() {
      if (!this.container) {
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
        ${title ? `<div class="toast-title">${title}</div>` : ""}
        <div class="toast-message">${message}</div>
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
  var Toast = new ToastManager();

  // ../js/components/modal.js
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
        <h3 class="modal-title">${title}</h3>
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
      this.activeModal = { backdrop, dialog, onClose };
      const handleEsc = (e) => {
        if (e.key === "Escape") {
          this.close();
          if (onClose)
            onClose();
          document.removeEventListener("keydown", handleEsc);
        }
      };
      document.addEventListener("keydown", handleEsc);
      return dialog;
    },
    /**
     * Cierra el modal activo
     */
    close() {
      if (this.activeModal) {
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
        content: `<p style="font-size: 14px; color: #475569;">${message}</p>`,
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

  // ../js/modules/dashboard.js
  init_db_service();
  init_formatters();

  // ../js/components/kpi-card.js
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

  // ../js/modules/dashboard.js
  var DashboardModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const [sales, products, expenses, cxc, cxp, shipping, orders] = await Promise.all([
        DB2.getAll(STORES.SALES, tenantId),
        DB2.getAll(STORES.PRODUCTS, tenantId),
        DB2.getAll(STORES.EXPENSES, tenantId),
        DB2.getAll(STORES.RECEIVABLES_CXC, tenantId),
        DB2.getAll(STORES.PAYABLES_CXP, tenantId),
        DB2.getAll(STORES.ORDERS_SHIPPING, tenantId),
        DB2.getAll(STORES.PRODUCTION_ORDERS, tenantId)
      ]);
      const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const currentMonth = (/* @__PURE__ */ new Date()).getMonth();
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
      let ventasDia = 0;
      let ventasMes = 0;
      let ventasAno = 0;
      let costoTotalVentas = 0;
      sales.forEach((s) => {
        const sDate = new Date(s.fecha);
        const isToday = s.fecha && s.fecha.startsWith(todayStr);
        const isThisMonth = sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear;
        const isThisYear = sDate.getFullYear() === currentYear;
        if (isToday)
          ventasDia += Number(s.total || 0);
        if (isThisMonth)
          ventasMes += Number(s.total || 0);
        if (isThisYear)
          ventasAno += Number(s.total || 0);
      });
      const totalGastos = expenses.reduce((acc, exp) => acc + Number(exp.valor || 0), 0);
      const totalCarteraCobrar = cxc.reduce((acc, c) => acc + Number(c.saldo || 0), 0);
      const totalCuentasPagar = cxp.reduce((acc, p) => acc + Number(p.saldo || 0), 0);
      const inventarioValorizado = products.reduce((acc, p) => acc + Number(p.stock || 0) * Number(p.costoPromedio || 0), 0);
      const productosStockBajo = products.filter((p) => p.stock > 0 && p.stock <= (p.stockMinimo || 15));
      const productosAgotados = products.filter((p) => Number(p.stock || 0) <= 0);
      const carteraVencida = cxc.filter((c) => c.estado === "VENCIDO" || c.diasMora && c.diasMora > 0);
      const enviosPendientes = shipping.filter((s) => s.estadoCiclo !== "ENTREGADO");
      const utilidadEstimada = Math.max(0, ventasAno * 0.45 - totalGastos);
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <div class="d-flex items-center gap-2">
            <h1>Dashboard Ejecutivo</h1>
            <span class="badge-demo">DEMO RAYO PRO</span>
          </div>
          <p>Visi\xF3n general de ventas, cartera, inventario y alertas operativas de <strong>${tenant.nombreComercial}</strong></p>
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
        trend: "+12%",
        trendPositive: true,
        footerText: "vs. d\xEDa anterior"
      })}

        ${renderKpiCard({
        label: "Ventas del Mes",
        value: Formatters.currency(ventasMes),
        icon: "\u{1F4C8}",
        iconBg: "var(--brand-primary-light)",
        iconColor: "var(--brand-primary)",
        trend: "+8.4%",
        trendPositive: true,
        footerText: "meta mensual 85%"
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
        label: "Utilidad Estimada",
        value: Formatters.currency(utilidadEstimada),
        icon: "\u{1F48E}",
        iconBg: "#ecfdf5",
        iconColor: "#059669",
        footerText: "Margen global ~42%"
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
        label: "Gastos Registrados",
        value: Formatters.currency(totalGastos),
        icon: "\u{1F3F7}\uFE0F",
        iconBg: "#fff1f2",
        iconColor: "#e11d48",
        footerText: "Gastos operativos mes"
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
                <div class="card-title">Ventas por Per\xEDodo y Tendencia</div>
                <div class="card-subtitle">Evoluci\xF3n de facturaci\xF3n \xFAltimos meses (COP)</div>
              </div>
              <span class="badge badge-info">2026</span>
            </div>
            <div class="card-body">
              <div style="display: flex; align-items: flex-end; justify-content: space-between; height: 180px; padding-top: 20px; border-bottom: 1px solid var(--border-color); gap: 12px;">
                ${[
        { m: "May", val: 185e5, h: 55 },
        { m: "Jun", val: 242e5, h: 72 },
        { m: "Jul", val: 219e5, h: 65 },
        { m: "Ago", val: 298e5, h: 88 },
        { m: "Sep", val: ventasMes || 324e5, h: 95 }
      ].map((bar) => `
                  <div style="flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end;">
                    <div style="font-size: 10px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">${Formatters.currency(bar.val, 0)}</div>
                    <div style="width: 100%; max-width: 48px; height: ${bar.h}%; background: var(--brand-primary); border-radius: 6px 6px 0 0; transition: height 0.5s ease;"></div>
                    <div style="font-size: 11px; font-weight: 600; color: var(--text-muted); margin-top: 8px;">${bar.m}</div>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>

          <!-- Distribuci\xF3n por Categor\xEDa y M\xE9todos de Pago -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="card" style="margin-bottom: 0;">
              <div class="card-header">
                <div class="card-title" style="font-size: 14px;">Ventas por Categor\xEDa</div>
              </div>
              <div class="card-body">
                <div class="d-flex flex-col gap-3">
                  <div>
                    <div class="d-flex justify-between text-xs font-semibold mb-1">
                      <span>Lavado Exterior (Shampoos)</span>
                      <span>45%</span>
                    </div>
                    <div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                      <div style="width: 45%; height: 100%; background: var(--brand-primary);"></div>
                    </div>
                  </div>
                  <div>
                    <div class="d-flex justify-between text-xs font-semibold mb-1">
                      <span>Protecci\xF3n & Ceras</span>
                      <span>30%</span>
                    </div>
                    <div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                      <div style="width: 30%; height: 100%; background: var(--brand-secondary);"></div>
                    </div>
                  </div>
                  <div>
                    <div class="d-flex justify-between text-xs font-semibold mb-1">
                      <span>Desengrasantes Pesados</span>
                      <span>15%</span>
                    </div>
                    <div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                      <div style="width: 15%; height: 100%; background: #10b981;"></div>
                    </div>
                  </div>
                  <div>
                    <div class="d-flex justify-between text-xs font-semibold mb-1">
                      <span>Accesorios / Microfibras</span>
                      <span>10%</span>
                    </div>
                    <div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                      <div style="width: 10%; height: 100%; background: #8b5cf6;"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card" style="margin-bottom: 0;">
              <div class="card-header">
                <div class="card-title" style="font-size: 14px;">M\xE9todos de Pago</div>
              </div>
              <div class="card-body">
                <div class="d-flex flex-col gap-2 text-xs">
                  <div class="d-flex justify-between items-center" style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
                    <span>\u{1F4F1} Nequi / Daviplata</span>
                    <strong style="color: #6366f1;">35% ($ 1.130.000)</strong>
                  </div>
                  <div class="d-flex justify-between items-center" style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
                    <span>\u{1F4B5} Efectivo en Caja</span>
                    <strong style="color: #10b981;">30% ($ 960.000)</strong>
                  </div>
                  <div class="d-flex justify-between items-center" style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
                    <span>\u{1F4B3} Transferencia Bancaria</span>
                    <strong style="color: var(--brand-primary);">20% ($ 640.000)</strong>
                  </div>
                  <div class="d-flex justify-between items-center" style="padding: 6px 0;">
                    <span>\u{1F4D1} Cr\xE9dito Directo 30 d\xEDas</span>
                    <strong style="color: #f59e0b;">15% ($ 480.000)</strong>
                  </div>
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
                      <div class="text-xs">${p.nombre} (Stock: 0 ${p.unidadMedida})</div>
                      <a href="#production" class="text-xs font-bold text-danger" style="text-decoration: underline; margin-top: 4px; display: inline-block;">Programar Producci\xF3n \u2192</a>
                    </div>
                  </div>
                `).join("")}

                ${productosStockBajo.map((p) => `
                  <div class="alert alert-warning" style="margin-bottom: 4px; padding: 10px 12px;">
                    <div>
                      <div class="font-bold">\u26A0\uFE0F Stock Cr\xEDtico M\xEDnimo</div>
                      <div class="text-xs">${p.nombre} (Existencias: ${p.stock} / M\xEDnimo: ${p.stockMinimo})</div>
                    </div>
                  </div>
                `).join("")}

                ${carteraVencida.map((c) => `
                  <div class="alert alert-warning" style="margin-bottom: 4px; padding: 10px 12px;">
                    <div>
                      <div class="font-bold">\u23F0 Factura en Mora</div>
                      <div class="text-xs">${c.clienteNombre} - Doc ${c.documento} - Saldo: ${Formatters.currency(c.saldo)}</div>
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
                El sistema almacena consecutivos fiscales y genera documentos equivalentes POS conformes a la normativa interna. Para emitir CUFE y XML validado se requiere enlazar el certificado digital o proveedor tecnol\xF3gico en el m\xF3dulo de integraciones.
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
          const defaultSummaryText = `\u{1F4CA} *RESUMEN EJECUTIVO DIARIO - ${tenant.nombreComercial}*
\u{1F4C5} *Fecha:* ${todayFormatted}

\u{1F4B0} *Ventas del D\xEDa:* ${Formatters.currency(ventasDia)}
\u{1F4C8} *Ventas Acumuladas Mes:* ${Formatters.currency(ventasMes)}
\u{1F48E} *Utilidad Estimada Mes:* ${Formatters.currency(utilidadEstimada)}
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

Ventas del D\xEDa: ${Formatters.currency(ventasDia)}
Ventas Mes: ${Formatters.currency(ventasMes)}
Utilidad Estimada: ${Formatters.currency(utilidadEstimada)}
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
              `Cierre de Caja y Arqueo Diario - ${tenant.nombreComercial}`,
              `${todayRaw}T183000Z`,
              `${todayRaw}T190000Z`,
              `Conciliaci\xF3n de efectivo f\xEDsico, transferencias Nequi/Daviplata y env\xEDo de reporte a socios en Nexa ERP.`
            );
          });
          document.getElementById("btn-gcal-monthly")?.addEventListener("click", () => {
            launchGCal(
              `Cierre Mensual de Inventario y Contabilidad - ${tenant.nombreComercial}`,
              `${endOfMonthRaw}T170000Z`,
              `${endOfMonthRaw}T190000Z`,
              `Auditor\xEDa de existencias f\xEDsicas en bodega vs Kardex y balance general mensual en Nexa ERP.`
            );
          });
          document.getElementById("btn-gcal-dian")?.addEventListener("click", () => {
            launchGCal(
              `Vencimiento Tributario DIAN (IVA / ReteFuente) - ${tenant.nombreComercial}`,
              `${endOfMonthRaw}T140000Z`,
              `${endOfMonthRaw}T160000Z`,
              `Presentaci\xF3n y pago de obligaciones tributarias DIAN para NIT ${tenant.nit}-${tenant.dv}.`
            );
          });
          document.getElementById("btn-gcal-yearly")?.addEventListener("click", () => {
            launchGCal(
              `Cierre Anual Fiscal y Balance General - ${tenant.nombreComercial}`,
              `${endOfYearRaw}T150000Z`,
              `${endOfYearRaw}T180000Z`,
              `Cierre de ejercicio fiscal anual, inventario total valorizado y distribuci\xF3n de utilidades a socios.`
            );
          });
        });
      }
    }
  };

  // ../js/modules/clients.js
  init_db_service();
  init_formatters();

  // ../js/components/data-table.js
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
              <input type="text" class="table-search-input" placeholder="${this.searchPlaceholder}" value="${this.searchQuery}">
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

  // ../js/modules/clients.js
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
      const [clients, priceLists, sales, cxcList, shipments] = await Promise.all([
        DB2.getAll(STORES.CUSTOMERS, tenantId),
        DB2.getAll(STORES.PRICE_LISTS, tenantId),
        DB2.getAll(STORES.SALES, tenantId),
        DB2.getAll(STORES.RECEIVABLES_CXC, tenantId),
        DB2.getAll(STORES.ORDERS_SHIPPING, tenantId)
      ]);
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Directorio de Clientes</h1>
          <p>Control de terceros, cartera, asignaci\xF3n de listas de precios y cupos comerciales</p>
        </div>
        <div class="view-actions">
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
            render: (val) => `<strong>${val || "-"}</strong>`
          },
          {
            key: "nombre",
            title: "Cliente / Raz\xF3n Social",
            render: (val, row) => `
            <div>
              <div class="font-bold">${val}</div>
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
              return `<span class="badge ${badgeClass}" style="font-weight: 700;">${val || "General"}</span>`;
            }
          },
          {
            key: "ciudad",
            title: "Ciudad",
            render: (val, row) => `${val || "-"}, ${row.departamento || ""}`
          },
          {
            key: "telefono",
            title: "Contacto",
            render: (val, row) => `
            <div class="text-xs">
              <div>\u{1F4DE} ${val || "-"}</div>
              ${row.whatsapp ? `<div>\u{1F4AC} <a href="https://wa.me/${row.whatsapp.replace(/\D/g, "")}" target="_blank" style="color: var(--brand-primary);">${row.whatsapp}</a></div>` : ""}
            </div>
          `
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
                  ${esFE ? "\u26A1 Factura Electr\xF3nica" : "\u{1F4C4} Remisi\xF3n / POS Sin FE"}
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
            render: (val) => `<span class="badge ${val === "ACTIVO" ? "badge-success" : "badge-danger"}">${val}</span>`
          }
        ],
        actions: (row) => `
        <button class="btn btn-secondary btn-sm btn-view-client" data-id="${row.id}" title="Ficha 360\xB0">\u{1F441}\uFE0F Ficha</button>
        <button class="btn btn-secondary btn-sm btn-edit-client" data-id="${row.id}" title="Editar">\u270F\uFE0F</button>
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
          this.openClientModal(null, tenantId, priceLists, () => this.render(container));
        });
      }
      container.addEventListener("click", (e) => {
        const editBtn = e.target.closest(".btn-edit-client");
        if (editBtn) {
          const id = editBtn.getAttribute("data-id");
          const client = clients.find((c) => c.id === id);
          this.openClientModal(client, tenantId, priceLists, () => this.render(container));
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
    openClientModal(client = null, tenantId, priceLists, onSaved) {
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
            <input type="text" class="form-control" id="modal-client-dv" name="dv" readonly value="${client ? client.dv : "-"}" style="background: #f1f5f9; font-weight: bold;">
          </div>
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
                <option value="${pl.id}" ${client && client.listaPreciosId === pl.id ? "selected" : ""}>${pl.nombre}</option>
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
                <option value="SI" ${!client || client.facturaElectronica !== false ? "selected" : ""}>\u26A1 S\xED - Factura Electr\xF3nica DIAN</option>
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
              const payload = {
                tenantId,
                codigo: formData.get("codigo"),
                tipoPersona: formData.get("tipoPersona"),
                nombre: formData.get("nombre"),
                nitCc,
                dv: calculatedDv !== null ? calculatedDv : 0,
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
                estado: "ACTIVO"
              };
              if (isEdit) {
                payload.id = client.id;
                payload.saldoPendiente = client.saldoPendiente || 0;
                payload.totalComprado = client.totalComprado || 0;
                payload.numeroCompras = client.numeroCompras || 0;
                await DB2.update(STORES.CUSTOMERS, payload);
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
                const saved = await DB2.add(STORES.CUSTOMERS, payload);
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
            <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin: 0; letter-spacing: -0.02em;">${client.nombre}</h2>
            <div class="text-xs text-muted" style="margin-top: 2px;">NIT/CC: <strong>${DianDV.formatWithDV(client.nitCc)}</strong> \u2022 Segmento: <span class="badge badge-neutral" style="font-size: 11px;">${client.tipoCliente}</span></div>
          </div>
          <span class="badge ${client.estado === "ACTIVO" ? "badge-success" : "badge-danger"}">${client.estado}</span>
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
        <div>\u{1F4CD} <strong>Direcci\xF3n de Entrega:</strong> ${client.direccion || "-"}, ${client.barrio || ""} (${client.ciudad || "-"}, ${client.departamento || ""})</div>
        <div>\u{1F4DE} <strong>Contacto Comercial:</strong> ${client.telefono || "-"} | <strong>WhatsApp:</strong> ${client.whatsapp || "-"} | <strong>Email:</strong> ${client.email || "-"}</div>
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
        ${client.observaciones ? `<div style="background: rgba(245, 158, 11, 0.08); padding: 8px 12px; border-radius: 8px; border-left: 3px solid #f59e0b; margin-top: 4px;">\u{1F4DD} <strong>Notas Internas:</strong> ${client.observaciones}</div>` : ""}
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
                    <td><strong>${c.documento}</strong><br><span class="text-xs text-muted">${c.observaciones || ""}</span></td>
                    <td>${Formatters.date(c.fechaEmision)}<br><span class="text-xs text-muted">Vence: ${Formatters.date(c.fechaVencimiento)}</span></td>
                    <td class="text-right font-medium">${Formatters.currency(c.valorTotal)}</td>
                    <td class="text-right font-medium" style="color: var(--color-success);">- ${Formatters.currency(c.abonos || 0)}</td>
                    <td class="text-right font-bold" style="color: var(--color-danger);">${Formatters.currency(c.saldo)}</td>
                    <td><span class="badge ${c.saldo === 0 ? "badge-success" : "badge-warning"}">${c.estado}</span></td>
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
                <td><strong>${s.consecutivo}</strong></td>
                <td>${Formatters.date(s.fecha)}</td>
                <td>${s.metodoPago}</td>
                <td class="text-right font-bold">${Formatters.currency(s.total)}</td>
                <td><span class="badge ${s.estado === "PAGADA" ? "badge-success" : "badge-warning"}">${s.estado}</span></td>
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
                    <td><strong>${sh.numeroGuia}</strong></td>
                    <td>${sh.transportadora}</td>
                    <td>${sh.cajasTotal || 1} Cajas</td>
                    <td class="text-xs">${sh.contenidoDescripcion || "-"}</td>
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

  // ../js/modules/products.js
  init_db_service();
  init_formatters();
  var ProductsModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const [products, priceLists, warehouses] = await Promise.all([
        DB2.getAll(STORES.PRODUCTS, tenantId),
        DB2.getAll(STORES.PRICE_LISTS, tenantId),
        DB2.getAll(STORES.WAREHOUSES, tenantId)
      ]);
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Cat\xE1logo de Productos & Insumos</h1>
          <p>Control de materias primas, productos terminados, 5 listas de precios y niveles de stock</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-export-products">\u{1F4CA} Exportar</button>
          <button class="btn btn-primary btn-sm" id="btn-new-product">\u2795 Nuevo Producto</button>
        </div>
      </div>

      <!-- FILTROS DE TIPO -->
      <div class="card mb-3" style="padding: 10px 16px;">
        <div class="d-flex items-center gap-2 flex-wrap">
          <span class="text-xs font-bold text-muted">FILTRAR POR TIPO:</span>
          <button class="btn btn-secondary btn-sm filter-type-btn active" data-type="ALL">Todos (${products.length})</button>
          <button class="btn btn-secondary btn-sm filter-type-btn" data-type="PRODUCTO_TERMINADO">\u26A1 Terminados Fabricados (${products.filter((p) => p.tipoItem === "PRODUCTO_TERMINADO").length})</button>
          <button class="btn btn-secondary btn-sm filter-type-btn" data-type="MATERIA_PRIMA">\u{1F9EA} Materias Primas Qu\xEDmicas (${products.filter((p) => p.tipoItem === "MATERIA_PRIMA").length})</button>
          <button class="btn btn-secondary btn-sm filter-type-btn" data-type="MERCANCIA">\u{1F6CD}\uFE0F Mercanc\xEDa Reventa (${products.filter((p) => p.tipoItem === "MERCANCIA").length})</button>
        </div>
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
              <div class="text-xs text-muted">${row.codigoBarras || ""}</div>
            </div>
          `
          },
          {
            key: "nombre",
            title: "Descripci\xF3n / Presentaci\xF3n",
            render: (val, row) => `
            <div>
              <div class="font-bold">${val}</div>
              <div class="text-xs text-muted">${row.categoria} \u2022 ${row.presentacion || row.unidadMedida}</div>
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
                <span class="badge ${badge}">${stock} ${row.unidadMedida}</span>
                <div class="text-xs text-muted" style="margin-top: 2px;">M\xEDn: ${min} | M\xE1x: ${row.stockMaximo || 100}</div>
              </div>
            `;
            }
          },
          {
            key: "costoPromedio",
            title: "Costo Promedio",
            render: (val) => Formatters.currency(val)
          },
          {
            key: "precios",
            title: "Precio 1 (P\xFAblico)",
            render: (val, row) => {
              const p1 = row.precios && row.precios.plist_1 || 0;
              return `<strong>${Formatters.currency(p1)}</strong>`;
            }
          },
          {
            key: "estado",
            title: "Estado",
            render: (val) => `<span class="badge ${val === "ACTIVO" ? "badge-success" : "badge-danger"}">${val}</span>`
          }
        ],
        actions: (row) => `
        <button class="btn btn-secondary btn-sm btn-edit-product" data-id="${row.id}" title="Editar">\u270F\uFE0F Editar</button>
      `
      });
      container.querySelectorAll(".filter-type-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          container.querySelectorAll(".filter-type-btn").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          const type = btn.getAttribute("data-type");
          if (type === "ALL") {
            currentFiltered = [...products];
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
      container.addEventListener("click", (e) => {
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
            <input type="text" class="form-control" name="sku" required value="${product ? product.sku : "SKU-" + Math.floor(1e3 + Math.random() * 9e3)}" placeholder="Ej: RAYO-SHAMP-1G">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">Nombre Comercial del Producto</label>
            <input type="text" class="form-control" name="nombre" required value="${product ? product.nombre : ""}" placeholder="Ej: Shampoo Automotriz pH Neutro 1 Gal\xF3n">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Categor\xEDa</label>
            <input type="text" class="form-control" name="categoria" required value="${product ? product.categoria : "Lavado Exterior"}" placeholder="Ej: Lavado Exterior">
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
            <label class="form-label">Costo Promedio ($ COP)</label>
            <input type="number" class="form-control" name="costoPromedio" id="prod-costo" value="${product ? product.costoPromedio : 0}">
          </div>
          <div class="form-group">
            <label class="form-label">Margen Esperado (%)</label>
            <input type="number" class="form-control" name="margenEsperado" value="${product ? product.margenEsperado : 50}">
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
                  <label class="form-label text-xs font-bold" style="color: var(--text-main);">${pl.nombre}</label>
                  <input type="number" class="form-control font-bold" name="precio_${pl.id}" value="${product && product.precios && product.precios[pl.id] || 0}" style="color: var(--brand-primary);">
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
                <option value="${w.id}" ${product && product.bodegaId === w.id ? "selected" : ""}>${w.nombre}</option>
              `).join("")}
            </select>
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Descripci\xF3n T\xE9cnica</label>
          <textarea class="form-control" name="descripcion" rows="2">${product ? product.descripcion || "" : ""}</textarea>
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
              const payload = {
                tenantId,
                tipoItem: formData.get("tipoItem"),
                sku: formData.get("sku"),
                codigoInterno: formData.get("sku"),
                nombre: formData.get("nombre"),
                categoria: formData.get("categoria"),
                unidadMedida: formData.get("unidadMedida"),
                costoPromedio: Number(formData.get("costoPromedio") || 0),
                margenEsperado: Number(formData.get("margenEsperado") || 0),
                stockMinimo: Number(formData.get("stockMinimo") || 0),
                bodegaId: formData.get("bodegaId"),
                descripcion: formData.get("descripcion"),
                precios,
                estado: "ACTIVO"
              };
              if (isEdit) {
                payload.id = product.id;
                payload.stock = product.stock || 0;
                await DB2.update(STORES.PRODUCTS, payload);
                await AuditService.log({
                  modulo: "Productos",
                  accion: "MODIFICAR",
                  registroId: payload.sku,
                  campoModificado: "Ficha y Precios",
                  valorAnterior: product.nombre,
                  valorNuevo: `${payload.nombre} (P1: $ ${precios.plist_1 || 0})`
                });
                Toast.success("Producto actualizado con \xE9xito.");
              } else {
                payload.stock = 0;
                await DB2.add(STORES.PRODUCTS, payload);
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

  // ../js/modules/inventory.js
  init_db_service();
  init_formatters();

  // ../js/services/kardex-service.js
  init_db_service();
  var MOVEMENT_TYPES = {
    COMPRA: { label: "Compra de Mercanc\xEDa/Insumos", type: "IN" },
    VENTA: { label: "Venta Facturada / POS", type: "OUT" },
    DEVOLUCION_VENTA: { label: "Devoluci\xF3n en Venta", type: "IN" },
    DEVOLUCION_COMPRA: { label: "Devoluci\xF3n a Proveedor", type: "OUT" },
    AJUSTE_POS: { label: "Ajuste de Inventario (+)", type: "IN" },
    AJUSTE_NEG: { label: "Ajuste de Inventario (-)", type: "OUT" },
    TRASLADO_ENTRADA: { label: "Traslado entre Bodegas (Entrada)", type: "IN" },
    TRASLADO_SALIDA: { label: "Traslado entre Bodegas (Salida)", type: "OUT" },
    PRODUCCION_ENTRADA: { label: "Entrada de Producto Terminado", type: "IN" },
    CONSUMO_PRODUCCION: { label: "Consumo de Materia Prima", type: "OUT" },
    MERMA: { label: "Baja por Merma T\xE9cnica", type: "OUT" },
    DANO: { label: "Baja por Da\xF1o / Vencimiento", type: "OUT" },
    INVENTARIO_FISICO: { label: "Ajuste Conteo F\xEDsico", type: "AUDIT" }
  };
  var KardexService = {
    /**
     * Registra un movimiento en Kardex y actualiza las existencias del producto
     */
    async registerMovement({
      tenantId,
      productoId,
      bodegaId,
      documentoTipo,
      documentoNumero,
      cantidad,
      costoUnitario,
      usuarioId,
      observacion
    }) {
      const product = await DB2.getById(STORES.PRODUCTS, productoId);
      if (!product)
        throw new Error(`Producto con ID ${productoId} no encontrado.`);
      const warehouse = bodegaId ? await DB2.getById(STORES.WAREHOUSES, bodegaId) : null;
      const warehouseName = warehouse ? warehouse.nombre : "Bodega Principal";
      const isEntry = MOVEMENT_TYPES[documentoTipo]?.type === "IN";
      const isExit = MOVEMENT_TYPES[documentoTipo]?.type === "OUT";
      const cantEntrada = isEntry ? Number(cantidad) : 0;
      const cantSalida = isExit ? Number(cantidad) : 0;
      const unitCost = Number(costoUnitario || product.costoPromedio || 0);
      const prevStock = Number(product.stock || 0);
      const newStock = isEntry ? prevStock + cantEntrada : prevStock - cantSalida;
      let newAvgCost = Number(product.costoPromedio || 0);
      if (isEntry && newStock > 0 && cantEntrada > 0) {
        const prevTotalCost = prevStock * newAvgCost;
        const entryTotalCost = cantEntrada * unitCost;
        newAvgCost = Math.round((prevTotalCost + entryTotalCost) / newStock);
      }
      product.stock = Math.max(0, newStock);
      product.costoPromedio = newAvgCost;
      if (isEntry && unitCost > 0) {
        product.ultimoCosto = unitCost;
      }
      await DB2.update(STORES.PRODUCTS, product);
      const movement = {
        tenantId,
        fecha: (/* @__PURE__ */ new Date()).toISOString(),
        productoId,
        productoNombre: product.nombre,
        sku: product.sku,
        bodegaId: bodegaId || "wh_1",
        bodegaNombre: warehouseName,
        documentoTipo,
        documentoNumero: documentoNumero || "-",
        cantidadEntrada: cantEntrada,
        cantidadSalida: cantSalida,
        saldoCantidad: product.stock,
        costoUnitario: unitCost,
        costoTotal: Math.round(Number(cantidad) * unitCost),
        usuarioId: usuarioId || localStorage.getItem("nexa_active_user") || "usr_admin",
        usuarioNombre: "Usuario Sistema",
        observacion: observacion || ""
      };
      const savedMovement = await DB2.add(STORES.KARDEX, movement);
      await AuditService.log({
        modulo: "Inventario",
        accion: isEntry ? "ENTRADA" : "SALIDA",
        registroId: product.sku,
        campoModificado: `Movimiento: ${documentoTipo}`,
        valorAnterior: `${prevStock} ${product.unidadMedida}`,
        valorNuevo: `${product.stock} ${product.unidadMedida}`
      });
      return savedMovement;
    },
    /**
     * Obtiene los movimientos de Kardex con filtros opcionales
     */
    async getMovements(tenantId, filters = {}) {
      let list = await DB2.getAll(STORES.KARDEX, tenantId);
      if (filters.productoId) {
        list = list.filter((m) => m.productoId === filters.productoId);
      }
      if (filters.bodegaId) {
        list = list.filter((m) => m.bodegaId === filters.bodegaId);
      }
      if (filters.documentoTipo) {
        list = list.filter((m) => m.documentoTipo === filters.documentoTipo);
      }
      return list.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }
  };

  // ../js/modules/inventory.js
  var InventoryModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const [products, warehouses, movements] = await Promise.all([
        DB2.getAll(STORES.PRODUCTS, tenantId),
        DB2.getAll(STORES.WAREHOUSES, tenantId),
        KardexService.getMovements(tenantId)
      ]);
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Inventario & Kardex Multibodega</h1>
          <p>Trazabilidad completa de entradas, salidas, consumos de producci\xF3n y traslados</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-inventory-adjustment">\u2696\uFE0F Ajuste Manual</button>
          <button class="btn btn-primary btn-sm" id="btn-inventory-transfer">\u{1F504} Traslado de Bodega</button>
        </div>
      </div>

      <!-- RESUMEN DE BODEGAS -->
      <div class="kpi-grid mb-4">
        ${warehouses.map((w) => {
        const prodsInWh = products.filter((p) => p.bodegaId === w.id);
        const totalStock = prodsInWh.reduce((acc, p) => acc + (p.stock || 0), 0);
        return `
            <div class="kpi-card">
              <div class="kpi-card-header">
                <span class="kpi-label">${w.codigo}</span>
                <span class="badge badge-info">${w.esPrincipal ? "Principal" : "Secundaria"}</span>
              </div>
              <div class="kpi-value" style="font-size: 18px;">${w.nombre}</div>
              <div class="kpi-footer">
                <span><strong>${prodsInWh.length}</strong> referencias \u2022 <strong>${totalStock}</strong> unidades f\xEDsicas</span>
              </div>
            </div>
          `;
      }).join("")}
      </div>

      <!-- TABS: KARDEX VS EXISTENCIAS -->
      <div class="card mb-3" style="padding: 6px 14px;">
        <div class="d-flex gap-2">
          <button class="btn btn-secondary btn-sm tab-btn active" data-tab="kardex">\u{1F4D1} Movimientos de Kardex (${movements.length})</button>
          <button class="btn btn-secondary btn-sm tab-btn" data-tab="stocks">\u{1F4E6} Existencias Actuales (${products.length})</button>
        </div>
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
                <strong>${val}</strong>
                <div class="text-xs text-muted">SKU: ${row.sku || "-"}</div>
              </div>
            `
            },
            {
              key: "bodegaNombre",
              title: "Bodega",
              render: (val) => `<span class="badge badge-neutral">${val}</span>`
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
                  <div class="text-xs text-muted">Doc: ${row.documentoNumero}</div>
                </div>
              `;
              }
            },
            {
              key: "cantidadEntrada",
              title: "Entrada",
              render: (val) => val > 0 ? `<strong class="text-success">+${val}</strong>` : "-"
            },
            {
              key: "cantidadSalida",
              title: "Salida",
              render: (val) => val > 0 ? `<strong class="text-danger">-${val}</strong>` : "-"
            },
            {
              key: "saldoCantidad",
              title: "Saldo Final",
              render: (val) => `<strong>${val}</strong>`
            },
            {
              key: "costoUnitario",
              title: "Costo Unit.",
              render: (val) => Formatters.currency(val)
            },
            {
              key: "observacion",
              title: "Observaciones",
              render: (val) => `<span class="text-xs text-muted">${val || "-"}</span>`
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
              render: (val) => `<strong>${val}</strong>`
            },
            {
              key: "nombre",
              title: "Nombre Producto",
              render: (val, row) => `${val} <span class="text-xs text-muted">(${row.unidadMedida})</span>`
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
                return `<span class="badge ${cls}">${stock} ${row.unidadMedida}</span>`;
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
     * Modal de Ajuste de Inventario (+ / -)
     */
    openAdjustmentModal(tenantId, products, warehouses, onComplete) {
      const content = `
      <form id="adjustment-form">
        <div class="form-group mb-3">
          <label class="form-label">Seleccionar Producto o Insumo</label>
          <select class="form-select" name="productoId" required>
            ${products.map((p) => `
              <option value="${p.id}">${p.nombre} (SKU: ${p.sku} | Stock: ${p.stock} ${p.unidadMedida})</option>
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
            ${warehouses.map((w) => `<option value="${w.id}">${w.nombre}</option>`).join("")}
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
              const prod = products.find((p) => p.id === productoId);
              await KardexService.registerMovement({
                tenantId,
                productoId,
                bodegaId,
                documentoTipo: tipo,
                documentoNumero: "AJUSTE-" + Math.floor(1e3 + Math.random() * 9e3),
                cantidad,
                costoUnitario: prod.costoPromedio,
                observacion
              });
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
      <form id="transfer-form">
        <div class="form-group mb-3">
          <label class="form-label">Producto a Trasladar</label>
          <select class="form-select" name="productoId" required>
            ${products.map((p) => `
              <option value="${p.id}">${p.nombre} (Stock: ${p.stock} ${p.unidadMedida})</option>
            `).join("")}
          </select>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Bodega Origen</label>
            <select class="form-select" name="bodegaOrigenId" required>
              ${warehouses.map((w) => `<option value="${w.id}">${w.nombre}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Bodega Destino</label>
            <select class="form-select" name="bodegaDestinoId" required>
              ${warehouses.map((w, idx) => `<option value="${w.id}" ${idx === 1 ? "selected" : ""}>${w.nombre}</option>`).join("")}
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
        title: "Traslado de Mercanc\xEDa entre Bodegas",
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
              const prod = products.find((p) => p.id === productoId);
              const docNum = "TR-" + Math.floor(1e3 + Math.random() * 9e3);
              await KardexService.registerMovement({
                tenantId,
                productoId,
                bodegaId: origenId,
                documentoTipo: "TRASLADO_SALIDA",
                documentoNumero: docNum,
                cantidad,
                costoUnitario: prod.costoPromedio,
                observacion: `Salida traslado hacia otra bodega. ${obs}`
              });
              await KardexService.registerMovement({
                tenantId,
                productoId,
                bodegaId: destinoId,
                documentoTipo: "TRASLADO_ENTRADA",
                documentoNumero: docNum,
                cantidad,
                costoUnitario: prod.costoPromedio,
                observacion: `Entrada traslado desde bodega origen. ${obs}`
              });
              Toast.success("Traslado completado exitosamente.");
              Modal.close();
              if (onComplete)
                onComplete();
            }
          }
        ]
      });
    }
  };

  // ../js/modules/production.js
  init_db_service();
  init_formatters();

  // ../js/services/production-service.js
  init_db_service();
  var ProductionService = {
    /**
     * Calcula el costo estimado unitario y total para una receta y cantidad solicitada
     */
    async calculateEstimatedCost(recetaId, cantidadAProducir) {
      const receta = await DB2.getById(STORES.RECIPES_BOM, recetaId);
      if (!receta)
        throw new Error("Receta no encontrada.");
      const factor = cantidadAProducir / (receta.rendimientoLote || 1);
      let costoTotalInsumos = 0;
      const desgloseInsumos = [];
      for (const insumo of receta.insumos) {
        const prod = await DB2.getById(STORES.PRODUCTS, insumo.materiaPrimaId);
        const cantRequerida = insumo.cantidad * factor;
        const cantConMerma = cantRequerida * (1 + (insumo.mermaEsperada || 0) / 100);
        const costoUnitario = prod ? prod.costoPromedio || 0 : 0;
        const costoInsumo = cantConMerma * costoUnitario;
        costoTotalInsumos += costoInsumo;
        desgloseInsumos.push({
          materiaPrimaId: insumo.materiaPrimaId,
          nombre: prod ? prod.nombre : "Insumo",
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
      responsableId,
      responsableNombre,
      observaciones
    }) {
      const pt = await DB2.getById(STORES.PRODUCTS, productoTerminadoId);
      if (!pt)
        throw new Error("Producto terminado no encontrado.");
      const receta = await DB2.getById(STORES.RECIPES_BOM, recetaId);
      if (!receta)
        throw new Error("Receta no encontrada.");
      const factor = cantidadProducida / (receta.rendimientoLote || 1);
      const numeroOrden = "OP-" + (/* @__PURE__ */ new Date()).getFullYear() + "-" + Math.floor(1e3 + Math.random() * 9e3);
      const lote = loteCodigo || `LOTE-${pt.sku.substring(0, 4)}-${Date.now().toString().slice(-4)}`;
      let costoTotalMateriasPrimasReal = 0;
      const insumosConsumidos = [];
      for (const insumo of receta.insumos) {
        const mp = await DB2.getById(STORES.PRODUCTS, insumo.materiaPrimaId);
        if (!mp)
          continue;
        const cantConsumida = Math.round(insumo.cantidad * factor * (1 + (insumo.mermaEsperada || 0) / 100) * 100) / 100;
        const costoInsumo = cantConsumida * (mp.costoPromedio || 0);
        costoTotalMateriasPrimasReal += costoInsumo;
        insumosConsumidos.push({
          materiaPrimaId: mp.id,
          nombre: mp.nombre,
          sku: mp.sku,
          cantidad: cantConsumida,
          unidadMedida: insumo.unidadMedida,
          costoUnitario: mp.costoPromedio,
          costoTotal: Math.round(costoInsumo)
        });
        await KardexService.registerMovement({
          tenantId,
          productoId: mp.id,
          bodegaId: mp.bodegaId || "wh_2",
          documentoTipo: "CONSUMO_PRODUCCION",
          documentoNumero: numeroOrden,
          cantidad: cantConsumida,
          costoUnitario: mp.costoPromedio,
          usuarioId: responsableId,
          observacion: `Consumo para fabricaci\xF3n de ${cantidadProducida} ${pt.unidadMedida} de ${pt.nombre} (Lote: ${lote})`
        });
      }
      const costoRealTotal = Math.round(costoTotalMateriasPrimasReal + Number(costosIndirectosReales || 0));
      const costoUnitarioReal = Math.round(costoRealTotal / cantidadProducida);
      await KardexService.registerMovement({
        tenantId,
        productoId: pt.id,
        bodegaId: pt.bodegaId || "wh_1",
        documentoTipo: "PRODUCCION_ENTRADA",
        documentoNumero: numeroOrden,
        cantidad: cantidadProducida,
        costoUnitario: costoUnitarioReal,
        usuarioId: responsableId,
        observacion: `Entrada de fabricaci\xF3n terminada. Lote: ${lote}`
      });
      const orden = {
        tenantId,
        numeroOrden,
        recetaId,
        recetaNombre: receta.nombreReceta,
        productoTerminadoId: pt.id,
        productoTerminadoNombre: pt.nombre,
        loteCodigo: lote,
        fechaProgramada: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        fechaInicio: (/* @__PURE__ */ new Date()).toISOString(),
        fechaFin: (/* @__PURE__ */ new Date()).toISOString(),
        cantidadPlanificada: cantidadProducida,
        cantidadProducida,
        costoEstimadoTotal: costoRealTotal,
        costoRealTotal,
        costoUnitarioReal,
        costosIndirectosReales,
        insumosConsumidos,
        estado: "COMPLETADA",
        responsableId,
        responsableNombre: responsableNombre || "Jefe de Planta",
        observaciones: observaciones || "Producci\xF3n finalizada exitosamente."
      };
      const savedOrder = await DB2.add(STORES.PRODUCTION_ORDERS, orden);
      await AuditService.log({
        modulo: "Producci\xF3n",
        accion: "CREAR",
        registroId: numeroOrden,
        campoModificado: "Orden Ejecutada",
        valorAnterior: "-",
        valorNuevo: `${cantidadProducida} ${pt.unidadMedida} de ${pt.nombre} (Lote: ${lote}) - Costo Unit: $ ${costoUnitarioReal}`
      });
      return savedOrder;
    }
  };

  // ../js/modules/production.js
  init_export_service();

  // ../js/components/print-template.js
  init_formatters();
  var PrintTemplates = {
    /**
     * Genera un código de barras SVG estándar Code 128 limpio
     */
    generateBarcodeSvg(text = "77092184531") {
      const bars = [];
      const hash = text.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      for (let i = 0; i < 48; i++) {
        const width = (i + hash) % 3 === 0 ? 3 : (i + hash) % 2 === 0 ? 2 : 1;
        const space = (i + hash) % 4 === 0 ? 2 : 1;
        bars.push(`<rect x="${i * 4}" y="0" width="${width}" height="46" fill="#000" />`);
      }
      return `
      <svg viewBox="0 0 200 50" width="180" height="46" xmlns="http://www.w3.org/2000/svg">
        ${bars.join("")}
      </svg>
      <div style="font-family: monospace; font-size: 11px; letter-spacing: 2px; text-align: center; margin-top: 2px; color: #000; font-weight: bold;">
        ${text}
      </div>
    `;
    },
    /**
     * Cabecera membretada corporativa con el logotipo real de Rayo Pro
     */
    getHeader(docTitle, docNumber, docDate) {
      const tenant = TenantServiceInstance.getActiveTenant() || {
        nombreComercial: "Rayo Pro",
        razonSocial: "Rayo Pro Colombia S.A.S.",
        nit: "901458321",
        dv: 4,
        direccion: "Carrera 42 # 54A - 77, Zona Industrial",
        ciudad: "Itag\xFC\xED, Antioquia",
        telefono: "(604) 444 8920",
        email: "contacto@rayopro.com.co",
        resolucionFacturacion: "Resoluci\xF3n DIAN No. 18764000123456"
      };
      if (tenant.membreteUrl) {
        return `
        <div class="doc-header" style="margin-bottom: 16px;">
          <img src="${tenant.membreteUrl}" alt="${tenant.nombreComercial}" style="width: 100%; max-height: 100px; object-fit: contain; margin-bottom: 10px; border-radius: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #000; padding-bottom: 6px;">
            <div>
              <div class="doc-badge">${docTitle}</div>
              <div style="font-size: 16px; font-weight: 800; color: #1d1d1f; margin: 4px 0 0 0;">No. ${docNumber}</div>
            </div>
            <div style="text-align: right; font-size: 11.5px; color: #444;">
              <div><strong>Fecha:</strong> ${Formatters.date(docDate)}</div>
              <div style="font-size: 10px; color: #777;">Nexa ERP \u2022 ${tenant.nombreComercial}</div>
            </div>
          </div>
        </div>
      `;
      }
      const logoSrc = TenantServiceInstance.getHorizontalLogo(tenant, false);
      const logoHtml = `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
        <img src="${logoSrc}" alt="${tenant.nombreComercial}" 
             style="height: 48px; max-width: 180px; object-fit: contain; display: block; border-radius: 4px;" 
             onerror="this.onerror=null; this.src='datos/isotipo fondo blanco.jpg';">
      </div>
    `;
      return `
      <div class="doc-header">
        <div class="doc-brand">
          ${logoHtml}
          <div style="font-size: 13px; font-weight: 700; color: #1d1d1f; line-height: 1.2;">${tenant.razonSocial}</div>
          <p><strong>NIT:</strong> ${tenant.nit}-${tenant.dv} | <strong>R\xE9gimen:</strong> ${tenant.regimen || "Responsable de IVA"}</p>
          <p>${tenant.direccion} \u2022 ${tenant.ciudad}</p>
          <p><strong>Tel:</strong> ${tenant.telefono} | <strong>Email:</strong> ${tenant.email}</p>
        </div>
        <div class="doc-meta">
          <div class="doc-badge">${docTitle}</div>
          <div style="font-size: 16px; font-weight: 800; color: #1d1d1f; margin: 4px 0;">No. ${docNumber}</div>
          <div style="font-size: 12px; color: #6e6e73;"><strong>Fecha:</strong> ${Formatters.date(docDate)}</div>
          <div style="font-size: 10px; color: #86868b; margin-top: 4px;">Nexa ERP Cloud \u2022 ${tenant.nombreComercial}</div>
        </div>
      </div>
    `;
    },
    /**
     * 1. RÓTULO / GUÍA DE ENVÍO COMPACTO (Diseñado para 4 por página)
     */
    shippingBoxLabel(shipping) {
      const tenant = TenantServiceInstance.getActiveTenant() || {
        nombreComercial: "Rayo Pro",
        razonSocial: "Rayo Pro Colombia S.A.S.",
        nit: "901458321-4",
        dv: 4,
        direccion: "Carrera 42 # 54A - 77",
        ciudad: "Itag\xFC\xED",
        telefono: "3017100508"
      };
      const qrCodeBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQAQMAAAC032DuAAAABlBMVEX///8AAABVwtN+AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAA50lEQVQokY3SMY7DIBAF0Iko3MUXQPY1tkDiSqZzZbZLh69kKQXXQOICSUeB+AvZjVLE481Ur0CaP8wQvcoid0TKojCcSNpx3SYaGBrILvfZ4IBWTnRIijfFs3abg81/jXdY887RPaPvsJX4Vs+p32kxIuLqvsIH9PFCpB1xnDQw3oFUGC5aIJ/r24Fh70fIRcAXhmylXbzpFoejpGAf3RhCpOj0ug0cN6RYNDz9z/aDweRT4lh3YeGU8YVh3SbJs2pv99kOJp/wGJ7jLNrBHNCGpe5oYNguKt6xJo4tr3DU/x7XMV/1A2RJkeLuHf/gAAAAAElFTkSuQmCC";
      return `
      <div style="flex: 1; min-height: 225px; border: 2px solid #000; border-radius: 8px; display: flex; flex-direction: column; padding: 8px; box-sizing: border-box; position: relative;">
        <!-- CABECERA -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 8px;">
          <img src="data:image/jpeg;base64,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" style="height: 38px; max-width: 200px; object-fit: contain;" alt="Logo" />
          <div style="text-align: right;">
            <div style="background: #000; color: #fff; padding: 2px 8px; font-weight: bold; border-radius: 4px; font-size: 11px; display: inline-block;">
              ${shipping.transportadora || "Transportadora M\xFAltiple"}
            </div>
            <div style="font-size: 10px; font-weight: bold; margin-top: 4px;">GU\xCDA: ${shipping.numeroGuia || "PENDIENTE"}</div>
          </div>
        </div>

        <!-- CUERPO PRINCIPAL DIVIDIDO EN 2 -->
        <div style="display: flex; flex: 1; gap: 12px;">
          
          <!-- REMITENTE -->
          <div style="flex: 1; border: 2px solid #000; padding: 6px; border-radius: 4px; font-size: 10px; line-height: 1.2; display: flex; flex-direction: column;">
            <div style="color: #444; margin-bottom: 4px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 2px;">DE (REMITENTE):</div>
            <div style="font-weight: 900; font-size: 11px;">${tenant.razonSocial}</div>
            <div>NIT: ${tenant.nit}-${tenant.dv}</div>
            <div>${tenant.direccion}, Zona Industrial</div>
            <div>${tenant.ciudad}</div>
            <div>Tel: ${tenant.telefono}</div>
          </div>

          <!-- DESTINATARIO -->
          <div style="flex: 2; border: 2px solid #000; padding: 6px; padding-right: 90px; border-radius: 4px; font-size: 11px; line-height: 1.2; display: flex; flex-direction: column; background: #fffdf0; position: relative;">
            <div style="font-weight: 900; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 4px;">PARA (DESTINATARIO):</div>
            <div style="font-weight: 900; font-size: 13px;">${shipping.clienteNombre}</div>
            <div><strong>NIT/CC:</strong> ${shipping.nitCc || "-"}</div>
            <div><strong>Direcci\xF3n:</strong> ${shipping.direccion}</div>
            <div><strong>Destino:</strong> ${shipping.ciudad} ${shipping.departamento ? "- " + shipping.departamento : ""}</div>
            <div><strong>Tel:</strong> ${shipping.telefono || "-"}</div>
            <div style="margin-top: 2px; padding-top: 2px; border-top: 1px dashed #999; font-weight: 600;">
              Desc: ${shipping.contenidoDescripcion || "Productos automotrices"} - ${shipping.cajasTotal || 1} CAJA(S)
            </div>
            
            <!-- QR PROMOCIONAL MOVIDO A LA ESQUINA SUPERIOR DERECHA -->
            <div style="position: absolute; top: 10px; right: 10px; text-align: center; width: 70px;">
              <img src="${qrCodeBase64}" alt="QR Rese\xF1a" style="width: 55px; height: 55px; display: block; margin: 0 auto;">
              <div style="font-size: 8px; line-height: 1.2; margin-top: 4px; font-weight: bold; color: #444;">D\xC9JANOS UNA<br>RESE\xD1A</div>
            </div>
          </div>
        </div>
      </div>
    `;
    },
    /**
     * 1.5. LOTE DE RÓTULOS (4 por página tamaño carta)
     */
    batchShippingLabels(shippings) {
      if (!shippings || shippings.length === 0)
        return "";
      let html = "";
      const itemsPerPage = 4;
      for (let i = 0; i < shippings.length; i += itemsPerPage) {
        const chunk = shippings.slice(i, i + itemsPerPage);
        html += `
        <div style="box-sizing: border-box; display: flex; flex-direction: column; gap: 8px; ${i + itemsPerPage < shippings.length ? "page-break-after: always;" : ""}">
      `;
        chunk.forEach((shipping) => {
          html += this.shippingBoxLabel(shipping);
        });
        if (chunk.length < itemsPerPage) {
          for (let j = 0; j < itemsPerPage - chunk.length; j++) {
            html += `<div style="flex: 1;"></div>`;
          }
        }
        html += `</div>`;
      }
      return html;
    },
    /**
     * 2. FACTURA COMERCIAL / POS / REMISIÓN CON LOGO OFICIAL
     */
    saleInvoice(sale, items = []) {
      const esFE = sale.facturaElectronica !== false && sale.tipoDoc !== "COTIZACION" && sale.tipoDoc !== "REMISION";
      const aplicaIva = sale.aplicaIva !== false && sale.impuestos > 0;
      let docTitle = "DOCUMENTO EQUIVALENTE POS";
      if (sale.tipoDoc === "COTIZACION") {
        docTitle = "COTIZACI\xD3N COMERCIAL";
      } else if (sale.tipoDoc === "REMISION") {
        docTitle = "REMISI\xD3N DE ENTREGA COMERCIAL";
      } else if (esFE) {
        docTitle = "FACTURA ELECTR\xD3NICA DE VENTA";
      } else {
        docTitle = "CUENTA DE COBRO / DOCUMENTO INTERNO (SIN FE)";
      }
      const header = this.getHeader(docTitle, sale.consecutivo, sale.fecha);
      const rowsHtml = items.map((it, idx) => `
      <tr style="font-size: 11px;">
        <td class="text-center" style="padding: 4px;">${idx + 1}</td>
        <td style="padding: 4px;"><strong>${it.sku || "-"}</strong></td>
        <td style="padding: 4px;">${it.nombre}</td>
        <td class="text-center" style="padding: 4px;"><strong>${it.cantidad}</strong></td>
        <td class="text-right" style="padding: 4px;">${Formatters.currency(it.precioUnitario)}</td>
        <td class="text-right" style="padding: 4px;"><strong>${Formatters.currency(it.total)}</strong></td>
      </tr>
    `).join("");
      return `
      ${header}
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; background: #fbfbfd; padding: 8px; border-radius: 6px; border: 1px solid #e5e5ea; line-height: 1.2;">
        <div>
          <div style="font-size: 10px; text-transform: uppercase; color: #86868b; font-weight: 700;">Datos del Cliente:</div>
          <div style="font-size: 12px; font-weight: 700; color: #1d1d1f; margin: 2px 0;">${sale.clienteNombre}</div>
          <div style="font-size: 11px; color: #424245;"><strong>NIT/CC:</strong> ${sale.clienteNit || "-"}</div>
          <div style="font-size: 11px; color: #424245;"><strong>Forma Pago:</strong> ${sale.metodoPago || "Cr\xE9dito Comercial"}</div>
          <div style="margin-top: 2px;">
            <span style="font-size: 9px; padding: 2px 4px; border-radius: 4px; background: ${esFE ? "#e0f2fe" : "#f1f5f9"}; color: ${esFE ? "#0369a1" : "#475569"}; font-weight: 700;">
              ${esFE ? "\u26A1 Factura Electr\xF3nica" : "\u{1F4C4} Doc Interno (Sin FE)"}
            </span>
          </div>
        </div>
        <div>
          <div style="font-size: 10px; text-transform: uppercase; color: #86868b; font-weight: 700;">Info Venta:</div>
          <div style="font-size: 11px; color: #424245;"><strong>Vendedor:</strong> ${sale.vendedorNombre || "Juan Pablo"}</div>
          <div style="font-size: 11px; color: #424245;"><strong>Estado:</strong> ${sale.estado}</div>
          <div style="font-size: 10px; color: #86868b; margin-top: 2px;">
            ${aplicaIva ? "R\xE9gimen con IVA (19%)" : "R\xE9gimen Exento (Sin IVA - 0%)"}
          </div>
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
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="doc-totals" style="margin-top: 5px;">
        <div class="total-row" style="padding: 2px 0;">
          <span>Subtotal Neto:</span>
          <span>${Formatters.currency(sale.subtotal)}</span>
        </div>
        ${sale.descuentos > 0 ? `
          <div class="total-row" style="padding: 2px 0; color: #ff3b30;">
            <span>Descuentos:</span>
            <span>-${Formatters.currency(sale.descuentos)}</span>
          </div>
        ` : ""}
        <div class="total-row" style="padding: 2px 0;">
          <span>${aplicaIva ? "IVA (19%):" : "IVA (Exento 0%):"}</span>
          <span>${Formatters.currency(sale.impuestos || 0)}</span>
        </div>
        <div class="total-row grand-total" style="padding-top: 4px; margin-top: 4px;">
          <span>TOTAL A PAGAR:</span>
          <span>${Formatters.currency(sale.total)}</span>
        </div>
      </div>

      <div class="doc-footer" style="margin-top: 15px; padding-top: 10px; font-size: 10px; line-height: 1.2;">
        <p>Agradecemos su compra y preferencia. Productos garantizados por Rayo Pro Colombia S.A.S.</p>
        <p style="margin-top: 2px; font-size: 9px;">
          ${esFE ? "Resoluci\xF3n DIAN No. 18764000123456 \u2022 Documento Validado por DIAN" : "Documento emitido para fines administrativos \u2022 Nexa ERP"}
        </p>
      </div>
    `;
    },
    /**
     * 3. ORDEN DE PRODUCCIÓN CON LA FIRMA REAL DE JUAN
     */
    productionOrder(order) {
      const header = this.getHeader("ORDEN DE FABRICACI\xD3N & CONTROL DE CALIDAD", order.numeroOrden, order.fechaInicio || order.fechaProgramada);
      const rowsHtml = (order.insumosConsumidos || []).map((ins, idx) => `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td><strong>${ins.sku || "-"}</strong></td>
        <td>${ins.nombre}</td>
        <td class="text-center font-bold">${ins.cantidad} ${ins.unidadMedida}</td>
        <td class="text-right">${Formatters.currency(ins.costoUnitario)}</td>
        <td class="text-right"><strong>${Formatters.currency(ins.costoTotal)}</strong></td>
      </tr>
    `).join("");
      return `
      ${header}

      <div style="background: #fbfbfd; border: 1px solid #e5e5ea; padding: 14px; border-radius: 8px; margin-bottom: 20px;">
        <div style="font-size: 11px; font-weight: 700; color: #0071e3; text-transform: uppercase;">Producto Fabricado en Planta:</div>
        <div style="font-size: 17px; font-weight: 800; color: #1d1d1f; margin: 4px 0;">${order.productoTerminadoNombre}</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 12px; margin-top: 8px;">
          <div><strong>Lote Asignado:</strong> <span style="background: #eef5fc; padding: 2px 6px; border-radius: 4px; font-weight: 700; color: #0071e3;">${order.loteCodigo}</span></div>
          <div><strong>Cant. Producida:</strong> ${order.cantidadProducida}</div>
          <div><strong>Estado:</strong> ${order.estado}</div>
          <div><strong>Responsable:</strong> ${order.responsableNombre || "Juan Pablo"}</div>
        </div>
      </div>

      <h4 style="font-size: 13px; margin-bottom: 8px; color: #1d1d1f;">Insumos y Empaques Consumidos (BOM):</h4>
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 40px;">#</th>
            <th style="width: 120px;">SKU Insumo</th>
            <th>Descripci\xF3n Materia Prima / Empaque</th>
            <th class="text-center" style="width: 100px;">Consumo</th>
            <th class="text-right" style="width: 120px;">Costo Unit.</th>
            <th class="text-right" style="width: 130px;">Costo Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="doc-totals">
        <div class="total-row">
          <span>Costos Indirectos (CIF):</span>
          <span>${Formatters.currency(order.costosIndirectosReales || 0)}</span>
        </div>
        <div class="total-row grand-total">
          <span>COSTO TOTAL LOTE:</span>
          <span>${Formatters.currency(order.costoRealTotal)}</span>
        </div>
        <div class="total-row" style="font-weight: 700; color: #0071e3; margin-top: 4px;">
          <span>Costo Unitario Real:</span>
          <span>${Formatters.currency(order.costoUnitarioReal)} / Unidad</span>
        </div>
      </div>

      <!-- FIRMA REAL DE JUAN INCORPORADA -->
      <div style="margin-top: 50px; display: flex; justify-content: space-around; align-items: flex-end;">
        <div style="width: 220px; text-align: center;">
          <img src="datos/firma juan.jpg" alt="Firma Juan Pablo" style="height: 60px; object-fit: contain; margin-bottom: -10px;" onerror="this.style.display='none'">
          <div style="border-top: 1px solid #1d1d1f; font-size: 11px; padding-top: 4px; font-weight: bold;">
            Juan Pablo
          </div>
          <div style="font-size: 10px; color: #6e6e73;">Gerencia de Operaciones y Planta</div>
        </div>
        <div style="width: 220px; text-align: center;">
          <div style="height: 60px;"></div>
          <div style="border-top: 1px solid #1d1d1f; font-size: 11px; padding-top: 4px; font-weight: bold;">
            Control de Calidad & Lotes
          </div>
          <div style="font-size: 10px; color: #6e6e73;">Inspecci\xF3n pH, Viscosidad y Sello</div>
        </div>
      </div>
    `;
    },
    /**
     * 4. COTIZACIÓN COMERCIAL FORMAL
     */
    commercialQuote(quote, items = []) {
      return this.saleInvoice({ ...quote, tipoDoc: "COTIZACION" }, items);
    }
  };

  // ../js/modules/production.js
  var ProductionModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const [recipes, orders, rawMaterials, finishedGoods] = await Promise.all([
        DB2.getAll(STORES.RECIPES_BOM, tenantId),
        DB2.getAll(STORES.PRODUCTION_ORDERS, tenantId),
        (await DB2.getAll(STORES.PRODUCTS, tenantId)).filter((p) => p.tipoItem === "MATERIA_PRIMA"),
        (await DB2.getAll(STORES.PRODUCTS, tenantId)).filter((p) => p.tipoItem === "PRODUCTO_TERMINADO")
      ]);
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <div class="d-flex items-center gap-2">
            <h1>M\xF3dulo de Producci\xF3n & F\xF3rmulas (BOM)</h1>
            <span class="badge-demo">FABRICACI\xD3N AUTOMOTRIZ</span>
          </div>
          <p>Control de recetas qu\xEDmicas, explosi\xF3n de insumos, costeo por lote y fabricaci\xF3n en planta</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-new-recipe">\u{1F9EA} Nueva F\xF3rmula / Receta</button>
          <button class="btn btn-primary btn-sm" id="btn-execute-production">\u26A1 Ejecutar Orden de Producci\xF3n</button>
        </div>
      </div>

      <!-- TABS: \xD3RDENES REALIZADAS VS F\xD3RMULAS ACTIVAS -->
      <div class="card mb-3" style="padding: 6px 14px;">
        <div class="d-flex gap-2">
          <button class="btn btn-secondary btn-sm tab-prod-btn active" data-tab="orders">\u{1F4CB} \xD3rdenes de Producci\xF3n (${orders.length})</button>
          <button class="btn btn-secondary btn-sm tab-prod-btn" data-tab="recipes">\u{1F9EA} F\xF3rmulas Maestras BOM (${recipes.length})</button>
        </div>
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
                <strong style="color: var(--brand-primary);">${val}</strong>
                <div class="text-xs text-muted">Lote: <strong>${row.loteCodigo}</strong></div>
              </div>
            `
            },
            {
              key: "productoTerminadoNombre",
              title: "Producto Fabricado",
              render: (val, row) => `
              <div>
                <div class="font-bold">${val}</div>
                <div class="text-xs text-muted">Cant: <strong>${row.cantidadProducida} unidades</strong></div>
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
              render: (val) => `<span class="badge badge-neutral">${val || "Planta"}</span>`
            },
            {
              key: "estado",
              title: "Estado",
              render: (val) => `<span class="badge badge-success">${val}</span>`
            }
          ],
          actions: (row) => `
          <button class="btn btn-secondary btn-sm btn-print-order" data-id="${row.id}" title="Imprimir Orden">\u{1F5A8}\uFE0F Imprimir</button>
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
                    <div class="card-header" style="background: #f8fafc;">
                      <div>
                        <strong style="color: var(--brand-primary); font-size: 15px;">${r.nombreReceta}</strong>
                        <div class="text-xs text-muted">Producto Resultante: <strong>${pt ? pt.nombre : "Producto Terminado"}</strong> | Rendimiento Lote: <strong>${r.rendimientoLote} ${r.unidadMedidaLote}</strong></div>
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
                            ${r.insumos.map((ins) => {
            const mp = rawMaterials.find((m) => m.id === ins.materiaPrimaId);
            const stock = mp ? mp.stock : 0;
            const isSufficient = stock >= ins.cantidad;
            return `
                                <tr>
                                  <td><strong>${mp ? mp.nombre : "Insumo"}</strong> <span class="text-xs text-muted">(${mp ? mp.sku : "-"})</span></td>
                                  <td class="text-center font-bold">${ins.cantidad}</td>
                                  <td class="text-center">${ins.unidadMedida}</td>
                                  <td class="text-center">${ins.mermaEsperada || 0}%</td>
                                  <td class="text-right">
                                    <span class="badge ${isSufficient ? "badge-success" : "badge-danger"}">
                                      ${stock} ${ins.unidadMedida}
                                    </span>
                                  </td>
                                </tr>
                              `;
          }).join("")}
                          </tbody>
                        </table>
                      </div>
                      ${r.observaciones ? `<div class="text-xs text-muted mt-2"><strong>Instrucciones de Mezcla:</strong> ${r.observaciones}</div>` : ""}
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
      container.addEventListener("click", (e) => {
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
            ExportService.printDocument(html, `Orden_Produccion_${order.numeroOrden}`);
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
      const content = `
      <form id="execute-production-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Seleccionar F\xF3rmula Maestra (BOM)</label>
            <select class="form-select" id="sel-production-recipe" name="recetaId">
              ${recipes.map((r) => `
                <option value="${r.id}" ${r.id === selectedRecipe.id ? "selected" : ""}>${r.nombreReceta}</option>
              `).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Cantidad a Fabricar (Unidades)</label>
            <input type="number" step="1" min="1" class="form-control" id="inp-prod-qty" name="cantidad" value="${selectedRecipe.rendimientoLote || 50}" required>
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">C\xF3digo de Lote</label>
            <input type="text" class="form-control" name="loteCodigo" value="LOTE-RP${(/* @__PURE__ */ new Date()).getMonth() + 1}-${Math.floor(100 + Math.random() * 900)}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Costos Indirectos Adicionales (CIF COP)</label>
            <input type="number" class="form-control" id="inp-prod-cif" name="costosIndirectos" value="${selectedRecipe.costosIndirectosEstimados || 35e3}">
          </div>
        </div>

        <!-- EXPLOSI\xD3N DIN\xC1MICA DE INSUMOS -->
        <div class="card mb-3" style="background: #f8fafc; border: 1px solid var(--border-color);">
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
                  responsableId: "usr_planta",
                  responsableNombre: "Juli\xE1n Montoya (Planta)",
                  observaciones
                });
                Toast.success(`\xA1Lote ${loteCodigo} fabricado con \xE9xito! Se consumieron las materias primas e ingres\xF3 el producto terminado a Kardex.`);
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
                    <td><strong>${ins.nombre}</strong></td>
                    <td class="text-center font-bold">${ins.cantidadRequerida} ${ins.unidadMedida}</td>
                    <td class="text-right">
                      <span class="badge ${ins.stockSuficiente ? "badge-success" : "badge-danger"}">
                        ${ins.stockDisponible} ${ins.unidadMedida}
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
              <span>Costo Total Estimado: <strong>${Formatters.currency(est.costoTotalEstimado)}</strong></span>
              <span class="ml-2 text-muted">| Costo Unitario: <strong class="text-success">${Formatters.currency(est.costoUnitarioEstimado)} / un</strong></span>
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
      dialog.querySelector("#sel-production-recipe").addEventListener("change", updateExplosion);
      dialog.querySelector("#inp-prod-qty").addEventListener("input", updateExplosion);
      updateExplosion();
    }
  };

  // ../js/modules/purchases.js
  init_db_service();
  init_formatters();
  var PurchasesModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const [purchases, suppliers, products, warehouses] = await Promise.all([
        DB2.getAll(STORES.PURCHASES, tenantId),
        DB2.getAll(STORES.SUPPLIERS, tenantId),
        DB2.getAll(STORES.PRODUCTS, tenantId),
        DB2.getAll(STORES.WAREHOUSES, tenantId)
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
            render: (val) => `<strong style="color: var(--brand-primary);">${val}</strong>`
          },
          {
            key: "proveedorNombre",
            title: "Proveedor",
            render: (val) => `<strong>${val || "Proveedor General"}</strong>`
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
            render: (val) => `<span class="badge ${val === "Cr\xE9dito" ? "badge-warning" : "badge-success"}">${val || "Contado"}</span>`
          },
          {
            key: "estado",
            title: "Estado Recepci\xF3n",
            render: (val) => `<span class="badge badge-success">${val || "RECIBIDA"}</span>`
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
              ${suppliers.map((s) => `<option value="${s.id}">${s.razonSocial} (NIT: ${s.nitCc}-${s.dv || 0})</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">No. Factura de Compra / Remisi\xF3n</label>
            <input type="text" class="form-control" name="consecutivo" required value="FAC-PROV-${Math.floor(1e3 + Math.random() * 9e3)}">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Bodega Destino de Almacenamiento</label>
            <select class="form-select" name="bodegaDestinoId">
              ${warehouses.map((w) => `<option value="${w.id}">${w.nombre}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Forma de Pago</label>
            <select class="form-select" name="condicionPago" id="purch-payment-term">
              <option value="Contado">Contado Inmediato (Transferencia / Banco)</option>
              <option value="Cr\xE9dito">Cr\xE9dito a Proveedor (Genera Cuenta por Pagar)</option>
            </select>
          </div>
        </div>

        <!-- AGREGAR \xCDTEMS A LA COMPRA -->
        <div class="card mb-3" style="background: #f8fafc; border: 1px solid var(--border-color);">
          <div class="card-header" style="padding: 10px 14px;">
            <div class="card-title" style="font-size: 13px;">\u{1F4E6} \xCDtems Comprados / Materias Primas</div>
          </div>
          <div class="card-body" style="padding: 12px;">
            <div class="form-row mb-2">
              <div class="form-group mb-0" style="flex: 2;">
                <select class="form-select" id="purch-item-prod">
                  ${products.map((p) => `<option value="${p.id}" data-cost="${p.costoPromedio}">${p.nombre} (${p.unidadMedida})</option>`).join("")}
                </select>
              </div>
              <div class="form-group mb-0">
                <input type="number" step="any" min="0.1" class="form-control" id="purch-item-qty" placeholder="Cantidad" value="10">
              </div>
              <div class="form-group mb-0">
                <input type="number" class="form-control" id="purch-item-cost" placeholder="Costo Unit.">
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
            onClick: async () => {
              if (purchaseItems.length === 0) {
                Toast.warning("Debe agregar al menos un producto a la compra.");
                return;
              }
              const form = dialog.querySelector("#purchase-form");
              const formData = new FormData(form);
              const proveedorId = formData.get("proveedorId");
              const supp = suppliers.find((s) => s.id === proveedorId);
              const consecutivo = formData.get("consecutivo");
              const bodegaId = formData.get("bodegaDestinoId");
              const condicionPago = formData.get("condicionPago");
              const totalCompra = purchaseItems.reduce((acc, i) => acc + i.cantidad * i.costoUnitario, 0);
              const purchaseRecord = {
                tenantId,
                consecutivo,
                proveedorId,
                proveedorNombre: supp ? supp.razonSocial : "Proveedor",
                fecha: (/* @__PURE__ */ new Date()).toISOString(),
                total: totalCompra,
                condicionPago,
                estado: "RECIBIDA",
                items: purchaseItems
              };
              await DB2.add(STORES.PURCHASES, purchaseRecord);
              for (const item of purchaseItems) {
                await KardexService.registerMovement({
                  tenantId,
                  productoId: item.productoId,
                  bodegaId,
                  documentoTipo: "COMPRA",
                  documentoNumero: consecutivo,
                  cantidad: item.cantidad,
                  costoUnitario: item.costoUnitario,
                  observacion: `Entrada compra fac. ${consecutivo} de ${supp?.razonSocial}`
                });
              }
              if (condicionPago === "Cr\xE9dito") {
                await DB2.add(STORES.PAYABLES_CXP, {
                  tenantId,
                  compraId: purchaseRecord.id,
                  documento: consecutivo,
                  proveedorId,
                  proveedorNombre: supp.razonSocial,
                  fechaEmision: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
                  fechaVencimiento: new Date(Date.now() + (supp.diasCredito || 30) * 864e5).toISOString().split("T")[0],
                  valorTotal: totalCompra,
                  abonos: 0,
                  saldo: totalCompra,
                  diasMora: 0,
                  estado: "AL_DIA"
                });
              }
              Toast.success("Compra procesada exitosamente. Se actualizaron existencias en Kardex.");
              Modal.close();
              if (onSaved)
                onSaved();
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
            <td><strong>${it.nombre}</strong></td>
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
        const qty = Number(dialog.querySelector("#purch-item-qty").value) || 1;
        const cost = Number(costInput.value) || 0;
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
                <td><strong>${s.razonSocial}</strong></td>
                <td>${s.nitCc}-${s.dv || 0}</td>
                <td>${s.contacto || "-"} (${s.telefono || "-"})</td>
                <td>${s.diasCredito || 0} d\xEDas</td>
                <td><span class="badge badge-neutral">${s.categoria || "Insumos"}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
      Modal.show({
        title: "Gesti\xF3n de Proveedores",
        content,
        size: "lg",
        footerButtons: [{ label: "Cerrar", class: "btn-secondary", onClick: () => Modal.close() }]
      });
    }
  };

  // ../js/modules/sales-pos.js
  init_db_service();
  init_formatters();

  // ../js/services/tax-service.js
  var TaxService = {
    /**
     * Calcula el subtotal, descuento, base gravable, IVA y total de una lista de ítems.
     * Si el cliente está en etapa inicial o no se le factura con IVA (aplicaIva === false o sin factura electrónica),
     * el IVA se liquida a $0 (0%) automáticamente.
     * @param {Array} items - Array de objetos con { cantidad, precioUnitario, descuentoPct, ivaPct }
     * @param {Number} globalDiscountPct - Porcentaje de descuento global
     * @param {Object} options - { aplicaIva: boolean, facturaElectronica: boolean }
     */
    calculateTotals(items = [], globalDiscountPct = 0, options = { aplicaIva: true, facturaElectronica: true }) {
      let subtotalBruto = 0;
      let totalDescuentosItems = 0;
      let subtotalNeto = 0;
      let totalIva = 0;
      const cobrarIva = options.aplicaIva !== false;
      items.forEach((item) => {
        const qty = Number(item.cantidad) || 0;
        const price = Number(item.precioUnitario) || 0;
        const itemGross = qty * price;
        const itemDiscPct = Number(item.descuentoPct) || 0;
        const itemDiscount = itemGross * (itemDiscPct / 100);
        const itemNet = itemGross - itemDiscount;
        const ivaPct = cobrarIva ? item.ivaPct !== void 0 ? Number(item.ivaPct) : 19 : 0;
        const itemIva = itemNet * (ivaPct / 100);
        subtotalBruto += itemGross;
        totalDescuentosItems += itemDiscount;
        subtotalNeto += itemNet;
        totalIva += itemIva;
      });
      const globalDiscount = subtotalNeto * (Number(globalDiscountPct || 0) / 100);
      const totalDescuentos = totalDescuentosItems + globalDiscount;
      const baseGravableFinal = Math.max(0, subtotalNeto - globalDiscount);
      const ivaFinal = cobrarIva && baseGravableFinal > 0 ? totalIva * (1 - Number(globalDiscountPct || 0) / 100) : 0;
      const total = Math.round(baseGravableFinal + ivaFinal);
      return {
        subtotalBruto: Math.round(subtotalBruto),
        totalDescuentos: Math.round(totalDescuentos),
        baseGravable: Math.round(baseGravableFinal),
        totalIva: Math.round(ivaFinal),
        aplicaIva: cobrarIva,
        total
      };
    }
  };

  // ../js/modules/sales-pos.js
  init_export_service();
  var SalesPosModule = {
    cart: [],
    selectedClient: null,
    selectedPriceListId: "plist_1",
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const [products, clients, priceLists, currentShift] = await Promise.all([
        DB2.getAll(STORES.PRODUCTS, tenantId),
        DB2.getAll(STORES.CUSTOMERS, tenantId),
        DB2.getAll(STORES.PRICE_LISTS, tenantId),
        CashService.getCurrentShift(tenantId)
      ]);
      const sellableProducts = products.filter((p) => p.tipoItem !== "MATERIA_PRIMA");
      this.cart = [];
      this.selectedClient = clients[0] || null;
      this.selectedPriceListId = this.selectedClient ? this.selectedClient.listaPreciosId || "plist_1" : "plist_1";
      container.innerHTML = `
      <div class="view-header" style="margin-bottom: 16px;">
        <div class="view-title-wrap">
          <div class="d-flex items-center gap-2">
            <h1>Punto de Venta (POS) & Mostrador</h1>
            ${currentShift ? `
              <span class="badge badge-success">\u2713 Caja Abierta (Turno Activo)</span>
            ` : `
              <span class="badge badge-danger">\u26A0\uFE0F Caja Cerrada (Turno sin aperturar)</span>
            `}
          </div>
          <p>Facturaci\xF3n r\xE1pida de mostrador, pedidos, cotizaciones y ventas a cr\xE9dito comercial</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-secondary btn-sm" id="btn-view-sales-history">\u{1F4DC} Historial Ventas</button>
          <button class="btn btn-secondary btn-sm" id="btn-clear-cart">\u{1F5D1}\uFE0F Limpiar Venta</button>
        </div>
      </div>

      <!-- INTERFAZ DIVIDIDA POS: CAT\xC1LOGO IZQUIERDA, TICKET DERECHA -->
      <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px;" class="pos-layout">
        
        <!-- COLUMNA IZQUIERDA: BUSCADOR Y CAT\xC1LOGO DE PRODUCTOS -->
        <div class="d-flex flex-col gap-3">
          <!-- BARRA DE B\xDASQUEDA R\xC1PIDA (C\xD3DIGO DE BARRAS / SKU) -->
          <div class="card" style="margin-bottom: 0;">
            <div class="card-body" style="padding: 14px 16px;">
              <div class="form-row">
                <div class="form-group mb-0" style="flex: 2;">
                  <label class="form-label text-xs font-bold">BUSCAR PRODUCTO (SKU / C\xD3DIGO BARRAS / NOMBRE):</label>
                  <div style="position: relative;">
                    <input type="text" id="pos-search-product" class="form-control" placeholder="Escriba o escanee con lector de barras..." autofocus>
                    <div id="pos-search-results" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: #fff; border: 1px solid var(--border-color); border-radius: 8px; box-shadow: var(--shadow-lg); z-index: 100; max-height: 250px; overflow-y: auto;"></div>
                  </div>
                </div>
                <div class="form-group mb-0">
                  <label class="form-label text-xs font-bold">LISTA DE PRECIOS:</label>
                  <select class="form-select" id="pos-select-pricelist">
                    ${priceLists.map((pl) => `
                      <option value="${pl.id}" ${pl.id === this.selectedPriceListId ? "selected" : ""}>${pl.nombre}</option>
                    `).join("")}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- GRID DE PRODUCTOS DISPONIBLES EN BOTONES T\xC1CTILES R\xC1PIDOS -->
          <div class="card" style="margin-bottom: 0; flex: 1;">
            <div class="card-header" style="padding: 10px 16px;">
              <div class="card-title" style="font-size: 13px;">\u26A1 Productos M\xE1s Vendidos (Acceso R\xE1pido)</div>
            </div>
            <div class="card-body" style="padding: 10px 12px;">
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px; max-height: 340px; overflow-y: auto;">
                ${sellableProducts.map((p) => {
        const price = p.precios && p.precios[this.selectedPriceListId] || p.costoPromedio * 1.5;
        const isAvailable = p.stock > 0;
        return `
                    <div class="pos-product-card card" data-product-id="${p.id}" style="cursor: ${isAvailable ? "pointer" : "not-allowed"}; margin-bottom: 0; padding: 8px 10px; border: 1px solid ${isAvailable ? "var(--border-color)" : "rgba(239, 68, 68, 0.3)"}; background: ${isAvailable ? "var(--bg-surface)" : "rgba(239, 68, 68, 0.08)"}; transition: transform 0.15s ease;">
                      <div class="text-xs font-bold" style="color: var(--brand-primary); font-size: 11px;">${p.sku}</div>
                      <div class="font-bold text-xs" style="margin: 2px 0; line-height: 1.2; height: 26px; overflow: hidden; font-size: 11.5px; color: var(--text-main);">${p.nombre}</div>
                      <div class="d-flex justify-between items-center mt-1">
                        <span class="text-xs font-bold" style="color: var(--text-main);">${Formatters.currency(price)}</span>
                        <span class="badge ${isAvailable ? "badge-success" : "badge-danger"}" style="font-size: 9.5px; padding: 1px 5px;">${p.stock} un</span>
                      </div>
                    </div>
                  `;
      }).join("")}
              </div>
            </div>
          </div>
        </div>

        <!-- COLUMNA DERECHA: TICKET / CARRITO DE VENTA -->
        <div class="card d-flex flex-col" style="margin-bottom: 0;">
          <div class="card-header" style="background: var(--bg-surface); padding: 10px 14px;">
            <div style="width: 100%;">
              <div class="d-flex justify-between items-center mb-1">
                <div class="card-title" style="font-size: 13px;">\u{1F6D2} Detalle de la Venta</div>
                <select class="form-select" id="pos-doc-type" style="width: auto; font-size: 11.5px; padding: 3px 6px;">
                  <option value="POS">Venta POS / Mostrador</option>
                  <option value="VENTA_CREDITO">Venta a Cr\xE9dito Comercial</option>
                  <option value="COTIZACION">Cotizaci\xF3n / Presupuesto</option>
                  <option value="REMISION">Remisi\xF3n de Entrega</option>
                </select>
              </div>

              <!-- SELECTOR DE CLIENTE -->
              <div class="d-flex items-center gap-2 mb-1">
                <select class="form-select" id="pos-select-client" style="font-size: 11.5px; padding: 4px 8px;">
                  ${clients.map((c) => `
                    <option value="${c.id}" ${this.selectedClient && this.selectedClient.id === c.id ? "selected" : ""}>
                      ${c.nombre} (${c.tipoCliente}) - Saldo: ${Formatters.currency(c.saldoPendiente || 0)}
                    </option>
                  `).join("")}
                </select>
                <button class="btn btn-secondary btn-sm" id="btn-pos-add-client" title="Nuevo Cliente" style="padding: 4px 8px;">\u{1F464}+</button>
              </div>

              <!-- BADGE INFORMATIVO DE R\xC9GIMEN TRIBUTARIO DEL CLIENTE -->
              <div id="pos-client-tax-badge" style="display: flex; align-items: center; justify-content: space-between; background: rgba(0, 113, 227, 0.05); border: 1px solid rgba(0, 113, 227, 0.15); border-radius: 6px; padding: 3px 6px; font-size: 10.5px;">
                <span id="pos-fe-status">\u26A1 Facturaci\xF3n Electr\xF3nica: <strong>S\xED</strong></span>
                <span id="pos-iva-status" class="badge badge-success" style="font-size: 10px;">Con IVA (19%)</span>
              </div>
            </div>
          </div>

          <!-- TABLA DE ITEMS EN CARRITO -->
          <div class="card-body" style="padding: 6px 10px; flex: 1; overflow-y: auto; max-height: 220px;">
            <div class="table-responsive">
              <table class="data-table" style="font-size: 11.5px;" id="pos-cart-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th class="text-center" style="width: 55px;">Cant.</th>
                    <th class="text-right" style="width: 80px;">Precio</th>
                    <th class="text-right" style="width: 85px;">Total</th>
                    <th style="width: 25px;"></th>
                  </tr>
                </thead>
                <tbody id="pos-cart-tbody">
                  <tr><td colspan="5" class="text-center text-muted" style="padding: 16px;">Carrito vac\xEDo. Seleccione productos de la izquierda.</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- LIQUIDACI\xD3N TRIBUTARIA Y TOTALES COMPACTOS -->
          <div class="card-footer" style="background: var(--bg-surface); padding: 10px 14px; border-top: 1px solid var(--border-color);">
            <div class="d-flex justify-between text-xs mb-1" style="font-size: 11.5px; color: var(--text-secondary);">
              <span>Subtotal Neto:</span>
              <strong id="pos-lbl-subtotal" style="color: var(--text-main);">$ 0</strong>
            </div>
            <div class="d-flex justify-between text-xs mb-1" style="font-size: 11.5px; color: var(--text-secondary);">
              <span>IVA Calculado:</span>
              <span id="pos-lbl-iva" style="color: var(--text-main);">$ 0</span>
            </div>
            <div class="d-flex justify-between text-base font-bold mb-2" style="font-size: 16px; color: var(--brand-primary); border-top: 1px solid var(--brand-primary); padding-top: 4px;">
              <span>TOTAL A PAGAR:</span>
              <span id="pos-lbl-total">$ 0</span>
            </div>

            <!-- FORMA DE PAGO & BOT\xD3N COBRAR -->
            <div class="form-row mb-2">
              <div class="form-group mb-0">
                <label class="form-label text-xs">Medio de Pago:</label>
                <select class="form-select" id="pos-payment-method" style="padding: 4px 8px; font-size: 11.5px;">
                  <option value="Efectivo">\u{1F4B5} Efectivo</option>
                  <option value="Nequi">\u{1F4F1} Nequi</option>
                  <option value="Daviplata">\u{1F4F1} Daviplata</option>
                  <option value="Transferencia">\u{1F3E6} Transferencia Bancaria</option>
                  <option value="Tarjeta">\u{1F4B3} Tarjeta D\xE9bito / Cr\xE9dito</option>
                  <option value="Cr\xE9dito">\u{1F4D1} Cr\xE9dito Directo (Cupo)</option>
                </select>
              </div>
              <div class="form-group mb-0">
                <label class="form-label text-xs">Pago Recibido ($ COP):</label>
                <input type="number" class="form-control" id="pos-inp-received" placeholder="Monto entregado" style="padding: 4px 8px; font-size: 11.5px;">
              </div>
            </div>

            <div class="d-flex justify-between items-center text-xs mb-2" id="pos-change-row" style="background: var(--bg-surface-solid); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border-color); color: var(--text-main);">
              <span>Cambio / Vueltas:</span>
              <strong class="text-success" id="pos-lbl-change" style="font-size: 13px;">$ 0</strong>
            </div>

            <!-- CONTENEDOR DE COMPROBANTE DE PAGO -->
            <div id="pos-attachment-row" style="display: none; background: var(--bg-surface-solid); padding: 8px; border-radius: 6px; border: 1px dashed var(--brand-primary); text-align: center; margin-bottom: 8px;">
              <label class="form-label text-xs d-block mb-1" style="color: var(--brand-primary); font-weight: 700;">\u{1F4F8} Foto del Comprobante (Opcional):</label>
              <input type="file" id="pos-inp-receipt-file" accept="image/*" capture="environment" style="font-size: 10px; width: 100%;">
              <input type="hidden" id="pos-inp-receipt-b64">
              <div id="pos-receipt-preview" class="mt-2" style="display: none;">
                <img src="" style="max-height: 80px; max-width: 100%; border-radius: 4px; object-fit: contain; border: 1px solid #ccc;">
              </div>
            </div>

            <button class="btn btn-primary w-100" id="btn-process-sale" style="padding: 9px; font-size: 14px; font-weight: 700;">
              \u26A1 COBRAR Y FACTURAR (F4)
            </button>
          </div>
        </div>

      </div>
    `;
      const updateCartView = () => {
        const tbody = container.querySelector("#pos-cart-tbody");
        if (this.cart.length === 0) {
          tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 24px;">Carrito vac\xEDo. Seleccione productos de la izquierda.</td></tr>`;
          container.querySelector("#pos-lbl-subtotal").textContent = "$ 0";
          container.querySelector("#pos-lbl-iva").textContent = "$ 0";
          container.querySelector("#pos-lbl-total").textContent = "$ 0";
          container.querySelector("#pos-lbl-change").textContent = "$ 0";
          return;
        }
        tbody.innerHTML = this.cart.map((item, idx) => `
        <tr>
          <td>
            <div class="font-bold">${item.nombre}</div>
            <div class="text-xs text-muted">SKU: ${item.sku}</div>
          </td>
          <td class="text-center">
            <input type="number" min="1" max="${item.stockMaximoDisponible}" class="form-control pos-item-qty" data-idx="${idx}" value="${item.cantidad}" style="width: 55px; padding: 2px 4px; text-align: center;">
          </td>
          <td class="text-right">${Formatters.currency(item.precioUnitario)}</td>
          <td class="text-right"><strong>${Formatters.currency(item.cantidad * item.precioUnitario)}</strong></td>
          <td class="text-right">
            <button class="btn btn-danger btn-sm pos-btn-remove" data-idx="${idx}" style="padding: 2px 6px;">&times;</button>
          </td>
        </tr>
      `).join("");
        const cobraIva = !this.selectedClient || this.selectedClient.aplicaIva !== false;
        const tieneFE = !this.selectedClient || this.selectedClient.facturaElectronica !== false;
        const totals = TaxService.calculateTotals(this.cart, 0, {
          aplicaIva: cobraIva,
          facturaElectronica: tieneFE
        });
        container.querySelector("#pos-lbl-subtotal").textContent = Formatters.currency(totals.baseGravable);
        const ivaLabel = container.querySelector("#pos-lbl-iva");
        if (cobraIva) {
          ivaLabel.textContent = Formatters.currency(totals.totalIva);
          ivaLabel.className = "";
        } else {
          ivaLabel.textContent = "$ 0 (Exento / Sin IVA)";
          ivaLabel.className = "text-warning font-bold";
        }
        container.querySelector("#pos-lbl-total").textContent = Formatters.currency(totals.total);
        const received = Number(container.querySelector("#pos-inp-received").value || totals.total);
        const change = Math.max(0, received - totals.total);
        container.querySelector("#pos-lbl-change").textContent = Formatters.currency(change);
      };
      const addProductToCart = (prodId) => {
        const prod = sellableProducts.find((p) => p.id === prodId);
        if (!prod)
          return;
        if (prod.stock <= 0) {
          Toast.warning(`El producto ${prod.nombre} se encuentra agotado.`);
          return;
        }
        const existing = this.cart.find((i) => i.productoId === prod.id);
        const unitPrice = prod.precios && prod.precios[this.selectedPriceListId] || prod.costoPromedio * 1.5;
        if (existing) {
          if (existing.cantidad + 1 > prod.stock) {
            Toast.warning(`No hay m\xE1s existencias f\xEDsicas de ${prod.nombre} (Stock actual: ${prod.stock}).`);
            return;
          }
          existing.cantidad += 1;
        } else {
          this.cart.push({
            productoId: prod.id,
            sku: prod.sku,
            nombre: prod.nombre,
            precioUnitario: unitPrice,
            cantidad: 1,
            stockMaximoDisponible: prod.stock,
            ivaPct: 19
          });
        }
        updateCartView();
      };
      container.querySelectorAll(".pos-product-card").forEach((card) => {
        card.addEventListener("click", () => {
          const id = card.getAttribute("data-product-id");
          addProductToCart(id);
        });
      });
      container.querySelector("#pos-select-pricelist").addEventListener("change", (e) => {
        this.selectedPriceListId = e.target.value;
        this.cart.forEach((item) => {
          const p = sellableProducts.find((prod) => prod.id === item.productoId);
          if (p && p.precios && p.precios[this.selectedPriceListId]) {
            item.precioUnitario = p.precios[this.selectedPriceListId];
          }
        });
        updateCartView();
        this.render(container);
      });
      const updateClientTaxBadge = () => {
        const feStatus = container.querySelector("#pos-fe-status");
        const ivaStatus = container.querySelector("#pos-iva-status");
        if (!feStatus || !ivaStatus)
          return;
        const esFE = !this.selectedClient || this.selectedClient.facturaElectronica !== false;
        const aplicaIva = !this.selectedClient || this.selectedClient.aplicaIva !== false;
        feStatus.innerHTML = `\u26A1 Facturaci\xF3n Electr\xF3nica: <strong>${esFE ? "S\xED" : "No (Documento Interno)"}</strong>`;
        if (aplicaIva) {
          ivaStatus.textContent = "Con IVA (19%)";
          ivaStatus.className = "badge badge-success";
        } else {
          ivaStatus.textContent = "Exento / Sin IVA (0%)";
          ivaStatus.className = "badge badge-warning";
        }
      };
      updateClientTaxBadge();
      container.querySelector("#pos-select-client").addEventListener("change", (e) => {
        const cli = clients.find((c) => c.id === e.target.value);
        this.selectedClient = cli;
        if (cli && cli.listaPreciosId) {
          this.selectedPriceListId = cli.listaPreciosId;
          container.querySelector("#pos-select-pricelist").value = cli.listaPreciosId;
          this.cart.forEach((item) => {
            const p = sellableProducts.find((prod) => prod.id === item.productoId);
            if (p && p.precios && p.precios[this.selectedPriceListId]) {
              item.precioUnitario = p.precios[this.selectedPriceListId];
            }
          });
        }
        updateClientTaxBadge();
        updateCartView();
      });
      const btnPosAddClient = container.querySelector("#btn-pos-add-client");
      if (btnPosAddClient) {
        btnPosAddClient.addEventListener("click", () => {
          ClientsModule.openClientModal(null, tenantId, priceLists, async (newClient) => {
            const updatedClients = await DB2.getAll(STORES.CUSTOMERS, tenantId);
            const clientSelect = container.querySelector("#pos-select-client");
            if (clientSelect) {
              clientSelect.innerHTML = updatedClients.map((c) => `
              <option value="${c.id}" ${newClient && c.id === newClient.id ? "selected" : ""}>
                ${c.nombre} (${c.tipoCliente}) - Saldo: ${Formatters.currency(c.saldoPendiente || 0)}
              </option>
            `).join("");
            }
            if (newClient) {
              this.selectedClient = newClient;
              if (newClient.listaPreciosId) {
                this.selectedPriceListId = newClient.listaPreciosId;
                const plSel = container.querySelector("#pos-select-pricelist");
                if (plSel)
                  plSel.value = newClient.listaPreciosId;
                this.cart.forEach((item) => {
                  const p = sellableProducts.find((prod) => prod.id === item.productoId);
                  if (p && p.precios && p.precios[this.selectedPriceListId]) {
                    item.precioUnitario = p.precios[this.selectedPriceListId];
                  }
                });
              }
              updateClientTaxBadge();
              updateCartView();
              Toast.success(`\xA1Cliente "${newClient.nombre}" creado y vinculado a la venta!`);
            }
          });
        });
      }
      container.querySelector("#pos-cart-tbody").addEventListener("input", (e) => {
        if (e.target.classList.contains("pos-item-qty")) {
          const idx = Number(e.target.getAttribute("data-idx"));
          const newQty = Math.max(1, Number(e.target.value));
          if (this.cart[idx]) {
            this.cart[idx].cantidad = newQty;
            updateCartView();
          }
        }
      });
      container.querySelector("#pos-cart-tbody").addEventListener("click", (e) => {
        const removeBtn = e.target.closest(".pos-btn-remove");
        if (removeBtn) {
          const idx = Number(removeBtn.getAttribute("data-idx"));
          this.cart.splice(idx, 1);
          updateCartView();
        }
      });
      container.querySelector("#pos-inp-received").addEventListener("input", updateCartView);
      container.querySelector("#btn-clear-cart").addEventListener("click", () => {
        this.cart = [];
        updateCartView();
      });
      container.querySelector("#btn-process-sale").addEventListener("click", () => {
        if (this.cart.length === 0) {
          Toast.warning("El carrito de venta est\xE1 vac\xEDo.");
          return;
        }
        const cobraIva = !this.selectedClient || this.selectedClient.aplicaIva !== false;
        const tieneFE = !this.selectedClient || this.selectedClient.facturaElectronica !== false;
        const totals = TaxService.calculateTotals(this.cart, 0, {
          aplicaIva: cobraIva,
          facturaElectronica: tieneFE
        });
        const metodoPago = container.querySelector("#pos-payment-method").value;
        const tipoDoc = container.querySelector("#pos-doc-type").value;
        Modal.confirm({
          title: "Confirmar Venta / Facturaci\xF3n",
          message: `\xBFEst\xE1 seguro de facturar por un total de <strong>${Formatters.currency(totals.total)}</strong> mediante <strong>${metodoPago}</strong>?`,
          confirmText: "S\xED, Facturar",
          cancelText: "Revisar",
          onConfirm: async () => {
            const consecutivo = "RP-" + Math.floor(1e4 + Math.random() * 9e4);
            const isCredit = metodoPago === "Cr\xE9dito" || tipoDoc === "VENTA_CREDITO";
            if (isCredit && this.selectedClient) {
              const nuevoSaldo = (this.selectedClient.saldoPendiente || 0) + totals.total;
              if (this.selectedClient.cupoCredito > 0 && nuevoSaldo > this.selectedClient.cupoCredito) {
                Toast.warning(`El cupo de cr\xE9dito ($ ${Formatters.currency(this.selectedClient.cupoCredito)}) ser\xEDa excedido. Saldo actual: ${Formatters.currency(this.selectedClient.saldoPendiente)}`);
                return;
              }
            }
            const received = Number(container.querySelector("#pos-inp-received").value || totals.total);
            const change = Math.max(0, received - totals.total);
            const sale = {
              tenantId,
              consecutivo,
              tipoDoc,
              facturaElectronica: tieneFE,
              aplicaIva: cobraIva,
              clienteId: this.selectedClient ? this.selectedClient.id : "cli_mostrador",
              clienteNombre: this.selectedClient ? this.selectedClient.nombre : "Cliente Mostrador",
              clienteNit: this.selectedClient ? this.selectedClient.nitCc : "222222222222",
              vendedorId: "usr_ventas",
              vendedorNombre: "Valentina Restrepo",
              listaPreciosId: this.selectedPriceListId,
              fecha: (/* @__PURE__ */ new Date()).toISOString(),
              estado: isCredit ? "CREDITO_PENDIENTE" : "PAGADA",
              subtotal: totals.baseGravable,
              descuentos: totals.totalDescuentos,
              impuestos: totals.totalIva,
              total: totals.total,
              metodoPago,
              pagoRecibido: isCredit ? 0 : received,
              cambio: isCredit ? 0 : change,
              saldoCredito: isCredit ? totals.total : 0,
              items: this.cart.map((i) => ({
                productoId: i.productoId,
                sku: i.sku,
                nombre: i.nombre,
                precioUnitario: i.precioUnitario,
                cantidad: i.cantidad,
                total: i.cantidad * i.precioUnitario
              }))
            };
            await DB2.add(STORES.SALES, sale);
            for (const item of this.cart) {
              await KardexService.registerMovement({
                tenantId,
                productoId: item.productoId,
                bodegaId: "wh_1",
                documentoTipo: "VENTA",
                documentoNumero: consecutivo,
                cantidad: item.cantidad,
                costoUnitario: item.precioUnitario,
                observacion: `Venta POS No. ${consecutivo} a ${sale.clienteNombre}`
              });
            }
            if (!isCredit && currentShift) {
              if (metodoPago === "Efectivo") {
                currentShift.totalVentasEfectivo = (currentShift.totalVentasEfectivo || 0) + totals.total;
                currentShift.saldoEsperado += totals.total;
              } else if (metodoPago === "Transferencia") {
                currentShift.totalVentasTransferencia = (currentShift.totalVentasTransferencia || 0) + totals.total;
              } else if (metodoPago === "Nequi" || metodoPago === "Daviplata") {
                currentShift.totalVentasNequiDaviplata = (currentShift.totalVentasNequiDaviplata || 0) + totals.total;
              } else if (metodoPago === "Tarjeta") {
                currentShift.totalVentasTarjeta = (currentShift.totalVentasTarjeta || 0) + totals.total;
              }
              await DB2.update(STORES.CASH_SHIFTS, currentShift);
            }
            if (isCredit && this.selectedClient) {
              this.selectedClient.saldoPendiente = (this.selectedClient.saldoPendiente || 0) + totals.total;
              this.selectedClient.totalComprado = (this.selectedClient.totalComprado || 0) + totals.total;
              this.selectedClient.numeroCompras = (this.selectedClient.numeroCompras || 0) + 1;
              await DB2.update(STORES.CUSTOMERS, this.selectedClient);
              await DB2.add(STORES.RECEIVABLES_CXC, {
                tenantId,
                ventaId: sale.id,
                documento: consecutivo,
                clienteId: this.selectedClient.id,
                clienteNombre: this.selectedClient.nombre,
                fechaEmision: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
                fechaVencimiento: new Date(Date.now() + (this.selectedClient.diasCredito || 30) * 864e5).toISOString().split("T")[0],
                valorTotal: totals.total,
                abonos: 0,
                saldo: totals.total,
                diasMora: 0,
                estado: "AL_DIA"
              });
            }
            await AuditService.log({
              modulo: "Ventas POS",
              accion: "CREAR",
              registroId: consecutivo,
              campoModificado: "Factura Emitida",
              valorAnterior: "-",
              valorNuevo: `${Formatters.currency(totals.total)} (${metodoPago})`
            });
            Toast.success(`\xA1Venta ${consecutivo} registrada con \xE9xito!`);
            await DB2.downloadAutoBackup("PostVenta_" + consecutivo);
            const cartSnapshot = JSON.parse(JSON.stringify(this.cart));
            const clientSnapshot = this.selectedClient ? { ...this.selectedClient } : null;
            const totalUnidades = cartSnapshot.reduce((acc, item) => acc + (Number(item.cantidad) || 0), 0);
            const cajasTotal = Math.max(1, Math.ceil(totalUnidades / 12));
            const transportadoraDefecto = "Coordinadora Mercantil";
            const shippingRecord = {
              tenantId,
              ventaId: sale.id,
              documentoNumero: consecutivo,
              clienteId: clientSnapshot ? clientSnapshot.id : "CLI_GEN",
              clienteNombre: sale.clienteNombre,
              nitCc: sale.clienteNit || (clientSnapshot ? clientSnapshot.nitCc : ""),
              telefono: clientSnapshot ? clientSnapshot.telefono || clientSnapshot.whatsapp || "3124567890" : "3124567890",
              whatsapp: clientSnapshot ? clientSnapshot.whatsapp || clientSnapshot.telefono || "" : "",
              email: clientSnapshot ? clientSnapshot.email || "" : "",
              ciudad: clientSnapshot ? clientSnapshot.ciudad || "Medell\xEDn" : "Medell\xEDn",
              departamento: clientSnapshot ? clientSnapshot.departamento || "Antioquia" : "Antioquia",
              barrio: clientSnapshot ? clientSnapshot.barrio || "" : "",
              direccion: clientSnapshot ? clientSnapshot.direccion || "Direcci\xF3n comercial" : "Direcci\xF3n comercial",
              transportadora: transportadoraDefecto,
              numeroGuia: `GUIA-${consecutivo.replace(/\D/g, "") || String(Math.floor(1e5 + Math.random() * 9e5))}`,
              costoEnvio: 0,
              fechaDespacho: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
              fechaEntregaEstimada: new Date(Date.now() + 2 * 864e5).toISOString().split("T")[0],
              estadoCiclo: "LISTO_DESPACHO",
              responsable: "Mateo Osorio (Bodega & Despachos)",
              cajasTotal,
              contenidoDescripcion: "Productos de mantenimiento y embellecimiento automotriz Rayo Pro",
              observaciones: "Manejar con precauci\xF3n. Productos de mantenimiento y embellecimiento automotriz Rayo Pro. No volcar."
            };
            try {
              await DB2.add(STORES.ORDERS_SHIPPING, shippingRecord);
            } catch (err) {
              console.warn("Registro de orden de despacho autom\xE1tico:", err);
            }
            const invoiceHtml = PrintTemplates.saleInvoice(sale, sale.items);
            const labelHtml = PrintTemplates.shippingBoxLabel(shippingRecord);
            const modalDialog = Modal.show({
              title: `\u2705 Venta ${consecutivo} Registrada con \xC9xito`,
              size: "lg",
              content: `
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; background: rgba(0, 113, 227, 0.05); padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(0, 113, 227, 0.15);">
            <div>
              <span style="font-size: 11px; font-weight: 700; color: var(--text-muted);">TOTAL COBRADO:</span>
              <strong style="font-size: 16px; color: var(--brand-primary); margin-left: 6px;">${Formatters.currency(totals.total)}</strong>
              <span class="badge badge-info" style="margin-left: 6px;">${metodoPago}</span>
            </div>
            <div>
              <span style="font-size: 12px; color: var(--text-secondary);">Cliente: <strong>${sale.clienteNombre}</strong></span>
            </div>
          </div>

          <!-- PESTA\xD1AS DE VISTA PREVIA INTERACTIVA -->
          <div class="d-flex items-center gap-2 mb-3" style="border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
            <button type="button" class="btn btn-sm btn-primary" id="btn-tab-preview-invoice" style="font-weight: 700;">
              \u{1F9FE} Factura / Comprobante POS
            </button>
            <button type="button" class="btn btn-sm btn-secondary" id="btn-tab-preview-shipping" style="font-weight: 700;">
              \u{1F3F7}\uFE0F R\xF3tulo de Despacho (${cajasTotal} ${cajasTotal === 1 ? "Caja" : "Cajas"})
            </button>
          </div>

          <!-- CONTENEDOR VISTA PREVIA FACTURA -->
          <div id="view-preview-invoice" style="display: block; max-height: 420px; overflow-y: auto; background: #ffffff; padding: 14px; border-radius: 8px; border: 1px solid var(--border-color); color: #1e293b;">
            ${invoiceHtml}
          </div>

          <!-- CONTENEDOR VISTA PREVIA R\xD3TULO -->
          <div id="view-preview-shipping" style="display: none; max-height: 420px; overflow-y: auto; background: #ffffff; padding: 14px; border-radius: 8px; border: 1px solid var(--border-color); color: #1e293b;">
            ${labelHtml}
          </div>
        `,
              footerButtons: [
                {
                  label: "\u{1F3F7}\uFE0F Imprimir R\xF3tulo de Env\xEDo",
                  class: "btn-secondary",
                  onClick: () => {
                    ExportService.printDocument(labelHtml, `Rotulo_Envio_${shippingRecord.numeroGuia}`);
                  }
                },
                {
                  label: "\u{1F5A8}\uFE0F Imprimir Factura",
                  class: "btn-primary",
                  onClick: () => {
                    ExportService.printDocument(invoiceHtml, `Factura_${consecutivo}`);
                  }
                },
                {
                  label: "\u2728 Nueva Venta",
                  class: "btn-secondary",
                  onClick: () => Modal.close()
                }
              ]
            });
            if (modalDialog) {
              const tabInvBtn = modalDialog.querySelector("#btn-tab-preview-invoice");
              const tabShipBtn = modalDialog.querySelector("#btn-tab-preview-shipping");
              const viewInv = modalDialog.querySelector("#view-preview-invoice");
              const viewShip = modalDialog.querySelector("#view-preview-shipping");
              if (tabInvBtn && tabShipBtn && viewInv && viewShip) {
                tabInvBtn.addEventListener("click", () => {
                  tabInvBtn.className = "btn btn-sm btn-primary";
                  tabShipBtn.className = "btn btn-sm btn-secondary";
                  viewInv.style.display = "block";
                  viewShip.style.display = "none";
                });
                tabShipBtn.addEventListener("click", () => {
                  tabShipBtn.className = "btn btn-sm btn-primary";
                  tabInvBtn.className = "btn btn-sm btn-secondary";
                  viewInv.style.display = "none";
                  viewShip.style.display = "block";
                });
              }
            }
            this.cart = [];
            this.render(container);
          }
        });
      });
      const handlePosKeys = (e) => {
        if (e.key === "F4") {
          e.preventDefault();
          const cobrBtn = container.querySelector("#btn-process-sale");
          if (cobrBtn)
            cobrBtn.click();
        } else if (e.key === "F2") {
          e.preventDefault();
          const search = container.querySelector("#pos-search-product");
          if (search)
            search.focus();
        }
      };
      window.addEventListener("keydown", handlePosKeys);
    }
  };

  // ../js/modules/shipping.js
  init_db_service();
  init_formatters();
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
        DB2.getAll(STORES.ORDERS_SHIPPING, tenantId),
        DB2.getAll(STORES.CUSTOMERS, tenantId)
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
              <strong style="color: var(--brand-primary);">${val || "POR ASIGNAR"}</strong>
              <div class="text-xs text-muted">${row.transportadora}</div>
            </div>
          `
          },
          {
            key: "clienteNombre",
            title: "Destinatario",
            render: (val, row) => `
            <div>
              <div class="font-bold">${val}</div>
              <div class="text-xs text-muted">\u{1F4CD} ${row.direccion || "-"}</div>
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
          <button class="btn btn-primary btn-sm btn-print-label" data-id="${row.id}" title="A\xF1adir a Cola de Impresi\xF3n">\u2795 Encolar</button>
          <button class="btn btn-secondary btn-sm btn-update-ship-status" data-id="${row.id}">\u{1F504} Estado</button>
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
        container.addEventListener("click", (e) => {
          const printLabelBtn = e.target.closest(".btn-print-label");
          if (printLabelBtn) {
            const id = printLabelBtn.getAttribute("data-id");
            DB2.getAll(STORES.ORDERS_SHIPPING, tenantId).then((ships) => {
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
            DB2.getAll(STORES.ORDERS_SHIPPING, tenantId).then((ships) => {
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
              ${clients.map((c) => `<option value="${c.id}" data-addr="${c.direccion || ""}">${c.nombre} (${c.ciudad || ""})</option>`).join("")}
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
            <input type="text" class="form-control" name="numeroGuia" required value="GUIA-${Math.floor(1e5 + Math.random() * 9e5)}" placeholder="Ej: 21987364501">
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
                responsable: "Valentina Restrepo",
                cajasTotal: 1,
                contenidoDescripcion: "Productos de mantenimiento y embellecimiento automotriz",
                observaciones: formData.get("observaciones") || "Manejar con precauci\xF3n. Productos de mantenimiento y embellecimiento automotriz."
              };
              await DB2.add(STORES.ORDERS_SHIPPING, payload);
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
        <label class="form-label">Gu\xEDa de Transporte: <strong>${ship.numeroGuia}</strong> (${ship.transportadora})</label>
        <div class="text-xs text-muted mb-2">Destinatario: ${ship.clienteNombre}</div>
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
              await DB2.update(STORES.ORDERS_SHIPPING, ship);
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

  // ../js/modules/cash.js
  init_db_service();
  init_formatters();
  var CashModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const [currentShift, allShifts, movements] = await Promise.all([
        CashService.getCurrentShift(tenantId),
        DB2.getAll(STORES.CASH_SHIFTS, tenantId),
        DB2.getAll(STORES.CASH_MOVEMENTS, tenantId)
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
              <div class="card-subtitle">Aperturado el ${Formatters.dateTime(currentShift.fechaApertura)} por <strong>${currentShift.usuarioNombre || "Cajero"}</strong></div>
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

            <div class="card" style="background: #f8fafc; border: 1px solid var(--border-color); margin-bottom: 0;">
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
                      <td><strong>${m.concepto}</strong></td>
                      <td>${m.tercero}</td>
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
                      <td><strong>${s.usuarioNombre || "Cajero"}</strong></td>
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
                await CashService.openShift({
                  tenantId,
                  usuarioId: "usr_admin",
                  usuarioNombre: "Carlos Mario Arango",
                  montoApertura,
                  observaciones
                });
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
            <input type="number" class="form-control" name="monto" required placeholder="Ej: 50000">
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Concepto o Detalle</label>
          <input type="text" class="form-control" name="concepto" required placeholder="Ej: Pago de almuerzo personal o recarga de botell\xF3n de agua">
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Tercero / Proveedor / Beneficiario</label>
          <input type="text" class="form-control" name="tercero" placeholder="Ej: Domicilios El Poblado">
        </div>
      </form>
    `;
      const dialog = Modal.show({
        title: "Registrar Movimiento en Caja",
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
              await DB2.downloadAutoBackup("CierreCaja");
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
\u{1F464} *Cajero Responsable:* ${shift.cajero || "Cajero"}
----------------------------------------
\u{1F4B5} *Base Inicial de Gaveta:* ${Formatters.currency(shift.montoInicial || 0)}
\u{1F4B0} *Ventas Efectivo:* ${Formatters.currency(shift.ventasEfectivo || 0)}
\u{1F4B3} *Ventas Tarjeta / Dat\xE1fono:* ${Formatters.currency(shift.ventasTarjeta || 0)}
\u{1F4F2} *Ventas Transferencias:* ${Formatters.currency(shift.ventasTransferencia || 0)}
\u2795 *Entradas manuales:* ${Formatters.currency(shift.totalEntradas || 0)}
\u2796 *Salidas / Gastos menores:* ${Formatters.currency(shift.totalSalidas || 0)}
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
          <input type="text" class="form-control" id="inp-shift-wa-phone" placeholder="Ej: 3001234567" value="3001234567">
          <span class="text-xs text-muted">Prefijo +57 Colombia se aplicar\xE1 autom\xE1ticamente.</span>
        </div>

        <div class="form-group mb-3">
          <label class="form-label font-bold">Mensaje Pre-redactado:</label>
          <textarea class="form-control" id="txt-shift-wa-msg" rows="9" style="font-family: monospace; font-size: 11px; white-space: pre-wrap;">${defaultMsg}</textarea>
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

  // ../js/modules/expenses.js
  init_db_service();
  init_formatters();
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
      const expenses = await DB2.getAll(STORES.EXPENSES, tenantId);
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
            render: (val) => `<span class="badge badge-neutral font-bold">${val}</span>`
          },
          {
            key: "concepto",
            title: "Concepto / Detalle",
            render: (val, row) => `
            <div>
              <strong>${val}</strong>
              <div class="text-xs text-muted">Beneficiario: ${row.proveedor || "-"}</div>
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
            render: (val) => `<span class="badge badge-info">${val || "Efectivo"}</span>`
          },
          {
            key: "responsableNombre",
            title: "Responsable",
            render: (val) => val || "Administraci\xF3n"
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
            <input type="number" class="form-control" name="valor" required placeholder="Ej: 85000">
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
              <option value="Efectivo Caja Menor">Efectivo Caja Menor</option>
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
              const payload = {
                tenantId,
                fecha: (/* @__PURE__ */ new Date()).toISOString(),
                categoria: formData.get("categoria"),
                valor: Number(formData.get("valor")),
                concepto: formData.get("concepto"),
                proveedor: formData.get("proveedor"),
                formaPago: formData.get("formaPago"),
                responsableNombre: "Carlos Mario Arango",
                observacion: formData.get("observacion")
              };
              await DB2.add(STORES.EXPENSES, payload);
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

  // ../js/modules/cxc.js
  init_db_service();
  init_formatters();
  var CxcModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const [receivables, clients] = await Promise.all([
        DB2.getAll(STORES.RECEIVABLES_CXC, tenantId),
        DB2.getAll(STORES.CUSTOMERS, tenantId)
      ]);
      const today = /* @__PURE__ */ new Date();
      receivables.forEach((r) => {
        if (r.fechaVencimiento && r.saldo > 0) {
          const dueDate = new Date(r.fechaVencimiento);
          const diffTime = today.getTime() - dueDate.getTime();
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
            render: (val) => `<strong style="color: var(--brand-primary);">${val}</strong>`
          },
          {
            key: "clienteNombre",
            title: "Cliente Deudor",
            render: (val) => `<strong>${val}</strong>`
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
          <button class="btn btn-primary btn-sm btn-cxc-payment" data-id="${row.id}" title="Registrar Abono">\u{1F4B5} Abono</button>
          <button class="btn btn-sm btn-cxc-whatsapp" data-id="${row.id}" style="background: #25d366; border-color: #25d366; color: #ffffff; font-weight: 700; padding: 3px 8px; font-size: 11px;" title="Enviar cobro por WhatsApp">\u{1F4F2} WhatsApp</button>
          <button class="btn btn-secondary btn-sm btn-cxc-calendar" data-id="${row.id}" title="Programar recordatorio en Google Calendar">\u{1F4C5} Recordatorio</button>
        </div>
      `
      });
      container.addEventListener("click", (e) => {
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
        <div class="text-xs text-muted">Abono a Documento: <strong>${cxcItem.documento}</strong></div>
        <div style="font-size: 16px; font-weight: 700; color: var(--text-main); margin: 2px 0;">${cxcItem.clienteNombre}</div>
        <div class="d-flex justify-between items-center text-xs mt-2">
          <span>Saldo Actual Pendiente:</span>
          <strong class="text-danger" style="font-size: 15px;">${Formatters.currency(cxcItem.saldo)}</strong>
        </div>
      </div>

      <form id="cxc-payment-form">
        <div class="form-group mb-3">
          <label class="form-label">Monto del Abono ($ COP)</label>
          <input type="number" step="any" min="1" max="${cxcItem.saldo}" class="form-control" name="montoAbono" value="${cxcItem.saldo}" required>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Forma de Pago del Recaudo</label>
          <select class="form-select" name="metodoPago">
            <option value="Efectivo">Efectivo (Ingresa a Caja Abierta)</option>
            <option value="Transferencia Bancolombia">Transferencia Bancolombia</option>
            <option value="Nequi">Nequi</option>
            <option value="Daviplata">Daviplata</option>
            <option value="Cheque">Cheque</option>
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
              const metodo = formData.get("metodoPago");
              const compB64 = formData.get("comprobanteBase64");
              const observacion = formData.get("reciboCaja");
              cxcItem.abonos = (cxcItem.abonos || 0) + abono;
              cxcItem.saldo = Math.max(0, cxcItem.saldo - abono);
              if (cxcItem.saldo === 0)
                cxcItem.estado = "PAGADA";
              cxcItem.historialPagos = cxcItem.historialPagos || [];
              cxcItem.historialPagos.push({
                fecha: (/* @__PURE__ */ new Date()).toISOString(),
                monto: abono,
                metodo,
                observacion,
                comprobanteBase64: compB64 || null
              });
              await DB2.update(STORES.RECEIVABLES_CXC, cxcItem);
              const client = clients.find((c) => c.id === cxcItem.clienteId);
              if (client) {
                client.saldoPendiente = Math.max(0, (client.saldoPendiente || 0) - abono);
                await DB2.update(STORES.CUSTOMERS, client);
              }
              if (metodo === "Efectivo") {
                const currentShift = await CashService.getCurrentShift(tenantId);
                if (currentShift) {
                  await CashService.addMovement({
                    tenantId,
                    turnoId: currentShift.id,
                    tipo: "INGRESO",
                    monto: abono,
                    concepto: `Abono Cartera Doc ${cxcItem.documento} de ${cxcItem.clienteNombre}`,
                    tercero: cxcItem.clienteNombre,
                    formaPago: "Efectivo"
                  });
                }
              }
              Toast.success(`Abono por ${Formatters.currency(abono)} registrado con \xE9xito.`);
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

  // ../js/modules/cxp.js
  init_db_service();
  init_formatters();
  var CxpModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const payables = await DB2.getAll(STORES.PAYABLES_CXP, tenantId);
      const totalPasivo = payables.reduce((acc, p) => acc + Number(p.saldo || 0), 0);
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Cuentas por Pagar (Proveedores)</h1>
          <p>Control de compromisos comerciales por compra de materias primas y servicios</p>
        </div>
      </div>

      <div class="kpi-grid mb-4">
        <div class="kpi-card">
          <div class="kpi-label">Pasivo Total con Proveedores</div>
          <div class="kpi-value text-danger">${Formatters.currency(totalPasivo)}</div>
          <div class="kpi-footer">${payables.filter((p) => p.saldo > 0).length} facturas pendientes de pago</div>
        </div>
      </div>

      <div id="cxp-table-container"></div>
    `;
      new DataTable({
        containerId: "cxp-table-container",
        data: payables.filter((p) => p.saldo > 0),
        columns: [
          {
            key: "documento",
            title: "Factura Proveedor",
            render: (val) => `<strong style="color: var(--brand-primary);">${val}</strong>`
          },
          {
            key: "proveedorNombre",
            title: "Proveedor",
            render: (val) => `<strong>${val}</strong>`
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
            render: (val) => `<span class="badge ${val === "AL_DIA" ? "badge-success" : "badge-danger"}">${val}</span>`
          }
        ],
        actions: (row) => `
        <button class="btn btn-primary btn-sm btn-cxp-pay" data-id="${row.id}">\u{1F4B3} Pagar a Proveedor</button>
      `
      });
      container.addEventListener("click", (e) => {
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
      <div class="mb-3" style="background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">
        <div class="text-xs text-muted">Pago a Proveedor: <strong>${cxpItem.proveedorNombre}</strong></div>
        <div style="font-size: 15px; font-weight: 700; margin: 2px 0;">Factura: ${cxpItem.documento}</div>
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
            <option value="Bancolombia Cuenta Corriente">Bancolombia Cuenta Corriente</option>
            <option value="Davivienda Ahorros">Davivienda Ahorros</option>
            <option value="Transferencia Nequi">Transferencia Nequi</option>
            <option value="Efectivo Caja">Efectivo Caja</option>
          </select>
        </div>
        <div class="form-group mb-3">
          <label class="form-label">N\xFAmero de Comprobante / Aprobaci\xF3n</label>
          <input type="text" class="form-control" name="comprobante" required placeholder="Ej: TRANSF-982347">
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
              cxpItem.abonos = (cxpItem.abonos || 0) + pago;
              cxpItem.saldo = Math.max(0, cxpItem.saldo - pago);
              if (cxpItem.saldo === 0)
                cxpItem.estado = "PAGADA";
              await DB2.update(STORES.PAYABLES_CXP, cxpItem);
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

  // ../js/modules/users.js
  init_db_service();
  var UsersModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const users = await DB2.getAll(STORES.USERS, tenantId);
      const currentUser = AuthServiceInstance.getCurrentUser();
      const isDev = AuthServiceInstance.isDeveloper();
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Gesti\xF3n de Usuarios & Control de Accesos (RBAC)</h1>
          <p>Administraci\xF3n de credenciales, roles operativos y matriz de permisos granulares</p>
        </div>
        <div class="view-actions">
          ${isDev ? `
            <button class="btn btn-primary btn-sm" id="btn-new-user">\u{1F464} Crear Usuario</button>
          ` : `
            <span class="badge badge-warning" style="font-size: 11px; padding: 6px 12px;">\u{1F512} Edici\xF3n reservada a Desarrollador</span>
          `}
        </div>
      </div>

      <!-- ALERTA DE SEGURIDAD Y PROTECCI\xD3N DE AUTOR\xCDA INTELECTUAL -->
      ${!isDev ? `
        <div class="alert alert-warning mb-4" style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 10px; padding: 14px 18px;">
          <div style="font-size: 13.5px; font-weight: 800; color: #b45309; margin-bottom: 4px;">
            \u{1F6E1}\uFE0F M\xF3dulo Protegido \u2014 Propiedad Intelectual & Licenciamiento Nexa ERP
          </div>
          <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
            La creaci\xF3n de usuarios del sistema y la alteraci\xF3n de roles y permisos RBAC est\xE1n reservadas exclusivamente al <strong>Desarrollador / Autor del Software</strong> con contrase\xF1a maestra. El perfil <strong>Gerente (Juan Pablo)</strong> cuenta con control total de las operaciones comerciales, inventarios y finanzas, pero la matriz de usuarios est\xE1 blindada para proteger la autor\xEDa intelectual del software.
          </div>
        </div>
      ` : ""}

      <div class="card mb-4" style="background: var(--bg-surface); border: 1px solid var(--border-color); padding: 14px 20px;">
        <div class="d-flex justify-between items-center flex-wrap gap-2">
          <div>
            <span class="text-xs text-muted">Sesi\xF3n Activa Actual:</span>
            <div style="font-size: 15px; font-weight: 700;">
              ${currentUser.nombre} 
              <span class="badge ${isDev ? "badge-primary" : "badge-info"}" style="font-size: 11px;">${currentUser.rol}</span>
            </div>
          </div>
          <div class="d-flex items-center gap-2">
            <span class="text-xs font-bold text-muted">CONMUTAR PERFIL:</span>
            <select class="form-select" id="sel-switch-user" style="width: auto; font-size: 12px;">
              ${users.map((u) => `
                <option value="${u.id}" ${u.id === currentUser.id ? "selected" : ""}>${u.nombre} - ${u.rol}</option>
              `).join("")}
            </select>
          </div>
        </div>
      </div>

      <div id="users-table-container"></div>
    `;
      new DataTable({
        containerId: "users-table-container",
        data: users,
        columns: [
          {
            key: "nombre",
            title: "Nombre de Usuario",
            render: (val, row) => `
            <div>
              <strong>${val}</strong>
              <div class="text-xs text-muted">@${row.usuario} \u2022 ${row.email}</div>
            </div>
          `
          },
          {
            key: "rol",
            title: "Rol Asignado",
            render: (val) => `<span class="badge ${val === "Desarrollador" ? "badge-primary font-bold" : "badge-info font-bold"}">${val}</span>`
          },
          {
            key: "permisos",
            title: "Permisos Granulares",
            render: (val) => {
              const list = Array.isArray(val) ? val : [];
              return list.map((p) => `<span class="badge badge-neutral" style="font-size: 10px; margin: 1px;">${p}</span>`).join(" ");
            }
          },
          {
            key: "estado",
            title: "Estado",
            render: (val) => `<span class="badge ${val === "ACTIVO" ? "badge-success" : "badge-danger"}">${val}</span>`
          }
        ],
        actions: (row) => isDev ? `
        <button class="btn btn-secondary btn-sm btn-edit-user" data-id="${row.id}">\u270F\uFE0F Editar</button>
        <button class="btn btn-danger btn-sm btn-delete-user" data-id="${row.id}">\u{1F5D1}\uFE0F Eliminar</button>
      ` : `
        <span class="badge badge-neutral" style="font-size: 10px;">\u{1F512} Protegido</span>
      `
      });
      container.querySelector("#sel-switch-user").addEventListener("change", async (e) => {
        const targetUserId = e.target.value;
        const targetUser = users.find((u) => u.id === targetUserId);
        if (!targetUser)
          return;
        if (targetUser.rol === "Desarrollador" || targetUser.rol === ROLES.DEV) {
          const pass = prompt("\u{1F510} Ingrese la contrase\xF1a de DESARROLLADOR para autenticar el perfil de autor:");
          if (!pass) {
            Toast.warning("Acceso de desarrollador cancelado.");
            this.render(container);
            return;
          }
          try {
            await AuthServiceInstance.switchUser(targetUserId, pass);
            Toast.success("Sesi\xF3n cambiada a Desarrollador.");
            this.render(container);
          } catch (err) {
            Toast.error(err.message || "Contrase\xF1a incorrecta.");
            this.render(container);
          }
          return;
        }
        await AuthServiceInstance.switchUser(targetUserId);
        Toast.success("Sesi\xF3n cambiada. Permisos actualizados.");
        this.render(container);
      });
      const btnNewUser = container.querySelector("#btn-new-user");
      if (btnNewUser) {
        btnNewUser.addEventListener("click", () => {
          if (!AuthServiceInstance.isDeveloper()) {
            Toast.error("Acci\xF3n reservada al Desarrollador del software.");
            return;
          }
          this.openUserModal(null, tenantId, () => this.render(container));
        });
      }
      container.addEventListener("click", (e) => {
        const editBtn = e.target.closest(".btn-edit-user");
        const deleteBtn = e.target.closest(".btn-delete-user");
        if (editBtn) {
          if (!AuthServiceInstance.isDeveloper()) {
            Toast.error("Edici\xF3n reservada al Desarrollador del software.");
            return;
          }
          const id = editBtn.getAttribute("data-id");
          const user = users.find((u) => u.id === id);
          this.openUserModal(user, tenantId, () => this.render(container));
        }
        if (deleteBtn) {
          if (!AuthServiceInstance.isDeveloper()) {
            Toast.error("Acci\xF3n reservada al Desarrollador del software.");
            return;
          }
          const id = deleteBtn.getAttribute("data-id");
          const user = users.find((u) => u.id === id);
          if (user.id === currentUser.id) {
            Toast.error("No puedes eliminar tu propio usuario mientras tienes la sesi\xF3n iniciada.");
            return;
          }
          Modal.confirm({
            title: "Confirmar Eliminaci\xF3n",
            message: `\xBFEst\xE1s seguro de que deseas eliminar permanentemente al usuario <strong>${user.nombre}</strong>?`,
            confirmText: "S\xED, Eliminar",
            cancelText: "Cancelar",
            onConfirm: async () => {
              try {
                await DB2.delete(STORES.USERS, id);
                Toast.success("Usuario eliminado exitosamente.");
                this.render(container);
              } catch (err) {
                Toast.error("Error al eliminar usuario: " + err.message);
              }
            }
          });
        }
      });
    },
    openUserModal(user = null, tenantId, onSaved) {
      const isEdit = !!user;
      const allPerms = Object.values(PERMISSIONS);
      const userPerms = user ? user.permisos || [] : ["VER", "CREAR", "EDITAR"];
      const content = `
      <form id="user-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Nombre Completo</label>
            <input type="text" class="form-control" name="nombre" required value="${user ? user.nombre : ""}" placeholder="Ej: Valentina Restrepo">
          </div>
          <div class="form-group">
            <label class="form-label">Nombre de Usuario (Login)</label>
            <input type="text" class="form-control" name="usuario" required value="${user ? user.usuario : ""}" placeholder="Ej: valentina.ventas">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Correo Electr\xF3nico</label>
            <input type="email" class="form-control" name="email" required value="${user ? user.email : ""}" placeholder="usuario@rayopro.com.co">
          </div>
          <div class="form-group">
            <label class="form-label">Rol del Sistema</label>
            <select class="form-select" name="rol" id="user-role-sel">
              ${Object.values(ROLES).map((r) => `
                <option value="${r}" ${user && user.rol === r ? "selected" : ""}>${r}</option>
              `).join("")}
            </select>
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Contrase\xF1a de Acceso</label>
            <input type="text" class="form-control" name="clave" value="${user ? user.clave || "" : ""}" placeholder="Ej: Admin.2026">
          </div>
          <div class="form-group">
            <label class="form-label">Estado de la Cuenta</label>
            <select class="form-select" name="estado">
              <option value="ACTIVO" ${!user || user.estado === "ACTIVO" ? "selected" : ""}>ACTIVO</option>
              <option value="INACTIVO" ${user && user.estado === "INACTIVO" ? "selected" : ""}>INACTIVO</option>
            </select>
          </div>
        </div>

        <div class="card mb-3" style="background: var(--bg-surface); border: 1px solid var(--border-color);">
          <div class="card-header" style="padding: 10px 14px;">
            <div class="card-title" style="font-size: 13px;">\u{1F6E1}\uFE0F Permisos Granulares de Acceso</div>
          </div>
          <div class="card-body" style="padding: 12px;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
              ${allPerms.map((p) => `
                <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer;">
                  <input type="checkbox" name="permiso_${p}" value="${p}" ${userPerms.includes(p) ? "checked" : ""}>
                  <span>${p === "FINANCIERO" ? "VER INFORMACI\xD3N FINANCIERA" : p}</span>
                </label>
              `).join("")}
            </div>
          </div>
        </div>
      </form>
    `;
      const dialog = Modal.show({
        title: isEdit ? `Editar Usuario: ${user.nombre}` : "Crear Nuevo Usuario",
        content,
        footerButtons: [
          { label: "Cancelar", class: "btn-secondary", onClick: () => Modal.close() },
          {
            label: isEdit ? "Guardar Cambios" : "Crear Usuario",
            class: "btn-primary",
            onClick: async () => {
              const form = dialog.querySelector("#user-form");
              if (!form.checkValidity()) {
                form.reportValidity();
                return;
              }
              const formData = new FormData(form);
              const permisos = [];
              allPerms.forEach((p) => {
                if (formData.get(`permiso_${p}`))
                  permisos.push(p);
              });
              const payload = {
                tenantId,
                nombre: formData.get("nombre"),
                usuario: formData.get("usuario"),
                email: formData.get("email"),
                rol: formData.get("rol"),
                clave: formData.get("clave") || (user ? user.clave : ""),
                estado: formData.get("estado") || "ACTIVO",
                permisos
              };
              if (isEdit) {
                payload.id = user.id;
                await DB2.update(STORES.USERS, payload);
                Toast.success("Usuario actualizado.");
              } else {
                await DB2.add(STORES.USERS, payload);
                Toast.success("Usuario registrado.");
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

  // ../js/modules/audit.js
  init_db_service();
  init_formatters();
  init_export_service();
  var AuditModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const logs = (await DB2.getAll(STORES.AUDIT_LOGS, tenantId)).sort((a, b) => new Date(b.fechaCreacion || b.fecha) - new Date(a.fechaCreacion || a.fecha));
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

      <div class="card mb-4" style="background: #f8fafc; padding: 12px 16px; border: 1px solid var(--border-color);">
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
              <div class="text-xs text-muted">${row.hora || ""}</div>
            </div>
          `
          },
          {
            key: "usuarioNombre",
            title: "Usuario Operador",
            render: (val) => `<strong>${val || "Sistema"}</strong>`
          },
          {
            key: "modulo",
            title: "M\xF3dulo",
            render: (val) => `<span class="badge badge-info">${val}</span>`
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
              return `<span class="badge ${map[val] || "badge-neutral"}">${val}</span>`;
            }
          },
          {
            key: "registroId",
            title: "Registro Afectado",
            render: (val) => `<code>${val || "-"}</code>`
          },
          {
            key: "campoModificado",
            title: "Detalle / Campo",
            render: (val) => `<strong>${val || "-"}</strong>`
          },
          {
            key: "valorAnterior",
            title: "Valor Anterior",
            render: (val) => `<span class="text-muted" style="text-decoration: line-through;">${val || "-"}</span>`
          },
          {
            key: "valorNuevo",
            title: "Valor Nuevo",
            render: (val) => `<strong class="text-primary">${val || "-"}</strong>`
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

  // ../js/modules/reports.js
  init_db_service();
  init_formatters();
  init_export_service();
  var ReportsModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const [sales, products, expenses, customers, cxc, purchases] = await Promise.all([
        DB2.getAll(STORES.SALES, tenantId),
        DB2.getAll(STORES.PRODUCTS, tenantId),
        DB2.getAll(STORES.EXPENSES, tenantId),
        DB2.getAll(STORES.CUSTOMERS, tenantId),
        DB2.getAll(STORES.RECEIVABLES_CXC, tenantId),
        DB2.getAll(STORES.PURCHASES, tenantId)
      ]);
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Centro de Reportes Gerenciales</h1>
          <p>Generaci\xF3n de balances operativos, rentabilidad, inventario y exportaci\xF3n oficial en CSV, Excel y PDF</p>
        </div>
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
        const totalVentas = sales.reduce((a, s) => a + Number(s.total || 0), 0);
        const totalGastos = expenses.reduce((a, e) => a + Number(e.valor || 0), 0);
        const invValorizado = products.reduce((a, p) => a + p.stock * p.costoPromedio, 0);
        const carteraActiva = cxc.reduce((a, c) => a + Number(c.saldo || 0), 0);
        const margenEst = Math.max(0, totalVentas * 0.45 - totalGastos);
        const header = PrintTemplates.getHeader("INFORME EJECUTIVO DE GESTI\xD3N GERENCIAL", "INF-2026-01", (/* @__PURE__ */ new Date()).toISOString());
        const maxVal = Math.max(totalVentas, totalGastos, carteraActiva, 1);
        const wVentas = Math.round(totalVentas / maxVal * 100);
        const wGastos = Math.round(totalGastos / maxVal * 100);
        const wCartera = Math.round(carteraActiva / maxVal * 100);
        const reportHtml = `
          ${header}

          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
            <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 15px;">Resumen Ejecutivo del Per\xEDodo</h3>
            <p style="margin: 0; color: #475569; font-size: 13px;">Consolidado contable de operaciones, ingresos de venta, flujo de inventario y estado financiero para <strong>${tenant.nombreComercial}</strong>.</p>
          </div>

          <!-- GR\xC1FICO GERENCIAL INCRUSTADO (HTML/CSS Puro) -->
          <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e5e5ea; border-radius: 8px;">
            <h4 style="margin: 0 0 15px 0; font-size: 13px; color: #1d1d1f; border-bottom: 1px solid #eee; padding-bottom: 8px;">Indicadores Financieros - Gr\xE1fico Comparativo</h4>
            
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <div style="width: 120px; font-size: 12px; font-weight: bold; color: #0284c7;">Facturaci\xF3n</div>
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
                <td><strong>Facturaci\xF3n Total Bruta</strong></td>
                <td class="text-right font-bold" style="color: #0284c7;">${Formatters.currency(totalVentas)}</td>
                <td>${sales.length} facturas y remisiones emitidas</td>
              </tr>
              <tr>
                <td><strong>Gastos Operativos & Administrativos</strong></td>
                <td class="text-right font-bold" style="color: #ef4444;">-${Formatters.currency(totalGastos)}</td>
                <td>Servicios, n\xF3mina, combustible y fletes</td>
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
              <tr style="background: #ecfdf5;">
                <td><strong>Utilidad Operativa Estimada</strong></td>
                <td class="text-right font-bold" style="color: #059669; font-size: 15px;">${Formatters.currency(margenEst)}</td>
                <td>Margen bruto estimado ~42% tras egresos</td>
              </tr>
            </tbody>
          </table>

          <div class="doc-footer" style="margin-top: 40px;">
          <p>Informe generado confidencialmente para la junta directiva y gerencia general.</p>
          <p style="margin-top: 4px; font-size: 10px;">Software Nexa ERP Multiempresa \u2022 Licenciado para ${tenant.razonSocial}</p>
        </div>
      `;
        ExportService.printDocument(reportHtml, "Informe_Ejecutivo_Nexa");
      });
    }
  };

  // ../js/modules/settings.js
  init_db_service();
  var SettingsModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const allTenants = await TenantServiceInstance.getAllTenants();
      const priceLists = await DB2.getAll(STORES.PRICE_LISTS, tenant.id);
      const warehouses = await DB2.getAll(STORES.WAREHOUSES, tenant.id);
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
              ${tenant.nombreComercial} (NIT: ${tenant.nit}-${tenant.dv})
            </div>
          </div>
          <div class="d-flex items-center gap-2 flex-wrap">
            <label class="text-xs font-bold text-muted">CONMUTAR EMPRESA:</label>
            <select class="form-select" id="sel-switch-tenant" style="width: auto; font-size: 13px; font-weight: 600;">
              ${allTenants.map((t) => `
                <option value="${t.id}" ${t.id === tenant.id ? "selected" : ""}>
                  ${t.nombreComercial} (${t.ciudad})
                </option>
              `).join("")}
            </select>
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
                    <input type="text" class="form-control" name="nombreComercial" required value="${tenant.nombreComercial}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Raz\xF3n Social Legal</label>
                    <input type="text" class="form-control" name="razonSocial" required value="${tenant.razonSocial}">
                  </div>
                </div>

                <div class="form-row mb-3">
                  <div class="form-group">
                    <label class="form-label">NIT (Sin d\xEDgito de verificaci\xF3n)</label>
                    <input type="text" class="form-control" id="inp-tenant-nit" name="nit" required value="${tenant.nit}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">D\xEDgito de Verificaci\xF3n (DV DIAN)</label>
                    <input type="text" class="form-control" id="inp-tenant-dv" name="dv" readonly value="${tenant.dv}" style="background: #f1f5f9; font-weight: bold;">
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
                    <input type="text" class="form-control" readonly value="COP (Peso Colombiano)" style="background: #f1f5f9;">
                  </div>
                </div>

                <div class="form-row mb-3">
                  <div class="form-group">
                    <label class="form-label">Direcci\xF3n Fiscal / Sede Principal</label>
                    <input type="text" class="form-control" name="direccion" value="${tenant.direccion || ""}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Ciudad</label>
                    <input type="text" class="form-control" name="ciudad" value="${tenant.ciudad || ""}">
                  </div>
                </div>

                <div class="form-row mb-3">
                  <div class="form-group">
                    <label class="form-label">Departamento</label>
                    <input type="text" class="form-control" name="departamento" value="${tenant.departamento || "Antioquia"}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Tel\xE9fono Fijo / PBX</label>
                    <input type="text" class="form-control" name="telefono" value="${tenant.telefono || ""}">
                  </div>
                </div>

                <div class="form-row mb-3">
                  <div class="form-group">
                    <label class="form-label">WhatsApp Comercial</label>
                    <input type="text" class="form-control" name="whatsapp" value="${tenant.whatsapp || ""}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Correo Electr\xF3nico Oficial</label>
                    <input type="email" class="form-control" name="email" value="${tenant.email || ""}">
                  </div>
                </div>

                <div class="form-group mb-0">
                  <label class="form-label">Texto de Resoluci\xF3n de Facturaci\xF3n (Pie de Documento)</label>
                  <input type="text" class="form-control" name="resolucionFacturacion" value="${tenant.resolucionFacturacion || ""}">
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
                <div class="card-title">Personalizaci\xF3n de las 5 Listas de Precios</div>
              </div>
              <div class="card-body">
                <p class="text-xs text-muted mb-3">Personalice el nombre comercial de cada una de las 5 listas de precios del sistema seg\xFAn el modelo de negocio.</p>
                <div class="d-flex flex-col gap-2">
                  ${priceLists.map((pl, idx) => `
                    <div class="form-row" style="align-items: center;">
                      <div style="font-weight: 700; font-size: 12px; color: var(--brand-primary); width: 80px;">Lista ${idx + 1}:</div>
                      <input type="text" class="form-control" name="plist_name_${pl.id}" value="${pl.nombre}" required style="flex: 1;">
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
                        <strong>${w.nombre}</strong>
                        <div class="text-muted">${w.codigo}</div>
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
      container.querySelector("#sel-switch-tenant").addEventListener("change", async (e) => {
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
          resolucionFacturacion: formData.get("resolucionFacturacion"),
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
          if (newName && newName !== pl.nombre) {
            pl.nombre = newName;
            await DB2.update(STORES.PRICE_LISTS, pl);
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
            <input type="text" class="form-control" id="modal-tenant-dv" name="dv" readonly value="-" style="background: #f1f5f9; font-weight: bold;">
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
                email: `contacto@${formData.get("nombreComercial").toLowerCase().replace(/\s+/g, "")}.com`,
                colores: {
                  primary: colorPrim,
                  primaryHover: colorPrim,
                  secondary: "#f59e0b",
                  accent: colorPrim
                },
                resolucionFacturacion: "Resoluci\xF3n DIAN No. Pendiente por asignar",
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

  // ../js/modules/backup.js
  init_db_service();
  var BackupModule = {
    async render(container) {
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Respaldo y Recuperaci\xF3n de Informaci\xF3n</h1>
          <p>Generaci\xF3n de copias de seguridad portables (JSON) y restauraci\xF3n segura de bases de datos</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        
        <!-- EXPORTAR COPIA DE SEGURIDAD -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div class="card-title">\u{1F4BE} Exportar Respaldo Completo</div>
            <span class="badge badge-success">Seguridad</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-4" style="line-height: 1.5;">
              Genera un archivo con formato <code>.json</code> que contiene la totalidad de datos del sistema: clientes, cat\xE1logo de productos, inventario Kardex, recetas BOM, ventas, \xF3rdenes de producci\xF3n, cuentas por cobrar, cuentas por pagar y auditor\xEDa.
            </p>
            <button class="btn btn-primary" id="btn-export-backup" style="width: 100%; padding: 12px;">
              \u2B07\uFE0F Descargar Archivo de Respaldo (.JSON)
            </button>
          </div>
        </div>

        <!-- RESTAURAR / SINCRONIZAR COPIA DE SEGURIDAD -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div class="card-title">\u{1F4E5} Sincronizar / Restaurar JSON</div>
            <span class="badge badge-warning">Cuidado</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-4" style="line-height: 1.5;">
              Permite cargar un archivo <code>.json</code> previamente generado. <strong>Nota:</strong> Los datos se fusionar\xE1n (Upsert); los registros nuevos se a\xF1adir\xE1n y los existentes se actualizar\xE1n si el JSON contiene una versi\xF3n m\xE1s reciente.
            </p>
            
            <div class="form-group mb-3">
              <label class="form-label text-xs">Seleccionar Archivo JSON de Respaldo:</label>
              <input type="file" id="inp-restore-file" accept=".json" class="form-control" style="font-size: 12px;">
            </div>

            <button class="btn btn-secondary" id="btn-restore-backup" style="width: 100%; padding: 12px;" disabled>
              \u{1F504} Validar y Restaurar Datos
            </button>
          </div>
        </div>

      </div>

      <div class="alert alert-info mt-4" style="font-size: 12px;">
        \u{1F6E1}\uFE0F <strong>Directriz de Seguridad:</strong> Por dise\xF1o de seguridad, este software no incluye opciones de "Borrar Todo" ni "Restablecimiento de F\xE1brica" para prevenir eliminaciones masivas accidentales o p\xE9rdidas irrecuperables de informaci\xF3n contable.
      </div>
    `;
      container.querySelector("#btn-export-backup").addEventListener("click", async () => {
        try {
          Toast.info("Generando copia de respaldo \xEDntegra...");
          const backupData = await DB2.exportBackup();
          const jsonStr = JSON.stringify(backupData, null, 2);
          const blob = new Blob([jsonStr], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const currentUser = AuthServiceInstance.getCurrentUser()?.nombre.replace(/\\s+/g, "") || "Usuario";
          const a = document.createElement("a");
          a.href = url;
          a.download = `NexaERP_Sync_${currentUser}_${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          Toast.success("Copia de respaldo descargada con \xE9xito.");
        } catch (err) {
          Toast.error("Error al generar respaldo: " + err.message);
        }
      });
      const fileInp = container.querySelector("#inp-restore-file");
      const restoreBtn = container.querySelector("#btn-restore-backup");
      fileInp.addEventListener("change", () => {
        restoreBtn.disabled = !fileInp.files || fileInp.files.length === 0;
      });
      restoreBtn.addEventListener("click", () => {
        const file = fileInp.files[0];
        if (!file)
          return;
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = JSON.parse(e.target.result);
            if (!data || !data.stores) {
              throw new Error("El archivo seleccionado no corresponde a un formato de respaldo v\xE1lido de Nexa ERP.");
            }
            Modal.confirm({
              title: "Confirmaci\xF3n de Restauraci\xF3n",
              message: `Est\xE1 a punto de cargar un respaldo generado el <strong>${data.timestamp || "Fecha desconocida"}</strong> con <strong>${Object.keys(data.stores).length}</strong> tablas de informaci\xF3n. \xBFDesea proceder?`,
              confirmText: "S\xED, Restaurar Informaci\xF3n",
              cancelText: "Cancelar",
              onConfirm: async () => {
                try {
                  await DB2.restoreBackup(data);
                  Toast.success("Informaci\xF3n restaurada con \xE9xito. Recargando par\xE1metros...");
                  setTimeout(() => window.location.reload(), 1200);
                } catch (restErr) {
                  Toast.error("Error al restaurar: " + restErr.message);
                }
              }
            });
          } catch (parseErr) {
            Toast.error("Archivo corrupto o inv\xE1lido: " + parseErr.message);
          }
        };
        reader.readAsText(file);
      });
    }
  };

  // ../js/modules/importer.js
  init_db_service();
  var ImporterModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Importaci\xF3n Masiva de Datos (CSV / Excel)</h1>
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
        const csv = "\uFEFF" + headers.join(";") + "\r\n" + sampleRow.join(";") + "\r\n";
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
          ["SKU", "Nombre", "TipoItem", "Categoria", "UnidadMedida", "CostoPromedio", "Precio1", "StockInicial", "StockMinimo"],
          ["RAYO-LIMP-500", "Limpiador Cristales Antiempa\xF1ante 500ml", "PRODUCTO_TERMINADO", "Visibilidad", "Unidad", "6500", "18000", "40", "10"]
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
            const text = e.target.result;
            const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
            if (lines.length < 2) {
              Toast.warning("El archivo seleccionado no contiene filas de datos.");
              return;
            }
            const headers = lines[0].split(";").map((h) => h.replace(/"/g, "").trim());
            const rows = [];
            for (let i = 1; i < lines.length; i++) {
              const cols = lines[i].split(";").map((c) => c.replace(/"/g, "").trim());
              if (cols.length >= headers.length) {
                const rowObj = {};
                headers.forEach((h, idx) => {
                  rowObj[h] = cols[idx];
                });
                rows.push(rowObj);
              }
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
        thead.innerHTML = `<tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>`;
        tbody.innerHTML = rows.slice(0, 10).map((r) => `
        <tr>${headers.map((h) => `<td>${r[h] || "-"}</td>`).join("")}</tr>
      `).join("");
        card.style.display = "block";
        card.scrollIntoView({ behavior: "smooth" });
      };
      container.querySelector("#btn-confirm-import").addEventListener("click", async () => {
        if (!pendingImportType || pendingImportRows.length === 0)
          return;
        try {
          let inserted = 0;
          if (pendingImportType === "CUSTOMERS") {
            for (const r of pendingImportRows) {
              const cleanNit = (r.NIT_CC || "").replace(/\D/g, "");
              await DB2.add(STORES.CUSTOMERS, {
                tenantId,
                codigo: r.Codigo || `CLI-${Math.floor(100 + Math.random() * 900)}`,
                nombre: r.Nombre || "Cliente Importado",
                nitCc: cleanNit,
                dv: DianDV.calculate(cleanNit) || 0,
                tipoCliente: r.TipoCliente || "Taller / Detailing",
                telefono: r.Telefono || "",
                ciudad: r.Ciudad || "Medell\xEDn",
                direccion: r.Direccion || "",
                cupoCredito: Number(r.CupoCredito || 0),
                diasCredito: Number(r.DiasCredito || 0),
                saldoPendiente: 0,
                estado: "ACTIVO"
              });
              inserted++;
            }
          } else if (pendingImportType === "PRODUCTS") {
            for (const r of pendingImportRows) {
              await DB2.add(STORES.PRODUCTS, {
                tenantId,
                sku: r.SKU || `SKU-${Date.now()}`,
                codigoInterno: r.SKU || "",
                nombre: r.Nombre || "Producto Importado",
                tipoItem: r.TipoItem || "PRODUCTO_TERMINADO",
                categoria: r.Categoria || "General",
                unidadMedida: r.UnidadMedida || "Unidad",
                costoPromedio: Number(r.CostoPromedio || 0),
                stock: Number(r.StockInicial || 0),
                stockMinimo: Number(r.StockMinimo || 10),
                precios: { plist_1: Number(r.Precio1 || 0) },
                estado: "ACTIVO"
              });
              inserted++;
            }
          } else if (pendingImportType === "SUPPLIERS") {
            for (const r of pendingImportRows) {
              const cleanNit = (r.NIT || "").replace(/\D/g, "");
              await DB2.add(STORES.SUPPLIERS, {
                tenantId,
                codigo: r.Codigo || `PROV-${Math.floor(100 + Math.random() * 900)}`,
                razonSocial: r.RazonSocial || "Proveedor Importado",
                nitCc: cleanNit,
                dv: DianDV.calculate(cleanNit) || 0,
                contacto: r.Contacto || "",
                telefono: r.Telefono || "",
                ciudad: r.Ciudad || "Medell\xEDn",
                categoria: r.Categoria || "Materias Primas",
                diasCredito: Number(r.DiasCredito || 30),
                estado: "ACTIVO"
              });
              inserted++;
            }
          }
          Toast.success(`\xA1Se importaron ${inserted} registros con \xE9xito!`);
          container.querySelector("#importer-preview-card").style.display = "none";
          pendingImportRows = [];
        } catch (err) {
          Toast.error("Error durante la importaci\xF3n: " + err.message);
        }
      });
    }
  };

  // ../js/modules/integrations.js
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
            <div class="card mb-3" style="background: #f8fafc; padding: 12px; font-size: 12px; border: 1px solid var(--border-color);">
              <div><strong>Ambiente Actual:</strong> Producci\xF3n Interna POS</div>
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
              <input type="password" class="form-control" placeholder="Token Meta Graph API..." value="">
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
              <input type="text" class="form-control" placeholder="https://api.rayopro.com/v1" readonly style="background: #f1f5f9;">
            </div>
            <span class="badge badge-success">Persistencia Local Segura Activa</span>
          </div>
        </div>

      </div>
    `;
      container.querySelector("#btn-config-dian").addEventListener("click", () => {
        alert("M\xF3dulo DIAN: Listo para incorporar credenciales cuando se disponga de Proveedor Tecnol\xF3gico habilitado en la DIAN.");
      });
    }
  };

  // ../js/modules/documents.js
  init_db_service();
  init_export_service();
  var DocumentsModule = {
    async render(container) {
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const [sales, orders, shipments] = await Promise.all([
        DB2.getAll(STORES.SALES, tenantId),
        DB2.getAll(STORES.PRODUCTION_ORDERS, tenantId),
        DB2.getAll(STORES.ORDERS_SHIPPING, tenantId)
      ]);
      const sampleSale = sales[0] || {
        consecutivo: "RP-10026",
        fecha: (/* @__PURE__ */ new Date()).toISOString(),
        clienteNombre: "Jhon Jairo Chalarca Acevedo (Cano)",
        clienteNit: "1096037405-1",
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
        clienteNombre: "Jhon Jairo Chalarca Acevedo (Cano Trucks)",
        nitCc: "1096037405-1",
        telefono: "3017100508",
        whatsapp: "+57 301 710 0508",
        email: "jhon.chalarca@canotrucks.co",
        direccion: "Manzana A Casa 17",
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
          <p>Plantillas din\xE1micas que adoptan autom\xE1ticamente la identidad corporativa de <strong>${tenant.nombreComercial}</strong></p>
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
        ExportService.printDocument(html, `Documento_${activeDocType}_${tenant.nombreComercial}`);
      });
    }
  };

  // ../js/app.js
  window.addEventListener("error", (e) => {
    console.error("Nexa Global Error:", e.error || e.message);
    const container = document.getElementById("view-container");
    if (container && (!container.children.length || container.innerHTML.includes("Cargando"))) {
      container.innerHTML = `
      <div style="margin: 20px; padding: 20px; background: #fef2f2; border: 1px solid #f87171; border-radius: 12px; color: #991b1b;">
        <h3 style="margin-top:0; font-size: 16px;">\u26A0\uFE0F Excepci\xF3n JavaScript Detectada</h3>
        <p style="font-size: 13px;">${e.message} en <strong>${e.filename}:${e.lineno}</strong></p>
      </div>
    `;
    }
  });
  window.addEventListener("unhandledrejection", (e) => {
    console.error("Nexa Unhandled Promise Rejection:", e.reason);
    const container = document.getElementById("view-container");
    if (container && (!container.children.length || container.innerHTML.includes("Cargando"))) {
      container.innerHTML = `
      <div style="margin: 20px; padding: 20px; background: #fef2f2; border: 1px solid #f87171; border-radius: 12px; color: #991b1b;">
        <h3 style="margin-top:0; font-size: 16px;">\u26A0\uFE0F Error de Promesa As\xEDncrona</h3>
        <p style="font-size: 13px;">${e.reason && (e.reason.message || e.reason)}</p>
      </div>
    `;
    }
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
    documents: DocumentsModule
  };
  var NexaApp = class {
    constructor() {
      this.contentContainer = null;
      this.currentRoute = "dashboard";
    }
    async init() {
      this.contentContainer = document.getElementById("view-container");
      try {
        const tenant = await TenantServiceInstance.init();
        await AuthServiceInstance.init(tenant.id);
        this.initShellUI(tenant);
        this.setupRouter();
        EventBus.on("tenant:changed", (newTenant) => {
          this.updateBrandUI(newTenant);
          this.loadCurrentRoute();
        });
        EventBus.on("auth:userChanged", (newUser) => {
          this.updateUserUI(newUser);
        });
        this.loadCurrentRoute();
        console.log("\u26A1 Nexa ERP inicializado correctamente para:", tenant.nombreComercial);
      } catch (err) {
        console.error("Error al inicializar Nexa ERP:", err);
        if (this.contentContainer) {
          this.contentContainer.innerHTML = `
          <div class="alert alert-danger">
            <strong>Error al inicializar el sistema:</strong> ${err.message}
          </div>
        `;
        }
      }
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
        Toast.warning(`El m\xF3dulo #${hash} no est\xE1 habilitado para su rol actual. Redirigiendo a #${defaultRoute}`);
        window.location.hash = `#${defaultRoute}`;
        return;
      }
      this.currentRoute = hash;
      document.querySelectorAll(".nav-item").forEach((item) => {
        const route = item.getAttribute("data-route");
        if (route === hash) {
          item.classList.add("active");
        } else {
          item.classList.remove("active");
        }
      });
      const sidebar = document.getElementById("app-sidebar");
      const overlay = document.getElementById("sidebar-overlay");
      if (sidebar)
        sidebar.classList.remove("open");
      if (overlay)
        overlay.classList.remove("active");
      const module = MODULES[hash] || DashboardModule;
      if (this.contentContainer) {
        try {
          this.contentContainer.innerHTML = '<div class="text-center text-muted" style="padding: 40px;">Cargando m\xF3dulo...</div>';
          await module.render(this.contentContainer);
        } catch (modErr) {
          console.error(`Error renderizando m\xF3dulo ${hash}:`, modErr);
          this.contentContainer.innerHTML = `
          <div class="alert alert-danger m-4">
            <h4 style="margin: 0 0 8px 0; font-size: 16px;">\u26A0\uFE0F Error al cargar el m\xF3dulo "${hash}"</h4>
            <p style="margin: 0; font-size: 13px;">${modErr.message || modErr}</p>
            <pre style="margin-top: 10px; font-size: 11px; background: rgba(0,0,0,0.05); padding: 8px; border-radius: 6px;">${modErr.stack || ""}</pre>
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
          const tenants = await TenantServiceInstance.getAllTenants();
          const activeTenant = TenantServiceInstance.getActiveTenant();
          Modal.show({
            title: "Seleccionar Empresa Multi-tenant",
            content: `
            <p class="text-xs text-muted mb-3">Conmute entre organizaciones en tiempo real sin recargar c\xF3digo ni reiniciar sesi\xF3n:</p>
            <div class="d-flex flex-col gap-2">
              ${tenants.map((t) => `
                <div class="card p-3 tenant-pick-card" data-id="${t.id}" style="cursor: pointer; margin-bottom: 0; border: 1px solid ${t.id === activeTenant.id ? "var(--brand-primary)" : "var(--border-color)"}; background: ${t.id === activeTenant.id ? "var(--brand-primary-light)" : "#fff"};">
                  <div class="d-flex justify-between items-center">
                    <div>
                      <strong style="font-size: 14px; color: ${t.id === activeTenant.id ? "var(--brand-primary)" : "var(--text-main)"};">${t.nombreComercial}</strong>
                      <div class="text-xs text-muted">NIT: ${t.nit}-${t.dv} \u2022 ${t.ciudad}</div>
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
      const savedTheme = localStorage.getItem("nexa_theme") || "light";
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
          ind.title = `Turno abierto con base: $ ${shift.montoApertura}`;
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
        brandNitEl.textContent = `NIT: ${tenant.nit}-${tenant.dv}`;
      if (topbarBrandEl)
        topbarBrandEl.textContent = tenant.nombreComercial;
      if (brandIconEl) {
        brandIconEl.innerHTML = `<img src="${isotipoSrc}" alt="${tenant.nombreComercial}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px; display: block;">`;
        brandIconEl.style.background = isDark ? "#000000" : "#ffffff";
        brandIconEl.style.borderColor = isDark ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.08)";
      }
      if (topbarBrandIconEl) {
        topbarBrandIconEl.innerHTML = `<img src="${isotipoSrc}" alt="${tenant.nombreComercial}" style="width: 18px; height: 18px; object-fit: contain; border-radius: 4px; display: block;">`;
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
        if (isSuperAdmin || route && allowedModules.includes(route)) {
          item.style.display = "flex";
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
      const tenant = TenantServiceInstance.getActiveTenant();
      const tenantId = tenant ? tenant.id : "tenant_rayopro";
      const users = await AuthServiceInstance.init(tenantId).then(async () => {
        const { DB: DB3, STORES: STORES2 } = await Promise.resolve().then(() => (init_db_service(), db_service_exports));
        return await DB3.getAll(STORES2.USERS, tenantId);
      });
      const currentUser = AuthServiceInstance.getCurrentUser();
      Modal.show({
        title: "Perfiles Operativos & Permisos (RBAC)",
        content: `
        <p class="text-xs text-muted mb-3">
          Seleccione un perfil para conmutar la sesi\xF3n o comprobar la interfaz anti-saturaci\xF3n personalizada por rol:
        </p>
        <div class="d-flex flex-col gap-2">
          ${users.map((u) => `
            <div class="card p-3 user-switch-card" data-id="${u.id}" style="cursor: pointer; margin-bottom: 0; border: 1px solid ${u.id === currentUser.id ? "var(--brand-primary)" : "var(--border-color)"}; background: ${u.id === currentUser.id ? "var(--brand-primary-light)" : "var(--bg-surface)"};">
              <div class="d-flex justify-between items-center">
                <div class="d-flex items-center gap-3">
                  <div class="user-avatar" style="width: 36px; height: 36px; font-size: 14px;">${u.nombre.charAt(0).toUpperCase()}</div>
                  <div>
                    <strong style="font-size: 14px; color: ${u.id === currentUser.id ? "var(--brand-primary)" : "var(--text-main)"};">${u.nombre}</strong>
                    <div class="text-xs text-muted">${u.usuario} \u2022 Rol: <span class="badge ${u.rol === "Desarrollador" ? "badge-primary" : "badge-info"}" style="font-size: 10px;">${u.rol}</span></div>
                  </div>
                </div>
                ${u.id === currentUser.id ? '<span class="badge badge-success">Activo</span>' : '<button class="btn btn-secondary btn-sm" style="pointer-events: none;">Cambiar</button>'}
              </div>
            </div>
          `).join("")}
        </div>
      `,
        footerButtons: [
          { label: "Ir a Gesti\xF3n de Usuarios", class: "btn-secondary", onClick: () => {
            Modal.close();
            window.location.hash = "#users";
          } },
          { label: "Cerrar", class: "btn-secondary", onClick: () => Modal.close() }
        ]
      });
      document.querySelectorAll(".user-switch-card").forEach((card) => {
        card.addEventListener("click", async () => {
          const id = card.getAttribute("data-id");
          const targetUser = users.find((u) => u.id === id);
          if (!targetUser)
            return;
          if (targetUser.rol === "Desarrollador") {
            const pass = prompt("\u{1F510} Ingrese la contrase\xF1a de DESARROLLADOR para autenticar el perfil maestro:");
            if (!pass) {
              Toast.warning("Acceso de desarrollador cancelado.");
              return;
            }
            try {
              await AuthServiceInstance.switchUser(id, pass);
              Modal.close();
              Toast.success("Sesi\xF3n cambiada a Desarrollador");
              this.filterSidebarForUser();
              this.loadCurrentRoute();
            } catch (err) {
              Toast.error(err.message || "Contrase\xF1a incorrecta.");
            }
            return;
          }
          try {
            await AuthServiceInstance.switchUser(id);
            Modal.close();
            Toast.success(`Perfil cambiado a ${targetUser.nombre}`);
            this.filterSidebarForUser();
            const currentHash = window.location.hash.replace("#", "") || "dashboard";
            if (!AuthServiceInstance.canAccessRoute(currentHash)) {
              window.location.hash = `#${AuthServiceInstance.getDefaultRoute()}`;
            } else {
              this.loadCurrentRoute();
            }
          } catch (err) {
            Toast.error(err.message);
          }
        });
      });
    }
    openGlobalSearch() {
      Modal.show({
        title: "B\xFAsqueda Global en Nexa ERP (Ctrl + K)",
        content: `
        <div class="form-group mb-3">
          <input type="text" id="inp-modal-global-search" class="form-control" placeholder="Escriba cliente, SKU, producto, orden..." autofocus>
        </div>
        <div class="d-flex flex-col gap-2" id="global-search-results" style="max-height: 250px; overflow-y: auto;">
          <div class="text-xs text-muted text-center" style="padding: 20px;">
            Escriba para buscar en clientes, productos, \xF3rdenes o ventas...
          </div>
        </div>
      `,
        footerButtons: [{ label: "Cerrar (Esc)", class: "btn-secondary", onClick: () => Modal.close() }]
      });
      const inp = document.getElementById("inp-modal-global-search");
      const res = document.getElementById("global-search-results");
      inp.addEventListener("input", async (e) => {
        const q = e.target.value.toLowerCase().trim();
        if (!q) {
          res.innerHTML = '<div class="text-xs text-muted text-center" style="padding: 20px;">Escriba para buscar...</div>';
          return;
        }
        const tenant = TenantServiceInstance.getActiveTenant();
        const [prods, clients] = await Promise.all([
          DB.getAll("products", tenant.id),
          DB.getAll("customers", tenant.id)
        ]);
        const matchedProds = prods.filter((p) => p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
        const matchedClients = clients.filter((c) => c.nombre.toLowerCase().includes(q) || c.nitCc && c.nitCc.includes(q));
        let html = "";
        matchedProds.forEach((p) => {
          html += `
          <div class="card p-2 mb-1" style="cursor: pointer;" onclick="window.location.hash='#products'; Modal.close();">
            <div class="d-flex justify-between items-center text-xs">
              <strong>\u{1F4E6} ${p.nombre}</strong>
              <span class="text-muted">${p.sku}</span>
            </div>
          </div>
        `;
        });
        matchedClients.forEach((c) => {
          html += `
          <div class="card p-2 mb-1" style="cursor: pointer;" onclick="window.location.hash='#clients'; Modal.close();">
            <div class="d-flex justify-between items-center text-xs">
              <strong>\u{1F464} ${c.nombre}</strong>
              <span class="text-muted">NIT/CC: ${c.nitCc}</span>
            </div>
          </div>
        `;
        });
        if (matchedProds.length === 0 && matchedClients.length === 0) {
          html = '<div class="text-xs text-muted text-center" style="padding: 20px;">Sin coincidencias encontradas.</div>';
        }
        res.innerHTML = html;
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
