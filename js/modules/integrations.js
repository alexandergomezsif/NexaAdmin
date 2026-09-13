/**
 * Nexa ERP - Módulo 19: Integraciones & Conectividad Externa (Cloud & DIAN Ready)
 * Arquitectura desacoplada para DIAN, WhatsApp, Pasarelas de Pago y Backend Remoto
 * Muestra estados reales y transparentes: "Integración pendiente de configuración"
 */

export const IntegrationsModule = {
  render(container) {
    container.innerHTML = `
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Integraciones & Servicios Externos</h1>
          <p>Ecosistema de conectividad para Facturación Electrónica DIAN, WhatsApp Cloud API, Transportadoras y Pasarelas</p>
        </div>
      </div>

      <div class="alert alert-info mb-4" style="font-size: 13px;">
        ℹ️ <strong>Transparencia de Integración:</strong> Este sistema cuenta con la estructura de datos lista para interoperar mediante API REST y Webhooks. Los módulos que requieran credenciales del operador o habilitación oficial muestran el estado real sin simulaciones ficticias.
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px;">
        
        <!-- 1. FACTURACIÓN ELECTRÓNICA DIAN -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div>
              <div class="card-title">🇨🇴 Facturación Electrónica DIAN</div>
              <div class="card-subtitle">Emisión de XML UBL 2.1, CUFE y QR oficial</div>
            </div>
            <span class="badge badge-warning">Pendiente Configuración</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3" style="line-height: 1.5;">
              Permite transmitir las facturas comerciales a los servidores de la DIAN mediante Proveedor Tecnológico autorizado o Software Propio.
            </p>
            <div class="card mb-3" style="background: #f8fafc; padding: 12px; font-size: 12px; border: 1px solid var(--border-color);">
              <div><strong>Ambiente Actual:</strong> Producción Interna POS</div>
              <div class="mt-1"><strong>Estado Habilitación DIAN:</strong> <span class="text-warning font-bold">Pendiente de Configuración</span></div>
              <div class="mt-1 text-muted text-xs">Requiere: Certificado Digital .pfx y Set de Pruebas DIAN.</div>
            </div>
            <button class="btn btn-secondary btn-sm w-100" id="btn-config-dian">⚙️ Parámetros DIAN / Proveedor Tecnológico</button>
          </div>
        </div>

        <!-- 2. WHATSAPP BUSINESS CLOUD API -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div>
              <div class="card-title">💬 WhatsApp Business API</div>
              <div class="card-subtitle">Envío automático de remisiones, facturas y cobros</div>
            </div>
            <span class="badge badge-neutral">No Conectado</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3" style="line-height: 1.5;">
              Envío de enlaces de pago, PDF de facturas y notificaciones de despacho de transportadora directo al WhatsApp del cliente.
            </p>
            <div class="form-group mb-3">
              <label class="form-label text-xs">WhatsApp Business Token / Meta API:</label>
              <input type="password" class="form-control" placeholder="Token Meta Graph API..." value="">
            </div>
            <button class="btn btn-secondary btn-sm w-100">🔗 Vincular Número WhatsApp</button>
          </div>
        </div>

        <!-- 3. TRANSPORTADORAS Y LOGÍSTICA -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div>
              <div class="card-title">🚚 Transportadoras Nacionales</div>
              <div class="card-subtitle">Generación de guías con Servientrega / Coordinadora</div>
            </div>
            <span class="badge badge-neutral">Manual / Listo API</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3" style="line-height: 1.5;">
              Generación de rótulos con código de barras y cotización de fletes en tiempo real conectando el webservice logístico.
            </p>
            <div class="d-flex flex-col gap-2">
              <div class="d-flex justify-between items-center text-xs">
                <span>Servientrega Webservice:</span>
                <span class="badge badge-warning">Configuración Pendiente</span>
              </div>
              <div class="d-flex justify-between items-center text-xs">
                <span>Coordinadora API:</span>
                <span class="badge badge-warning">Configuración Pendiente</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. PASARELAS DE PAGO (WOMPI / NEQUI / BOLD) -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div>
              <div class="card-title">💳 Pasarelas de Pago Digital</div>
              <div class="card-subtitle">Cobros QR Nequi, PSE y Tarjetas en línea</div>
            </div>
            <span class="badge badge-neutral">No Configurado</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3" style="line-height: 1.5;">
              Generación de links de cobro para clientes a través de Wompi Bancolombia, Bold o PayU Colombia.
            </p>
            <button class="btn btn-secondary btn-sm w-100">⚙️ Configurar Llaves de Integración</button>
          </div>
        </div>

        <!-- 5. BACKEND REMOTO & CLOUD SYNC -->
        <div class="card" style="margin-bottom: 0;">
          <div class="card-header">
            <div>
              <div class="card-title">☁️ Sincronización Backend Cloud</div>
              <div class="card-subtitle">Conexión a base de datos central PostgreSQL / REST</div>
            </div>
            <span class="badge badge-info">Modo Local IndexedDB</span>
          </div>
          <div class="card-body">
            <p class="text-xs text-muted mb-3" style="line-height: 1.5;">
              La capa de servicios (<code>db-service.js</code>) está completamente desacoplada para admitir sincronización bidireccional con backend Node.js, Supabase o Spring Boot.
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

    container.querySelector('#btn-config-dian').addEventListener('click', () => {
      alert('Módulo DIAN: Listo para incorporar credenciales cuando se disponga de Proveedor Tecnológico habilitado en la DIAN.');
    });
  }
};
