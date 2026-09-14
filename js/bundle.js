(()=>{var Je=Object.defineProperty;var le=(e,t)=>()=>(e&&(t=e(e=0)),t);var Ce=(e,t)=>{for(var o in t)Je(e,o,{get:t[o],enumerable:!0})};var Ee={};Ce(Ee,{DB:()=>f,STORES:()=>v});var We,v,ce,f,N=le(()=>{We="NexaERP_DB",v={TENANTS:"tenants",USERS:"users",PRICE_LISTS:"price_lists",WAREHOUSES:"warehouses",PRODUCTS:"products",KARDEX:"kardex",RECIPES_BOM:"recipes_bom",PRODUCTION_ORDERS:"production_orders",CUSTOMERS:"customers",SUPPLIERS:"suppliers",SALES:"sales",PURCHASES:"purchases",ORDERS_SHIPPING:"orders_shipping",CASH_SHIFTS:"cash_shifts",CASH_MOVEMENTS:"cash_movements",EXPENSES:"expenses",RECEIVABLES_CXC:"receivables_cxc",PAYABLES_CXP:"payables_cxp",AUDIT_LOGS:"audit_logs",SYSTEM_PARAMS:"system_params"},ce=class{constructor(){this.db=null,this.initPromise=null}async init(){return this.db?this.db:this.initPromise?this.initPromise:(this.initPromise=new Promise((t,o)=>{let a=indexedDB.open(We,2);a.onupgradeneeded=r=>{let s=r.target.result,i=(n,d="id",l=[])=>{if(!s.objectStoreNames.contains(n)){let c=s.createObjectStore(n,{keyPath:d});l.forEach(p=>{c.createIndex(p.name,p.key,{unique:!!p.unique})})}};i(v.TENANTS,"id"),i(v.USERS,"id",[{name:"tenantId",key:"tenantId"},{name:"usuario",key:"usuario",unique:!1}]),i(v.PRICE_LISTS,"id",[{name:"tenantId",key:"tenantId"}]),i(v.WAREHOUSES,"id",[{name:"tenantId",key:"tenantId"}]),i(v.PRODUCTS,"id",[{name:"tenantId",key:"tenantId"},{name:"sku",key:"sku"},{name:"tipoItem",key:"tipoItem"}]),i(v.KARDEX,"id",[{name:"tenantId",key:"tenantId"},{name:"productoId",key:"productoId"},{name:"fecha",key:"fecha"}]),i(v.RECIPES_BOM,"id",[{name:"tenantId",key:"tenantId"},{name:"productoTerminadoId",key:"productoTerminadoId"}]),i(v.PRODUCTION_ORDERS,"id",[{name:"tenantId",key:"tenantId"},{name:"estado",key:"estado"}]),i(v.CUSTOMERS,"id",[{name:"tenantId",key:"tenantId"},{name:"nitCc",key:"nitCc"}]),i(v.SUPPLIERS,"id",[{name:"tenantId",key:"tenantId"},{name:"nitCc",key:"nitCc"}]),i(v.SALES,"id",[{name:"tenantId",key:"tenantId"},{name:"fecha",key:"fecha"},{name:"clienteId",key:"clienteId"}]),i(v.PURCHASES,"id",[{name:"tenantId",key:"tenantId"},{name:"fecha",key:"fecha"}]),i(v.ORDERS_SHIPPING,"id",[{name:"tenantId",key:"tenantId"},{name:"estadoCiclo",key:"estadoCiclo"}]),i(v.CASH_SHIFTS,"id",[{name:"tenantId",key:"tenantId"},{name:"estado",key:"estado"}]),i(v.CASH_MOVEMENTS,"id",[{name:"tenantId",key:"tenantId"},{name:"turnoId",key:"turnoId"}]),i(v.EXPENSES,"id",[{name:"tenantId",key:"tenantId"},{name:"fecha",key:"fecha"}]),i(v.RECEIVABLES_CXC,"id",[{name:"tenantId",key:"tenantId"},{name:"clienteId",key:"clienteId"},{name:"estado",key:"estado"}]),i(v.PAYABLES_CXP,"id",[{name:"tenantId",key:"tenantId"},{name:"proveedorId",key:"proveedorId"},{name:"estado",key:"estado"}]),i(v.AUDIT_LOGS,"id",[{name:"tenantId",key:"tenantId"},{name:"fecha",key:"fecha"},{name:"modulo",key:"modulo"}]),i(v.SYSTEM_PARAMS,"id",[{name:"tenantId",key:"tenantId"}])},a.onsuccess=r=>{this.db=r.target.result,t(this.db)},a.onerror=r=>{console.error("Error al abrir IndexedDB:",r.target.error),o(r.target.error)}}),this.initPromise)}async getAll(t,o=null){return await this.init(),new Promise((a,r)=>{let n=this.db.transaction([t],"readonly").objectStore(t).getAll();n.onsuccess=()=>{let d=n.result||[];o&&t!==v.TENANTS&&(d=d.filter(l=>l.tenantId===o)),a(d)},n.onerror=()=>r(n.error)})}async getById(t,o){return await this.init(),new Promise((a,r)=>{let n=this.db.transaction([t],"readonly").objectStore(t).get(o);n.onsuccess=()=>a(n.result||null),n.onerror=()=>r(n.error)})}async add(t,o){return await this.init(),o.id||(o.id=(t.substring(0,3)+"_"+Date.now()+"_"+Math.random().toString(36).substring(2,7)).toLowerCase()),o.fechaCreacion||(o.fechaCreacion=new Date().toISOString()),new Promise((a,r)=>{let n=this.db.transaction([t],"readwrite").objectStore(t).add(o);n.onsuccess=()=>a(o),n.onerror=()=>r(n.error)})}async update(t,o){return await this.init(),o.fechaModificacion=new Date().toISOString(),new Promise((a,r)=>{let n=this.db.transaction([t],"readwrite").objectStore(t).put(o);n.onsuccess=()=>a(o),n.onerror=()=>r(n.error)})}async delete(t,o){return await this.init(),new Promise((a,r)=>{let n=this.db.transaction([t],"readwrite").objectStore(t).delete(o);n.onsuccess=()=>a(!0),n.onerror=()=>r(n.error)})}async bulkAdd(t,o){return await this.init(),new Promise((a,r)=>{let s=this.db.transaction([t],"readwrite"),i=s.objectStore(t);s.oncomplete=()=>a(!0),s.onerror=()=>r(s.error),o.forEach(n=>{n.id||(n.id=(t.substring(0,3)+"_"+Date.now()+"_"+Math.random().toString(36).substring(2,7)).toLowerCase()),i.put(n)})})}async exportBackup(){await this.init();let t={version:2,timestamp:new Date().toISOString(),stores:{}},o=Object.values(v);for(let a of o)t.stores[a]=await this.getAll(a);return t}async restoreBackup(t){if(!t||!t.stores)throw new Error("Formato de archivo de respaldo inv\xE1lido o corrupto.");await this.init();let o=Object.keys(t.stores);for(let a of o)if(Object.values(v).includes(a)){let r=t.stores[a];Array.isArray(r)&&r.length>0&&await this.bulkAdd(a,r)}return!0}},f=new ce});var g,B=le(()=>{g={currency(e,t=0){if(e==null||isNaN(e))return"$ 0";let o=Number(e);return new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",minimumFractionDigits:t,maximumFractionDigits:t}).format(o)},number(e,t=0){return e==null||isNaN(e)?"0":new Intl.NumberFormat("es-CO",{minimumFractionDigits:t,maximumFractionDigits:t}).format(Number(e))},date(e){if(!e)return"-";let t=new Date(e);return isNaN(t.getTime())?e:new Intl.DateTimeFormat("es-CO",{day:"2-digit",month:"short",year:"numeric"}).format(t)},dateTime(e){if(!e)return"-";let t=new Date(e);return isNaN(t.getTime())?e:new Intl.DateTimeFormat("es-CO",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:!0}).format(t)},toInputDate(e=new Date){let t=new Date(e),o=""+(t.getMonth()+1),a=""+t.getDate();return[t.getFullYear(),o.padStart(2,"0"),a.padStart(2,"0")].join("-")},parseCurrency(e){if(typeof e=="number")return e;if(!e)return 0;let t=e.toString().replace(/[^0-9,-]/g,"").replace(",",".");return parseFloat(t)||0},escapeHTML(e){return e?String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"):""}}});var fe={};Ce(fe,{ExportService:()=>U});var U,Q=le(()=>{B();U={exportToCSV(e,t="reporte",o=null){if(!e||!e.length){alert("No hay datos disponibles para exportar.");return}let a=Object.keys(o||e[0]),r=o?Object.values(o):a,s="\uFEFF";s+=r.map(l=>`"${String(l).replace(/"/g,'""')}"`).join(";")+`\r
`,e.forEach(l=>{let c=a.map(p=>{let m=l[p];return m==null&&(m=""),typeof m=="object"&&(m=JSON.stringify(m)),`"${String(m).replace(/"/g,'""')}"`}).join(";");s+=c+`\r
`});let i=new Blob([s],{type:"text/csv;charset=utf-8;"}),n=URL.createObjectURL(i),d=document.createElement("a");d.setAttribute("href",n),d.setAttribute("download",`${t}_${new Date().toISOString().split("T")[0]}.csv`),document.body.appendChild(d),d.click(),document.body.removeChild(d),URL.revokeObjectURL(n)},printDocument(e,t="Documento Nexa ERP"){let o=`<!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>${t}</title>
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
        ${e}
      </body>
      </html>
    `,a=null;try{a=window.open("","_blank","width=880,height=920")}catch{a=null}if(a&&!a.closed)try{a.document.open(),a.document.write(o),a.document.close(),a.focus(),setTimeout(()=>{try{a.print()}catch{}},400);return}catch(i){console.warn("Fallback a iframe de impresi\xF3n por restricci\xF3n de ventana:",i)}let r=document.createElement("iframe");r.style.position="fixed",r.style.right="0",r.style.bottom="0",r.style.width="0",r.style.height="0",r.style.border="0",document.body.appendChild(r);let s=r.contentWindow.document;s.open(),s.write(o),s.close(),setTimeout(()=>{try{r.contentWindow.focus(),r.contentWindow.print()}catch(i){console.error("Error al imprimir desde iframe:",i)}setTimeout(()=>{document.body.contains(r)&&document.body.removeChild(r)},5e3)},400)}}});N();var S="tenant_rayopro",Ke="tenant_autobrillo",ae={tenants:[{id:S,nombreComercial:"Rayo Pro",razonSocial:"Rayo Pro Colombia S.A.S.",nit:"901458321",dv:4,tipoPersona:"JURIDICA",regimen:"Responsable de IVA",direccion:"Carrera 42 # 54A - 77, Zona Industrial",ciudad:"Itag\xFC\xED",departamento:"Antioquia",telefono:"(604) 444 8920",whatsapp:"+573124567890",email:"contacto@rayopro.com.co",sitioWeb:"https://rayopro.com.co",isotipoLightUrl:"datos/isotipo fondo blanco.jpg",isotipoDarkUrl:"datos/isotipo fondo negro.jpg",logoHorizontalLightUrl:"datos/logo+isotipo.jpg",logoHorizontalDarkUrl:"datos/isotipo + logo fondo negro.jpg",membreteUrl:"",logoUrl:"datos/logo+isotipo.jpg",faviconUrl:"datos/isotipo fondo blanco.jpg",firmaUrl:"datos/firma juan.jpg",colores:{primary:"#0071e3",primaryHover:"#0077ed",secondary:"#f59e0b",accent:"#0071e3"},resolucionFacturacion:"Resoluci\xF3n DIAN No. 18764000123456 de 2026-01-15 (Prefijo RP del 1 al 10000)",moneda:"COP",esDemo:!1},{id:Ke,nombreComercial:"AutoBrillo Colombia",razonSocial:"AutoBrillo Car Care S.A.S.",nit:"900874125",dv:8,tipoPersona:"JURIDICA",regimen:"Responsable de IVA",direccion:"Calle 13 # 68D - 12",ciudad:"Bogot\xE1 D.C.",departamento:"Cundinamarca",telefono:"(601) 745 2200",whatsapp:"+573108889900",email:"administracion@autobrillo.co",sitioWeb:"https://autobrillo.co",logoUrl:"",faviconUrl:"",colores:{primary:"#34c759",primaryHover:"#2db84d",secondary:"#ff9500",accent:"#34c759"},resolucionFacturacion:"Resoluci\xF3n DIAN No. 18764000987654 (Prefijo AB)",moneda:"COP",esDemo:!0}],price_lists:[{id:"plist_1",tenantId:S,nombre:"P1 - Precio P\xFAblico / Final",descripcion:"Mostrador y consumidor particular",esDefecto:!0,orden:1},{id:"plist_2",tenantId:S,nombre:"P2 - Precio Lavaderos / Taller",descripcion:"Autolavados y centros de detailing",esDefecto:!1,orden:2},{id:"plist_3",tenantId:S,nombre:"P3 - Precio Mayorista (Docenas)",descripcion:"Compras por cajas completas x 12 unidades",esDefecto:!1,orden:3},{id:"plist_4",tenantId:S,nombre:"P4 - Precio Distribuidor Autorizado",descripcion:"Almacenes y distribuidores regionales",esDefecto:!1,orden:4},{id:"plist_5",tenantId:S,nombre:"P5 - Precio Especial Cano Trucks",descripcion:"Tarifa preferencial convenio Jhon Chalarca (Cano)",esDefecto:!1,orden:5}],warehouses:[{id:"wh_1",tenantId:S,codigo:"BOD-01",nombre:"Bodega Principal & Despachos",direccion:"Carrera 42 # 54A - 77 Itag\xFC\xED",esPrincipal:!0,estado:"ACTIVO"},{id:"wh_2",tenantId:S,codigo:"BOD-02",nombre:"Planta de Producci\xF3n & Reactores",direccion:"\xC1rea de Envasado Nave B",esPrincipal:!1,estado:"ACTIVO"},{id:"wh_3",tenantId:S,codigo:"BOD-03",nombre:"Punto de Venta / Mostrador",direccion:"Mostrador de atenci\xF3n y retail",esPrincipal:!1,estado:"ACTIVO"}],users:[{id:"usr_dev",tenantId:S,nombre:"Desarrollador Master (Autor de Software)",usuario:"desarrollador",clave:"Admin.2026",email:"desarrollador@nexa.software",rol:"Desarrollador",estado:"ACTIVO",permisos:["VER","CREAR","EDITAR","ELIMINAR","AUTORIZAR","EXPORTAR","FINANCIERO","DEVELOPER"]},{id:"usr_juan",tenantId:S,nombre:"Juan Pablo (Gerente General)",usuario:"juan.gerencia",clave:"gerente.2026",email:"juan@rayopro.com.co",rol:"Gerente",estado:"ACTIVO",firmaUrl:"datos/firma juan.jpg",permisos:["VER","CREAR","EDITAR","AUTORIZAR","EXPORTAR","FINANCIERO"]},{id:"usr_admin",tenantId:S,nombre:"Carlos Mario Arango",usuario:"carlos.admin",clave:"carlos.2026",email:"carlos@rayopro.com.co",rol:"Gerente",estado:"ACTIVO",permisos:["VER","CREAR","EDITAR","AUTORIZAR","EXPORTAR","FINANCIERO"]},{id:"usr_ventas",tenantId:S,nombre:"Valentina Restrepo",usuario:"valentina.ventas",email:"ventas@rayopro.com.co",rol:"Vendedor",estado:"ACTIVO",permisos:["VER","CREAR","EDITAR"]},{id:"usr_bodega",tenantId:S,nombre:"Mateo Osorio (Bodega & Despachos)",usuario:"mateo.logistica",email:"bodega@rayopro.com.co",rol:"Bodega",estado:"ACTIVO",permisos:["VER","CREAR","EDITAR"]},{id:"usr_produccion",tenantId:S,nombre:"Ing. David G\xF3mez (Jefe de Planta)",usuario:"david.planta",email:"produccion@rayopro.com.co",rol:"Producci\xF3n",estado:"ACTIVO",permisos:["VER","CREAR","EDITAR","AUTORIZAR"]},{id:"usr_caja",tenantId:S,nombre:"Camila Henao (Caja Mostrador)",usuario:"camila.caja",email:"caja@rayopro.com.co",rol:"Caja",estado:"ACTIVO",permisos:["VER","CREAR","EDITAR"]}],products:[{id:"prod_deseng_1l",tenantId:S,codigoInterno:"RAYO-001",sku:"DESENG-1L",codigoBarras:"7707123450011",nombre:"Desengrasante Automotriz 1 Litro",descripcion:"Desengrasante concentrado de alta eficacia para motor, rines y chasis. Empaque est\xE1ndar Caja x 12.",categoria:"Desengrasantes",subcategoria:"L\xEDnea Concentrada",marca:"Rayo Pro",presentacion:"Botella 1 Litro (Caja x 12)",unidadMedida:"Litro",tipoItem:"PRODUCTO_TERMINADO",costoPromedio:8500,ultimoCosto:8700,margenEsperado:60,precios:{plist_1:21e3,plist_2:18e3,plist_3:15500,plist_4:13500,plist_5:11130},stock:144,stockMinimo:24,stockMaximo:500,bodegaId:"wh_1",estado:"ACTIVO"},{id:"prod_shamp_desinc_1l",tenantId:S,codigoInterno:"RAYO-002",sku:"SHAMP-DESINC-1L",codigoBarras:"7707123450028",nombre:"Shampoo Desincrustante 1 Litro",descripcion:"F\xF3rmula \xE1cida controlada para remover sarro, lluvia \xE1cida y marcas minerales de pintura y rines. Caja x 12.",categoria:"Lavado Exterior",subcategoria:"Desincrustantes",marca:"Rayo Pro",presentacion:"Botella 1 Litro (Caja x 12)",unidadMedida:"Litro",tipoItem:"PRODUCTO_TERMINADO",costoPromedio:11500,ultimoCosto:11800,margenEsperado:64,precios:{plist_1:32e3,plist_2:26e3,plist_3:22500,plist_4:19500,plist_5:15712},stock:96,stockMinimo:24,stockMaximo:300,bodegaId:"wh_1",estado:"ACTIVO"},{id:"prod_metal_polish",tenantId:S,codigoInterno:"RAYO-003",sku:"METAL-POLISH-500",codigoBarras:"7707123450035",nombre:"Metal Polish Restaurador Metales 500 ml",descripcion:"Pasta pulidora abrillantadora para rines de aluminio, escapes cromados y tanques de tractomulas. Caja x 12.",categoria:"Brillo y Pulido",subcategoria:"Metales & Cromados",marca:"Rayo Pro",presentacion:"Envase 500 ml (Caja x 12)",unidadMedida:"Unidad",tipoItem:"PRODUCTO_TERMINADO",costoPromedio:9200,ultimoCosto:9400,margenEsperado:67,precios:{plist_1:28e3,plist_2:23e3,plist_3:19500,plist_4:16500,plist_5:12040},stock:120,stockMinimo:24,stockMaximo:300,bodegaId:"wh_1",estado:"ACTIVO"},{id:"prod_deseng_multi_1l",tenantId:S,codigoInterno:"RAYO-004",sku:"DESENG-MULTI-1L",codigoBarras:"7707123450042",nombre:"Desengrasante Multiusos 1 Litro",descripcion:"Limpiador desengrasante bioactivo para tapicer\xEDa pesada, carcasas y superficies lavables.",categoria:"Desengrasantes",subcategoria:"L\xEDnea Multiusos",marca:"Rayo Pro",presentacion:"Botella 1 Litro (Caja x 12)",unidadMedida:"Litro",tipoItem:"PRODUCTO_TERMINADO",costoPromedio:7800,ultimoCosto:8e3,margenEsperado:65,precios:{plist_1:22e3,plist_2:18500,plist_3:16e3,plist_4:14e3,plist_5:12500},stock:108,stockMinimo:24,stockMaximo:400,bodegaId:"wh_1",estado:"ACTIVO"},{id:"prod_deseng_multi_1g",tenantId:S,codigoInterno:"RAYO-005",sku:"DESENG-MULTI-1G",codigoBarras:"7707123450059",nombre:"Desengrasante Multiusos 1 Gal\xF3n (3.78 L)",descripcion:"Presentaci\xF3n gal\xF3n econ\xF3mico para talleres y empresas de transporte de carga.",categoria:"Desengrasantes",subcategoria:"L\xEDnea Multiusos",marca:"Rayo Pro",presentacion:"Gal\xF3n (3785 ml)",unidadMedida:"Gal\xF3n",tipoItem:"PRODUCTO_TERMINADO",costoPromedio:19500,ultimoCosto:2e4,margenEsperado:59,precios:{plist_1:48e3,plist_2:39e3,plist_3:34e3,plist_4:3e4,plist_5:27500},stock:45,stockMinimo:15,stockMaximo:200,bodegaId:"wh_1",estado:"ACTIVO"},{id:"prod_shamp_desinc_4l",tenantId:S,codigoInterno:"RAYO-006",sku:"SHAMP-DESINC-4L",codigoBarras:"7707123450066",nombre:"Shampoo Desincrustante Gal\xF3n 4 Litros",descripcion:"Desincrustante \xE1cido en gal\xF3n para flotas de tractomulas y buses intermunicipales.",categoria:"Lavado Exterior",subcategoria:"Desincrustantes",marca:"Rayo Pro",presentacion:"Gal\xF3n 4 Litros",unidadMedida:"Gal\xF3n",tipoItem:"PRODUCTO_TERMINADO",costoPromedio:26e3,ultimoCosto:26500,margenEsperado:60,precios:{plist_1:65e3,plist_2:52e3,plist_3:45e3,plist_4:4e4,plist_5:37e3},stock:32,stockMinimo:12,stockMaximo:150,bodegaId:"wh_1",estado:"ACTIVO"},{id:"prod_garrafa_shamp_23l",tenantId:S,codigoInterno:"RAYO-007",sku:"GARRAFA-SHAMP-23L",codigoBarras:"7707123450073",nombre:"Garrafa Industrial x 23 Litros Shampoo Desincrustante",descripcion:"Presentaci\xF3n mayorista en garrafa pl\xE1stica azul de 23 litros para alto consumo en lavaderos de carga pesada.",categoria:"Industrial Gran Formato",subcategoria:"Desincrustantes",marca:"Rayo Pro",presentacion:"Garrafa 23 Litros",unidadMedida:"Garrafa",tipoItem:"PRODUCTO_TERMINADO",costoPromedio:118e3,ultimoCosto:12e4,margenEsperado:58,precios:{plist_1:28e4,plist_2:225e3,plist_3:195e3,plist_4:175e3,plist_5:16e4},stock:14,stockMinimo:5,stockMaximo:50,bodegaId:"wh_1",estado:"ACTIVO"},{id:"prod_deseng_todero_1g",tenantId:S,codigoInterno:"RAYO-008",sku:"DESENG-TODERO-1G",codigoBarras:"7707123450080",nombre:"Gal\xF3n Desengrasante Todero Automotriz",descripcion:"F\xF3rmula vers\xE1til de media concentraci\xF3n para lavado r\xE1pido de carrocer\xEDas y chasis.",categoria:"Desengrasantes",subcategoria:"L\xEDnea Todero",marca:"Rayo Pro",presentacion:"Gal\xF3n (3785 ml)",unidadMedida:"Gal\xF3n",tipoItem:"PRODUCTO_TERMINADO",costoPromedio:18e3,ultimoCosto:18500,margenEsperado:61,precios:{plist_1:46e3,plist_2:37e3,plist_3:32e3,plist_4:28500,plist_5:26e3},stock:28,stockMinimo:10,stockMaximo:120,bodegaId:"wh_1",estado:"ACTIVO"},{id:"prod_deseng_todero_1l",tenantId:S,codigoInterno:"RAYO-009",sku:"DESENG-TODERO-1L",codigoBarras:"7707123450097",nombre:"Desengrasante Todero 1 Litro",descripcion:"Presentaci\xF3n 1 litro para mantenimiento diario de veh\xEDculos livianos y motos.",categoria:"Desengrasantes",subcategoria:"L\xEDnea Todero",marca:"Rayo Pro",presentacion:"Botella 1 Litro (Caja x 12)",unidadMedida:"Litro",tipoItem:"PRODUCTO_TERMINADO",costoPromedio:6800,ultimoCosto:7e3,margenEsperado:64,precios:{plist_1:19e3,plist_2:15e3,plist_3:13e3,plist_4:11500,plist_5:10200},stock:72,stockMinimo:24,stockMaximo:300,bodegaId:"wh_1",estado:"ACTIVO"},{id:"prod_garrafa_deseng_23l",tenantId:S,codigoInterno:"RAYO-010",sku:"GARRAFA-DESENG-23L",codigoBarras:"7707123450103",nombre:"Garrafa Industrial x 23 Litros Desengrasante",descripcion:"Desengrasante alcalino industrial de choque en garrafa de 23 litros para desengrase severo de quintas ruedas.",categoria:"Industrial Gran Formato",subcategoria:"Desengrasantes",marca:"Rayo Pro",presentacion:"Garrafa 23 Litros",unidadMedida:"Garrafa",tipoItem:"PRODUCTO_TERMINADO",costoPromedio:105e3,ultimoCosto:108e3,margenEsperado:60,precios:{plist_1:26e4,plist_2:21e4,plist_3:18e4,plist_4:16e4,plist_5:145e3},stock:18,stockMinimo:6,stockMaximo:60,bodegaId:"wh_1",estado:"ACTIVO"},{id:"prod_rayoblack_500",tenantId:S,codigoInterno:"RAYO-011",sku:"RAYOBLACK-500",codigoBarras:"7707123450110",nombre:"RayoBlack Restaurador de Partes Negras 500 ml",descripcion:"Acondicionador cer\xE1mico polim\xE9rico negro para molduras, llantas y defensas pl\xE1sticas. Terminado seco.",categoria:"Acondicionadores",subcategoria:"Pl\xE1sticos y Llantas",marca:"Rayo Pro",presentacion:"Botella dosificadora 500 ml",unidadMedida:"Unidad",tipoItem:"PRODUCTO_TERMINADO",costoPromedio:12500,ultimoCosto:12800,margenEsperado:64,precios:{plist_1:35e3,plist_2:28e3,plist_3:24e3,plist_4:21e3,plist_5:18500},stock:85,stockMinimo:20,stockMaximo:250,bodegaId:"wh_1",estado:"ACTIVO"},{id:"prod_mp_base_alcalina",tenantId:S,codigoInterno:"MP-010",sku:"MP-BASE-ALCAL",nombre:"Base Desengrasante Alcalina Concentrada",categoria:"Materias Primas Qu\xEDmicas",unidadMedida:"Kg",tipoItem:"MATERIA_PRIMA",costoPromedio:9200,stock:850,stockMinimo:200,bodegaId:"wh_2",estado:"ACTIVO"},{id:"prod_mp_acido_fluorhidrico",tenantId:S,codigoInterno:"MP-011",sku:"MP-ACIDO-DESINC",nombre:"Compuesto Activo \xC1cido Desincrustante Grado Auto",categoria:"Materias Primas Qu\xEDmicas",unidadMedida:"Kg",tipoItem:"MATERIA_PRIMA",costoPromedio:16800,stock:420,stockMinimo:100,bodegaId:"wh_2",estado:"ACTIVO"},{id:"prod_mp_envase_1l",tenantId:S,codigoInterno:"EMP-010",sku:"EMP-BOTELLA-1L",nombre:"Botella PEAD 1 Litro Boca 28mm Blanca",categoria:"Material de Empaque",unidadMedida:"Unidad",tipoItem:"MATERIA_PRIMA",costoPromedio:1100,stock:1200,stockMinimo:300,bodegaId:"wh_2",estado:"ACTIVO"},{id:"prod_mp_caja_12",tenantId:S,codigoInterno:"EMP-012",sku:"EMP-CAJA-12",nombre:"Caja Cart\xF3n Corrugado Rayo Pro x 12 Unidades",categoria:"Material de Empaque",unidadMedida:"Unidad",tipoItem:"MATERIA_PRIMA",costoPromedio:2200,stock:350,stockMinimo:80,bodegaId:"wh_2",estado:"ACTIVO"},{id:"prod_mp_garrafa_23l",tenantId:S,codigoInterno:"EMP-023",sku:"EMP-GARRAFA-23L",nombre:"Garrafa Industrial PEAD 23 Litros Azul c/Tapa 60mm",categoria:"Material de Empaque",unidadMedida:"Unidad",tipoItem:"MATERIA_PRIMA",costoPromedio:18500,stock:65,stockMinimo:20,bodegaId:"wh_2",estado:"ACTIVO"}],customers:[{id:"cli_cano_trucks",tenantId:S,codigo:"CLI-CANO",tipoCliente:"Flotas de Tractomulas / Carga Pesada",tipoPersona:"NATURAL",nombre:"Jhon Jairo Chalarca Acevedo (Cano)",razonSocial:"Jhon Jairo Chalarca Acevedo / Cano Trucks",nitCc:"1096037405",dv:1,facturaElectronica:!1,aplicaIva:!1,telefono:"3017100508",whatsapp:"+573017100508",email:"jhon.chalarca@canotrucks.co",direccion:"Manzana A Casa 17",barrio:"La Estaci\xF3n",ciudad:"La Tebaida",departamento:"Quind\xEDo",vendedorId:"usr_juan",vendedorNombre:"Juan Pablo (Gerente)",listaPreciosId:"plist_5",cupoCredito:3e7,diasCredito:30,saldoPendiente:19756e3,totalComprado:485e5,numeroCompras:12,ultimaCompra:"2026-09-09",estado:"ACTIVO",observaciones:"Cliente VIP flotas del Quind\xEDo. Pedidos en Cajas x 12. Facturaci\xF3n por remisiones internas netas sin IVA."},{id:"cli_autospa",tenantId:S,codigo:"CLI-002",tipoCliente:"Taller / Detailing",tipoPersona:"JURIDICA",nombre:"AutoSpa Premium Medell\xEDn",razonSocial:"AutoSpa Detailing SAS",nitCc:"901223445",dv:1,facturaElectronica:!0,aplicaIva:!0,telefono:"(604) 321 4455",whatsapp:"+573004561234",email:"gerencia@autospamedellin.co",direccion:"Calle 10 # 43E - 28 El Poblado",ciudad:"Medell\xEDn",departamento:"Antioquia",barrio:"El Poblado",vendedorId:"usr_ventas",vendedorNombre:"Valentina Restrepo",listaPreciosId:"plist_2",cupoCredito:5e6,diasCredito:30,saldoPendiente:125e4,totalComprado:1485e4,numeroCompras:14,ultimaCompra:"2026-09-08",estado:"ACTIVO",observaciones:"Cliente frecuente VIP detailing. Requiere factura electr\xF3nica en cada compra."},{id:"cli_lavadero_bello",tenantId:S,codigo:"CLI-003",tipoCliente:"Consumidor Final / Negocio Inicial",tipoPersona:"NATURAL",nombre:"Lavadero El Oasis Bello (Emprendimiento)",razonSocial:"Carlos Andr\xE9s Mu\xF1oz",nitCc:"71239844",dv:3,facturaElectronica:!1,aplicaIva:!1,telefono:"3128901234",whatsapp:"+573128901234",email:"eloasis.bello@gmail.com",direccion:"Calle 50 # 48 - 19",ciudad:"Bello",departamento:"Antioquia",barrio:"Prado",vendedorId:"usr_ventas",vendedorNombre:"Valentina Restrepo",listaPreciosId:"plist_1",cupoCredito:1e6,diasCredito:15,saldoPendiente:0,totalComprado:185e4,numeroCompras:3,ultimaCompra:"2026-09-11",estado:"ACTIVO",observaciones:"Negocio en etapa inicial. Se le expide cuenta de cobro / remisi\xF3n sin IVA."}],recipes_bom:[{id:"bom_deseng_1l",tenantId:S,productoTerminadoId:"prod_deseng_1l",nombreReceta:"F\xF3rmula Maestra Desengrasante 1L (Lote 120 Botellas / 10 Cajas x 12)",rendimientoLote:120,unidadMedidaLote:"Botellas",tiempoProduccionMinutos:90,costosIndirectosEstimados:45e3,insumos:[{materiaPrimaId:"prod_mp_base_alcalina",cantidad:36,unidadMedida:"Kg",mermaEsperada:1},{materiaPrimaId:"prod_mp_envase_1l",cantidad:120,unidadMedida:"Unidad",mermaEsperada:0},{materiaPrimaId:"prod_mp_caja_12",cantidad:10,unidadMedida:"Unidad",mermaEsperada:0}],estado:"ACTIVO",observaciones:"Agitaci\xF3n constante a 500 RPM. Control de pH alcalino en 11.5."},{id:"bom_shamp_desinc_1l",tenantId:S,productoTerminadoId:"prod_shamp_desinc_1l",nombreReceta:"F\xF3rmula Maestra Shampoo Desincrustante 1L (Lote 120 Botellas / 10 Cajas x 12)",rendimientoLote:120,unidadMedidaLote:"Botellas",tiempoProduccionMinutos:110,costosIndirectosEstimados:55e3,insumos:[{materiaPrimaId:"prod_mp_acido_fluorhidrico",cantidad:28,unidadMedida:"Kg",mermaEsperada:1.5},{materiaPrimaId:"prod_mp_envase_1l",cantidad:120,unidadMedida:"Unidad",mermaEsperada:0},{materiaPrimaId:"prod_mp_caja_12",cantidad:10,unidadMedida:"Unidad",mermaEsperada:0}],estado:"ACTIVO",observaciones:"Manipulaci\xF3n con EPP de seguridad industrial \xE1cido. pH final calibrado en 2.8."}],production_orders:[{id:"ord_prod_001",tenantId:S,numeroOrden:"OP-2026-0042",recetaId:"bom_deseng_1l",productoTerminadoId:"prod_deseng_1l",productoTerminadoNombre:"Desengrasante Automotriz 1 Litro (10 Cajas x 12)",loteCodigo:"LOTE-DES2609-01",fechaProgramada:"2026-09-10",fechaInicio:"2026-09-10T08:00:00Z",fechaFin:"2026-09-10T11:30:00Z",cantidadPlanificada:120,cantidadProducida:120,costoEstimadoTotal:102e4,costoRealTotal:1018500,costoUnitarioReal:8487,costosIndirectosReales:45e3,estado:"COMPLETADA",responsableId:"usr_juan",responsableNombre:"Juan Pablo (Gerente)",firmaUrl:"datos/firma juan.jpg",insumosConsumidos:[{materiaPrimaId:"prod_mp_base_alcalina",sku:"MP-BASE-ALCAL",nombre:"Base Desengrasante Alcalina Concentrada",cantidad:36,unidadMedida:"Kg",costoUnitario:9200,costoTotal:331200},{materiaPrimaId:"prod_mp_envase_1l",sku:"EMP-BOTELLA-1L",nombre:"Botella PEAD 1 Litro Boca 28mm Blanca",cantidad:120,unidadMedida:"Unidad",costoUnitario:1100,costoTotal:132e3},{materiaPrimaId:"prod_mp_caja_12",sku:"EMP-CAJA-12",nombre:"Caja Cart\xF3n Corrugado Rayo Pro x 12 Und",cantidad:10,unidadMedida:"Unidad",costoUnitario:2200,costoTotal:22e3}],observaciones:"Lote empacado en 10 cajas rotuladas con logo Rayo Pro para despacho."}],orders_shipping:[{id:"ship_cano_01",tenantId:S,ventaId:"sale_cano_01",clienteId:"cli_cano_trucks",clienteNombre:"Jhon Jairo Chalarca Acevedo (Cano Trucks)",nitCc:"1096037405-1",telefono:"3017100508",whatsapp:"+57 301 710 0508",email:"jhon.chalarca@canotrucks.co",direccion:"Manzana A Casa 17",barrio:"La Estaci\xF3n",ciudad:"La Tebaida",departamento:"Quind\xEDo",transportadora:"Coordinadora Mercantil Carga",numeroGuia:"77092184531",costoEnvio:165e3,estadoCiclo:"ENVIADO",fechaDespacho:"2026-09-11",fechaEntregaEstimada:"2026-09-14",cajasTotal:17,contenidoDescripcion:"17 CAJAS X 12 (Productos de mantenimiento y embellecimiento automotriz)",responsable:"Juan Pablo (Gerente)",observaciones:"Manejar con cuidado. Cajas con sellos de seguridad Rayo Pro. Productos de mantenimiento y embellecimiento automotriz."},{id:"ship_cano_02",tenantId:S,ventaId:"sale_cano_02",clienteId:"cli_cano_trucks",clienteNombre:"Jhon Jairo Chalarca Acevedo (Cano Trucks)",nitCc:"1096037405-1",telefono:"3017100508",whatsapp:"+57 301 710 0508",email:"jhon.chalarca@canotrucks.co",direccion:"Manzana A Casa 17",barrio:"La Estaci\xF3n",ciudad:"La Tebaida",departamento:"Quind\xEDo",transportadora:"Envia Colvanes",numeroGuia:"04128994711",costoEnvio:95e3,estadoCiclo:"LISTO_DESPACHO",fechaDespacho:"2026-09-12",fechaEntregaEstimada:"2026-09-15",cajasTotal:8,contenidoDescripcion:"8 CAJAS X 12 (Productos de mantenimiento y embellecimiento automotriz)",responsable:"Valentina Restrepo",observaciones:"Despacho prioritario programado para recolecci\xF3n hoy en la tarde. Productos de embellecimiento automotriz."}],receivables_cxc:[{id:"cxc_cano_01",tenantId:S,ventaId:"sale_cano_prev",documento:"RP-CANO-088",clienteId:"cli_cano_trucks",clienteNombre:"Jhon Jairo Chalarca Acevedo (Cano)",fechaEmision:"2026-08-15",fechaVencimiento:"2026-09-15",valorTotal:26e6,abonos:6244e3,saldo:19756e3,diasMora:0,estado:"POR_VENCER",observaciones:"Abonos conciliados: $4.244.000 el 03-Sep-2026 y $2.000.000 el 09-Sep-2026."}],sales:[{id:"sale_cano_01",tenantId:S,consecutivo:"RP-10026",tipoDoc:"VENTA_CREDITO",clienteId:"cli_cano_trucks",clienteNombre:"Jhon Jairo Chalarca Acevedo (Cano)",clienteNit:"1096.037.405-1",vendedorId:"usr_juan",vendedorNombre:"Juan Pablo (Gerente)",listaPreciosId:"plist_5",fecha:"2026-09-11T14:20:00Z",estado:"CREDITO_PENDIENTE",subtotal:6964706,descuentos:0,impuestos:1323294,total:8288e3,metodoPago:"Cr\xE9dito",pagoRecibido:0,cambio:0,saldoCredito:8288e3,items:[{productoId:"prod_deseng_1l",sku:"DESENG-1L",nombre:"Desengrasante Automotriz 1 Litro (17 Cajas x 12 = 204 Und)",cantidad:204,precioUnitario:11130,total:2270520},{productoId:"prod_shamp_desinc_1l",sku:"SHAMP-DESINC-1L",nombre:"Shampoo Desincrustante 1 Litro (17 Cajas x 12 = 204 Und)",cantidad:204,precioUnitario:15712,total:3205248},{productoId:"prod_metal_polish",sku:"METAL-POLISH-500",nombre:"Metal Polish Restaurador 500 ml (192 Und)",cantidad:192,precioUnitario:12040,total:2311680}]}],cash_shifts:[{id:"cshift_actual",tenantId:S,usuarioId:"usr_juan",usuarioNombre:"Juan Pablo (Gerente)",fechaApertura:"2026-09-12T07:30:00Z",fechaCierre:null,montoApertura:3e5,totalVentasEfectivo:85e4,totalVentasTransferencia:2e6,totalVentasNequiDaviplata:45e4,totalVentasTarjeta:25e4,totalVentasCredito:8288e3,totalIngresos:5e4,totalEgresos:4e4,totalGastos:35e3,totalRetiros:0,saldoEsperado:1125e3,saldoContado:0,diferencia:0,estado:"ABIERTA",observaciones:"Turno activo principal Rayo Pro"}],expenses:[{id:"exp_001",tenantId:S,fecha:"2026-09-12T09:20:00Z",categoria:"Mensajer\xEDa y Env\xEDos",concepto:"Flete despacho Coordinadora a La Tebaida Quind\xEDo (Cano Trucks)",proveedor:"Coordinadora Mercantil S.A.",valor:165e3,formaPago:"Transferencia Bancolombia",responsableId:"usr_juan",responsableNombre:"Juan Pablo",observacion:"Gu\xEDa 77092184531"}],payables_cxp:[{id:"cxp_001",tenantId:S,compraId:"comp_042",documento:"FAC-QUIM-8841",proveedorId:"prov_01",proveedorNombre:"Qu\xEDmicos Industriales de Colombia S.A.S.",fechaEmision:"2026-09-01",fechaVencimiento:"2026-10-15",valorTotal:45e5,abonos:0,saldo:45e5,diasMora:0,estado:"AL_DIA"}],suppliers:[{id:"prov_01",tenantId:S,codigo:"PROV-001",razonSocial:"Qu\xEDmicos Industriales de Colombia S.A.S.",nitCc:"890900123",dv:5,contacto:"Ing. Fernando G\xF3mez",telefono:"(604) 448 3030",ciudad:"Sabaneta",departamento:"Antioquia",diasCredito:45,categoria:"Materias Primas Qu\xEDmicas",estado:"ACTIVO"},{id:"prov_02",tenantId:S,codigo:"PROV-002",razonSocial:"Pl\xE1sticos & Envases del Valle S.A.",nitCc:"805011456",dv:2,contacto:"Carolina Morales",telefono:"(602) 441 5500",ciudad:"Palmira",departamento:"Valle del Cauca",diasCredito:30,categoria:"Envases & Tapas",estado:"ACTIVO"}],kardex:[{id:"kdx_001",tenantId:S,fecha:"2026-09-10T11:30:00Z",productoId:"prod_deseng_1l",productoNombre:"Desengrasante Automotriz 1 Litro",sku:"DESENG-1L",bodegaId:"wh_1",bodegaNombre:"Bodega Principal & Despachos",documentoTipo:"PRODUCCION_ENTRADA",documentoNumero:"OP-2026-0042",cantidadEntrada:120,cantidadSalida:0,saldoCantidad:144,costoUnitario:8487,costoTotal:1018500,usuarioId:"usr_juan",usuarioNombre:"Juan Pablo (Gerente)",observacion:"Entrada por lote fabricado LOTE-DES2609-01 (10 cajas x 12)"}],audit_logs:[{id:"aud_001",tenantId:S,fecha:"2026-09-12",hora:"10:15:00",usuarioId:"usr_juan",usuarioNombre:"Juan Pablo (Gerente)",modulo:"Ventas POS",accion:"CREAR",registroId:"RP-10026",campoModificado:"Factura Despacho Cano Trucks",valorAnterior:"-",valorNuevo:"$ 8.288.000 (Cr\xE9dito a 30 d\xEDas)",ipUserAgent:"Nexa iOS Desktop App"}]};var z={WEIGHTS:[3,7,13,17,19,23,29,37,41,43,47,53,59,67,71],calculate(e){if(!e)return null;let t=e.toString().replace(/\D/g,"");if(t.length===0)return null;let o=0,a=t.length;for(let s=0;s<a;s++){let i=parseInt(t.charAt(a-1-s),10),n=this.WEIGHTS[s]||0;o+=i*n}let r=o%11;return r>1?11-r:r},formatWithDV(e){if(!e)return"";let t=e.toString().replace(/\D/g,"");if(!t)return"";let o=this.calculate(t),a=new Intl.NumberFormat("es-CO").format(parseInt(t,10));return o!==null?`${a}-${o}`:a}};var pe=class{constructor(){this.events={}}on(t,o){return this.events[t]||(this.events[t]=[]),this.events[t].push(o),()=>this.off(t,o)}off(t,o){this.events[t]&&(this.events[t]=this.events[t].filter(a=>a!==o))}emit(t,o){this.events[t]&&this.events[t].forEach(a=>{try{a(o)}catch(r){console.error(`Error en listener de evento "${t}":`,r)}})}},Z=new pe;var me=class{constructor(){this.currentTenant=null,this.activeTenantId=localStorage.getItem("nexa_active_tenant")||S}async init(){await f.init();let t=await f.getAll(v.TENANTS),o=await f.getAll(v.PRODUCTS,S),a=o&&o.some(r=>r.sku==="DESENG-1L");if(!t||t.length===0||!a)await this.seedInitialDatabase(),t=await f.getAll(v.TENANTS);else{let r=await f.getAll(v.USERS,S);for(let i of ae.users){let n=r.find(d=>d.id===i.id);n?i.id==="usr_dev"&&(n.clave==="dev.nexa.2026"||!n.clave)?(n.clave="Admin.2026",await f.update(v.USERS,n)):i.id==="usr_juan"&&n.rol!=="Gerente"&&(n.rol="Gerente",n.nombre="Juan Pablo (Gerente General)",n.clave="gerente.2026",await f.update(v.USERS,n)):await f.add(v.USERS,i)}let s=await f.getAll(v.CUSTOMERS,S);for(let i of ae.customers){let n=s.find(d=>d.id===i.id);n?(n.facturaElectronica===void 0||n.aplicaIva===void 0)&&(n.facturaElectronica=i.facturaElectronica,n.aplicaIva=i.aplicaIva,await f.update(v.CUSTOMERS,n)):await f.add(v.CUSTOMERS,i)}for(let i of t){let n=!1;i.id===S&&(i.isotipoLightUrl||(i.isotipoLightUrl="datos/isotipo fondo blanco.jpg",n=!0),i.isotipoDarkUrl||(i.isotipoDarkUrl="datos/isotipo fondo negro.jpg",n=!0),i.logoHorizontalLightUrl||(i.logoHorizontalLightUrl="datos/logo+isotipo.jpg",n=!0),i.logoHorizontalDarkUrl||(i.logoHorizontalDarkUrl="datos/isotipo + logo fondo negro.jpg",n=!0)),n&&await f.update(v.TENANTS,i)}}return this.currentTenant=t.find(r=>r.id===this.activeTenantId)||t[0],this.currentTenant&&(this.activeTenantId=this.currentTenant.id,localStorage.setItem("nexa_active_tenant",this.activeTenantId),this.applyTheme(this.currentTenant)),this.currentTenant}async seedInitialDatabase(){for(let[t,o]of Object.entries(ae)){let a=v[t.toUpperCase()];a&&Array.isArray(o)&&await f.bulkAdd(a,o)}}getActiveTenant(){return this.currentTenant}async getAllTenants(){return await f.getAll(v.TENANTS)}async switchTenant(t){let o=await f.getById(v.TENANTS,t);if(!o)throw new Error("Empresa no encontrada.");return this.currentTenant=o,this.activeTenantId=o.id,localStorage.setItem("nexa_active_tenant",this.activeTenantId),this.applyTheme(o),Z.emit("tenant:changed",o),o}async updateTenant(t){t.nit&&(t.dv=z.calculate(t.nit));let o=await f.update(v.TENANTS,t);return o.id===this.activeTenantId&&(this.currentTenant=o,this.applyTheme(o),Z.emit("tenant:changed",o)),o}async createTenant(t){t.id||(t.id="tenant_"+Date.now()),t.nit&&(t.dv=z.calculate(t.nit));let o=await f.add(v.TENANTS,t),a=[{id:`plist_1_${o.id}`,tenantId:o.id,nombre:"P1 - Precio P\xFAblico / Final",descripcion:"Mostrador y consumidor particular",esDefecto:!0,orden:1},{id:`plist_2_${o.id}`,tenantId:o.id,nombre:"P2 - Precio Lavaderos / Taller",descripcion:"Autolavados y centros de detailing",esDefecto:!1,orden:2},{id:`plist_3_${o.id}`,tenantId:o.id,nombre:"P3 - Precio Mayorista (Docenas)",descripcion:"Compras por cajas completas x 12 unidades",esDefecto:!1,orden:3},{id:`plist_4_${o.id}`,tenantId:o.id,nombre:"P4 - Precio Distribuidor Autorizado",descripcion:"Almacenes y distribuidores regionales",esDefecto:!1,orden:4},{id:`plist_5_${o.id}`,tenantId:o.id,nombre:"P5 - Precio Especial Convenio",descripcion:"Tarifa preferencial convenios",esDefecto:!1,orden:5}];for(let r of a)await f.add(v.PRICE_LISTS,r);return await f.add(v.WAREHOUSES,{id:`wh_1_${o.id}`,tenantId:o.id,codigo:"BOD-01",nombre:"Bodega Principal & Despachos",direccion:o.direccion||"Sede Principal",esPrincipal:!0,estado:"ACTIVO"}),o}applyTheme(t){if(!t)return;let o=document.documentElement,a=t.colores||{primary:"#0284c7",primaryHover:"#0369a1",secondary:"#f59e0b",accent:"#0284c7"};o.style.setProperty("--brand-primary",a.primary),o.style.setProperty("--brand-primary-hover",a.primaryHover||a.primary),o.style.setProperty("--brand-secondary",a.secondary),o.style.setProperty("--brand-accent",a.accent||a.primary),document.title=`${t.nombreComercial} | Nexa ERP Cloud`,document.querySelectorAll("[data-tenant-name]").forEach(r=>{r.textContent=t.nombreComercial}),document.querySelectorAll("[data-tenant-nit]").forEach(r=>{r.textContent=`NIT: ${t.nit}-${t.dv}`})}getIsotipo(t,o=!1){if(!t)return"";if(o){if(t.isotipoDarkUrl)return t.isotipoDarkUrl;if(t.id===S)return"datos/isotipo fondo negro.jpg"}else{if(t.isotipoLightUrl)return t.isotipoLightUrl;if(t.faviconUrl)return t.faviconUrl;if(t.id===S)return"datos/isotipo fondo blanco.jpg"}return this.generateAutoIsotipo(t,o)}getHorizontalLogo(t,o=!1){if(!t)return"";if(o){if(t.logoHorizontalDarkUrl)return t.logoHorizontalDarkUrl;if(t.id===S)return"datos/isotipo + logo fondo negro.jpg"}else{if(t.logoHorizontalLightUrl)return t.logoHorizontalLightUrl;if(t.logoUrl)return t.logoUrl;if(t.id===S)return"datos/logo+isotipo.jpg"}return this.generateAutoHorizontalLogo(t,o)}getMembrete(t){return t?t.membreteUrl?t.membreteUrl:this.generateAutoMembrete(t):""}generateAutoIsotipo(t,o=!1){let a=t.nombreComercial||"Nexa",r=a.trim().split(/\s+/),s=r.length>1?(r[0][0]+r[1][0]).toUpperCase():a.substring(0,2).toUpperCase(),i=t.colores?.primary||"#0071e3",n=t.colores?.secondary||"#38bdf8",d=o?"#000000":"#ffffff",l=o?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.08)",c=o?"#ffffff":i,p=`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
        <defs>
          <linearGradient id="grad_${t.id||"auto"}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${i}" />
            <stop offset="100%" stop-color="${n}" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="22" fill="${d}" stroke="${l}" stroke-width="2"/>
        <circle cx="50" cy="50" r="36" fill="url(#grad_${t.id||"auto"})" opacity="${o?"0.22":"0.12"}"/>
        <text x="50" y="59" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="30" font-weight="900" fill="${c}" text-anchor="middle" letter-spacing="-1">${s}</text>
      </svg>
    `.trim();return`data:image/svg+xml;utf8,${encodeURIComponent(p)}`}generateAutoHorizontalLogo(t,o=!1){let a=t.nombreComercial||"Nexa ERP",r=t.razonSocial||a,s=a.trim().split(/\s+/),i=s.length>1?(s[0][0]+s[1][0]).toUpperCase():a.substring(0,2).toUpperCase(),c=`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 70" width="340" height="70">
        <rect width="54" height="54" x="8" y="8" rx="14" fill="${t.colores?.primary||"#0071e3"}" />
        <text x="35" y="44" font-family="-apple-system, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle">${i}</text>
        <text x="74" y="36" font-family="-apple-system, sans-serif" font-size="19" font-weight="900" fill="${o?"#ffffff":"#1d1d1f"}" letter-spacing="-0.5">${a}</text>
        <text x="74" y="52" font-family="-apple-system, sans-serif" font-size="10" font-weight="600" fill="${o?"#94a3b8":"#64748b"}" letter-spacing="0.5">${r.substring(0,32).toUpperCase()}</text>
      </svg>
    `.trim();return`data:image/svg+xml;utf8,${encodeURIComponent(c)}`}generateAutoMembrete(t){let o=t.nombreComercial||"Nexa ERP",a=`NIT: ${t.nit||""}-${t.dv||""}`,r=`${t.direccion||""} \u2022 ${t.ciudad||""} \u2022 Tel: ${t.telefono||""}`,s=t.colores?.primary||"#0071e3",i=t.colores?.secondary||"#f59e0b",n=`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 110" width="800" height="110">
        <rect width="800" height="8" x="0" y="0" fill="${s}"/>
        <rect width="180" height="8" x="620" y="0" fill="${i}"/>
        <text x="25" y="46" font-family="-apple-system, sans-serif" font-size="24" font-weight="900" fill="#1d1d1f">${o}</text>
        <text x="25" y="68" font-family="-apple-system, sans-serif" font-size="12" font-weight="700" fill="#374151">${a} \u2022 ${t.regimen||"Responsable de IVA"}</text>
        <text x="25" y="88" font-family="-apple-system, sans-serif" font-size="11" font-weight="500" fill="#6b7280">${r}</text>
        <line x1="25" y1="102" x2="775" y2="102" stroke="#e5e7eb" stroke-width="1.5"/>
      </svg>
    `.trim();return`data:image/svg+xml;utf8,${encodeURIComponent(n)}`}},I=new me;N();N();var ue=class{async log({modulo:t,accion:o,registroId:a,campoModificado:r,valorAnterior:s,valorNuevo:i}){try{let n=localStorage.getItem("nexa_active_tenant")||"tenant_rayopro",d=new Date,l=d.toLocaleTimeString("es-CO",{hour12:!1}),c=d.toISOString().split("T")[0],p=localStorage.getItem("nexa_active_user")||"usr_admin",m="Usuario Sistema",u=await f.getById(v.USERS,p);u&&(m=u.nombre);let b={tenantId:n,fecha:c,hora:l,usuarioId:p,usuarioNombre:m,modulo:t,accion:o,registroId:a||"-",campoModificado:r||"Operaci\xF3n General",valorAnterior:s!=null?String(s):"-",valorNuevo:i!=null?String(i):"-",ipUserAgent:navigator.userAgent.substring(0,50)};return await f.add(v.AUDIT_LOGS,b),b}catch(n){console.warn("No se pudo registrar la entrada de auditor\xEDa:",n)}}async getLogs(t){return(await f.getAll(v.AUDIT_LOGS,t)).sort((a,r)=>new Date(r.fechaCreacion||r.fecha)-new Date(a.fechaCreacion||a.fecha))}},V=new ue;var G={DEV:"Desarrollador",ADMIN:"Desarrollador",GERENTE:"Gerente",VENDEDOR:"Vendedor",BODEGA:"Bodega",PRODUCCION:"Producci\xF3n",CAJA:"Caja"},re={VER:"VER",CREAR:"CREAR",EDITAR:"EDITAR",ELIMINAR:"ELIMINAR",AUTORIZAR:"AUTORIZAR",EXPORTAR:"EXPORTAR",FINANCIERO:"FINANCIERO",DEVELOPER:"DEVELOPER"},Ie={[G.DEV]:["dashboard","sales-pos","clients","shipping","products","inventory","production","purchases","cash","expenses","cxc","cxp","reports","users","audit","settings","backup","importer","integrations","documents"],[G.GERENTE]:["dashboard","sales-pos","clients","shipping","products","inventory","production","purchases","cash","expenses","cxc","cxp","reports","settings","backup","importer","integrations","documents"],[G.VENDEDOR]:["sales-pos","clients","shipping","products","documents"],[G.BODEGA]:["products","inventory","shipping","purchases"],[G.PRODUCCION]:["products","inventory","production","purchases","documents"],[G.CAJA]:["sales-pos","cash","expenses","cxc"]},be=class{constructor(){this.currentUser=null,this.activeUserId=localStorage.getItem("nexa_active_user")||"usr_dev"}async init(t){let o=await f.getAll(v.USERS,t);return(!o||o.length===0)&&(o=await f.getAll(v.USERS)),this.currentUser=o&&o.find(a=>a.id===this.activeUserId)||o&&o[0]||{id:"usr_dev",nombre:"Desarrollador Master (Autor de Software)",usuario:"desarrollador",clave:"Admin.2026",rol:G.DEV,permisos:Object.values(re)},localStorage.setItem("nexa_active_user",this.currentUser.id),this.currentUser}getCurrentUser(){return this.currentUser}isDeveloper(){return this.currentUser?.rol===G.DEV||this.currentUser?.rol==="Desarrollador"}canManageUsers(){return this.isDeveloper()}canManageTenants(){return this.isDeveloper()}async switchUser(t,o=null){let a=await f.getById(v.USERS,t);if(!a)throw new Error("Usuario no encontrado.");if(a.rol===G.DEV||a.rol==="Desarrollador"){let r=a.clave||"Admin.2026";if(!o||o.trim()!==r.trim())throw new Error("Contrase\xF1a de Desarrollador requerida para autenticar este perfil de alta seguridad.")}return this.currentUser=a,this.activeUserId=a.id,localStorage.setItem("nexa_active_user",a.id),await V.log({modulo:"Seguridad",accion:"LOGIN",registroId:a.id,campoModificado:"Sesi\xF3n Activa",valorAnterior:"-",valorNuevo:`${a.nombre} (${a.rol})`}),Z.emit("auth:userChanged",a),a}getAllowedModules(){return this.currentUser?this.isDeveloper()?Ie[G.DEV]:Ie[this.currentUser.rol]||["dashboard"]:[]}canAccessRoute(t){return!t||t===""?!0:this.currentUser?this.isDeveloper()?!0:this.getAllowedModules().includes(t):!1}getDefaultRoute(){let t=this.getAllowedModules();return t&&t.length>0?t[0]:"dashboard"}hasPermission(t){return this.currentUser?this.isDeveloper()?!0:(this.currentUser.permisos||[]).includes(t):!1}canViewFinancials(){return this.hasPermission(re.FINANCIERO)}},k=new be;N();var H={async getCurrentShift(e){return(await f.getAll(v.CASH_SHIFTS,e)).find(o=>o.estado==="ABIERTA")||null},async openShift({tenantId:e,usuarioId:t,usuarioNombre:o,montoApertura:a,observaciones:r}){if(await this.getCurrentShift(e))throw new Error("Ya existe un turno de caja abierto. Debe cerrarlo antes de aperturar uno nuevo.");let i={tenantId:e,usuarioId:t,usuarioNombre:o,fechaApertura:new Date().toISOString(),fechaCierre:null,montoApertura:Number(a)||0,totalVentasEfectivo:0,totalVentasTransferencia:0,totalVentasNequiDaviplata:0,totalVentasTarjeta:0,totalVentasCredito:0,totalIngresos:0,totalEgresos:0,totalGastos:0,totalRetiros:0,saldoEsperado:Number(a)||0,saldoContado:0,diferencia:0,estado:"ABIERTA",observaciones:r||""},n=await f.add(v.CASH_SHIFTS,i);return await V.log({modulo:"Caja",accion:"CREAR",registroId:n.id,campoModificado:"Apertura de Turno",valorAnterior:"-",valorNuevo:`Apertura con base: $ ${a}`}),n},async addMovement({tenantId:e,turnoId:t,tipo:o,monto:a,concepto:r,tercero:s,formaPago:i}){let n=await f.getById(v.CASH_SHIFTS,t);if(!n||n.estado!=="ABIERTA")throw new Error("No hay turno de caja abierto v\xE1lido para registrar este movimiento.");let d=Number(a);o==="INGRESO"?(n.totalIngresos=(n.totalIngresos||0)+d,n.saldoEsperado+=d):o==="EGRESO"?(n.totalEgresos=(n.totalEgresos||0)+d,n.saldoEsperado-=d):o==="RETIRO"?(n.totalRetiros=(n.totalRetiros||0)+d,n.saldoEsperado-=d):o==="GASTO"&&(n.totalGastos=(n.totalGastos||0)+d,n.saldoEsperado-=d),await f.update(v.CASH_SHIFTS,n);let l={tenantId:e,turnoId:t,tipo:o,monto:d,concepto:r,tercero:s||"-",formaPago:i||"Efectivo",fecha:new Date().toISOString(),usuarioId:n.usuarioId},c=await f.add(v.CASH_MOVEMENTS,l);return await V.log({modulo:"Caja",accion:"CREAR",registroId:t,campoModificado:`Movimiento Caja: ${o}`,valorAnterior:"-",valorNuevo:`$ ${d} - ${r}`}),c},async closeShift({turnoId:e,saldoContado:t,observacionesCierre:o}){let a=await f.getById(v.CASH_SHIFTS,e);if(!a)throw new Error("Turno de caja no encontrado.");let r=Number(t)||0,s=r-a.saldoEsperado;return a.fechaCierre=new Date().toISOString(),a.saldoContado=r,a.diferencia=s,a.observacionesCierre=o||"",a.estado="CERRADA",await f.update(v.CASH_SHIFTS,a),await V.log({modulo:"Caja",accion:"MODIFICAR",registroId:e,campoModificado:"Cierre y Arqueo de Caja",valorAnterior:`Esperado: $ ${a.saldoEsperado}`,valorNuevo:`Contado: $ ${r} (Diferencia: $ ${s})`}),a}};var ve=class{constructor(){this.container=null,this.init()}init(){this.container||(this.container=document.createElement("div"),this.container.className="toast-container",document.body.appendChild(this.container))}show({title:t,message:o,type:a="info",duration:r=3500}){this.init();let s=document.createElement("div");s.className=`toast toast-${a}`;let i={success:"\u2713",danger:"\u2715",warning:"\u26A0",info:"\u2139"};s.innerHTML=`
      <div style="font-weight: bold; font-size: 16px; line-height: 1;">${i[a]||"\u2139"}</div>
      <div class="toast-content">
        ${t?`<div class="toast-title">${t}</div>`:""}
        <div class="toast-message">${o}</div>
      </div>
      <button style="background: none; border: none; font-size: 16px; color: #94a3b8; cursor: pointer;">&times;</button>
    `,s.querySelector("button").addEventListener("click",()=>{this.remove(s)}),this.container.appendChild(s),r>0&&setTimeout(()=>{this.remove(s)},r)}remove(t){t.style.opacity="0",t.style.transform="translateX(100%)",t.style.transition="all 0.2s ease-out",setTimeout(()=>{t.parentElement&&t.parentElement.removeChild(t)},200)}success(t,o="Operaci\xF3n Exitosa"){this.show({title:o,message:t,type:"success"})}error(t,o="Error"){this.show({title:o,message:t,type:"danger",duration:5e3})}warning(t,o="Atenci\xF3n"){this.show({title:o,message:t,type:"warning"})}info(t,o="Informaci\xF3n"){this.show({title:o,message:t,type:"info"})}},C=new ve;var x={activeModal:null,show({title:e,content:t,footerButtons:o=[],size:a="md",onClose:r=null}){this.close();let s=document.createElement("div");s.className="modal-backdrop";let i=document.createElement("div");i.className=`modal-dialog modal-${a}`,i.innerHTML=`
      <div class="modal-header">
        <h3 class="modal-title">${e}</h3>
        <button class="modal-close" aria-label="Cerrar">&times;</button>
      </div>
      <div class="modal-body">${t}</div>
      <div class="modal-footer"></div>
    `;let n=i.querySelector(".modal-footer");o&&o.length>0?o.forEach(l=>{let c=document.createElement("button");c.className=`btn ${l.class||"btn-secondary"}`,c.textContent=l.label,l.id&&(c.id=l.id),c.addEventListener("click",p=>{l.onClick?l.onClick(i,p):this.close()}),n.appendChild(c)}):n.style.display="none",i.querySelector(".modal-close").addEventListener("click",()=>{this.close(),r&&r()}),s.addEventListener("click",l=>{l.target===s&&(this.close(),r&&r())}),s.appendChild(i),document.body.appendChild(s),this.activeModal={backdrop:s,dialog:i,onClose:r};let d=l=>{l.key==="Escape"&&(this.close(),r&&r(),document.removeEventListener("keydown",d))};return document.addEventListener("keydown",d),i},close(){this.activeModal&&(this.activeModal.backdrop&&this.activeModal.backdrop.parentElement&&this.activeModal.backdrop.parentElement.removeChild(this.activeModal.backdrop),this.activeModal=null)},confirm({title:e="\xBFEst\xE1 seguro?",message:t,confirmText:o="Confirmar",cancelText:a="Cancelar",isDanger:r=!1,onConfirm:s}){this.show({title:e,content:`<p style="font-size: 14px; color: #475569;">${t}</p>`,size:"sm",footerButtons:[{label:a,class:"btn-secondary",onClick:()=>this.close()},{label:o,class:r?"btn-danger":"btn-primary",onClick:()=>{this.close(),s&&s()}}]})}};N();B();function X({label:e,value:t,icon:o="\u{1F4CA}",iconBg:a="var(--brand-primary-light)",iconColor:r="var(--brand-primary)",trend:s=null,trendPositive:i=!0,footerText:n=""}){let d=s!==null?`
    <span class="kpi-trend ${i?"positive":"negative"}">
      ${i?"\u2191":"\u2193"} ${s}
    </span>
  `:"";return`
    <div class="kpi-card">
      <div class="kpi-card-header">
        <span class="kpi-label">${e}</span>
        <div class="kpi-icon-wrap" style="background: ${a}; color: ${r};">
          ${o}
        </div>
      </div>
      <div class="kpi-value">${t}</div>
      <div class="kpi-footer">
        ${d}
        <span>${n}</span>
      </div>
    </div>
  `}var ge={async render(e){let t=I.getActiveTenant(),o=t?t.id:"tenant_rayopro",[a,r,s,i,n,d,l]=await Promise.all([f.getAll(v.SALES,o),f.getAll(v.PRODUCTS,o),f.getAll(v.EXPENSES,o),f.getAll(v.RECEIVABLES_CXC,o),f.getAll(v.PAYABLES_CXP,o),f.getAll(v.ORDERS_SHIPPING,o),f.getAll(v.PRODUCTION_ORDERS,o)]),c=new Date().toISOString().split("T")[0],p=new Date().getMonth(),m=new Date().getFullYear(),u=0,b=0,h=0,y=0;a.forEach(T=>{let O=new Date(T.fecha),_=T.fecha&&T.fecha.startsWith(c),$=O.getMonth()===p&&O.getFullYear()===m,q=O.getFullYear()===m;_&&(u+=Number(T.total||0)),$&&(b+=Number(T.total||0)),q&&(h+=Number(T.total||0))});let E=s.reduce((T,O)=>T+Number(O.valor||0),0),P=i.reduce((T,O)=>T+Number(O.saldo||0),0),A=n.reduce((T,O)=>T+Number(O.saldo||0),0),R=r.reduce((T,O)=>T+Number(O.stock||0)*Number(O.costoPromedio||0),0),w=r.filter(T=>T.stock>0&&T.stock<=(T.stockMinimo||15)),D=r.filter(T=>Number(T.stock||0)<=0),j=i.filter(T=>T.estado==="VENCIDO"||T.diasMora&&T.diasMora>0),M=d.filter(T=>T.estadoCiclo!=="ENTREGADO"),W=Math.max(0,h*.45-E);e.innerHTML=`
      <div class="view-header">
        <div class="view-title-wrap">
          <div class="d-flex items-center gap-2">
            <h1>Dashboard Ejecutivo</h1>
            <span class="badge-demo">DEMO RAYO PRO</span>
          </div>
          <p>Visi\xF3n general de ventas, cartera, inventario y alertas operativas de <strong>${t.nombreComercial}</strong></p>
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
        ${X({label:"Ventas del D\xEDa",value:g.currency(u),icon:"\u{1F4B0}",iconBg:"var(--color-success-bg)",iconColor:"var(--color-success)",trend:"+12%",trendPositive:!0,footerText:"vs. d\xEDa anterior"})}

        ${X({label:"Ventas del Mes",value:g.currency(b),icon:"\u{1F4C8}",iconBg:"var(--brand-primary-light)",iconColor:"var(--brand-primary)",trend:"+8.4%",trendPositive:!0,footerText:"meta mensual 85%"})}

        ${X({label:"Inventario Valorizado",value:g.currency(R),icon:"\u{1F4E6}",iconBg:"#f3e8ff",iconColor:"#7e22ce",footerText:`${r.length} referencias activas`})}

        ${X({label:"Utilidad Estimada",value:g.currency(W),icon:"\u{1F48E}",iconBg:"#ecfdf5",iconColor:"#059669",footerText:"Margen global ~42%"})}

        ${X({label:"Cuentas por Cobrar",value:g.currency(P),icon:"\u{1F465}",iconBg:"var(--color-warning-bg)",iconColor:"var(--color-warning)",footerText:`${j.length} en mora`})}

        ${X({label:"Cuentas por Pagar",value:g.currency(A),icon:"\u{1F4D1}",iconBg:"var(--color-danger-bg)",iconColor:"var(--color-danger)",footerText:`${n.length} facturas proveedores`})}

        ${X({label:"Gastos Registrados",value:g.currency(E),icon:"\u{1F3F7}\uFE0F",iconBg:"#fff1f2",iconColor:"#e11d48",footerText:"Gastos operativos mes"})}

        ${X({label:"Env\xEDos en Curso",value:`${M.length} Despachos`,icon:"\u{1F69A}",iconBg:"#e0f2fe",iconColor:"#0369a1",footerText:"Por entregar a clientes"})}
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
                ${[{m:"May",val:185e5,h:55},{m:"Jun",val:242e5,h:72},{m:"Jul",val:219e5,h:65},{m:"Ago",val:298e5,h:88},{m:"Sep",val:b||324e5,h:95}].map(T=>`
                  <div style="flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end;">
                    <div style="font-size: 10px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px;">${g.currency(T.val,0)}</div>
                    <div style="width: 100%; max-width: 48px; height: ${T.h}%; background: var(--brand-primary); border-radius: 6px 6px 0 0; transition: height 0.5s ease;"></div>
                    <div style="font-size: 11px; font-weight: 600; color: var(--text-muted); margin-top: 8px;">${T.m}</div>
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
              <span class="badge badge-danger">${w.length+D.length+j.length}</span>
            </div>
            <div class="card-body" style="padding: 12px 16px;">
              <div class="d-flex flex-col gap-2">
                ${D.map(T=>`
                  <div class="alert alert-danger" style="margin-bottom: 4px; padding: 10px 12px;">
                    <div>
                      <div class="font-bold">\u274C Producto Agotado</div>
                      <div class="text-xs">${T.nombre} (Stock: 0 ${T.unidadMedida})</div>
                      <a href="#production" class="text-xs font-bold text-danger" style="text-decoration: underline; margin-top: 4px; display: inline-block;">Programar Producci\xF3n \u2192</a>
                    </div>
                  </div>
                `).join("")}

                ${w.map(T=>`
                  <div class="alert alert-warning" style="margin-bottom: 4px; padding: 10px 12px;">
                    <div>
                      <div class="font-bold">\u26A0\uFE0F Stock Cr\xEDtico M\xEDnimo</div>
                      <div class="text-xs">${T.nombre} (Existencias: ${T.stock} / M\xEDnimo: ${T.stockMinimo})</div>
                    </div>
                  </div>
                `).join("")}

                ${j.map(T=>`
                  <div class="alert alert-warning" style="margin-bottom: 4px; padding: 10px 12px;">
                    <div>
                      <div class="font-bold">\u23F0 Factura en Mora</div>
                      <div class="text-xs">${T.clienteNombre} - Doc ${T.documento} - Saldo: ${g.currency(T.saldo)}</div>
                    </div>
                  </div>
                `).join("")}

                ${w.length===0&&D.length===0&&j.length===0?`
                  <div class="text-center text-muted" style="padding: 20px;">
                    \u2713 Todas las operaciones se encuentran al d\xEDa. Sin alertas activas.
                  </div>
                `:""}
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
    `,e.querySelector("#btn-refresh-dashboard").addEventListener("click",()=>{this.render(e)}),e.querySelector("#btn-quick-new-sale").addEventListener("click",()=>{window.location.hash="#sales-pos"}),e.querySelectorAll("[data-nav-to]").forEach(T=>{T.addEventListener("click",O=>{let _=O.currentTarget.getAttribute("data-nav-to");window.location.hash=`#${_}`})});let ee=e.querySelector("#btn-dash-wa-summary");ee&&ee.addEventListener("click",()=>{let T=new Date().toLocaleDateString("es-CO",{weekday:"long",year:"numeric",month:"long",day:"numeric"}),O=`\u{1F4CA} *RESUMEN EJECUTIVO DIARIO - ${t.nombreComercial}*
\u{1F4C5} *Fecha:* ${T}

\u{1F4B0} *Ventas del D\xEDa:* ${g.currency(u)}
\u{1F4C8} *Ventas Acumuladas Mes:* ${g.currency(b)}
\u{1F48E} *Utilidad Estimada Mes:* ${g.currency(W)}
\u26A0\uFE0F *Cartera Pendiente Total:* ${g.currency(P)}
\u{1F6A8} *Cartera en Mora:* ${g.currency(j.reduce((_,$)=>_+Number($.saldo||0),0))} (${j.length} cuentas)
\u{1F4E6} *Inventario Valorizado:* ${g.currency(R)} (${r.length} referencias)
\u{1F69A} *Despachos Activos:* ${M.length} \xF3rdenes en curso

${w.length>0?`\u26A0\uFE0F *Productos con Stock Bajo:* ${w.map(_=>_.nombre+" ("+_.stock+")").join(", ")}
`:""}
\u2705 Cierre y monitoreo generado desde Nexa ERP.`;x.show({title:"\u{1F4F2} Enviar Resumen Diario a Socios por WhatsApp",size:"md",content:`
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
              <input type="text" class="form-control font-bold" id="dash-wa-phone" value="${t.whatsapp?t.whatsapp.replace(/\D/g,""):"57"}" placeholder="Ej: 573124567890">
            </div>

            <div class="form-group mb-3">
              <label class="form-label font-bold">Mensaje Ejecutivo a Enviar</label>
              <textarea class="form-control" id="dash-wa-text" rows="10" style="font-size: 12px; font-family: monospace; line-height: 1.4;">${O}</textarea>
            </div>
          `,footerButtons:[{label:"Cancelar",class:"btn-secondary",onClick:()=>x.close()},{label:"\u{1F4AC} Abrir en WhatsApp Web y Enviar",class:"btn-primary",onClick:()=>{let _=document.getElementById("dash-wa-phone"),$=document.getElementById("dash-wa-text"),q=(_?_.value:"").replace(/\D/g,""),K=$?$.value:O;if(!q||q.length<10){C.warning("Por favor ingrese un n\xFAmero de tel\xE9fono v\xE1lido.");return}window.open(`https://api.whatsapp.com/send?phone=${q}&text=${encodeURIComponent(K)}`,"_blank"),C.success("Abriendo WhatsApp Web con el resumen del d\xEDa..."),x.close()}}]})});let te=e.querySelector("#btn-dash-email-summary");te&&te.addEventListener("click",()=>{let T=new Date().toLocaleDateString("es-CO"),O=`Resumen Ejecutivo Diario - ${t.nombreComercial} (${T})`,_=`Resumen Ejecutivo Diario - ${t.nombreComercial}
Fecha: ${T}

Ventas del D\xEDa: ${g.currency(u)}
Ventas Mes: ${g.currency(b)}
Utilidad Estimada: ${g.currency(W)}
Cartera Pendiente: ${g.currency(P)}
Inventario: ${g.currency(R)}

Generado por Nexa ERP.`;window.open(`mailto:?subject=${encodeURIComponent(O)}&body=${encodeURIComponent(_)}`,"_blank")});let Y=e.querySelector("#btn-dash-calendar");Y&&Y.addEventListener("click",()=>{let T=new Date().toISOString().split("T")[0].replace(/-/g,""),O=new Date,$=new Date(O.getFullYear(),O.getMonth()+1,0).toISOString().split("T")[0].replace(/-/g,""),q=`${O.getFullYear()}1231`;x.show({title:"\u{1F4C5} Programar Cierres & Recordatorios en Google Calendar",size:"md",content:`
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
          `,footerButtons:[{label:"Cerrar",class:"btn-secondary",onClick:()=>x.close()}]});let K=(oe,qe,Fe,Ge)=>{let He=`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(oe)}&dates=${qe}/${Fe}&details=${encodeURIComponent(Ge)}&location=Rayo+Pro+Colombia`;window.open(He,"_blank"),C.info("Abriendo Google Calendar...")};document.getElementById("btn-gcal-daily")?.addEventListener("click",()=>{K(`Cierre de Caja y Arqueo Diario - ${t.nombreComercial}`,`${T}T183000Z`,`${T}T190000Z`,"Conciliaci\xF3n de efectivo f\xEDsico, transferencias Nequi/Daviplata y env\xEDo de reporte a socios en Nexa ERP.")}),document.getElementById("btn-gcal-monthly")?.addEventListener("click",()=>{K(`Cierre Mensual de Inventario y Contabilidad - ${t.nombreComercial}`,`${$}T170000Z`,`${$}T190000Z`,"Auditor\xEDa de existencias f\xEDsicas en bodega vs Kardex y balance general mensual en Nexa ERP.")}),document.getElementById("btn-gcal-dian")?.addEventListener("click",()=>{K(`Vencimiento Tributario DIAN (IVA / ReteFuente) - ${t.nombreComercial}`,`${$}T140000Z`,`${$}T160000Z`,`Presentaci\xF3n y pago de obligaciones tributarias DIAN para NIT ${t.nit}-${t.dv}.`)}),document.getElementById("btn-gcal-yearly")?.addEventListener("click",()=>{K(`Cierre Anual Fiscal y Balance General - ${t.nombreComercial}`,`${q}T150000Z`,`${q}T180000Z`,"Cierre de ejercicio fiscal anual, inventario total valorizado y distribuci\xF3n de utilidades a socios.")})})}};N();B();var L=class{constructor({containerId:t,columns:o=[],data:a=[],pageSize:r=10,searchable:s=!0,searchPlaceholder:i="Buscar en la tabla...",emptyMessage:n="No se encontraron registros.",actions:d=null}){this.container=typeof t=="string"?document.getElementById(t):t,this.columns=o,this.rawData=[...a],this.filteredData=[...a],this.pageSize=r,this.currentPage=1,this.searchQuery="",this.sortKey=null,this.sortAsc=!0,this.searchable=s,this.searchPlaceholder=i,this.emptyMessage=n,this.actions=d,this.render()}updateData(t){this.rawData=[...t],this.applyFilters()}applyFilters(){let t=[...this.rawData];if(this.searchQuery.trim()){let o=this.searchQuery.toLowerCase();t=t.filter(a=>this.columns.some(r=>{let s=a[r.key];return s==null?!1:String(s).toLowerCase().includes(o)}))}this.sortKey&&t.sort((o,a)=>{let r=o[this.sortKey],s=a[this.sortKey];if(r===s)return 0;if(r==null)return 1;if(s==null)return-1;let i=r>s?1:-1;return this.sortAsc?i:-i}),this.filteredData=t,this.currentPage=1,this.renderBody()}render(){if(!this.container)return;this.container.innerHTML=`
      <div class="card" style="margin-bottom: 0;">
        ${this.searchable?`
          <div class="table-toolbar">
            <div class="table-search">
              <span class="table-search-icon">\u{1F50D}</span>
              <input type="text" class="table-search-input" placeholder="${this.searchPlaceholder}" value="${this.searchQuery}">
            </div>
            <div class="table-info-counter text-xs text-muted"></div>
          </div>
        `:""}
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                ${this.columns.map(o=>`
                  <th style="cursor: pointer; ${o.width?`width: ${o.width};`:""}" data-col-key="${o.key}">
                    ${o.title} <span class="sort-indicator" data-sort-for="${o.key}">\u2195</span>
                  </th>
                `).join("")}
                ${this.actions?'<th style="text-align: right; width: 120px;">Acciones</th>':""}
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
    `;let t=this.container.querySelector(".table-search-input");t&&t.addEventListener("input",o=>{this.searchQuery=o.target.value,this.applyFilters()}),this.container.querySelectorAll("thead th[data-col-key]").forEach(o=>{o.addEventListener("click",()=>{let a=o.getAttribute("data-col-key");this.sortKey===a?this.sortAsc=!this.sortAsc:(this.sortKey=a,this.sortAsc=!0),this.applyFilters()})}),this.container.querySelector(".btn-prev").addEventListener("click",()=>{this.currentPage>1&&(this.currentPage--,this.renderBody())}),this.container.querySelector(".btn-next").addEventListener("click",()=>{let o=Math.ceil(this.filteredData.length/this.pageSize)||1;this.currentPage<o&&(this.currentPage++,this.renderBody())}),this.renderBody()}renderBody(){let t=this.container.querySelector(".table-body"),o=this.container.querySelector(".pagination-info"),a=this.container.querySelector(".table-info-counter"),r=this.container.querySelector(".btn-prev"),s=this.container.querySelector(".btn-next"),i=this.filteredData.length,n=Math.ceil(i/this.pageSize)||1,d=(this.currentPage-1)*this.pageSize,l=this.filteredData.slice(d,d+this.pageSize);if(a&&(a.textContent=`Mostrando ${l.length} de ${i} registros`),o&&(o.textContent=`P\xE1gina ${this.currentPage} de ${n} (${i} total)`),r&&(r.disabled=this.currentPage<=1),s&&(s.disabled=this.currentPage>=n),this.container.querySelectorAll("[data-sort-for]").forEach(c=>{c.getAttribute("data-sort-for")===this.sortKey?(c.textContent=this.sortAsc?"\u2191":"\u2193",c.style.color="var(--brand-primary)"):(c.textContent="\u2195",c.style.color="var(--text-light)")}),l.length===0){let c=this.columns.length+(this.actions?1:0);t.innerHTML=`
        <tr>
          <td colspan="${c}" class="text-center" style="padding: 30px; color: var(--text-muted);">
            ${this.emptyMessage}
          </td>
        </tr>
      `;return}t.innerHTML=l.map(c=>{let p=this.columns.map(u=>{let b=c[u.key];return u.render?b=u.render(c[u.key],c):b==null&&(b="-"),`<td>${b}</td>`}).join(""),m="";return this.actions&&(m=`<td style="text-align: right; white-space: nowrap;">${this.actions(c)}</td>`),`<tr>${p}${m}</tr>`}).join("")}};var se={"Consumidor Final":{priceListOrder:1,badge:"badge-neutral",titulo:"P1 - Precio P\xFAblico / Final",requisitos:"Sin m\xEDnimo de compra. Venta al detal y mostrador. Pago 100% de contado (Efectivo, Nequi, Tarjeta). Sin cupo de cr\xE9dito.",cupoRecomendado:0,diasCredito:0},"Taller / Detailing":{priceListOrder:2,badge:"badge-info",titulo:"P2 - Precio Lavaderos & Centros de Detailing",requisitos:"Negocio f\xEDsico activo de autolavado o taller. RUT o registro fotogr\xE1fico. Frecuencia de compra quincenal. Descuento profesional.",cupoRecomendado:8e5,diasCredito:15},Mayorista:{priceListOrder:3,badge:"badge-warning",titulo:"P3 - Precio Mayorista por Cajas (Docenas)",requisitos:"Compras m\xEDnimas por cajas cerradas de 12 unidades o pedido consolidado superior a $600.000 COP. Despacho directo.",cupoRecomendado:25e5,diasCredito:30},Distribuidor:{priceListOrder:4,badge:"badge-primary",titulo:"P4 - Precio Distribuidor Autorizado Regional",requisitos:"Almac\xE9n de repuestos o lubricentro con fuerza comercial. Pedido inicial de apertura m\xEDnimo de $2.500.000 COP y recompra mensual sostenida. C\xE1mara de Comercio y 2 referencias.",cupoRecomendado:6e6,diasCredito:30},"Flotas / Convenios":{priceListOrder:5,badge:"badge-success",titulo:"P5 - Precio Especial Grandes Flotas & Convenios",requisitos:"Flotas de tractomulas, camiones pesados o buses (>10 veh\xEDculos, ej: Cano Trucks). Suministro en garrafas 23L o canecas. Convenio corporativo formal a cr\xE9dito.",cupoRecomendado:12e6,diasCredito:45}},ie={async render(e){let t=I.getActiveTenant(),o=t?t.id:"tenant_rayopro",[a,r,s,i,n]=await Promise.all([f.getAll(v.CUSTOMERS,o),f.getAll(v.PRICE_LISTS,o),f.getAll(v.SALES,o),f.getAll(v.RECEIVABLES_CXC,o),f.getAll(v.ORDERS_SHIPPING,o)]);e.innerHTML=`
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
    `;let d=new L({containerId:"clients-table-container",data:a,columns:[{key:"codigo",title:"C\xF3digo",width:"90px",render:p=>`<strong>${p||"-"}</strong>`},{key:"nombre",title:"Cliente / Raz\xF3n Social",render:(p,m)=>`
            <div>
              <div class="font-bold">${p}</div>
              <div class="text-xs text-muted">NIT/CC: ${z.formatWithDV(m.nitCc)}</div>
            </div>
          `},{key:"tipoCliente",title:"Tipo / Segmento",render:p=>{let m=se[p];return`<span class="badge ${m?m.badge:"badge-neutral"}" style="font-weight: 700;">${p||"General"}</span>`}},{key:"ciudad",title:"Ciudad",render:(p,m)=>`${p||"-"}, ${m.departamento||""}`},{key:"telefono",title:"Contacto",render:(p,m)=>`
            <div class="text-xs">
              <div>\u{1F4DE} ${p||"-"}</div>
              ${m.whatsapp?`<div>\u{1F4AC} <a href="https://wa.me/${m.whatsapp.replace(/\D/g,"")}" target="_blank" style="color: var(--brand-primary);">${m.whatsapp}</a></div>`:""}
            </div>
          `},{key:"listaPreciosId",title:"Lista Asignada",render:p=>{let m=r.find(u=>u.id===p);return`<span class="badge badge-info">${m?m.nombre:"P1 (P\xFAblico)"}</span>`}},{key:"facturaElectronica",title:"Facturaci\xF3n & IVA",render:(p,m)=>{let u=p!==!1,b=m.aplicaIva!==!1;return`
              <div>
                <span class="badge ${u?"badge-success":"badge-neutral"}" style="font-size: 11px;">
                  ${u?"\u26A1 Factura Electr\xF3nica":"\u{1F4C4} Remisi\xF3n / POS Sin FE"}
                </span>
                <div class="text-xs" style="margin-top: 2px; color: ${b?"var(--text-muted)":"var(--color-warning)"}; font-weight: ${b?"normal":"bold"};">
                  ${b?"\u2713 Con IVA (19%)":"\u2715 Exento / Sin IVA (0%)"}
                </div>
              </div>
            `}},{key:"saldoPendiente",title:"Saldo Cartera",render:p=>{let m=Number(p||0);return m>0?`<strong class="text-danger">${g.currency(m)}</strong>`:'<span class="text-success">$ 0</span>'}},{key:"estado",title:"Estado",render:p=>`<span class="badge ${p==="ACTIVO"?"badge-success":"badge-danger"}">${p}</span>`}],actions:p=>`
        <button class="btn btn-secondary btn-sm btn-view-client" data-id="${p.id}" title="Ficha 360\xB0">\u{1F441}\uFE0F Ficha</button>
        <button class="btn btn-secondary btn-sm btn-edit-client" data-id="${p.id}" title="Editar">\u270F\uFE0F</button>
      `}),l=e.querySelector("#btn-export-clients");l&&l.addEventListener("click",async()=>{let{ExportService:p}=await Promise.resolve().then(()=>(Q(),fe));p.exportToCSV(a,"Clientes_RayoPro")});let c=e.querySelector("#btn-new-client");c&&c.addEventListener("click",()=>{this.openClientModal(null,o,r,()=>this.render(e))}),e.addEventListener("click",p=>{let m=p.target.closest(".btn-edit-client");if(m){let b=m.getAttribute("data-id"),h=a.find(y=>y.id===b);this.openClientModal(h,o,r,()=>this.render(e));return}let u=p.target.closest(".btn-view-client");if(u){let b=u.getAttribute("data-id"),h=a.find(A=>A.id===b),y=s.filter(A=>A.clienteId===b),E=i.filter(A=>A.clienteId===b),P=n.filter(A=>A.clienteId===b);this.openClientProfileModal(h,y,r,E,P)}})},openClientModal(e=null,t,o,a){let r=!!e,s=`
      <form id="client-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">C\xF3digo Interno</label>
            <input type="text" class="form-control" name="codigo" required value="${e?e.codigo:"CLI-"+Math.floor(100+Math.random()*900)}">
          </div>
          <div class="form-group">
            <label class="form-label">Tipo de Persona</label>
            <select class="form-select" name="tipoPersona" id="modal-client-persona">
              <option value="NATURAL" ${e&&e.tipoPersona==="NATURAL"?"selected":""}>Persona Natural</option>
              <option value="JURIDICA" ${!e||e.tipoPersona==="JURIDICA"?"selected":""}>Persona Jur\xEDdica (Empresa)</option>
            </select>
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">Nombre Comercial o Completo</label>
            <input type="text" class="form-control" name="nombre" required value="${e?e.nombre:""}" placeholder="Ej: AutoSpa Medell\xEDn o Juan P\xE9rez">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">NIT o C\xE9dula (Sin DV)</label>
            <input type="text" class="form-control" id="modal-client-nit" name="nitCc" required value="${e?e.nitCc:""}" placeholder="Ej: 901458321">
          </div>
          <div class="form-group">
            <label class="form-label">DV (C\xE1lculo DIAN)</label>
            <input type="text" class="form-control" id="modal-client-dv" name="dv" readonly value="${e?e.dv:"-"}" style="background: #f1f5f9; font-weight: bold;">
          </div>
        </div>

        <div class="form-row mb-1">
          <div class="form-group">
            <label class="form-label font-bold">Tipo / Segmento Comercial</label>
            <select class="form-select" name="tipoCliente" id="modal-client-segment">
              <option value="Consumidor Final" ${e&&e.tipoCliente==="Consumidor Final"?"selected":""}>Consumidor Final (P1 - P\xFAblico)</option>
              <option value="Taller / Detailing" ${!e||e.tipoCliente==="Taller / Detailing"?"selected":""}>Taller / Detailing (P2 - Taller)</option>
              <option value="Mayorista" ${e&&e.tipoCliente==="Mayorista"?"selected":""}>Mayorista (P3 - Docenas/Cajas)</option>
              <option value="Distribuidor" ${e&&e.tipoCliente==="Distribuidor"?"selected":""}>Distribuidor (P4 - Distribuidor)</option>
              <option value="Flotas / Convenios" ${e&&e.tipoCliente==="Flotas / Convenios"?"selected":""}>Flotas / Convenios (P5 - Especial)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label font-bold">Lista de Precios Asignada</label>
            <select class="form-select" name="listaPreciosId" id="modal-client-pricelist">
              ${o.map(h=>`
                <option value="${h.id}" ${e&&e.listaPreciosId===h.id?"selected":""}>${h.nombre}</option>
              `).join("")}
            </select>
          </div>
        </div>

        <!-- GU\xCDA DE REQUISITOS Y CONDICIONES POR SEGMENTO -->
        <div id="modal-segment-guide" class="mb-3" style="background: var(--bg-surface-solid); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px 14px; font-size: 11.5px; line-height: 1.4;">
          <div style="font-weight: 700; color: var(--brand-primary); margin-bottom: 2px;" id="modal-seg-title">
            ${se[e?.tipoCliente||"Taller / Detailing"]?.titulo||"Condiciones Comerciales"}
          </div>
          <div style="color: var(--text-secondary);" id="modal-seg-requisitos">
            <strong>Requisitos Comerciales:</strong> ${se[e?.tipoCliente||"Taller / Detailing"]?.requisitos||""}
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Tel\xE9fono Fijo / M\xF3vil</label>
            <input type="text" class="form-control" name="telefono" value="${e?e.telefono:""}">
          </div>
          <div class="form-group">
            <label class="form-label">WhatsApp (Notificaciones)</label>
            <input type="text" class="form-control" name="whatsapp" value="${e?e.whatsapp:""}" placeholder="+573001234567">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Correo Electr\xF3nico</label>
            <input type="email" class="form-control" name="email" value="${e?e.email:""}">
          </div>
          <div class="form-group">
            <label class="form-label">Ciudad / Municipio</label>
            <input type="text" class="form-control" name="ciudad" value="${e?e.ciudad:"Medell\xEDn"}">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Direcci\xF3n de Entrega</label>
            <input type="text" class="form-control" name="direccion" value="${e?e.direccion:""}">
          </div>
          <div class="form-group">
            <label class="form-label">Barrio / Sector</label>
            <input type="text" class="form-control" name="barrio" value="${e?e.barrio:""}">
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
                <option value="SI" ${!e||e.facturaElectronica!==!1?"selected":""}>\u26A1 S\xED - Factura Electr\xF3nica DIAN</option>
                <option value="NO" ${e&&e.facturaElectronica===!1?"selected":""}>\u{1F4C4} No - Remisi\xF3n / Venta Interna (Sin FE)</option>
              </select>
              <span class="form-help">Para clientes que a\xFAn no requieren o no reciben FE formal.</span>
            </div>
            <div class="form-group mb-0">
              <label class="form-label font-bold">\xBFLiquidar con IVA (19%)?</label>
              <select class="form-select" name="aplicaIva" id="modal-client-iva">
                <option value="SI" ${!e||e.aplicaIva!==!1?"selected":""}>\u2713 S\xED - Liquidar IVA (19%)</option>
                <option value="NO" ${e&&e.aplicaIva===!1?"selected":""}>\u2715 No - Sin IVA / Exento (0% Etapa Inicial)</option>
              </select>
              <span class="form-help">Ideal para empresas en etapa inicial o tratos comerciales netos.</span>
            </div>
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Cupo de Cr\xE9dito ($ COP)</label>
            <input type="number" class="form-control" name="cupoCredito" value="${e?e.cupoCredito:0}">
          </div>
          <div class="form-group">
            <label class="form-label">D\xEDas de Cr\xE9dito Plazo</label>
            <input type="number" class="form-control" name="diasCredito" value="${e?e.diasCredito:0}">
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Observaciones Comerciales</label>
          <textarea class="form-control" name="observaciones" rows="2">${e&&e.observaciones||""}</textarea>
        </div>
      </form>
    `,i=x.show({title:r?`Editar Cliente: ${e.nombre}`:"Crear Nuevo Cliente",content:s,size:"lg",footerButtons:[{label:"Cancelar",class:"btn-secondary",onClick:()=>x.close()},{label:r?"Guardar Cambios":"Crear Cliente",class:"btn-primary",onClick:async()=>{let h=i.querySelector("#client-form");if(!h.checkValidity()){h.reportValidity();return}let y=new FormData(h),E=y.get("nitCc").replace(/\D/g,""),P=z.calculate(E),A={tenantId:t,codigo:y.get("codigo"),tipoPersona:y.get("tipoPersona"),nombre:y.get("nombre"),nitCc:E,dv:P!==null?P:0,tipoCliente:y.get("tipoCliente"),listaPreciosId:y.get("listaPreciosId"),facturaElectronica:y.get("facturaElectronica")==="SI",aplicaIva:y.get("aplicaIva")==="SI",telefono:y.get("telefono"),whatsapp:y.get("whatsapp"),email:y.get("email"),direccion:y.get("direccion"),ciudad:y.get("ciudad"),barrio:y.get("barrio"),cupoCredito:Number(y.get("cupoCredito")||0),diasCredito:Number(y.get("diasCredito")||0),observaciones:y.get("observaciones"),estado:"ACTIVO"};if(r)A.id=e.id,A.saldoPendiente=e.saldoPendiente||0,A.totalComprado=e.totalComprado||0,A.numeroCompras=e.numeroCompras||0,await f.update(v.CUSTOMERS,A),await V.log({modulo:"Clientes",accion:"MODIFICAR",registroId:A.codigo,campoModificado:"Datos Generales",valorAnterior:e.nombre,valorNuevo:A.nombre}),C.success("Cliente actualizado correctamente.");else{A.saldoPendiente=0,A.totalComprado=0,A.numeroCompras=0;let R=await f.add(v.CUSTOMERS,A);await V.log({modulo:"Clientes",accion:"CREAR",registroId:A.codigo,campoModificado:"Cliente Nuevo",valorAnterior:"-",valorNuevo:A.nombre}),C.success("Cliente registrado exitosamente."),x.close(),a&&a(R||A);return}x.close(),a&&a(A)}}]}),n=i.querySelector("#modal-client-nit"),d=i.querySelector("#modal-client-dv");n.addEventListener("input",h=>{let y=h.target.value.replace(/\D/g,""),E=z.calculate(y);d.value=E!==null?E:"-"});let l=i.querySelector("#modal-client-segment"),c=i.querySelector("#modal-client-pricelist"),p=i.querySelector("#modal-seg-title"),m=i.querySelector("#modal-seg-requisitos"),u=i.querySelector('input[name="cupoCredito"]'),b=i.querySelector('input[name="diasCredito"]');l&&c&&l.addEventListener("change",h=>{let y=h.target.value,E=se[y];if(E){p&&(p.textContent=E.titulo),m&&(m.innerHTML=`<strong>Requisitos Comerciales:</strong> ${E.requisitos}`);let P=o.find(A=>A.orden===E.priceListOrder)||o[E.priceListOrder-1];P&&(c.value=P.id),!r&&u&&b&&(u.value=E.cupoRecomendado,b.value=E.diasCredito)}})},openClientProfileModal(e,t=[],o,a=[],r=[]){let s=o.find(p=>p.id===e.listaPreciosId),i=s?s.nombre:"Precio P\xFAblico",n=t.reduce((p,m)=>p+Number(m.total||0),e.totalComprado||0),d=Math.max(t.length,e.numeroCompras||0),l=d>0?Math.round(n/d):0,c=`
      <div class="mb-4" style="background: rgba(0, 113, 227, 0.03); padding: 18px; border-radius: 16px; border: 1px solid rgba(0, 113, 227, 0.12);">
        <div class="d-flex justify-between items-center mb-2">
          <div>
            <h2 style="font-size: 20px; font-weight: 700; color: var(--text-main); margin: 0; letter-spacing: -0.02em;">${e.nombre}</h2>
            <div class="text-xs text-muted" style="margin-top: 2px;">NIT/CC: <strong>${z.formatWithDV(e.nitCc)}</strong> \u2022 Segmento: <span class="badge badge-neutral" style="font-size: 11px;">${e.tipoCliente}</span></div>
          </div>
          <span class="badge ${e.estado==="ACTIVO"?"badge-success":"badge-danger"}">${e.estado}</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 14px;">
          <div style="background: var(--bg-surface-solid); padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-xs);">
            <div class="text-xs text-muted">Total Comprado</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--color-success);">${g.currency(n)}</div>
          </div>
          <div style="background: var(--bg-surface-solid); padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-xs);">
            <div class="text-xs text-muted">Saldo en Cartera</div>
            <div style="font-size: 16px; font-weight: 700; color: ${e.saldoPendiente>0?"var(--color-danger)":"var(--color-success)"};">
              ${g.currency(e.saldoPendiente||0)}
            </div>
          </div>
          <div style="background: var(--bg-surface-solid); padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-xs);">
            <div class="text-xs text-muted">Cupo Disponible</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--brand-primary);">
              ${g.currency(Math.max(0,(e.cupoCredito||0)-(e.saldoPendiente||0)))}
            </div>
          </div>
          <div style="background: var(--bg-surface-solid); padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); box-shadow: var(--shadow-xs);">
            <div class="text-xs text-muted">Ticket Promedio</div>
            <div style="font-size: 16px; font-weight: 700; color: var(--text-main);">${g.currency(l)}</div>
          </div>
        </div>
      </div>

      <div class="d-flex flex-col gap-2 mb-4 text-xs" style="color: var(--text-main); background: var(--bg-surface-solid); padding: 14px; border-radius: 12px; border: 1px solid var(--border-color);">
        <div>\u{1F4CD} <strong>Direcci\xF3n de Entrega:</strong> ${e.direccion||"-"}, ${e.barrio||""} (${e.ciudad||"-"}, ${e.departamento||""})</div>
        <div>\u{1F4DE} <strong>Contacto Comercial:</strong> ${e.telefono||"-"} | <strong>WhatsApp:</strong> ${e.whatsapp||"-"} | <strong>Email:</strong> ${e.email||"-"}</div>
        <div>\u{1F3F7}\uFE0F <strong>Lista de Precios Predilecta:</strong> <span class="badge badge-info" style="font-size: 11px;">${i}</span></div>
        <div>\u26A1 <strong>R\xE9gimen de Facturaci\xF3n:</strong> 
          <span class="badge ${e.facturaElectronica!==!1?"badge-success":"badge-neutral"}" style="font-size: 11px;">
            ${e.facturaElectronica!==!1?"Facturaci\xF3n Electr\xF3nica DIAN":"Documento Interno / Sin FE"}
          </span>
          <span class="badge ${e.aplicaIva!==!1?"badge-info":"badge-warning"}" style="font-size: 11px; margin-left: 6px;">
            ${e.aplicaIva!==!1?"Liquida IVA (19%)":"Exento de IVA / Etapa Inicial (0%)"}
          </span>
        </div>
        <div>\u23F1\uFE0F <strong>Condici\xF3n de Cr\xE9dito:</strong> ${e.diasCredito>0?`${e.diasCredito} D\xEDas plazo (Cupo Total: ${g.currency(e.cupoCredito)})`:"Contado inmediato"}</div>
        ${e.observaciones?`<div style="background: rgba(245, 158, 11, 0.08); padding: 8px 12px; border-radius: 8px; border-left: 3px solid #f59e0b; margin-top: 4px;">\u{1F4DD} <strong>Notas Internas:</strong> ${e.observaciones}</div>`:""}
      </div>

      <!-- SECCI\xD3N CARTERA & ABONOS HIST\xD3RICOS -->
      ${a.length>0?`
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
                ${a.map(p=>`
                  <tr>
                    <td><strong>${p.documento}</strong><br><span class="text-xs text-muted">${p.observaciones||""}</span></td>
                    <td>${g.date(p.fechaEmision)}<br><span class="text-xs text-muted">Vence: ${g.date(p.fechaVencimiento)}</span></td>
                    <td class="text-right font-medium">${g.currency(p.valorTotal)}</td>
                    <td class="text-right font-medium" style="color: var(--color-success);">- ${g.currency(p.abonos||0)}</td>
                    <td class="text-right font-bold" style="color: var(--color-danger);">${g.currency(p.saldo)}</td>
                    <td><span class="badge ${p.saldo===0?"badge-success":"badge-warning"}">${p.estado}</span></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `:""}

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
            ${t.length>0?t.map(p=>`
              <tr>
                <td><strong>${p.consecutivo}</strong></td>
                <td>${g.date(p.fecha)}</td>
                <td>${p.metodoPago}</td>
                <td class="text-right font-bold">${g.currency(p.total)}</td>
                <td><span class="badge ${p.estado==="PAGADA"?"badge-success":"badge-warning"}">${p.estado}</span></td>
              </tr>
            `).join(""):`
              <tr><td colspan="5" class="text-center text-muted" style="padding: 15px;">Sin compras registradas a\xFAn.</td></tr>
            `}
          </tbody>
        </table>
      </div>

      <!-- DESPACHOS RECIENTES -->
      ${r.length>0?`
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
                ${r.map(p=>`
                  <tr>
                    <td><strong>${p.numeroGuia}</strong></td>
                    <td>${p.transportadora}</td>
                    <td>${p.cajasTotal||1} Cajas</td>
                    <td class="text-xs">${p.contenidoDescripcion||"-"}</td>
                    <td><span class="badge ${p.estadoCiclo==="ENTREGADO"?"badge-success":"badge-info"}">${p.estadoCiclo}</span></td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `:""}
    `;x.show({title:`Ficha 360\xB0 del Cliente: ${e.nombre}`,content:c,size:"lg",footerButtons:[{label:"Cerrar",class:"btn-secondary",onClick:()=>x.close()}]})}};N();B();var Ae={async render(e){let t=I.getActiveTenant(),o=t?t.id:"tenant_rayopro",[a,r,s]=await Promise.all([f.getAll(v.PRODUCTS,o),f.getAll(v.PRICE_LISTS,o),f.getAll(v.WAREHOUSES,o)]);e.innerHTML=`
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
          <button class="btn btn-secondary btn-sm filter-type-btn active" data-type="ALL">Todos (${a.length})</button>
          <button class="btn btn-secondary btn-sm filter-type-btn" data-type="PRODUCTO_TERMINADO">\u26A1 Terminados Fabricados (${a.filter(c=>c.tipoItem==="PRODUCTO_TERMINADO").length})</button>
          <button class="btn btn-secondary btn-sm filter-type-btn" data-type="MATERIA_PRIMA">\u{1F9EA} Materias Primas Qu\xEDmicas (${a.filter(c=>c.tipoItem==="MATERIA_PRIMA").length})</button>
          <button class="btn btn-secondary btn-sm filter-type-btn" data-type="MERCANCIA">\u{1F6CD}\uFE0F Mercanc\xEDa Reventa (${a.filter(c=>c.tipoItem==="MERCANCIA").length})</button>
        </div>
      </div>

      <div id="products-table-container"></div>
    `;let i=[...a],n=new L({containerId:"products-table-container",data:i,columns:[{key:"sku",title:"SKU / C\xF3digo",width:"120px",render:(c,p)=>`
            <div>
              <strong style="color: var(--brand-primary);">${c||p.codigoInterno}</strong>
              <div class="text-xs text-muted">${p.codigoBarras||""}</div>
            </div>
          `},{key:"nombre",title:"Descripci\xF3n / Presentaci\xF3n",render:(c,p)=>`
            <div>
              <div class="font-bold">${c}</div>
              <div class="text-xs text-muted">${p.categoria} \u2022 ${p.presentacion||p.unidadMedida}</div>
            </div>
          `},{key:"tipoItem",title:"Tipo",render:c=>{let m={PRODUCTO_TERMINADO:{label:"Terminado",class:"badge-info"},MATERIA_PRIMA:{label:"Materia Prima",class:"badge-warning"},MERCANCIA:{label:"Mercanc\xEDa",class:"badge-neutral"},SERVICIO:{label:"Servicio",class:"badge-success"}}[c]||{label:c,class:"badge-neutral"};return`<span class="badge ${m.class}">${m.label}</span>`}},{key:"stock",title:"Existencias",render:(c,p)=>{let m=Number(c||0),u=Number(p.stockMinimo||10),b="badge-success";return m<=0?b="badge-danger":m<=u&&(b="badge-warning"),`
              <div>
                <span class="badge ${b}">${m} ${p.unidadMedida}</span>
                <div class="text-xs text-muted" style="margin-top: 2px;">M\xEDn: ${u} | M\xE1x: ${p.stockMaximo||100}</div>
              </div>
            `}},{key:"costoPromedio",title:"Costo Promedio",render:c=>g.currency(c)},{key:"precios",title:"Precio 1 (P\xFAblico)",render:(c,p)=>{let m=p.precios&&p.precios.plist_1||0;return`<strong>${g.currency(m)}</strong>`}},{key:"estado",title:"Estado",render:c=>`<span class="badge ${c==="ACTIVO"?"badge-success":"badge-danger"}">${c}</span>`}],actions:c=>`
        <button class="btn btn-secondary btn-sm btn-edit-product" data-id="${c.id}" title="Editar">\u270F\uFE0F Editar</button>
      `});e.querySelectorAll(".filter-type-btn").forEach(c=>{c.addEventListener("click",p=>{e.querySelectorAll(".filter-type-btn").forEach(u=>u.classList.remove("active")),c.classList.add("active");let m=c.getAttribute("data-type");m==="ALL"?i=[...a]:i=a.filter(u=>u.tipoItem===m),n.updateData(i)})});let d=e.querySelector("#btn-export-products");d&&d.addEventListener("click",async()=>{let{ExportService:c}=await Promise.resolve().then(()=>(Q(),fe));c.exportToCSV(a,"Catalogo_Productos_RayoPro")});let l=e.querySelector("#btn-new-product");l&&l.addEventListener("click",()=>{this.openProductModal(null,o,r,s,()=>this.render(e))}),e.addEventListener("click",c=>{let p=c.target.closest(".btn-edit-product");if(p){let m=p.getAttribute("data-id"),u=a.find(b=>b.id===m);this.openProductModal(u,o,r,s,()=>this.render(e))}})},openProductModal(e=null,t,o,a,r){let s=!!e,i=`
      <form id="product-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Tipo de \xCDtem</label>
            <select class="form-select" name="tipoItem">
              <option value="PRODUCTO_TERMINADO" ${e&&e.tipoItem==="PRODUCTO_TERMINADO"?"selected":""}>Producto Terminado (Fabricado)</option>
              <option value="MATERIA_PRIMA" ${e&&e.tipoItem==="MATERIA_PRIMA"?"selected":""}>Materia Prima / Qu\xEDmico / Insumo</option>
              <option value="MERCANCIA" ${e&&e.tipoItem==="MERCANCIA"?"selected":""}>Mercanc\xEDa para Reventa</option>
              <option value="SERVICIO" ${e&&e.tipoItem==="SERVICIO"?"selected":""}>Servicio</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">SKU / Referencia</label>
            <input type="text" class="form-control" name="sku" required value="${e?e.sku:"SKU-"+Math.floor(1e3+Math.random()*9e3)}" placeholder="Ej: RAYO-SHAMP-1G">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label">Nombre Comercial del Producto</label>
            <input type="text" class="form-control" name="nombre" required value="${e?e.nombre:""}" placeholder="Ej: Shampoo Automotriz pH Neutro 1 Gal\xF3n">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Categor\xEDa</label>
            <input type="text" class="form-control" name="categoria" required value="${e?e.categoria:"Lavado Exterior"}" placeholder="Ej: Lavado Exterior">
          </div>
          <div class="form-group">
            <label class="form-label">Unidad de Medida</label>
            <select class="form-select" name="unidadMedida">
              <option value="Unidad" ${e&&e.unidadMedida==="Unidad"?"selected":""}>Unidad</option>
              <option value="Gal\xF3n" ${e&&e.unidadMedida==="Gal\xF3n"?"selected":""}>Gal\xF3n (3785 ml)</option>
              <option value="Litro" ${e&&e.unidadMedida==="Litro"?"selected":""}>Litro</option>
              <option value="Kg" ${e&&e.unidadMedida==="Kg"?"selected":""}>Kilogramo (Kg)</option>
              <option value="Gramo" ${e&&e.unidadMedida==="Gramo"?"selected":""}>Gramo</option>
            </select>
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Costo Promedio ($ COP)</label>
            <input type="number" class="form-control" name="costoPromedio" id="prod-costo" value="${e?e.costoPromedio:0}">
          </div>
          <div class="form-group">
            <label class="form-label">Margen Esperado (%)</label>
            <input type="number" class="form-control" name="margenEsperado" value="${e?e.margenEsperado:50}">
          </div>
        </div>

        <!-- 5 LISTAS DE PRECIOS CONFIGURABLES -->
        <div class="card mb-3" style="background: var(--bg-surface); border: 1px solid var(--border-color);">
          <div class="card-header" style="padding: 10px 14px; background: rgba(0, 113, 227, 0.06); border-bottom: 1px solid var(--border-color);">
            <div class="card-title" style="font-size: 13px; font-weight: 700; color: var(--brand-primary);">\u{1F4B0} 5 Listas de Precios de Venta (COP)</div>
          </div>
          <div class="card-body" style="padding: 14px;">
            <div class="form-row">
              ${o.map(d=>`
                <div class="form-group mb-2">
                  <label class="form-label text-xs font-bold" style="color: var(--text-main);">${d.nombre}</label>
                  <input type="number" class="form-control font-bold" name="precio_${d.id}" value="${e&&e.precios&&e.precios[d.id]||0}" style="color: var(--brand-primary);">
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Stock M\xEDnimo Alerta</label>
            <input type="number" class="form-control" name="stockMinimo" value="${e?e.stockMinimo:15}">
          </div>
          <div class="form-group">
            <label class="form-label">Bodega Habitual</label>
            <select class="form-select" name="bodegaId">
              ${a.map(d=>`
                <option value="${d.id}" ${e&&e.bodegaId===d.id?"selected":""}>${d.nombre}</option>
              `).join("")}
            </select>
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Descripci\xF3n T\xE9cnica</label>
          <textarea class="form-control" name="descripcion" rows="2">${e&&e.descripcion||""}</textarea>
        </div>
      </form>
    `,n=x.show({title:s?`Editar Producto: ${e.nombre}`:"Nuevo Producto / Referencia",content:i,size:"lg",footerButtons:[{label:"Cancelar",class:"btn-secondary",onClick:()=>x.close()},{label:s?"Guardar Cambios":"Crear Producto",class:"btn-primary",onClick:async()=>{let d=n.querySelector("#product-form");if(!d.checkValidity()){d.reportValidity();return}let l=new FormData(d),c={};o.forEach(m=>{c[m.id]=Number(l.get(`precio_${m.id}`)||0)});let p={tenantId:t,tipoItem:l.get("tipoItem"),sku:l.get("sku"),codigoInterno:l.get("sku"),nombre:l.get("nombre"),categoria:l.get("categoria"),unidadMedida:l.get("unidadMedida"),costoPromedio:Number(l.get("costoPromedio")||0),margenEsperado:Number(l.get("margenEsperado")||0),stockMinimo:Number(l.get("stockMinimo")||0),bodegaId:l.get("bodegaId"),descripcion:l.get("descripcion"),precios:c,estado:"ACTIVO"};s?(p.id=e.id,p.stock=e.stock||0,await f.update(v.PRODUCTS,p),await V.log({modulo:"Productos",accion:"MODIFICAR",registroId:p.sku,campoModificado:"Ficha y Precios",valorAnterior:e.nombre,valorNuevo:`${p.nombre} (P1: $ ${c.plist_1||0})`}),C.success("Producto actualizado con \xE9xito.")):(p.stock=0,await f.add(v.PRODUCTS,p),await V.log({modulo:"Productos",accion:"CREAR",registroId:p.sku,campoModificado:"Producto Creado",valorAnterior:"-",valorNuevo:p.nombre}),C.success("Producto registrado exitosamente.")),x.close(),r&&r()}}]})}};N();B();N();var ne={COMPRA:{label:"Compra de Mercanc\xEDa/Insumos",type:"IN"},VENTA:{label:"Venta Facturada / POS",type:"OUT"},DEVOLUCION_VENTA:{label:"Devoluci\xF3n en Venta",type:"IN"},DEVOLUCION_COMPRA:{label:"Devoluci\xF3n a Proveedor",type:"OUT"},AJUSTE_POS:{label:"Ajuste de Inventario (+)",type:"IN"},AJUSTE_NEG:{label:"Ajuste de Inventario (-)",type:"OUT"},TRASLADO_ENTRADA:{label:"Traslado entre Bodegas (Entrada)",type:"IN"},TRASLADO_SALIDA:{label:"Traslado entre Bodegas (Salida)",type:"OUT"},PRODUCCION_ENTRADA:{label:"Entrada de Producto Terminado",type:"IN"},CONSUMO_PRODUCCION:{label:"Consumo de Materia Prima",type:"OUT"},MERMA:{label:"Baja por Merma T\xE9cnica",type:"OUT"},DANO:{label:"Baja por Da\xF1o / Vencimiento",type:"OUT"},INVENTARIO_FISICO:{label:"Ajuste Conteo F\xEDsico",type:"AUDIT"}},J={async registerMovement({tenantId:e,productoId:t,bodegaId:o,documentoTipo:a,documentoNumero:r,cantidad:s,costoUnitario:i,usuarioId:n,observacion:d}){let l=await f.getById(v.PRODUCTS,t);if(!l)throw new Error(`Producto con ID ${t} no encontrado.`);let c=o?await f.getById(v.WAREHOUSES,o):null,p=c?c.nombre:"Bodega Principal",m=ne[a]?.type==="IN",u=ne[a]?.type==="OUT",b=m?Number(s):0,h=u?Number(s):0,y=Number(i||l.costoPromedio||0),E=Number(l.stock||0),P=m?E+b:E-h,A=Number(l.costoPromedio||0);if(m&&P>0&&b>0){let D=E*A,j=b*y;A=Math.round((D+j)/P)}l.stock=Math.max(0,P),l.costoPromedio=A,m&&y>0&&(l.ultimoCosto=y),await f.update(v.PRODUCTS,l);let R={tenantId:e,fecha:new Date().toISOString(),productoId:t,productoNombre:l.nombre,sku:l.sku,bodegaId:o||"wh_1",bodegaNombre:p,documentoTipo:a,documentoNumero:r||"-",cantidadEntrada:b,cantidadSalida:h,saldoCantidad:l.stock,costoUnitario:y,costoTotal:Math.round(Number(s)*y),usuarioId:n||localStorage.getItem("nexa_active_user")||"usr_admin",usuarioNombre:"Usuario Sistema",observacion:d||""},w=await f.add(v.KARDEX,R);return await V.log({modulo:"Inventario",accion:m?"ENTRADA":"SALIDA",registroId:l.sku,campoModificado:`Movimiento: ${a}`,valorAnterior:`${E} ${l.unidadMedida}`,valorNuevo:`${l.stock} ${l.unidadMedida}`}),w},async getMovements(e,t={}){let o=await f.getAll(v.KARDEX,e);return t.productoId&&(o=o.filter(a=>a.productoId===t.productoId)),t.bodegaId&&(o=o.filter(a=>a.bodegaId===t.bodegaId)),t.documentoTipo&&(o=o.filter(a=>a.documentoTipo===t.documentoTipo)),o.sort((a,r)=>new Date(r.fecha)-new Date(a.fecha))}};var Se={async render(e){let t=I.getActiveTenant(),o=t?t.id:"tenant_rayopro",[a,r,s]=await Promise.all([f.getAll(v.PRODUCTS,o),f.getAll(v.WAREHOUSES,o),J.getMovements(o)]);e.innerHTML=`
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
        ${r.map(d=>{let l=a.filter(p=>p.bodegaId===d.id),c=l.reduce((p,m)=>p+(m.stock||0),0);return`
            <div class="kpi-card">
              <div class="kpi-card-header">
                <span class="kpi-label">${d.codigo}</span>
                <span class="badge badge-info">${d.esPrincipal?"Principal":"Secundaria"}</span>
              </div>
              <div class="kpi-value" style="font-size: 18px;">${d.nombre}</div>
              <div class="kpi-footer">
                <span><strong>${l.length}</strong> referencias \u2022 <strong>${c}</strong> unidades f\xEDsicas</span>
              </div>
            </div>
          `}).join("")}
      </div>

      <!-- TABS: KARDEX VS EXISTENCIAS -->
      <div class="card mb-3" style="padding: 6px 14px;">
        <div class="d-flex gap-2">
          <button class="btn btn-secondary btn-sm tab-btn active" data-tab="kardex">\u{1F4D1} Movimientos de Kardex (${s.length})</button>
          <button class="btn btn-secondary btn-sm tab-btn" data-tab="stocks">\u{1F4E6} Existencias Actuales (${a.length})</button>
        </div>
      </div>

      <div id="inventory-content-area"></div>
    `;let i=()=>{let d=e.querySelector("#inventory-content-area");d.innerHTML='<div id="kardex-table-container"></div>',new L({containerId:"kardex-table-container",data:s,columns:[{key:"fecha",title:"Fecha y Hora",render:l=>g.dateTime(l)},{key:"productoNombre",title:"Producto / Insumo",render:(l,c)=>`
              <div>
                <strong>${l}</strong>
                <div class="text-xs text-muted">SKU: ${c.sku||"-"}</div>
              </div>
            `},{key:"bodegaNombre",title:"Bodega",render:l=>`<span class="badge badge-neutral">${l}</span>`},{key:"documentoTipo",title:"Tipo Movimiento",render:(l,c)=>{let p=ne[l]||{label:l,type:"OTHER"};return`
                <div>
                  <span class="badge ${p.type==="IN"?"badge-success":p.type==="OUT"?"badge-danger":"badge-warning"}">${p.label}</span>
                  <div class="text-xs text-muted">Doc: ${c.documentoNumero}</div>
                </div>
              `}},{key:"cantidadEntrada",title:"Entrada",render:l=>l>0?`<strong class="text-success">+${l}</strong>`:"-"},{key:"cantidadSalida",title:"Salida",render:l=>l>0?`<strong class="text-danger">-${l}</strong>`:"-"},{key:"saldoCantidad",title:"Saldo Final",render:l=>`<strong>${l}</strong>`},{key:"costoUnitario",title:"Costo Unit.",render:l=>g.currency(l)},{key:"observacion",title:"Observaciones",render:l=>`<span class="text-xs text-muted">${l||"-"}</span>`}]})},n=()=>{let d=e.querySelector("#inventory-content-area");d.innerHTML='<div id="stocks-table-container"></div>',new L({containerId:"stocks-table-container",data:a,columns:[{key:"sku",title:"SKU",render:l=>`<strong>${l}</strong>`},{key:"nombre",title:"Nombre Producto",render:(l,c)=>`${l} <span class="text-xs text-muted">(${c.unidadMedida})</span>`},{key:"stock",title:"Existencia Actual",render:(l,c)=>{let p=Number(l||0),m=Number(c.stockMinimo||10),u="badge-success";return p<=0?u="badge-danger":p<=m&&(u="badge-warning"),`<span class="badge ${u}">${p} ${c.unidadMedida}</span>`}},{key:"costoPromedio",title:"Costo Promedio",render:l=>g.currency(l)},{key:"stock",title:"Valor Total Stock",render:(l,c)=>g.currency(Number(l||0)*Number(c.costoPromedio||0))},{key:"ubicacionBodega",title:"Ubicaci\xF3n",render:l=>l||"No especificada"}]})};i(),e.querySelectorAll(".tab-btn").forEach(d=>{d.addEventListener("click",()=>{e.querySelectorAll(".tab-btn").forEach(c=>c.classList.remove("active")),d.classList.add("active"),d.getAttribute("data-tab")==="kardex"?i():n()})}),e.querySelector("#btn-inventory-adjustment").addEventListener("click",()=>{this.openAdjustmentModal(o,a,r,()=>this.render(e))}),e.querySelector("#btn-inventory-transfer").addEventListener("click",()=>{this.openTransferModal(o,a,r,()=>this.render(e))})},openAdjustmentModal(e,t,o,a){let r=`
      <form id="adjustment-form">
        <div class="form-group mb-3">
          <label class="form-label">Seleccionar Producto o Insumo</label>
          <select class="form-select" name="productoId" required>
            ${t.map(i=>`
              <option value="${i.id}">${i.nombre} (SKU: ${i.sku} | Stock: ${i.stock} ${i.unidadMedida})</option>
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
            ${o.map(i=>`<option value="${i.id}">${i.nombre}</option>`).join("")}
          </select>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Motivo o Justificaci\xF3n del Ajuste</label>
          <textarea class="form-control" name="observacion" required rows="2" placeholder="Ej: Conteo f\xEDsico fin de mes o frasco quebrado en estiba"></textarea>
        </div>
      </form>
    `,s=x.show({title:"Registrar Ajuste Manual de Inventario",content:r,footerButtons:[{label:"Cancelar",class:"btn-secondary",onClick:()=>x.close()},{label:"Aplicar Ajuste a Kardex",class:"btn-primary",onClick:async()=>{let i=s.querySelector("#adjustment-form");if(!i.checkValidity()){i.reportValidity();return}let n=new FormData(i),d=n.get("productoId"),l=Number(n.get("cantidad")),c=n.get("documentoTipo"),p=n.get("bodegaId"),m=n.get("observacion"),u=t.find(b=>b.id===d);await J.registerMovement({tenantId:e,productoId:d,bodegaId:p,documentoTipo:c,documentoNumero:"AJUSTE-"+Math.floor(1e3+Math.random()*9e3),cantidad:l,costoUnitario:u.costoPromedio,observacion:m}),C.success("Ajuste de inventario registrado en Kardex."),x.close(),a&&a()}}]})},openTransferModal(e,t,o,a){let r=`
      <form id="transfer-form">
        <div class="form-group mb-3">
          <label class="form-label">Producto a Trasladar</label>
          <select class="form-select" name="productoId" required>
            ${t.map(i=>`
              <option value="${i.id}">${i.nombre} (Stock: ${i.stock} ${i.unidadMedida})</option>
            `).join("")}
          </select>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Bodega Origen</label>
            <select class="form-select" name="bodegaOrigenId" required>
              ${o.map(i=>`<option value="${i.id}">${i.nombre}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Bodega Destino</label>
            <select class="form-select" name="bodegaDestinoId" required>
              ${o.map((i,n)=>`<option value="${i.id}" ${n===1?"selected":""}>${i.nombre}</option>`).join("")}
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
    `,s=x.show({title:"Traslado de Mercanc\xEDa entre Bodegas",content:r,footerButtons:[{label:"Cancelar",class:"btn-secondary",onClick:()=>x.close()},{label:"Ejecutar Traslado",class:"btn-primary",onClick:async()=>{let i=s.querySelector("#transfer-form");if(!i.checkValidity()){i.reportValidity();return}let n=new FormData(i),d=n.get("productoId"),l=n.get("bodegaOrigenId"),c=n.get("bodegaDestinoId"),p=Number(n.get("cantidad")),m=n.get("observacion")||"Traslado entre bodegas";if(l===c){C.warning("La bodega de origen y destino no pueden ser la misma.");return}let u=t.find(h=>h.id===d),b="TR-"+Math.floor(1e3+Math.random()*9e3);await J.registerMovement({tenantId:e,productoId:d,bodegaId:l,documentoTipo:"TRASLADO_SALIDA",documentoNumero:b,cantidad:p,costoUnitario:u.costoPromedio,observacion:`Salida traslado hacia otra bodega. ${m}`}),await J.registerMovement({tenantId:e,productoId:d,bodegaId:c,documentoTipo:"TRASLADO_ENTRADA",documentoNumero:b,cantidad:p,costoUnitario:u.costoPromedio,observacion:`Entrada traslado desde bodega origen. ${m}`}),C.success("Traslado completado exitosamente."),x.close(),a&&a()}}]})}};N();B();N();var he={async calculateEstimatedCost(e,t){let o=await f.getById(v.RECIPES_BOM,e);if(!o)throw new Error("Receta no encontrada.");let a=t/(o.rendimientoLote||1),r=0,s=[];for(let l of o.insumos){let c=await f.getById(v.PRODUCTS,l.materiaPrimaId),m=l.cantidad*a*(1+(l.mermaEsperada||0)/100),u=c&&c.costoPromedio||0,b=m*u;r+=b,s.push({materiaPrimaId:l.materiaPrimaId,nombre:c?c.nombre:"Insumo",sku:c?c.sku:"-",cantidadBase:l.cantidad,cantidadRequerida:Math.round(m*100)/100,unidadMedida:l.unidadMedida,stockDisponible:c?c.stock:0,costoUnitario:u,costoTotal:Math.round(b),stockSuficiente:c?c.stock>=m:!1})}let i=(o.costosIndirectosEstimados||0)*a,n=Math.round(r+i),d=Math.round(n/t);return{receta:o,cantidadAProducir:t,desgloseInsumos:s,costoTotalInsumos:Math.round(r),costosIndirectos:Math.round(i),costoTotalEstimado:n,costoUnitarioEstimado:d,todosConStock:s.every(l=>l.stockSuficiente)}},async executeProductionOrder({tenantId:e,recetaId:t,productoTerminadoId:o,cantidadProducida:a,loteCodigo:r,costosIndirectosReales:s=0,responsableId:i,responsableNombre:n,observaciones:d}){let l=await f.getById(v.PRODUCTS,o);if(!l)throw new Error("Producto terminado no encontrado.");let c=await f.getById(v.RECIPES_BOM,t);if(!c)throw new Error("Receta no encontrada.");let p=a/(c.rendimientoLote||1),m="OP-"+new Date().getFullYear()+"-"+Math.floor(1e3+Math.random()*9e3),u=r||`LOTE-${l.sku.substring(0,4)}-${Date.now().toString().slice(-4)}`,b=0,h=[];for(let R of c.insumos){let w=await f.getById(v.PRODUCTS,R.materiaPrimaId);if(!w)continue;let D=Math.round(R.cantidad*p*(1+(R.mermaEsperada||0)/100)*100)/100,j=D*(w.costoPromedio||0);b+=j,h.push({materiaPrimaId:w.id,nombre:w.nombre,sku:w.sku,cantidad:D,unidadMedida:R.unidadMedida,costoUnitario:w.costoPromedio,costoTotal:Math.round(j)}),await J.registerMovement({tenantId:e,productoId:w.id,bodegaId:w.bodegaId||"wh_2",documentoTipo:"CONSUMO_PRODUCCION",documentoNumero:m,cantidad:D,costoUnitario:w.costoPromedio,usuarioId:i,observacion:`Consumo para fabricaci\xF3n de ${a} ${l.unidadMedida} de ${l.nombre} (Lote: ${u})`})}let y=Math.round(b+Number(s||0)),E=Math.round(y/a);await J.registerMovement({tenantId:e,productoId:l.id,bodegaId:l.bodegaId||"wh_1",documentoTipo:"PRODUCCION_ENTRADA",documentoNumero:m,cantidad:a,costoUnitario:E,usuarioId:i,observacion:`Entrada de fabricaci\xF3n terminada. Lote: ${u}`});let P={tenantId:e,numeroOrden:m,recetaId:t,recetaNombre:c.nombreReceta,productoTerminadoId:l.id,productoTerminadoNombre:l.nombre,loteCodigo:u,fechaProgramada:new Date().toISOString().split("T")[0],fechaInicio:new Date().toISOString(),fechaFin:new Date().toISOString(),cantidadPlanificada:a,cantidadProducida:a,costoEstimadoTotal:y,costoRealTotal:y,costoUnitarioReal:E,costosIndirectosReales:s,insumosConsumidos:h,estado:"COMPLETADA",responsableId:i,responsableNombre:n||"Jefe de Planta",observaciones:d||"Producci\xF3n finalizada exitosamente."},A=await f.add(v.PRODUCTION_ORDERS,P);return await V.log({modulo:"Producci\xF3n",accion:"CREAR",registroId:m,campoModificado:"Orden Ejecutada",valorAnterior:"-",valorNuevo:`${a} ${l.unidadMedida} de ${l.nombre} (Lote: ${u}) - Costo Unit: $ ${E}`}),A}};Q();B();var F={generateBarcodeSvg(e="77092184531"){let t=[],o=e.split("").reduce((a,r)=>a+r.charCodeAt(0),0);for(let a=0;a<48;a++){let r=(a+o)%3===0?3:(a+o)%2===0?2:1,s=(a+o)%4===0?2:1;t.push(`<rect x="${a*4}" y="0" width="${r}" height="46" fill="#000" />`)}return`
      <svg viewBox="0 0 200 50" width="180" height="46" xmlns="http://www.w3.org/2000/svg">
        ${t.join("")}
      </svg>
      <div style="font-family: monospace; font-size: 11px; letter-spacing: 2px; text-align: center; margin-top: 2px; color: #000; font-weight: bold;">
        ${e}
      </div>
    `},getHeader(e,t,o){let a=I.getActiveTenant()||{nombreComercial:"Rayo Pro",razonSocial:"Rayo Pro Colombia S.A.S.",nit:"901458321",dv:4,direccion:"Carrera 42 # 54A - 77, Zona Industrial",ciudad:"Itag\xFC\xED, Antioquia",telefono:"(604) 444 8920",email:"contacto@rayopro.com.co",resolucionFacturacion:"Resoluci\xF3n DIAN No. 18764000123456"};return a.membreteUrl?`
        <div class="doc-header" style="margin-bottom: 16px;">
          <img src="${a.membreteUrl}" alt="${a.nombreComercial}" style="width: 100%; max-height: 100px; object-fit: contain; margin-bottom: 10px; border-radius: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #000; padding-bottom: 6px;">
            <div>
              <div class="doc-badge">${e}</div>
              <div style="font-size: 16px; font-weight: 800; color: #1d1d1f; margin: 4px 0 0 0;">No. ${t}</div>
            </div>
            <div style="text-align: right; font-size: 11.5px; color: #444;">
              <div><strong>Fecha:</strong> ${g.date(o)}</div>
              <div style="font-size: 10px; color: #777;">Nexa ERP \u2022 ${a.nombreComercial}</div>
            </div>
          </div>
        </div>
      `:`
      <div class="doc-header">
        <div class="doc-brand">
          ${`
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
        <img src="${I.getHorizontalLogo(a,!1)}" alt="${a.nombreComercial}" 
             style="height: 48px; max-width: 180px; object-fit: contain; display: block; border-radius: 4px;" 
             onerror="this.onerror=null; this.src='datos/isotipo fondo blanco.jpg';">
      </div>
    `}
          <div style="font-size: 13px; font-weight: 700; color: #1d1d1f; line-height: 1.2;">${a.razonSocial}</div>
          <p><strong>NIT:</strong> ${a.nit}-${a.dv} | <strong>R\xE9gimen:</strong> ${a.regimen||"Responsable de IVA"}</p>
          <p>${a.direccion} \u2022 ${a.ciudad}</p>
          <p><strong>Tel:</strong> ${a.telefono} | <strong>Email:</strong> ${a.email}</p>
        </div>
        <div class="doc-meta">
          <div class="doc-badge">${e}</div>
          <div style="font-size: 16px; font-weight: 800; color: #1d1d1f; margin: 4px 0;">No. ${t}</div>
          <div style="font-size: 12px; color: #6e6e73;"><strong>Fecha:</strong> ${g.date(o)}</div>
          <div style="font-size: 10px; color: #86868b; margin-top: 4px;">Nexa ERP Cloud \u2022 ${a.nombreComercial}</div>
        </div>
      </div>
    `},shippingBoxLabel(e){let t=I.getActiveTenant()||{nombreComercial:"Rayo Pro",razonSocial:"Rayo Pro Colombia S.A.S.",nit:"901458321",dv:4,direccion:"Carrera 42 # 54A - 77",ciudad:"Itag\xFC\xED",telefono:"3017100508"},o=this.generateBarcodeSvg(e.numeroGuia||"77092184531");return`
      <div style="border: 3px solid #000; padding: 16px; max-width: 620px; margin: 0 auto; background: #fff; font-family: -apple-system, BlinkMacSystemFont, Arial, sans-serif; color: #000;">
        
        <!-- CABECERA R\xD3TULO CON LOGO DESTACADO DE ALTA VISIBILIDAD -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${I.getHorizontalLogo(t,!1)}" alt="${t.nombreComercial}" 
                 style="height: 44px; max-width: 155px; object-fit: contain; border-radius: 4px;" 
                 onerror="this.onerror=null; this.src='datos/isotipo fondo blanco.jpg';">
            <div>
              <div style="font-size: 16px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase;">
                ${t.nombreComercial}
              </div>
              <div style="font-size: 10px; font-weight: 700; color: #444;">L\xCDNEA PROFESIONAL DE EMBELLECIMIENTO AUTOMOTRIZ</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="background: #000; color: #fff; padding: 4px 10px; font-size: 12px; font-weight: 800; border-radius: 4px; text-transform: uppercase;">
              ${e.transportadora||"COORDINADORA / ENVIA"}
            </div>
            <div style="font-size: 11px; font-weight: bold; margin-top: 4px;">GU\xCDA: ${e.numeroGuia||"77092184531"}</div>
          </div>
        </div>

        <!-- C\xD3DIGO DE BARRAS DE RASTREO -->
        <div style="text-align: center; padding: 10px; background: #f9f9f9; border: 1px dashed #666; margin-bottom: 16px; border-radius: 6px;">
          ${o}
        </div>

        <!-- CUADRO DE REMITENTE Y DESTINATARIO -->
        <div style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 14px; margin-bottom: 16px;">
          
          <!-- REMITENTE -->
          <div style="border: 1px solid #999; padding: 10px; border-radius: 6px; font-size: 11px; line-height: 1.45;">
            <div style="font-weight: 800; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 6px; color: #555;">
              DE (REMITENTE):
            </div>
            <div style="font-weight: 800; font-size: 12px;">${t.razonSocial}</div>
            <div><strong>NIT:</strong> ${t.nit}-${t.dv}</div>
            <div><strong>Direcci\xF3n:</strong> ${t.direccion}</div>
            <div><strong>Ciudad:</strong> ${t.ciudad} - ${t.departamento||"Antioquia"}</div>
            <div><strong>Tel\xE9fono:</strong> ${t.telefono}</div>
            ${t.whatsapp?`<div><strong>WhatsApp:</strong> ${t.whatsapp}</div>`:""}
          </div>

          <!-- DESTINATARIO COMPLETO SIN OMITIR NADA -->
          <div style="border: 2px solid #000; padding: 10px; border-radius: 6px; font-size: 11.5px; line-height: 1.45; background: #fffdf0;">
            <div style="font-weight: 900; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 6px; color: #000; font-size: 12px;">
              PARA (DESTINATARIO):
            </div>
            <div style="font-weight: 900; font-size: 14px; color: #000; margin-bottom: 2px;">${e.clienteNombre}</div>
            <div><strong>NIT / C.C.:</strong> ${e.nitCc||"-"}</div>
            <div><strong>Direcci\xF3n de Entrega:</strong> ${e.direccion}</div>
            ${e.barrio?`<div><strong>Barrio / Sector:</strong> ${e.barrio}</div>`:""}
            <div><strong>Ciudad / Destino:</strong> ${e.ciudad} - ${e.departamento||""}</div>
            <div><strong>Tel\xE9fono Contacto:</strong> ${e.telefono||"-"}</div>
            ${e.whatsapp?`<div><strong>WhatsApp:</strong> ${e.whatsapp}</div>`:""}
            ${e.email?`<div><strong>Correo Electr\xF3nico:</strong> ${e.email}</div>`:""}
            ${e.observaciones?`
              <div style="margin-top: 6px; font-size: 10.5px; color: #333; border-top: 1px dashed #aaa; padding-top: 4px;">
                <strong>Instrucciones / Obs:</strong> ${e.observaciones}
              </div>
            `:""}
          </div>

        </div>

        <!-- DETALLES DEL PAQUETE / CAJAS -->
        <div style="border: 1px solid #000; padding: 12px; margin-bottom: 16px; border-radius: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 11px; font-weight: 700; color: #555;">DESCRIPCI\xD3N DEL CONTENIDO:</div>
              <div style="font-size: 13px; font-weight: 800;">${e.contenidoDescripcion||"Productos de mantenimiento y embellecimiento automotriz"}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 11px; font-weight: 700; color: #555;">TOTAL CAJAS / BULTOS:</div>
              <div style="font-size: 18px; font-weight: 900; color: #0071e3;">${e.cajasTotal||1} CAJAS</div>
            </div>
          </div>
        </div>

        <!-- INSTRUCCIONES DE MANEJO SEGURO (SEGURO PARA TRANSPORTADORAS) -->
        <div style="display: flex; align-items: center; justify-content: space-around; background: #000; color: #fff; padding: 8px; border-radius: 4px; font-size: 11px; font-weight: 800; text-transform: uppercase;">
          <span>\u2728 PRODUCTOS DE EMBELLECIMIENTO AUTOMOTRIZ</span>
          <span>\u2B06\uFE0F ESTE LADO ARRIBA</span>
          <span>\u{1F4E6} MANEJAR CON CUIDADO</span>
        </div>

        <div style="font-size: 9px; color: #777; text-align: center; margin-top: 10px;">
          R\xF3tulo Oficial de Despacho generado por Nexa ERP para Rayo Pro Colombia
        </div>
      </div>
    `},saleInvoice(e,t=[]){let o=e.facturaElectronica!==!1&&e.tipoDoc!=="COTIZACION"&&e.tipoDoc!=="REMISION",a=e.aplicaIva!==!1&&e.impuestos>0,r="DOCUMENTO EQUIVALENTE POS";e.tipoDoc==="COTIZACION"?r="COTIZACI\xD3N COMERCIAL":e.tipoDoc==="REMISION"?r="REMISI\xD3N DE ENTREGA COMERCIAL":o?r="FACTURA ELECTR\xD3NICA DE VENTA":r="CUENTA DE COBRO / DOCUMENTO INTERNO (SIN FE)";let s=this.getHeader(r,e.consecutivo,e.fecha),i=t.map((n,d)=>`
      <tr>
        <td class="text-center">${d+1}</td>
        <td><strong>${n.sku||"-"}</strong></td>
        <td>${n.nombre}</td>
        <td class="text-center"><strong>${n.cantidad}</strong></td>
        <td class="text-right">${g.currency(n.precioUnitario)}</td>
        <td class="text-right"><strong>${g.currency(n.total)}</strong></td>
      </tr>
    `).join("");return`
      ${s}
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; background: #fbfbfd; padding: 14px; border-radius: 8px; border: 1px solid #e5e5ea;">
        <div>
          <div style="font-size: 11px; text-transform: uppercase; color: #86868b; font-weight: 700;">Datos del Cliente:</div>
          <div style="font-size: 14px; font-weight: 700; color: #1d1d1f; margin: 2px 0;">${e.clienteNombre}</div>
          <div style="font-size: 12px; color: #424245;"><strong>NIT/CC:</strong> ${e.clienteNit||"-"}</div>
          <div style="font-size: 12px; color: #424245;"><strong>Forma de Pago:</strong> ${e.metodoPago||"Cr\xE9dito Comercial"}</div>
          <div style="margin-top: 4px;">
            <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: ${o?"#e0f2fe":"#f1f5f9"}; color: ${o?"#0369a1":"#475569"}; font-weight: 700;">
              ${o?"\u26A1 Factura Electr\xF3nica":"\u{1F4C4} Documento Interno / Sin FE"}
            </span>
          </div>
        </div>
        <div>
          <div style="font-size: 11px; text-transform: uppercase; color: #86868b; font-weight: 700;">Informaci\xF3n de Venta:</div>
          <div style="font-size: 12px; color: #424245;"><strong>Asesor / Vendedor:</strong> ${e.vendedorNombre||"Juan Pablo"}</div>
          <div style="font-size: 12px; color: #424245;"><strong>Estado:</strong> ${e.estado}</div>
          <div style="font-size: 11px; color: #86868b; margin-top: 4px;">
            ${a?"R\xE9gimen con IVA (19%)":"R\xE9gimen Exento / Etapa Inicial (Sin IVA - 0%)"}
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 40px;">#</th>
            <th style="width: 120px;">SKU</th>
            <th>Descripci\xF3n del Producto / Empaque</th>
            <th class="text-center" style="width: 80px;">Cant.</th>
            <th class="text-right" style="width: 120px;">V. Unitario</th>
            <th class="text-right" style="width: 130px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${i}
        </tbody>
      </table>

      <div class="doc-totals">
        <div class="total-row">
          <span>Subtotal Neto:</span>
          <span>${g.currency(e.subtotal)}</span>
        </div>
        ${e.descuentos>0?`
          <div class="total-row" style="color: #ff3b30;">
            <span>Descuentos:</span>
            <span>-${g.currency(e.descuentos)}</span>
          </div>
        `:""}
        <div class="total-row">
          <span>${a?"IVA (19%):":"IVA (Exento 0%):"}</span>
          <span>${g.currency(e.impuestos||0)}</span>
        </div>
        <div class="total-row grand-total">
          <span>TOTAL A PAGAR:</span>
          <span>${g.currency(e.total)}</span>
        </div>
      </div>

      <div class="doc-footer">
        <p>Agradecemos su compra y preferencia. Productos de mantenimiento y embellecimiento automotriz garantizados por Rayo Pro Colombia S.A.S.</p>
        <p style="margin-top: 4px; font-size: 10px;">
          ${o?"Resoluci\xF3n DIAN No. 18764000123456 \u2022 Documento Oficial Validado por DIAN":"Documento comercial emitido para fines administrativos internos \u2022 Software Nexa ERP"}
        </p>
      </div>
    `},productionOrder(e){let t=this.getHeader("ORDEN DE FABRICACI\xD3N & CONTROL DE CALIDAD",e.numeroOrden,e.fechaInicio||e.fechaProgramada),o=(e.insumosConsumidos||[]).map((a,r)=>`
      <tr>
        <td class="text-center">${r+1}</td>
        <td><strong>${a.sku||"-"}</strong></td>
        <td>${a.nombre}</td>
        <td class="text-center font-bold">${a.cantidad} ${a.unidadMedida}</td>
        <td class="text-right">${g.currency(a.costoUnitario)}</td>
        <td class="text-right"><strong>${g.currency(a.costoTotal)}</strong></td>
      </tr>
    `).join("");return`
      ${t}

      <div style="background: #fbfbfd; border: 1px solid #e5e5ea; padding: 14px; border-radius: 8px; margin-bottom: 20px;">
        <div style="font-size: 11px; font-weight: 700; color: #0071e3; text-transform: uppercase;">Producto Fabricado en Planta:</div>
        <div style="font-size: 17px; font-weight: 800; color: #1d1d1f; margin: 4px 0;">${e.productoTerminadoNombre}</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 12px; margin-top: 8px;">
          <div><strong>Lote Asignado:</strong> <span style="background: #eef5fc; padding: 2px 6px; border-radius: 4px; font-weight: 700; color: #0071e3;">${e.loteCodigo}</span></div>
          <div><strong>Cant. Producida:</strong> ${e.cantidadProducida}</div>
          <div><strong>Estado:</strong> ${e.estado}</div>
          <div><strong>Responsable:</strong> ${e.responsableNombre||"Juan Pablo"}</div>
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
          ${o}
        </tbody>
      </table>

      <div class="doc-totals">
        <div class="total-row">
          <span>Costos Indirectos (CIF):</span>
          <span>${g.currency(e.costosIndirectosReales||0)}</span>
        </div>
        <div class="total-row grand-total">
          <span>COSTO TOTAL LOTE:</span>
          <span>${g.currency(e.costoRealTotal)}</span>
        </div>
        <div class="total-row" style="font-weight: 700; color: #0071e3; margin-top: 4px;">
          <span>Costo Unitario Real:</span>
          <span>${g.currency(e.costoUnitarioReal)} / Unidad</span>
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
    `},commercialQuote(e,t=[]){return this.saleInvoice({...e,tipoDoc:"COTIZACION"},t)}};var Te={async render(e){let t=I.getActiveTenant(),o=t?t.id:"tenant_rayopro",[a,r,s,i]=await Promise.all([f.getAll(v.RECIPES_BOM,o),f.getAll(v.PRODUCTION_ORDERS,o),(await f.getAll(v.PRODUCTS,o)).filter(l=>l.tipoItem==="MATERIA_PRIMA"),(await f.getAll(v.PRODUCTS,o)).filter(l=>l.tipoItem==="PRODUCTO_TERMINADO")]);e.innerHTML=`
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
          <button class="btn btn-secondary btn-sm tab-prod-btn active" data-tab="orders">\u{1F4CB} \xD3rdenes de Producci\xF3n (${r.length})</button>
          <button class="btn btn-secondary btn-sm tab-prod-btn" data-tab="recipes">\u{1F9EA} F\xF3rmulas Maestras BOM (${a.length})</button>
        </div>
      </div>

      <div id="production-content-area"></div>
    `;let n=()=>{let l=e.querySelector("#production-content-area");l.innerHTML='<div id="orders-table-container"></div>',new L({containerId:"orders-table-container",data:r.sort((c,p)=>new Date(p.fechaInicio||p.fechaProgramada)-new Date(c.fechaInicio||c.fechaProgramada)),columns:[{key:"numeroOrden",title:"No. Orden / Lote",render:(c,p)=>`
              <div>
                <strong style="color: var(--brand-primary);">${c}</strong>
                <div class="text-xs text-muted">Lote: <strong>${p.loteCodigo}</strong></div>
              </div>
            `},{key:"productoTerminadoNombre",title:"Producto Fabricado",render:(c,p)=>`
              <div>
                <div class="font-bold">${c}</div>
                <div class="text-xs text-muted">Cant: <strong>${p.cantidadProducida} unidades</strong></div>
              </div>
            `},{key:"fechaInicio",title:"Fecha Fabricaci\xF3n",render:c=>g.date(c)},{key:"costoRealTotal",title:"Costo Total Lote",render:c=>g.currency(c)},{key:"costoUnitarioReal",title:"Costo Unit. Real",render:c=>`<strong class="text-success">${g.currency(c)}</strong>`},{key:"responsableNombre",title:"Responsable",render:c=>`<span class="badge badge-neutral">${c||"Planta"}</span>`},{key:"estado",title:"Estado",render:c=>`<span class="badge badge-success">${c}</span>`}],actions:c=>`
          <button class="btn btn-secondary btn-sm btn-print-order" data-id="${c.id}" title="Imprimir Orden">\u{1F5A8}\uFE0F Imprimir</button>
        `})},d=()=>{let l=e.querySelector("#production-content-area");l.innerHTML=`
        <div class="card">
          <div class="card-header">
            <div class="card-title">F\xF3rmulas Qu\xEDmicas y Estructura de Materiales (BOM)</div>
          </div>
          <div class="card-body">
            <div class="d-flex flex-col gap-3">
              ${a.map(c=>{let p=i.find(m=>m.id===c.productoTerminadoId);return`
                  <div class="card" style="border: 1px solid var(--border-color); margin-bottom: 0;">
                    <div class="card-header" style="background: #f8fafc;">
                      <div>
                        <strong style="color: var(--brand-primary); font-size: 15px;">${c.nombreReceta}</strong>
                        <div class="text-xs text-muted">Producto Resultante: <strong>${p?p.nombre:"Producto Terminado"}</strong> | Rendimiento Lote: <strong>${c.rendimientoLote} ${c.unidadMedidaLote}</strong></div>
                      </div>
                      <button class="btn btn-primary btn-sm btn-quick-produce" data-receta-id="${c.id}">\u26A1 Fabricar Este Lote</button>
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
                            ${c.insumos.map(m=>{let u=s.find(y=>y.id===m.materiaPrimaId),b=u?u.stock:0,h=b>=m.cantidad;return`
                                <tr>
                                  <td><strong>${u?u.nombre:"Insumo"}</strong> <span class="text-xs text-muted">(${u?u.sku:"-"})</span></td>
                                  <td class="text-center font-bold">${m.cantidad}</td>
                                  <td class="text-center">${m.unidadMedida}</td>
                                  <td class="text-center">${m.mermaEsperada||0}%</td>
                                  <td class="text-right">
                                    <span class="badge ${h?"badge-success":"badge-danger"}">
                                      ${b} ${m.unidadMedida}
                                    </span>
                                  </td>
                                </tr>
                              `}).join("")}
                          </tbody>
                        </table>
                      </div>
                      ${c.observaciones?`<div class="text-xs text-muted mt-2"><strong>Instrucciones de Mezcla:</strong> ${c.observaciones}</div>`:""}
                    </div>
                  </div>
                `}).join("")}
            </div>
          </div>
        </div>
      `};n(),e.querySelectorAll(".tab-prod-btn").forEach(l=>{l.addEventListener("click",()=>{e.querySelectorAll(".tab-prod-btn").forEach(p=>p.classList.remove("active")),l.classList.add("active"),l.getAttribute("data-tab")==="orders"?n():d()})}),e.querySelector("#btn-execute-production").addEventListener("click",()=>{this.openExecuteProductionModal(o,a,i,s,()=>this.render(e))}),e.addEventListener("click",l=>{let c=l.target.closest(".btn-quick-produce");if(c){let m=c.getAttribute("data-receta-id");this.openExecuteProductionModal(o,a,i,s,()=>this.render(e),m);return}let p=l.target.closest(".btn-print-order");if(p){let m=p.getAttribute("data-id"),u=r.find(b=>b.id===m);if(u){let b=F.productionOrder(u);U.printDocument(b,`Orden_Produccion_${u.numeroOrden}`)}}})},openExecuteProductionModal(e,t,o,a,r,s=null){if(t.length===0){C.warning("No hay recetas BOM registradas. Debe crear una receta primero.");return}let i=s?t.find(c=>c.id===s):t[0],n=`
      <form id="execute-production-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Seleccionar F\xF3rmula Maestra (BOM)</label>
            <select class="form-select" id="sel-production-recipe" name="recetaId">
              ${t.map(c=>`
                <option value="${c.id}" ${c.id===i.id?"selected":""}>${c.nombreReceta}</option>
              `).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Cantidad a Fabricar (Unidades)</label>
            <input type="number" step="1" min="1" class="form-control" id="inp-prod-qty" name="cantidad" value="${i.rendimientoLote||50}" required>
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">C\xF3digo de Lote</label>
            <input type="text" class="form-control" name="loteCodigo" value="LOTE-RP${new Date().getMonth()+1}-${Math.floor(100+Math.random()*900)}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Costos Indirectos Adicionales (CIF COP)</label>
            <input type="number" class="form-control" id="inp-prod-cif" name="costosIndirectos" value="${i.costosIndirectosEstimados||35e3}">
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
    `,d=x.show({title:"Ejecutar Fabricaci\xF3n en Planta",content:n,size:"lg",footerButtons:[{label:"Cancelar",class:"btn-secondary",onClick:()=>x.close()},{label:"Fabricar & Ingresar a Inventario",class:"btn-primary",id:"btn-confirm-production",onClick:async()=>{let c=d.querySelector("#execute-production-form");if(!c.checkValidity()){c.reportValidity();return}let p=new FormData(c),m=p.get("recetaId"),u=Number(p.get("cantidad")),b=p.get("loteCodigo"),h=Number(p.get("costosIndirectos")||0),y=p.get("observaciones"),E=t.find(P=>P.id===m);try{d.querySelector("#btn-confirm-production").disabled=!0,d.querySelector("#btn-confirm-production").textContent="Procesando fabricaci\xF3n...",await he.executeProductionOrder({tenantId:e,recetaId:m,productoTerminadoId:E.productoTerminadoId,cantidadProducida:u,loteCodigo:b,costosIndirectosReales:h,responsableId:"usr_planta",responsableNombre:"Juli\xE1n Montoya (Planta)",observaciones:y}),C.success(`\xA1Lote ${b} fabricado con \xE9xito! Se consumieron las materias primas e ingres\xF3 el producto terminado a Kardex.`),x.close(),r&&r()}catch(P){console.error(P),C.error(`Error al procesar la producci\xF3n: ${P.message}`),d.querySelector("#btn-confirm-production").disabled=!1,d.querySelector("#btn-confirm-production").textContent="Fabricar & Ingresar a Inventario"}}}]}),l=async()=>{let c=d.querySelector("#sel-production-recipe").value,p=Number(d.querySelector("#inp-prod-qty").value)||1,m=d.querySelector("#explosion-preview-area"),u=d.querySelector("#btn-confirm-production");try{let b=await he.calculateEstimatedCost(c,p);m.innerHTML=`
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
                ${b.desgloseInsumos.map(h=>`
                  <tr>
                    <td><strong>${h.nombre}</strong></td>
                    <td class="text-center font-bold">${h.cantidadRequerida} ${h.unidadMedida}</td>
                    <td class="text-right">
                      <span class="badge ${h.stockSuficiente?"badge-success":"badge-danger"}">
                        ${h.stockDisponible} ${h.unidadMedida}
                      </span>
                    </td>
                    <td class="text-right">${g.currency(h.costoTotal)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <div class="d-flex justify-between items-center text-xs mt-2" style="border-top: 1px dashed #cbd5e1; padding-top: 8px;">
            <div>
              <span>Costo Total Estimado: <strong>${g.currency(b.costoTotalEstimado)}</strong></span>
              <span class="ml-2 text-muted">| Costo Unitario: <strong class="text-success">${g.currency(b.costoUnitarioEstimado)} / un</strong></span>
            </div>
            ${b.todosConStock?`
              <span class="badge badge-success">\u2713 Stock disponible para producir</span>
            `:`
              <span class="badge badge-danger">\u26A0\uFE0F Stock insuficiente en uno o m\xE1s insumos</span>
            `}
          </div>
        `,b.todosConStock?u.disabled=!1:(u.disabled=!0,u.title="Insumos insuficientes en bodega")}catch(b){m.innerHTML=`<div class="text-danger text-xs">${b.message}</div>`}};d.querySelector("#sel-production-recipe").addEventListener("change",l),d.querySelector("#inp-prod-qty").addEventListener("input",l),l()}};N();B();var Pe={async render(e){let t=I.getActiveTenant(),o=t?t.id:"tenant_rayopro",[a,r,s,i]=await Promise.all([f.getAll(v.PURCHASES,o),f.getAll(v.SUPPLIERS,o),f.getAll(v.PRODUCTS,o),f.getAll(v.WAREHOUSES,o)]);e.innerHTML=`
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
    `,new L({containerId:"purchases-table-container",data:a,columns:[{key:"consecutivo",title:"Factura / Doc.",render:n=>`<strong style="color: var(--brand-primary);">${n}</strong>`},{key:"proveedorNombre",title:"Proveedor",render:n=>`<strong>${n||"Proveedor General"}</strong>`},{key:"fecha",title:"Fecha Emisi\xF3n",render:n=>g.date(n)},{key:"total",title:"Valor Total",render:n=>`<strong>${g.currency(n)}</strong>`},{key:"condicionPago",title:"Condici\xF3n",render:n=>`<span class="badge ${n==="Cr\xE9dito"?"badge-warning":"badge-success"}">${n||"Contado"}</span>`},{key:"estado",title:"Estado Recepci\xF3n",render:n=>`<span class="badge badge-success">${n||"RECIBIDA"}</span>`}]}),e.querySelector("#btn-new-purchase").addEventListener("click",()=>{this.openPurchaseModal(o,r,s,i,()=>this.render(e))}),e.querySelector("#btn-manage-suppliers").addEventListener("click",()=>{this.openSuppliersModal(o,r,()=>this.render(e))})},openPurchaseModal(e,t,o,a,r){let s=[],i=`
      <form id="purchase-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Proveedor</label>
            <select class="form-select" id="purch-supplier" name="proveedorId" required>
              ${t.map(m=>`<option value="${m.id}">${m.razonSocial} (NIT: ${m.nitCc}-${m.dv||0})</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">No. Factura de Compra / Remisi\xF3n</label>
            <input type="text" class="form-control" name="consecutivo" required value="FAC-PROV-${Math.floor(1e3+Math.random()*9e3)}">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Bodega Destino de Almacenamiento</label>
            <select class="form-select" name="bodegaDestinoId">
              ${a.map(m=>`<option value="${m.id}">${m.nombre}</option>`).join("")}
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
                  ${o.map(m=>`<option value="${m.id}" data-cost="${m.costoPromedio}">${m.nombre} (${m.unidadMedida})</option>`).join("")}
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
    `,n=x.show({title:"Registrar Entrada de Mercanc\xEDa / Compra",content:i,size:"lg",footerButtons:[{label:"Cancelar",class:"btn-secondary",onClick:()=>x.close()},{label:"Ingresar Compra a Kardex",class:"btn-primary",onClick:async()=>{if(s.length===0){C.warning("Debe agregar al menos un producto a la compra.");return}let m=n.querySelector("#purchase-form"),u=new FormData(m),b=u.get("proveedorId"),h=t.find(w=>w.id===b),y=u.get("consecutivo"),E=u.get("bodegaDestinoId"),P=u.get("condicionPago"),A=s.reduce((w,D)=>w+D.cantidad*D.costoUnitario,0),R={tenantId:e,consecutivo:y,proveedorId:b,proveedorNombre:h?h.razonSocial:"Proveedor",fecha:new Date().toISOString(),total:A,condicionPago:P,estado:"RECIBIDA",items:s};await f.add(v.PURCHASES,R);for(let w of s)await J.registerMovement({tenantId:e,productoId:w.productoId,bodegaId:E,documentoTipo:"COMPRA",documentoNumero:y,cantidad:w.cantidad,costoUnitario:w.costoUnitario,observacion:`Entrada compra fac. ${y} de ${h?.razonSocial}`});P==="Cr\xE9dito"&&await f.add(v.PAYABLES_CXP,{tenantId:e,compraId:R.id,documento:y,proveedorId:b,proveedorNombre:h.razonSocial,fechaEmision:new Date().toISOString().split("T")[0],fechaVencimiento:new Date(Date.now()+(h.diasCredito||30)*864e5).toISOString().split("T")[0],valorTotal:A,abonos:0,saldo:A,diasMora:0,estado:"AL_DIA"}),C.success("Compra procesada exitosamente. Se actualizaron existencias en Kardex."),x.close(),r&&r()}}]}),d=()=>{let m=n.querySelector("#purch-items-tbody"),u=n.querySelector("#purch-total-lbl");if(s.length===0){m.innerHTML='<tr><td colspan="5" class="text-center text-muted" style="padding: 12px;">Sin \xEDtems agregados.</td></tr>',u.textContent="$ 0";return}let b=0;m.innerHTML=s.map((h,y)=>{let E=h.cantidad*h.costoUnitario;return b+=E,`
          <tr>
            <td><strong>${h.nombre}</strong></td>
            <td class="text-center">${h.cantidad}</td>
            <td class="text-right">${g.currency(h.costoUnitario)}</td>
            <td class="text-right"><strong>${g.currency(E)}</strong></td>
            <td class="text-right"><button type="button" class="btn btn-danger btn-sm purch-del-item" data-idx="${y}">&times;</button></td>
          </tr>
        `}).join(""),u.textContent=g.currency(b)},l=n.querySelector("#purch-item-prod"),c=n.querySelector("#purch-item-cost"),p=()=>{let m=l.options[l.selectedIndex];c.value=m.getAttribute("data-cost")||0};l.addEventListener("change",p),p(),n.querySelector("#btn-add-purch-item").addEventListener("click",()=>{let m=l.value,u=o.find(y=>y.id===m),b=Number(n.querySelector("#purch-item-qty").value)||1,h=Number(c.value)||0;s.push({productoId:m,nombre:u.nombre,cantidad:b,costoUnitario:h}),d()}),n.querySelector("#purch-items-tbody").addEventListener("click",m=>{if(m.target.classList.contains("purch-del-item")){let u=Number(m.target.getAttribute("data-idx"));s.splice(u,1),d()}})},openSuppliersModal(e,t,o){let a=`
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
            ${t.map(r=>`
              <tr>
                <td><strong>${r.razonSocial}</strong></td>
                <td>${r.nitCc}-${r.dv||0}</td>
                <td>${r.contacto||"-"} (${r.telefono||"-"})</td>
                <td>${r.diasCredito||0} d\xEDas</td>
                <td><span class="badge badge-neutral">${r.categoria||"Insumos"}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;x.show({title:"Gesti\xF3n de Proveedores",content:a,size:"lg",footerButtons:[{label:"Cerrar",class:"btn-secondary",onClick:()=>x.close()}]})}};N();B();var ye={calculateTotals(e=[],t=0,o={aplicaIva:!0,facturaElectronica:!0}){let a=0,r=0,s=0,i=0,n=o.aplicaIva!==!1;e.forEach(u=>{let b=Number(u.cantidad)||0,h=Number(u.precioUnitario)||0,y=b*h,E=Number(u.descuentoPct)||0,P=y*(E/100),A=y-P,R=n?u.ivaPct!==void 0?Number(u.ivaPct):19:0,w=A*(R/100);a+=y,r+=P,s+=A,i+=w});let d=s*(Number(t||0)/100),l=r+d,c=Math.max(0,s-d),p=n&&c>0?i*(1-Number(t||0)/100):0,m=Math.round(c+p);return{subtotalBruto:Math.round(a),totalDescuentos:Math.round(l),baseGravable:Math.round(c),totalIva:Math.round(p),aplicaIva:n,total:m}}};Q();var Re={cart:[],selectedClient:null,selectedPriceListId:"plist_1",async render(e){let t=I.getActiveTenant(),o=t?t.id:"tenant_rayopro",[a,r,s,i]=await Promise.all([f.getAll(v.PRODUCTS,o),f.getAll(v.CUSTOMERS,o),f.getAll(v.PRICE_LISTS,o),H.getCurrentShift(o)]),n=a.filter(u=>u.tipoItem!=="MATERIA_PRIMA");this.cart=[],this.selectedClient=r[0]||null,this.selectedPriceListId=this.selectedClient&&this.selectedClient.listaPreciosId||"plist_1",e.innerHTML=`
      <div class="view-header" style="margin-bottom: 16px;">
        <div class="view-title-wrap">
          <div class="d-flex items-center gap-2">
            <h1>Punto de Venta (POS) & Mostrador</h1>
            ${i?`
              <span class="badge badge-success">\u2713 Caja Abierta (Turno Activo)</span>
            `:`
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
                    ${s.map(u=>`
                      <option value="${u.id}" ${u.id===this.selectedPriceListId?"selected":""}>${u.nombre}</option>
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
                ${n.map(u=>{let b=u.precios&&u.precios[this.selectedPriceListId]||u.costoPromedio*1.5,h=u.stock>0;return`
                    <div class="pos-product-card card" data-product-id="${u.id}" style="cursor: ${h?"pointer":"not-allowed"}; margin-bottom: 0; padding: 8px 10px; border: 1px solid ${h?"var(--border-color)":"rgba(239, 68, 68, 0.3)"}; background: ${h?"var(--bg-surface)":"rgba(239, 68, 68, 0.08)"}; transition: transform 0.15s ease;">
                      <div class="text-xs font-bold" style="color: var(--brand-primary); font-size: 11px;">${u.sku}</div>
                      <div class="font-bold text-xs" style="margin: 2px 0; line-height: 1.2; height: 26px; overflow: hidden; font-size: 11.5px; color: var(--text-main);">${u.nombre}</div>
                      <div class="d-flex justify-between items-center mt-1">
                        <span class="text-xs font-bold" style="color: var(--text-main);">${g.currency(b)}</span>
                        <span class="badge ${h?"badge-success":"badge-danger"}" style="font-size: 9.5px; padding: 1px 5px;">${u.stock} un</span>
                      </div>
                    </div>
                  `}).join("")}
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
                  ${r.map(u=>`
                    <option value="${u.id}" ${this.selectedClient&&this.selectedClient.id===u.id?"selected":""}>
                      ${u.nombre} (${u.tipoCliente}) - Saldo: ${g.currency(u.saldoPendiente||0)}
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

            <button class="btn btn-primary w-100" id="btn-process-sale" style="padding: 9px; font-size: 14px; font-weight: 700;">
              \u26A1 COBRAR Y FACTURAR (F4)
            </button>
          </div>
        </div>

      </div>
    `;let d=()=>{let u=e.querySelector("#pos-cart-tbody");if(this.cart.length===0){u.innerHTML='<tr><td colspan="5" class="text-center text-muted" style="padding: 24px;">Carrito vac\xEDo. Seleccione productos de la izquierda.</td></tr>',e.querySelector("#pos-lbl-subtotal").textContent="$ 0",e.querySelector("#pos-lbl-iva").textContent="$ 0",e.querySelector("#pos-lbl-total").textContent="$ 0",e.querySelector("#pos-lbl-change").textContent="$ 0";return}u.innerHTML=this.cart.map((R,w)=>`
        <tr>
          <td>
            <div class="font-bold">${R.nombre}</div>
            <div class="text-xs text-muted">SKU: ${R.sku}</div>
          </td>
          <td class="text-center">
            <input type="number" min="1" max="${R.stockMaximoDisponible}" class="form-control pos-item-qty" data-idx="${w}" value="${R.cantidad}" style="width: 55px; padding: 2px 4px; text-align: center;">
          </td>
          <td class="text-right">${g.currency(R.precioUnitario)}</td>
          <td class="text-right"><strong>${g.currency(R.cantidad*R.precioUnitario)}</strong></td>
          <td class="text-right">
            <button class="btn btn-danger btn-sm pos-btn-remove" data-idx="${w}" style="padding: 2px 6px;">&times;</button>
          </td>
        </tr>
      `).join("");let b=!this.selectedClient||this.selectedClient.aplicaIva!==!1,h=!this.selectedClient||this.selectedClient.facturaElectronica!==!1,y=ye.calculateTotals(this.cart,0,{aplicaIva:b,facturaElectronica:h});e.querySelector("#pos-lbl-subtotal").textContent=g.currency(y.baseGravable);let E=e.querySelector("#pos-lbl-iva");b?(E.textContent=g.currency(y.totalIva),E.className=""):(E.textContent="$ 0 (Exento / Sin IVA)",E.className="text-warning font-bold"),e.querySelector("#pos-lbl-total").textContent=g.currency(y.total);let P=Number(e.querySelector("#pos-inp-received").value||y.total),A=Math.max(0,P-y.total);e.querySelector("#pos-lbl-change").textContent=g.currency(A)},l=u=>{let b=n.find(E=>E.id===u);if(!b)return;if(b.stock<=0){C.warning(`El producto ${b.nombre} se encuentra agotado.`);return}let h=this.cart.find(E=>E.productoId===b.id),y=b.precios&&b.precios[this.selectedPriceListId]||b.costoPromedio*1.5;if(h){if(h.cantidad+1>b.stock){C.warning(`No hay m\xE1s existencias f\xEDsicas de ${b.nombre} (Stock actual: ${b.stock}).`);return}h.cantidad+=1}else this.cart.push({productoId:b.id,sku:b.sku,nombre:b.nombre,precioUnitario:y,cantidad:1,stockMaximoDisponible:b.stock,ivaPct:19});d()};e.querySelectorAll(".pos-product-card").forEach(u=>{u.addEventListener("click",()=>{let b=u.getAttribute("data-product-id");l(b)})}),e.querySelector("#pos-select-pricelist").addEventListener("change",u=>{this.selectedPriceListId=u.target.value,this.cart.forEach(b=>{let h=n.find(y=>y.id===b.productoId);h&&h.precios&&h.precios[this.selectedPriceListId]&&(b.precioUnitario=h.precios[this.selectedPriceListId])}),d(),this.render(e)});let c=()=>{let u=e.querySelector("#pos-fe-status"),b=e.querySelector("#pos-iva-status");if(!u||!b)return;let h=!this.selectedClient||this.selectedClient.facturaElectronica!==!1,y=!this.selectedClient||this.selectedClient.aplicaIva!==!1;u.innerHTML=`\u26A1 Facturaci\xF3n Electr\xF3nica: <strong>${h?"S\xED":"No (Documento Interno)"}</strong>`,y?(b.textContent="Con IVA (19%)",b.className="badge badge-success"):(b.textContent="Exento / Sin IVA (0%)",b.className="badge badge-warning")};c(),e.querySelector("#pos-select-client").addEventListener("change",u=>{let b=r.find(h=>h.id===u.target.value);this.selectedClient=b,b&&b.listaPreciosId&&(this.selectedPriceListId=b.listaPreciosId,e.querySelector("#pos-select-pricelist").value=b.listaPreciosId,this.cart.forEach(h=>{let y=n.find(E=>E.id===h.productoId);y&&y.precios&&y.precios[this.selectedPriceListId]&&(h.precioUnitario=y.precios[this.selectedPriceListId])})),c(),d()});let p=e.querySelector("#btn-pos-add-client");p&&p.addEventListener("click",()=>{ie.openClientModal(null,o,s,async u=>{let b=await f.getAll(v.CUSTOMERS,o),h=e.querySelector("#pos-select-client");if(h&&(h.innerHTML=b.map(y=>`
              <option value="${y.id}" ${u&&y.id===u.id?"selected":""}>
                ${y.nombre} (${y.tipoCliente}) - Saldo: ${g.currency(y.saldoPendiente||0)}
              </option>
            `).join("")),u){if(this.selectedClient=u,u.listaPreciosId){this.selectedPriceListId=u.listaPreciosId;let y=e.querySelector("#pos-select-pricelist");y&&(y.value=u.listaPreciosId),this.cart.forEach(E=>{let P=n.find(A=>A.id===E.productoId);P&&P.precios&&P.precios[this.selectedPriceListId]&&(E.precioUnitario=P.precios[this.selectedPriceListId])})}c(),d(),C.success(`\xA1Cliente "${u.nombre}" creado y vinculado a la venta!`)}})}),e.querySelector("#pos-cart-tbody").addEventListener("input",u=>{if(u.target.classList.contains("pos-item-qty")){let b=Number(u.target.getAttribute("data-idx")),h=Math.max(1,Number(u.target.value));this.cart[b]&&(this.cart[b].cantidad=h,d())}}),e.querySelector("#pos-cart-tbody").addEventListener("click",u=>{let b=u.target.closest(".pos-btn-remove");if(b){let h=Number(b.getAttribute("data-idx"));this.cart.splice(h,1),d()}}),e.querySelector("#pos-inp-received").addEventListener("input",d),e.querySelector("#btn-clear-cart").addEventListener("click",()=>{this.cart=[],d()}),e.querySelector("#btn-process-sale").addEventListener("click",async()=>{if(this.cart.length===0){C.warning("El carrito de venta est\xE1 vac\xEDo.");return}let u=!this.selectedClient||this.selectedClient.aplicaIva!==!1,b=!this.selectedClient||this.selectedClient.facturaElectronica!==!1,h=ye.calculateTotals(this.cart,0,{aplicaIva:u,facturaElectronica:b}),y=e.querySelector("#pos-payment-method").value,E=e.querySelector("#pos-doc-type").value,P="RP-"+Math.floor(1e4+Math.random()*9e4),A=y==="Cr\xE9dito"||E==="VENTA_CREDITO";if(A&&this.selectedClient){let $=(this.selectedClient.saldoPendiente||0)+h.total;if(this.selectedClient.cupoCredito>0&&$>this.selectedClient.cupoCredito){C.warning(`El cupo de cr\xE9dito ($ ${g.currency(this.selectedClient.cupoCredito)}) ser\xEDa excedido. Saldo actual: ${g.currency(this.selectedClient.saldoPendiente)}`);return}}let R=Number(e.querySelector("#pos-inp-received").value||h.total),w=Math.max(0,R-h.total),D={tenantId:o,consecutivo:P,tipoDoc:E,facturaElectronica:b,aplicaIva:u,clienteId:this.selectedClient?this.selectedClient.id:"cli_mostrador",clienteNombre:this.selectedClient?this.selectedClient.nombre:"Cliente Mostrador",clienteNit:this.selectedClient?this.selectedClient.nitCc:"222222222222",vendedorId:"usr_ventas",vendedorNombre:"Valentina Restrepo",listaPreciosId:this.selectedPriceListId,fecha:new Date().toISOString(),estado:A?"CREDITO_PENDIENTE":"PAGADA",subtotal:h.baseGravable,descuentos:h.totalDescuentos,impuestos:h.totalIva,total:h.total,metodoPago:y,pagoRecibido:A?0:R,cambio:A?0:w,saldoCredito:A?h.total:0,items:this.cart.map($=>({productoId:$.productoId,sku:$.sku,nombre:$.nombre,precioUnitario:$.precioUnitario,cantidad:$.cantidad,total:$.cantidad*$.precioUnitario}))};await f.add(v.SALES,D);for(let $ of this.cart)await J.registerMovement({tenantId:o,productoId:$.productoId,bodegaId:"wh_1",documentoTipo:"VENTA",documentoNumero:P,cantidad:$.cantidad,costoUnitario:$.precioUnitario,observacion:`Venta POS No. ${P} a ${D.clienteNombre}`});!A&&i&&(y==="Efectivo"?(i.totalVentasEfectivo=(i.totalVentasEfectivo||0)+h.total,i.saldoEsperado+=h.total):y==="Transferencia"?i.totalVentasTransferencia=(i.totalVentasTransferencia||0)+h.total:y==="Nequi"||y==="Daviplata"?i.totalVentasNequiDaviplata=(i.totalVentasNequiDaviplata||0)+h.total:y==="Tarjeta"&&(i.totalVentasTarjeta=(i.totalVentasTarjeta||0)+h.total),await f.update(v.CASH_SHIFTS,i)),A&&this.selectedClient&&(this.selectedClient.saldoPendiente=(this.selectedClient.saldoPendiente||0)+h.total,this.selectedClient.totalComprado=(this.selectedClient.totalComprado||0)+h.total,this.selectedClient.numeroCompras=(this.selectedClient.numeroCompras||0)+1,await f.update(v.CUSTOMERS,this.selectedClient),await f.add(v.RECEIVABLES_CXC,{tenantId:o,ventaId:D.id,documento:P,clienteId:this.selectedClient.id,clienteNombre:this.selectedClient.nombre,fechaEmision:new Date().toISOString().split("T")[0],fechaVencimiento:new Date(Date.now()+(this.selectedClient.diasCredito||30)*864e5).toISOString().split("T")[0],valorTotal:h.total,abonos:0,saldo:h.total,diasMora:0,estado:"AL_DIA"})),await V.log({modulo:"Ventas POS",accion:"CREAR",registroId:P,campoModificado:"Factura Emitida",valorAnterior:"-",valorNuevo:`${g.currency(h.total)} (${y})`}),C.success(`\xA1Venta ${P} registrada con \xE9xito!`);let j=JSON.parse(JSON.stringify(this.cart)),M=this.selectedClient?{...this.selectedClient}:null,W=j.reduce(($,q)=>$+(Number(q.cantidad)||0),0),ee=Math.max(1,Math.ceil(W/12)),Y={tenantId:o,ventaId:D.id,documentoNumero:P,clienteId:M?M.id:"CLI_GEN",clienteNombre:D.clienteNombre,nitCc:D.clienteNit||(M?M.nitCc:""),telefono:M&&(M.telefono||M.whatsapp)||"3124567890",whatsapp:M&&(M.whatsapp||M.telefono)||"",email:M&&M.email||"",ciudad:M&&M.ciudad||"Medell\xEDn",departamento:M&&M.departamento||"Antioquia",barrio:M&&M.barrio||"",direccion:M&&M.direccion||"Direcci\xF3n comercial",transportadora:"Coordinadora Mercantil",numeroGuia:`GUIA-${P.replace(/\D/g,"")||String(Math.floor(1e5+Math.random()*9e5))}`,costoEnvio:0,fechaDespacho:new Date().toISOString().split("T")[0],fechaEntregaEstimada:new Date(Date.now()+2*864e5).toISOString().split("T")[0],estadoCiclo:"LISTO_DESPACHO",responsable:"Mateo Osorio (Bodega & Despachos)",cajasTotal:ee,contenidoDescripcion:"Productos de mantenimiento y embellecimiento automotriz Rayo Pro",observaciones:"Manejar con precauci\xF3n. Productos de mantenimiento y embellecimiento automotriz Rayo Pro. No volcar."};try{await f.add(v.ORDERS_SHIPPING,Y)}catch($){console.warn("Registro de orden de despacho autom\xE1tico:",$)}let T=F.saleInvoice(D,D.items),O=F.shippingBoxLabel(Y),_=x.show({title:`\u2705 Venta ${P} Registrada con \xC9xito`,size:"lg",content:`
          <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; background: rgba(0, 113, 227, 0.05); padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(0, 113, 227, 0.15);">
            <div>
              <span style="font-size: 11px; font-weight: 700; color: var(--text-muted);">TOTAL COBRADO:</span>
              <strong style="font-size: 16px; color: var(--brand-primary); margin-left: 6px;">${g.currency(h.total)}</strong>
              <span class="badge badge-info" style="margin-left: 6px;">${y}</span>
            </div>
            <div>
              <span style="font-size: 12px; color: var(--text-secondary);">Cliente: <strong>${D.clienteNombre}</strong></span>
            </div>
          </div>

          <!-- PESTA\xD1AS DE VISTA PREVIA INTERACTIVA -->
          <div class="d-flex items-center gap-2 mb-3" style="border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
            <button type="button" class="btn btn-sm btn-primary" id="btn-tab-preview-invoice" style="font-weight: 700;">
              \u{1F9FE} Factura / Comprobante POS
            </button>
            <button type="button" class="btn btn-sm btn-secondary" id="btn-tab-preview-shipping" style="font-weight: 700;">
              \u{1F3F7}\uFE0F R\xF3tulo de Despacho (${ee} ${ee===1?"Caja":"Cajas"})
            </button>
          </div>

          <!-- CONTENEDOR VISTA PREVIA FACTURA -->
          <div id="view-preview-invoice" style="display: block; max-height: 420px; overflow-y: auto; background: #ffffff; padding: 14px; border-radius: 8px; border: 1px solid var(--border-color); color: #1e293b;">
            ${T}
          </div>

          <!-- CONTENEDOR VISTA PREVIA R\xD3TULO -->
          <div id="view-preview-shipping" style="display: none; max-height: 420px; overflow-y: auto; background: #ffffff; padding: 14px; border-radius: 8px; border: 1px solid var(--border-color); color: #1e293b;">
            ${O}
          </div>
        `,footerButtons:[{label:"\u{1F3F7}\uFE0F Imprimir R\xF3tulo de Env\xEDo",class:"btn-secondary",onClick:()=>{U.printDocument(O,`Rotulo_Envio_${Y.numeroGuia}`)}},{label:"\u{1F5A8}\uFE0F Imprimir Factura",class:"btn-primary",onClick:()=>{U.printDocument(T,`Factura_${P}`)}},{label:"\u2728 Nueva Venta",class:"btn-secondary",onClick:()=>x.close()}]});if(_){let $=_.querySelector("#btn-tab-preview-invoice"),q=_.querySelector("#btn-tab-preview-shipping"),K=_.querySelector("#view-preview-invoice"),oe=_.querySelector("#view-preview-shipping");$&&q&&K&&oe&&($.addEventListener("click",()=>{$.className="btn btn-sm btn-primary",q.className="btn btn-sm btn-secondary",K.style.display="block",oe.style.display="none"}),q.addEventListener("click",()=>{q.className="btn btn-sm btn-primary",$.className="btn btn-sm btn-secondary",K.style.display="none",oe.style.display="block"}))}this.cart=[],this.render(e)});let m=u=>{if(u.key==="F4"){u.preventDefault();let b=e.querySelector("#btn-process-sale");b&&b.click()}else if(u.key==="F2"){u.preventDefault();let b=e.querySelector("#pos-search-product");b&&b.focus()}};window.addEventListener("keydown",m)}};N();B();Q();var de={RECIBIDO:{label:"Pedido Recibido",class:"badge-info",icon:"\u{1F4E5}"},PREPARACION:{label:"En Preparaci\xF3n",class:"badge-warning",icon:"\u{1F4E6}"},EMPACADO:{label:"Empacado / Zunchado",class:"badge-warning",icon:"\u{1F3F7}\uFE0F"},LISTO_DESPACHO:{label:"Listo p/ Despacho",class:"badge-primary",icon:"\u{1F69A}"},ENVIADO:{label:"En Ruta / Transportadora",class:"badge-info",icon:"\u{1F6E3}\uFE0F"},ENTREGADO:{label:"Entregado a Cliente",class:"badge-success",icon:"\u2713"},DEVUELTO:{label:"Devuelto a Planta",class:"badge-danger",icon:"\u21A9\uFE0F"},CANCELADO:{label:"Cancelado",class:"badge-danger",icon:"\u2715"}},we={async render(e){let t=I.getActiveTenant(),o=t?t.id:"tenant_rayopro",[a,r]=await Promise.all([f.getAll(v.ORDERS_SHIPPING,o),f.getAll(v.CUSTOMERS,o)]);e.innerHTML=`
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Log\xEDstica de Pedidos & Env\xEDos</h1>
          <p>Control de despacho de mercanc\xEDa, transportadoras nacionales (Servientrega, Coordinadora, Envia) y estado de entrega</p>
        </div>
        <div class="view-actions">
          <button class="btn btn-primary btn-sm" id="btn-new-shipping">\u{1F69A} Registrar Nuevo Env\xEDo</button>
        </div>
      </div>

      <!-- KANBAN SUMMARY DE CICLO LOG\xCDSTICO -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px;">
        ${Object.entries(de).slice(0,6).map(([s,i])=>{let n=a.filter(d=>d.estadoCiclo===s).length;return`
            <div class="card" style="margin-bottom: 0; padding: 12px; border-left: 3px solid var(--brand-primary);">
              <div class="d-flex justify-between items-center">
                <span class="text-xs font-bold text-muted">${i.label}</span>
                <span>${i.icon}</span>
              </div>
              <div style="font-size: 20px; font-weight: 800; margin-top: 4px;">${n}</div>
            </div>
          `}).join("")}
      </div>

      <div id="shipping-table-container"></div>
    `,new L({containerId:"shipping-table-container",data:a,columns:[{key:"numeroGuia",title:"Gu\xEDa / Transportadora",render:(s,i)=>`
            <div>
              <strong style="color: var(--brand-primary);">${s||"POR ASIGNAR"}</strong>
              <div class="text-xs text-muted">${i.transportadora}</div>
            </div>
          `},{key:"clienteNombre",title:"Destinatario",render:(s,i)=>`
            <div>
              <div class="font-bold">${s}</div>
              <div class="text-xs text-muted">\u{1F4CD} ${i.direccion||"-"}</div>
            </div>
          `},{key:"estadoCiclo",title:"Estado del Env\xEDo",render:s=>{let i=de[s]||{label:s,class:"badge-neutral",icon:""};return`<span class="badge ${i.class}">${i.icon} ${i.label}</span>`}},{key:"fechaDespacho",title:"Fecha Despacho",render:s=>g.date(s)},{key:"fechaEntregaEstimada",title:"Fecha Estimada",render:s=>g.date(s)},{key:"costoEnvio",title:"Flete / Valor",render:s=>Number(s)>0?g.currency(s):'<span class="text-success">Gratis / Propio</span>'}],actions:s=>`
        <button class="btn btn-primary btn-sm btn-print-label" data-id="${s.id}" title="Imprimir R\xF3tulo Adhesivo con C\xF3digo de Barras">\u{1F3F7}\uFE0F R\xF3tulo Env\xEDo</button>
        <button class="btn btn-secondary btn-sm btn-update-ship-status" data-id="${s.id}">\u{1F504} Estado</button>
      `}),e.querySelector("#btn-new-shipping").addEventListener("click",()=>{this.openNewShippingModal(o,r,()=>this.render(e))}),e.addEventListener("click",s=>{let i=s.target.closest(".btn-print-label");if(i){let d=i.getAttribute("data-id"),l=a.find(c=>c.id===d);if(l){let c=F.shippingBoxLabel(l);U.printDocument(c,`Rotulo_Envio_${l.numeroGuia}`)}return}let n=s.target.closest(".btn-update-ship-status");if(n){let d=n.getAttribute("data-id"),l=a.find(c=>c.id===d);this.openUpdateStatusModal(l,()=>this.render(e))}})},openNewShippingModal(e,t,o){let a=`
      <form id="shipping-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Cliente Destinatario</label>
            <select class="form-select" name="clienteId" id="ship-client-select" required>
              ${t.map(s=>`<option value="${s.id}" data-addr="${s.direccion||""}">${s.nombre} (${s.ciudad||""})</option>`).join("")}
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
            <input type="text" class="form-control" name="numeroGuia" required value="GUIA-${Math.floor(1e5+Math.random()*9e5)}" placeholder="Ej: 21987364501">
          </div>
          <div class="form-group">
            <label class="form-label">Costo Flete ($ COP)</label>
            <input type="number" class="form-control" name="costoEnvio" value="0">
          </div>
        </div>

        <div class="form-group mb-3">
          <label class="form-label">Direcci\xF3n Completa de Destino</label>
          <input type="text" class="form-control" id="ship-address" name="direccion" required value="${t[0]?.direccion||""}">
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Fecha de Despacho</label>
            <input type="date" class="form-control" name="fechaDespacho" value="${g.toInputDate()}">
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
    `,r=x.show({title:"Generar Despacho y Gu\xEDa de Transporte",content:a,footerButtons:[{label:"Cancelar",class:"btn-secondary",onClick:()=>x.close()},{label:"Registrar Despacho",class:"btn-primary",onClick:async()=>{let s=r.querySelector("#shipping-form");if(!s.checkValidity()){s.reportValidity();return}let i=new FormData(s),n=t.find(l=>l.id===i.get("clienteId")),d={tenantId:e,clienteId:n.id,clienteNombre:n.nombre,nitCc:n.nitCc||"",telefono:n.telefono||n.whatsapp||"",whatsapp:n.whatsapp||n.telefono||"",email:n.email||"",ciudad:n.ciudad||"Medell\xEDn",departamento:n.departamento||"Antioquia",barrio:n.barrio||"",direccion:i.get("direccion")||n.direccion||"",transportadora:i.get("transportadora"),numeroGuia:i.get("numeroGuia"),costoEnvio:Number(i.get("costoEnvio")||0),fechaDespacho:i.get("fechaDespacho"),fechaEntregaEstimada:new Date(Date.now()+3*864e5).toISOString().split("T")[0],estadoCiclo:i.get("estadoCiclo"),responsable:"Valentina Restrepo",cajasTotal:1,contenidoDescripcion:"Productos de mantenimiento y embellecimiento automotriz",observaciones:i.get("observaciones")||"Manejar con precauci\xF3n. Productos de mantenimiento y embellecimiento automotriz."};await f.add(v.ORDERS_SHIPPING,d),C.success("Despacho registrado correctamente."),x.close(),o&&o()}}]});r.querySelector("#ship-client-select").addEventListener("change",s=>{let i=s.target.options[s.target.selectedIndex];r.querySelector("#ship-address").value=i.getAttribute("data-addr")||""})},openUpdateStatusModal(e,t){let o=`
      <div class="form-group mb-3">
        <label class="form-label">Gu\xEDa de Transporte: <strong>${e.numeroGuia}</strong> (${e.transportadora})</label>
        <div class="text-xs text-muted mb-2">Destinatario: ${e.clienteNombre}</div>
      </div>
      <div class="form-group mb-3">
        <label class="form-label">Seleccionar Nuevo Estado del Ciclo:</label>
        <select class="form-select" id="new-ship-status">
          ${Object.entries(de).map(([r,s])=>`
            <option value="${r}" ${e.estadoCiclo===r?"selected":""}>${s.icon} ${s.label}</option>
          `).join("")}
        </select>
      </div>
    `,a=x.show({title:"Actualizar Estado Log\xEDstico",content:o,size:"sm",footerButtons:[{label:"Cancelar",class:"btn-secondary",onClick:()=>x.close()},{label:"Guardar Estado",class:"btn-primary",onClick:async()=>{let r=a.querySelector("#new-ship-status").value;e.estadoCiclo=r,r==="ENTREGADO"&&(e.fechaEntregaReal=new Date().toISOString().split("T")[0]),await f.update(v.ORDERS_SHIPPING,e),C.success(`Estado actualizado a: ${de[r].label}`),x.close(),t&&t()}}]})}};N();B();var $e={async render(e){let t=I.getActiveTenant(),o=t?t.id:"tenant_rayopro",[a,r,s]=await Promise.all([H.getCurrentShift(o),f.getAll(v.CASH_SHIFTS,o),f.getAll(v.CASH_MOVEMENTS,o)]),i=a?s.filter(m=>m.turnoId===a.id):[];e.innerHTML=`
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Control de Caja & Arqueos</h1>
          <p>Manejo de turnos, efectivo f\xEDsico, ingresos, retiros a banco y diferencias de caja</p>
        </div>
        <div class="view-actions">
          ${a?`
            <button class="btn btn-secondary btn-sm" id="btn-cash-movement">\u2795 Movimiento de Caja</button>
            <button class="btn btn-danger btn-sm" id="btn-close-shift">\u{1F512} Cerrar Turno & Arqueo</button>
          `:`
            <button class="btn btn-primary btn-sm" id="btn-open-shift">\u{1F513} Aperturar Turno de Caja</button>
          `}
        </div>
      </div>

      ${a?`
        <!-- RESUMEN DEL TURNO ACTIVO -->
        <div class="card mb-4" style="border-top: 4px solid var(--brand-primary);">
          <div class="card-header">
            <div>
              <div class="card-title">Turno de Caja Activo</div>
              <div class="card-subtitle">Aperturado el ${g.dateTime(a.fechaApertura)} por <strong>${a.usuarioNombre||"Cajero"}</strong></div>
            </div>
            <span class="badge badge-success">\u25CF TURNO ABIERTO</span>
          </div>
          <div class="card-body">
            <div class="kpi-grid mb-3">
              <div class="kpi-card">
                <div class="kpi-label">Base Inicial Apertura</div>
                <div class="kpi-value">${g.currency(a.montoApertura)}</div>
                <div class="kpi-footer">Efectivo inicial en gaveta</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Ventas en Efectivo</div>
                <div class="kpi-value text-success">${g.currency(a.totalVentasEfectivo||0)}</div>
                <div class="kpi-footer">+ Efectivo sumado por ventas</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Ingresos / Otros</div>
                <div class="kpi-value">${g.currency(a.totalIngresos||0)}</div>
                <div class="kpi-footer">+ Entradas manuales a caja</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Gastos Menores / Egresos</div>
                <div class="kpi-value text-danger">-${g.currency((a.totalGastos||0)+(a.totalEgresos||0)+(a.totalRetiros||0))}</div>
                <div class="kpi-footer">- Salidas de efectivo</div>
              </div>
            </div>

            <div class="card" style="background: #f8fafc; border: 1px solid var(--border-color); margin-bottom: 0;">
              <div class="card-body d-flex justify-between items-center" style="padding: 14px 20px;">
                <div>
                  <div class="text-xs font-bold text-muted">SALDO ESTIMADO EN EFECTIVO (ESPERADO EN GAVETA):</div>
                  <div style="font-size: 26px; font-weight: 800; color: var(--brand-primary);">${g.currency(a.saldoEsperado)}</div>
                </div>
                <div class="d-flex gap-2">
                  <div class="text-xs text-muted" style="text-align: right;">
                    <div>Nequi / Daviplata: <strong>${g.currency(a.totalVentasNequiDaviplata||0)}</strong></div>
                    <div>Transferencias: <strong>${g.currency(a.totalVentasTransferencia||0)}</strong></div>
                    <div>Tarjetas: <strong>${g.currency(a.totalVentasTarjeta||0)}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- MOVIMIENTOS DEL TURNO ACTUAL -->
        <div class="card mb-4">
          <div class="card-header">
            <div class="card-title" style="font-size: 14px;">Movimientos Manuales del Turno (${i.length})</div>
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
                  ${i.length>0?i.map(m=>`
                    <tr>
                      <td>${g.dateTime(m.fecha)}</td>
                      <td>
                        <span class="badge ${m.tipo==="INGRESO"?"badge-success":"badge-danger"}">${m.tipo}</span>
                      </td>
                      <td><strong>${m.concepto}</strong></td>
                      <td>${m.tercero}</td>
                      <td class="text-right font-bold ${m.tipo==="INGRESO"?"text-success":"text-danger"}">
                        ${m.tipo==="INGRESO"?"+":"-"}${g.currency(m.monto)}
                      </td>
                    </tr>
                  `).join(""):`
                    <tr><td colspan="5" class="text-center text-muted" style="padding: 20px;">No hay movimientos manuales en este turno.</td></tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `:`
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
                ${r.filter(m=>m.estado==="CERRADA").length>0?r.filter(m=>m.estado==="CERRADA").map(m=>{let u=m.diferencia||0,b=u===0||u>0?"text-success":"text-danger";return`
                    <tr>
                      <td>${g.dateTime(m.fechaApertura)}</td>
                      <td>${g.dateTime(m.fechaCierre)}</td>
                      <td><strong>${m.usuarioNombre||"Cajero"}</strong></td>
                      <td class="text-right">${g.currency(m.montoApertura)}</td>
                      <td class="text-right">${g.currency(m.totalVentasEfectivo)}</td>
                      <td class="text-right">${g.currency(m.saldoEsperado)}</td>
                      <td class="text-right"><strong>${g.currency(m.saldoContado)}</strong></td>
                      <td class="text-right font-bold ${b}">${u>0?"+":""}${g.currency(u)}</td>
                      <td><span class="badge badge-neutral">Cerrada</span></td>
                    </tr>
                  `}).join(""):`
                  <tr><td colspan="9" class="text-center text-muted" style="padding: 20px;">No hay turnos cerrados en el historial.</td></tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;let n=()=>{this.openShiftModal(o,()=>this.render(e))},d=e.querySelector("#btn-open-shift");d&&d.addEventListener("click",n);let l=e.querySelector("#btn-open-shift-center");l&&l.addEventListener("click",n);let c=e.querySelector("#btn-cash-movement");c&&c.addEventListener("click",()=>{this.openMovementModal(o,a.id,()=>this.render(e))});let p=e.querySelector("#btn-close-shift");p&&p.addEventListener("click",()=>{this.openCloseShiftModal(a,()=>this.render(e))})},openShiftModal(e,t){let a=x.show({title:"Apertura de Turno de Caja",content:`
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
    `,footerButtons:[{label:"Cancelar",class:"btn-secondary",onClick:()=>x.close()},{label:"Aperturar Caja",class:"btn-primary",onClick:async()=>{let r=a.querySelector("#open-shift-form"),s=new FormData(r),i=Number(s.get("montoApertura")||0),n=s.get("observaciones");try{await H.openShift({tenantId:e,usuarioId:"usr_admin",usuarioNombre:"Carlos Mario Arango",montoApertura:i,observaciones:n}),C.success("Turno de caja aperturado correctamente."),x.close(),t&&t()}catch(d){C.error(d.message)}}}]})},openMovementModal(e,t,o){let r=x.show({title:"Registrar Movimiento en Caja",content:`
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
    `,footerButtons:[{label:"Cancelar",class:"btn-secondary",onClick:()=>x.close()},{label:"Registrar en Caja",class:"btn-primary",onClick:async()=>{let s=r.querySelector("#cash-mov-form");if(!s.checkValidity()){s.reportValidity();return}let i=new FormData(s);await H.addMovement({tenantId:e,turnoId:t,tipo:i.get("tipo"),monto:Number(i.get("monto")),concepto:i.get("concepto"),tercero:i.get("tercero")}),C.success("Movimiento de caja registrado."),x.close(),o&&o()}}]})},openCloseShiftModal(e,t){let o=`
      <div class="mb-3" style="background: var(--brand-primary-light); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
        <div class="d-flex justify-between items-center text-xs">
          <span style="color: var(--text-main); font-weight: 600;">Saldo Te\xF3rico Esperado en Gaveta:</span>
          <strong style="font-size: 16px; color: var(--brand-primary);">${g.currency(e.saldoEsperado)}</strong>
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
    `,a=x.show({title:"Cierre y Arqueo Final de Caja",content:o,footerButtons:[{label:"Cancelar",class:"btn-secondary",onClick:()=>x.close()},{label:"Confirmar Cierre de Turno",class:"btn-danger",onClick:async()=>{let n=a.querySelector("#close-shift-form");if(!n.checkValidity()){n.reportValidity();return}let d=new FormData(n),l=Number(d.get("saldoContado")),c=d.get("observacionesCierre"),p=l-e.saldoEsperado;await H.closeShift({turnoId:e.id,saldoContado:l,observacionesCierre:c}),C.success("Turno de caja cerrado exitosamente."),x.close(),t&&t(),this.openShiftCloseWhatsAppModal(e,l,p,c)}}]}),r=a.querySelector("#inp-cash-counted"),s=a.querySelector("#lbl-cash-diff"),i=a.querySelector("#lbl-cash-diff-desc");r.addEventListener("input",()=>{let d=(Number(r.value)||0)-e.saldoEsperado;s.textContent=g.currency(d),d===0?(s.style.color="var(--color-success)",i.textContent="\u2713 Caja cuadrada con exactitud perfecta."):d>0?(s.style.color="var(--color-success)",i.textContent=`Sobrante de caja a favor de la empresa: ${g.currency(d)}`):(s.style.color="var(--color-danger)",i.textContent=`\u26A0\uFE0F Faltante de dinero en gaveta: ${g.currency(Math.abs(d))}`)})},openShiftCloseWhatsAppModal(e,t,o,a){let r=o===0?"\u2705 CUADRE PERFECTO":o>0?`\u{1F7E2} SOBRANTE (+${g.currency(o)})`:`\u{1F534} FALTANTE (-${g.currency(Math.abs(o))})`,s=new Date().toLocaleDateString("es-CO",{weekday:"long",year:"numeric",month:"long",day:"numeric"}),i=new Date().toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"}),d=`
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
          <textarea class="form-control" id="txt-shift-wa-msg" rows="9" style="font-family: monospace; font-size: 11px; white-space: pre-wrap;">${`\u{1F4CA} *REPORTE DE CIERRE DE CAJA*
\u{1F4C5} *Fecha:* ${s}
\u23F0 *Hora:* ${i}
\u{1F464} *Cajero Responsable:* ${e.cajero||"Cajero"}
----------------------------------------
\u{1F4B5} *Base Inicial de Gaveta:* ${g.currency(e.montoInicial||0)}
\u{1F4B0} *Ventas Efectivo:* ${g.currency(e.ventasEfectivo||0)}
\u{1F4B3} *Ventas Tarjeta / Dat\xE1fono:* ${g.currency(e.ventasTarjeta||0)}
\u{1F4F2} *Ventas Transferencias:* ${g.currency(e.ventasTransferencia||0)}
\u2795 *Entradas manuales:* ${g.currency(e.totalEntradas||0)}
\u2796 *Salidas / Gastos menores:* ${g.currency(e.totalSalidas||0)}
----------------------------------------
\u{1F3AF} *Total Te\xF3rico Esperado en Gaveta:* ${g.currency(e.saldoEsperado||0)}
\u{1F4B5} *Total Real F\xEDsico Contado:* ${g.currency(t)}
\u2696\uFE0F *Resultado del Cuadre:* ${r}
`+(a?`\u{1F4DD} *Observaciones:* ${a}
`:"")+`----------------------------------------
_Reporte generado autom\xE1ticamente desde Nexa Admin ERP._`}</textarea>
        </div>
      </div>
    `,l=x.show({title:"\u{1F4F2} Enviar Balance de Cierre a Socios / Gerencia",content:d,footerButtons:[{label:"Omitir / Cerrar",class:"btn-secondary",onClick:()=>x.close()},{label:"\u{1F680} Abrir WhatsApp Web",class:"btn-success",onClick:()=>{let c=(l.querySelector("#inp-shift-wa-phone").value||"").replace(/\D/g,""),p=l.querySelector("#txt-shift-wa-msg").value;if(!c){C.warning("Ingrese un n\xFAmero de tel\xE9fono v\xE1lido.");return}let u=`https://api.whatsapp.com/send?phone=${c.startsWith("57")?c:"57"+c}&text=${encodeURIComponent(p)}`;window.open(u,"_blank"),x.close()}}]})}};N();B();var Ye=["Transporte y Fletes","Combustible y Veh\xEDculos","Servicios P\xFAblicos","N\xF3mina y Prestaciones","Arriendo de Bodega / Local","Materia Prima / Insumos Menores","Empaque y Cajas","Publicidad y Marketing Digital","Mensajer\xEDa y Env\xEDos","Mantenimiento de Maquinaria","Impuestos y Tasas","Comisiones de Ventas","Otros Gastos Administrativos"],De={async render(e){let t=I.getActiveTenant(),o=t?t.id:"tenant_rayopro",a=await f.getAll(v.EXPENSES,o),r=a.reduce((s,i)=>s+Number(i.valor||0),0);e.innerHTML=`
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
          <div class="kpi-value text-danger">${g.currency(r)}</div>
          <div class="kpi-footer">${a.length} registros contables</div>
        </div>
      </div>

      <div id="expenses-table-container"></div>
    `,new L({containerId:"expenses-table-container",data:a.sort((s,i)=>new Date(i.fecha)-new Date(s.fecha)),columns:[{key:"fecha",title:"Fecha",render:s=>g.date(s)},{key:"categoria",title:"Categor\xEDa",render:s=>`<span class="badge badge-neutral font-bold">${s}</span>`},{key:"concepto",title:"Concepto / Detalle",render:(s,i)=>`
            <div>
              <strong>${s}</strong>
              <div class="text-xs text-muted">Beneficiario: ${i.proveedor||"-"}</div>
            </div>
          `},{key:"valor",title:"Valor Pagado",render:s=>`<strong class="text-danger">-${g.currency(s)}</strong>`},{key:"formaPago",title:"Medio de Pago",render:s=>`<span class="badge badge-info">${s||"Efectivo"}</span>`},{key:"responsableNombre",title:"Responsable",render:s=>s||"Administraci\xF3n"}]}),e.querySelector("#btn-new-expense").addEventListener("click",()=>{this.openExpenseModal(o,()=>this.render(e))})},openExpenseModal(e,t){let o=`
      <form id="expense-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Categor\xEDa del Gasto</label>
            <select class="form-select" name="categoria" required>
              ${Ye.map(r=>`<option value="${r}">${r}</option>`).join("")}
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
    `,a=x.show({title:"Registrar Nuevo Gasto Operativo",content:o,footerButtons:[{label:"Cancelar",class:"btn-secondary",onClick:()=>x.close()},{label:"Guardar Gasto",class:"btn-primary",onClick:async()=>{let r=a.querySelector("#expense-form");if(!r.checkValidity()){r.reportValidity();return}let s=new FormData(r),i={tenantId:e,fecha:new Date().toISOString(),categoria:s.get("categoria"),valor:Number(s.get("valor")),concepto:s.get("concepto"),proveedor:s.get("proveedor"),formaPago:s.get("formaPago"),responsableNombre:"Carlos Mario Arango",observacion:s.get("observacion")};await f.add(v.EXPENSES,i),C.success("Gasto registrado exitosamente."),x.close(),t&&t()}}]})}};N();B();var Oe={async render(e){let t=I.getActiveTenant(),o=t?t.id:"tenant_rayopro",[a,r]=await Promise.all([f.getAll(v.RECEIVABLES_CXC,o),f.getAll(v.CUSTOMERS,o)]),s=new Date;a.forEach(d=>{if(d.fechaVencimiento&&d.saldo>0){let l=new Date(d.fechaVencimiento),c=s.getTime()-l.getTime(),p=Math.floor(c/(1e3*60*60*24));p>0?(d.diasMora=p,d.estado=p>30?"MORA_CRITICA":"VENCIDO"):p>=-5?(d.diasMora=0,d.estado="POR_VENCER"):(d.diasMora=0,d.estado="AL_DIA")}});let i=a.reduce((d,l)=>d+Number(l.saldo||0),0),n=a.filter(d=>d.estado==="VENCIDO"||d.estado==="MORA_CRITICA").reduce((d,l)=>d+Number(l.saldo||0),0);e.innerHTML=`
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Cuentas por Cobrar (Cartera)</h1>
          <p>Control de deudas de clientes comerciales, plazos de pago y recaudo de cartera</p>
        </div>
      </div>

      <div class="kpi-grid mb-4">
        <div class="kpi-card">
          <div class="kpi-label">Cartera Total Activa</div>
          <div class="kpi-value text-warning">${g.currency(i)}</div>
          <div class="kpi-footer">${a.filter(d=>d.saldo>0).length} facturas con saldo</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Cartera en Mora Vencida</div>
          <div class="kpi-value text-danger">${g.currency(n)}</div>
          <div class="kpi-footer">Requiere cobro urgente</div>
        </div>
      </div>

      <div id="cxc-table-container"></div>
    `,new L({containerId:"cxc-table-container",data:a.filter(d=>d.saldo>0),columns:[{key:"documento",title:"Factura / Documento",render:d=>`<strong style="color: var(--brand-primary);">${d}</strong>`},{key:"clienteNombre",title:"Cliente Deudor",render:d=>`<strong>${d}</strong>`},{key:"fechaEmision",title:"Emisi\xF3n",render:d=>g.date(d)},{key:"fechaVencimiento",title:"Vencimiento",render:d=>g.date(d)},{key:"valorTotal",title:"Valor Total",render:d=>g.currency(d)},{key:"abonos",title:"Abonos Realizados",render:d=>g.currency(d||0)},{key:"saldo",title:"Saldo Pendiente",render:d=>`<strong class="text-danger">${g.currency(d)}</strong>`},{key:"estado",title:"Estado / Mora",render:(d,l)=>{let p={AL_DIA:{label:"Al D\xEDa",class:"badge-success"},POR_VENCER:{label:"Pr\xF3ximo a Vencer",class:"badge-warning"},VENCIDO:{label:`Vencido (${l.diasMora} d)`,class:"badge-danger"},MORA_CRITICA:{label:`Mora Cr\xEDtica (${l.diasMora} d)`,class:"badge-danger"}}[d]||{label:d,class:"badge-neutral"};return`<span class="badge ${p.class}">${p.label}</span>`}}],actions:d=>`
        <div class="d-flex items-center gap-1 flex-wrap">
          <button class="btn btn-primary btn-sm btn-cxc-payment" data-id="${d.id}" title="Registrar Abono">\u{1F4B5} Abono</button>
          <button class="btn btn-sm btn-cxc-whatsapp" data-id="${d.id}" style="background: #25d366; border-color: #25d366; color: #ffffff; font-weight: 700; padding: 3px 8px; font-size: 11px;" title="Enviar cobro por WhatsApp">\u{1F4F2} WhatsApp</button>
          <button class="btn btn-secondary btn-sm btn-cxc-calendar" data-id="${d.id}" title="Programar recordatorio en Google Calendar">\u{1F4C5} Recordatorio</button>
        </div>
      `}),e.addEventListener("click",d=>{let l=d.target.closest(".btn-cxc-payment");if(l){let m=l.getAttribute("data-id"),u=a.find(b=>b.id===m);this.openPaymentModal(u,o,r,()=>this.render(e));return}let c=d.target.closest(".btn-cxc-whatsapp");if(c){let m=c.getAttribute("data-id"),u=a.find(b=>b.id===m);this.openWhatsAppModal(u,t,r);return}let p=d.target.closest(".btn-cxc-calendar");if(p){let m=p.getAttribute("data-id"),u=a.find(b=>b.id===m);this.scheduleGoogleCalendar(u,t,r);return}})},openPaymentModal(e,t,o,a){let r=`
      <div class="mb-3" style="background: var(--bg-surface-solid); padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">
        <div class="text-xs text-muted">Abono a Documento: <strong>${e.documento}</strong></div>
        <div style="font-size: 16px; font-weight: 700; color: var(--text-main); margin: 2px 0;">${e.clienteNombre}</div>
        <div class="d-flex justify-between items-center text-xs mt-2">
          <span>Saldo Actual Pendiente:</span>
          <strong class="text-danger" style="font-size: 15px;">${g.currency(e.saldo)}</strong>
        </div>
      </div>

      <form id="cxc-payment-form">
        <div class="form-group mb-3">
          <label class="form-label">Monto del Abono ($ COP)</label>
          <input type="number" step="any" min="1" max="${e.saldo}" class="form-control" name="montoAbono" value="${e.saldo}" required>
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
    `,s=x.show({title:"Recaudar Cartera / Registrar Abono",content:r,footerButtons:[{label:"Cancelar",class:"btn-secondary",onClick:()=>x.close()},{label:"Procesar Abono",class:"btn-primary",onClick:async()=>{let i=s.querySelector("#cxc-payment-form");if(!i.checkValidity()){i.reportValidity();return}let n=new FormData(i),d=Number(n.get("montoAbono")),l=n.get("metodoPago");e.abonos=(e.abonos||0)+d,e.saldo=Math.max(0,e.saldo-d),e.saldo===0&&(e.estado="PAGADA"),await f.update(v.RECEIVABLES_CXC,e);let c=o.find(p=>p.id===e.clienteId);if(c&&(c.saldoPendiente=Math.max(0,(c.saldoPendiente||0)-d),await f.update(v.CUSTOMERS,c)),l==="Efectivo"){let p=await H.getCurrentShift(t);p&&await H.addMovement({tenantId:t,turnoId:p.id,tipo:"INGRESO",monto:d,concepto:`Abono Cartera Doc ${e.documento} de ${e.clienteNombre}`,tercero:e.clienteNombre,formaPago:"Efectivo"})}C.success(`Abono por ${g.currency(d)} registrado con \xE9xito.`),x.close(),a&&a()}}]})},openWhatsAppModal(e,t,o){let a=o.find(d=>d.id===e.clienteId||d.nombre===e.clienteNombre)||{},r=(a.whatsapp||a.telefono||"").replace(/\D/g,"");r.length===10&&(r="57"+r);let s=e.estado==="VENCIDO"||e.estado==="MORA_CRITICA"||e.diasMora&&e.diasMora>0,i="";s?i=`Hola *${e.clienteNombre}*, un cordial saludo de parte de *${t.nombreComercial}*.

Le escribimos para solicitar comedidamente la cancelaci\xF3n de su saldo pendiente por *${g.currency(e.saldo)}*, correspondiente a la factura *${e.documento}*, la cual presenta *${e.diasMora||0} d\xEDas de mora* (Venci\xF3: ${g.date(e.fechaVencimiento)}).

Puede realizar su transferencia a nuestras cuentas oficiales:
\u{1F3E6} *Bancolombia Cta Ahorros:* 123-456789-01
\u{1F4F1} *Nequi / Daviplata:* ${t.telefono||"3124567890"}
*NIT:* ${t.nit}-${t.dv}

Le agradecemos enviarnos el comprobante por este medio para actualizar su estado de cuenta y mantener activo su cupo de cr\xE9dito para pr\xF3ximos despachos.

\xA1Muchas gracias por su atenci\xF3n!`:i=`Hola *${e.clienteNombre}*, un cordial saludo de parte de *${t.nombreComercial}*.

Le compartimos un recordatorio amable sobre su factura *${e.documento}* por valor de *${g.currency(e.saldo)}*, cuya fecha de vencimiento es el *${g.date(e.fechaVencimiento)}*.

Cuentas habilitadas para pago:
\u{1F3E6} *Bancolombia Cta Ahorros:* 123-456789-01
\u{1F4F1} *Nequi / Daviplata:* ${t.telefono||"3124567890"}

Quedamos a su entera disposici\xF3n para cualquier inquietud o para coordinar su pr\xF3ximo pedido.

\xA1Feliz d\xEDa!`;let n=`
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
          <input type="text" class="form-control font-bold" id="inp-wa-phone" value="${r||"57"}" placeholder="Ej: 573124567890">
          <span class="badge ${r?"badge-success":"badge-warning"}" id="badge-wa-status">${r?"\u2713 Registrado":"\u26A0\uFE0F Sin registrar"}</span>
        </div>
        <span class="form-help">Incluya el c\xF3digo de pa\xEDs (Ej: 57 para Colombia seguido del celular).</span>
      </div>

      <div class="form-group mb-3">
        <label class="form-label font-bold">Mensaje Pre-redactado de Cobro</label>
        <textarea class="form-control" id="inp-wa-message" rows="8" style="font-size: 12px; font-family: monospace; line-height: 1.4;">${i}</textarea>
        <span class="form-help">Puede personalizar cualquier texto antes de pulsar Enviar. Los asteriscos *texto* saldr\xE1n en negrita en WhatsApp.</span>
      </div>
    `;x.show({title:`\u{1F4F2} Cobro por WhatsApp - Factura ${e.documento}`,content:n,size:"md",footerButtons:[{label:"Cancelar",class:"btn-secondary",onClick:()=>x.close()},{label:"\u{1F4AC} Abrir en WhatsApp Web y Enviar",class:"btn-primary",onClick:()=>{let d=document.getElementById("inp-wa-phone"),l=document.getElementById("inp-wa-message"),c=(d?d.value:r).replace(/\D/g,""),p=l?l.value:i;if(!c||c.length<10){C.warning("Por favor ingrese un n\xFAmero de WhatsApp v\xE1lido.");return}let m=`https://api.whatsapp.com/send?phone=${c}&text=${encodeURIComponent(p)}`;window.open(m,"_blank"),C.success("Abriendo WhatsApp Web con el mensaje pre-cargado..."),x.close()}}]})},scheduleGoogleCalendar(e,t,o){let a=o.find(l=>l.id===e.clienteId)||{},s=(e.fechaVencimiento||new Date().toISOString().split("T")[0]).replace(/-/g,""),i=`Cobro Factura ${e.documento} - ${e.clienteNombre}`,n=`Recordatorio de cobro de cartera en Nexa ERP (${t.nombreComercial})

Cliente: ${e.clienteNombre}
Factura: ${e.documento}
Saldo Pendiente: ${g.currency(e.saldo)}
Fecha Vencimiento: ${g.date(e.fechaVencimiento)}
Contacto: ${a.telefono||a.whatsapp||"No registrado"}`,d=`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(i)}&dates=${s}T140000Z/${s}T143000Z&details=${encodeURIComponent(n)}`;window.open(d,"_blank"),C.info("Abriendo Google Calendar para programar el recordatorio...")}};N();B();var Me={async render(e){let t=I.getActiveTenant(),o=t?t.id:"tenant_rayopro",a=await f.getAll(v.PAYABLES_CXP,o),r=a.reduce((s,i)=>s+Number(i.saldo||0),0);e.innerHTML=`
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Cuentas por Pagar (Proveedores)</h1>
          <p>Control de compromisos comerciales por compra de materias primas y servicios</p>
        </div>
      </div>

      <div class="kpi-grid mb-4">
        <div class="kpi-card">
          <div class="kpi-label">Pasivo Total con Proveedores</div>
          <div class="kpi-value text-danger">${g.currency(r)}</div>
          <div class="kpi-footer">${a.filter(s=>s.saldo>0).length} facturas pendientes de pago</div>
        </div>
      </div>

      <div id="cxp-table-container"></div>
    `,new L({containerId:"cxp-table-container",data:a.filter(s=>s.saldo>0),columns:[{key:"documento",title:"Factura Proveedor",render:s=>`<strong style="color: var(--brand-primary);">${s}</strong>`},{key:"proveedorNombre",title:"Proveedor",render:s=>`<strong>${s}</strong>`},{key:"fechaEmision",title:"Emisi\xF3n",render:s=>g.date(s)},{key:"fechaVencimiento",title:"Vencimiento",render:s=>g.date(s)},{key:"valorTotal",title:"Valor Total",render:s=>g.currency(s)},{key:"saldo",title:"Saldo Pendiente",render:s=>`<strong class="text-danger">${g.currency(s)}</strong>`},{key:"estado",title:"Estado",render:s=>`<span class="badge ${s==="AL_DIA"?"badge-success":"badge-danger"}">${s}</span>`}],actions:s=>`
        <button class="btn btn-primary btn-sm btn-cxp-pay" data-id="${s.id}">\u{1F4B3} Pagar a Proveedor</button>
      `}),e.addEventListener("click",s=>{let i=s.target.closest(".btn-cxp-pay");if(i){let n=i.getAttribute("data-id"),d=a.find(l=>l.id===n);this.openPaySupplierModal(d,()=>this.render(e))}})},openPaySupplierModal(e,t){let o=`
      <div class="mb-3" style="background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">
        <div class="text-xs text-muted">Pago a Proveedor: <strong>${e.proveedorNombre}</strong></div>
        <div style="font-size: 15px; font-weight: 700; margin: 2px 0;">Factura: ${e.documento}</div>
        <div class="text-xs text-danger font-bold mt-1">Saldo a Liquidar: ${g.currency(e.saldo)}</div>
      </div>

      <form id="cxp-pay-form">
        <div class="form-group mb-3">
          <label class="form-label">Monto del Pago ($ COP)</label>
          <input type="number" step="any" min="1" max="${e.saldo}" class="form-control" name="monto" value="${e.saldo}" required>
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
    `,a=x.show({title:"Registrar Pago a Proveedor",content:o,footerButtons:[{label:"Cancelar",class:"btn-secondary",onClick:()=>x.close()},{label:"Confirmar Pago",class:"btn-primary",onClick:async()=>{let r=a.querySelector("#cxp-pay-form");if(!r.checkValidity()){r.reportValidity();return}let s=new FormData(r),i=Number(s.get("monto"));e.abonos=(e.abonos||0)+i,e.saldo=Math.max(0,e.saldo-i),e.saldo===0&&(e.estado="PAGADA"),await f.update(v.PAYABLES_CXP,e),C.success(`Pago por ${g.currency(i)} registrado con \xE9xito.`),x.close(),t&&t()}}]})}};N();var Ne={async render(e){let t=I.getActiveTenant(),o=t?t.id:"tenant_rayopro",a=await f.getAll(v.USERS,o),r=k.getCurrentUser(),s=k.isDeveloper();e.innerHTML=`
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Gesti\xF3n de Usuarios & Control de Accesos (RBAC)</h1>
          <p>Administraci\xF3n de credenciales, roles operativos y matriz de permisos granulares</p>
        </div>
        <div class="view-actions">
          ${s?`
            <button class="btn btn-primary btn-sm" id="btn-new-user">\u{1F464} Crear Usuario</button>
          `:`
            <span class="badge badge-warning" style="font-size: 11px; padding: 6px 12px;">\u{1F512} Edici\xF3n reservada a Desarrollador</span>
          `}
        </div>
      </div>

      <!-- ALERTA DE SEGURIDAD Y PROTECCI\xD3N DE AUTOR\xCDA INTELECTUAL -->
      ${s?"":`
        <div class="alert alert-warning mb-4" style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 10px; padding: 14px 18px;">
          <div style="font-size: 13.5px; font-weight: 800; color: #b45309; margin-bottom: 4px;">
            \u{1F6E1}\uFE0F M\xF3dulo Protegido \u2014 Propiedad Intelectual & Licenciamiento Nexa ERP
          </div>
          <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">
            La creaci\xF3n de usuarios del sistema y la alteraci\xF3n de roles y permisos RBAC est\xE1n reservadas exclusivamente al <strong>Desarrollador / Autor del Software</strong> con contrase\xF1a maestra. El perfil <strong>Gerente (Juan Pablo)</strong> cuenta con control total de las operaciones comerciales, inventarios y finanzas, pero la matriz de usuarios est\xE1 blindada para proteger la autor\xEDa intelectual del software.
          </div>
        </div>
      `}

      <div class="card mb-4" style="background: var(--bg-surface); border: 1px solid var(--border-color); padding: 14px 20px;">
        <div class="d-flex justify-between items-center flex-wrap gap-2">
          <div>
            <span class="text-xs text-muted">Sesi\xF3n Activa Actual:</span>
            <div style="font-size: 15px; font-weight: 700;">
              ${r.nombre} 
              <span class="badge ${s?"badge-primary":"badge-info"}" style="font-size: 11px;">${r.rol}</span>
            </div>
          </div>
          <div class="d-flex items-center gap-2">
            <span class="text-xs font-bold text-muted">CONMUTAR PERFIL:</span>
            <select class="form-select" id="sel-switch-user" style="width: auto; font-size: 12px;">
              ${a.map(n=>`
                <option value="${n.id}" ${n.id===r.id?"selected":""}>${n.nombre} - ${n.rol}</option>
              `).join("")}
            </select>
          </div>
        </div>
      </div>

      <div id="users-table-container"></div>
    `,new L({containerId:"users-table-container",data:a,columns:[{key:"nombre",title:"Nombre de Usuario",render:(n,d)=>`
            <div>
              <strong>${n}</strong>
              <div class="text-xs text-muted">@${d.usuario} \u2022 ${d.email}</div>
            </div>
          `},{key:"rol",title:"Rol Asignado",render:n=>`<span class="badge ${n==="Desarrollador"?"badge-primary font-bold":"badge-info font-bold"}">${n}</span>`},{key:"permisos",title:"Permisos Granulares",render:n=>(Array.isArray(n)?n:[]).map(l=>`<span class="badge badge-neutral" style="font-size: 10px; margin: 1px;">${l}</span>`).join(" ")},{key:"estado",title:"Estado",render:n=>`<span class="badge ${n==="ACTIVO"?"badge-success":"badge-danger"}">${n}</span>`}],actions:n=>s?`
        <button class="btn btn-secondary btn-sm btn-edit-user" data-id="${n.id}">\u270F\uFE0F Editar</button>
        <button class="btn btn-danger btn-sm btn-delete-user" data-id="${n.id}">\u{1F5D1}\uFE0F Eliminar</button>
      `:`
        <span class="badge badge-neutral" style="font-size: 10px;">\u{1F512} Protegido</span>
      `}),e.querySelector("#sel-switch-user").addEventListener("change",async n=>{let d=n.target.value,l=a.find(c=>c.id===d);if(l){if(l.rol==="Desarrollador"||l.rol===G.DEV){let c=prompt("\u{1F510} Ingrese la contrase\xF1a de DESARROLLADOR para autenticar el perfil de autor:");if(!c){C.warning("Acceso de desarrollador cancelado."),this.render(e);return}try{await k.switchUser(d,c),C.success("Sesi\xF3n cambiada a Desarrollador."),this.render(e)}catch(p){C.error(p.message||"Contrase\xF1a incorrecta."),this.render(e)}return}await k.switchUser(d),C.success("Sesi\xF3n cambiada. Permisos actualizados."),this.render(e)}});let i=e.querySelector("#btn-new-user");i&&i.addEventListener("click",()=>{if(!k.isDeveloper()){C.error("Acci\xF3n reservada al Desarrollador del software.");return}this.openUserModal(null,o,()=>this.render(e))}),e.addEventListener("click",n=>{let d=n.target.closest(".btn-edit-user"),l=n.target.closest(".btn-delete-user");if(d){if(!k.isDeveloper()){C.error("Edici\xF3n reservada al Desarrollador del software.");return}let c=d.getAttribute("data-id"),p=a.find(m=>m.id===c);this.openUserModal(p,o,()=>this.render(e))}if(l){if(!k.isDeveloper()){C.error("Acci\xF3n reservada al Desarrollador del software.");return}let c=l.getAttribute("data-id"),p=a.find(m=>m.id===c);if(p.id===r.id){C.error("No puedes eliminar tu propio usuario mientras tienes la sesi\xF3n iniciada.");return}x.confirm({title:"Confirmar Eliminaci\xF3n",message:`\xBFEst\xE1s seguro de que deseas eliminar permanentemente al usuario <strong>${p.nombre}</strong>?`,confirmText:"S\xED, Eliminar",cancelText:"Cancelar",onConfirm:async()=>{try{await f.delete(v.USERS,c),C.success("Usuario eliminado exitosamente."),this.render(e)}catch(m){C.error("Error al eliminar usuario: "+m.message)}}})}})},openUserModal(e=null,t,o){let a=!!e,r=Object.values(re),s=e?e.permisos||[]:["VER","CREAR","EDITAR"],i=`
      <form id="user-form">
        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Nombre Completo</label>
            <input type="text" class="form-control" name="nombre" required value="${e?e.nombre:""}" placeholder="Ej: Valentina Restrepo">
          </div>
          <div class="form-group">
            <label class="form-label">Nombre de Usuario (Login)</label>
            <input type="text" class="form-control" name="usuario" required value="${e?e.usuario:""}" placeholder="Ej: valentina.ventas">
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Correo Electr\xF3nico</label>
            <input type="email" class="form-control" name="email" required value="${e?e.email:""}" placeholder="usuario@rayopro.com.co">
          </div>
          <div class="form-group">
            <label class="form-label">Rol del Sistema</label>
            <select class="form-select" name="rol" id="user-role-sel">
              ${Object.values(G).map(d=>`
                <option value="${d}" ${e&&e.rol===d?"selected":""}>${d}</option>
              `).join("")}
            </select>
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="form-group">
            <label class="form-label">Contrase\xF1a de Acceso</label>
            <input type="text" class="form-control" name="clave" value="${e&&e.clave||""}" placeholder="Ej: Admin.2026">
          </div>
          <div class="form-group">
            <label class="form-label">Estado de la Cuenta</label>
            <select class="form-select" name="estado">
              <option value="ACTIVO" ${!e||e.estado==="ACTIVO"?"selected":""}>ACTIVO</option>
              <option value="INACTIVO" ${e&&e.estado==="INACTIVO"?"selected":""}>INACTIVO</option>
            </select>
          </div>
        </div>

        <div class="card mb-3" style="background: var(--bg-surface); border: 1px solid var(--border-color);">
          <div class="card-header" style="padding: 10px 14px;">
            <div class="card-title" style="font-size: 13px;">\u{1F6E1}\uFE0F Permisos Granulares de Acceso</div>
          </div>
          <div class="card-body" style="padding: 12px;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
              ${r.map(d=>`
                <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; cursor: pointer;">
                  <input type="checkbox" name="permiso_${d}" value="${d}" ${s.includes(d)?"checked":""}>
                  <span>${d==="FINANCIERO"?"VER INFORMACI\xD3N FINANCIERA":d}</span>
                </label>
              `).join("")}
            </div>
          </div>
        </div>
      </form>
    `,n=x.show({title:a?`Editar Usuario: ${e.nombre}`:"Crear Nuevo Usuario",content:i,footerButtons:[{label:"Cancelar",class:"btn-secondary",onClick:()=>x.close()},{label:a?"Guardar Cambios":"Crear Usuario",class:"btn-primary",onClick:async()=>{let d=n.querySelector("#user-form");if(!d.checkValidity()){d.reportValidity();return}let l=new FormData(d),c=[];r.forEach(m=>{l.get(`permiso_${m}`)&&c.push(m)});let p={tenantId:t,nombre:l.get("nombre"),usuario:l.get("usuario"),email:l.get("email"),rol:l.get("rol"),clave:l.get("clave")||(e?e.clave:""),estado:l.get("estado")||"ACTIVO",permisos:c};a?(p.id=e.id,await f.update(v.USERS,p),C.success("Usuario actualizado.")):(await f.add(v.USERS,p),C.success("Usuario registrado.")),x.close(),o&&o()}}]})}};N();B();Q();var ke={async render(e){let t=I.getActiveTenant(),o=t?t.id:"tenant_rayopro",a=(await f.getAll(v.AUDIT_LOGS,o)).sort((r,s)=>new Date(s.fechaCreacion||s.fecha)-new Date(r.fechaCreacion||r.fecha));e.innerHTML=`
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
    `,new L({containerId:"audit-table-container",data:a,columns:[{key:"fecha",title:"Fecha y Hora",render:(r,s)=>`
            <div>
              <strong>${g.date(r)}</strong>
              <div class="text-xs text-muted">${s.hora||""}</div>
            </div>
          `},{key:"usuarioNombre",title:"Usuario Operador",render:r=>`<strong>${r||"Sistema"}</strong>`},{key:"modulo",title:"M\xF3dulo",render:r=>`<span class="badge badge-info">${r}</span>`},{key:"accion",title:"Acci\xF3n",render:r=>`<span class="badge ${{CREAR:"badge-success",MODIFICAR:"badge-warning",ELIMINAR:"badge-danger",AUTORIZAR:"badge-primary",LOGIN:"badge-neutral"}[r]||"badge-neutral"}">${r}</span>`},{key:"registroId",title:"Registro Afectado",render:r=>`<code>${r||"-"}</code>`},{key:"campoModificado",title:"Detalle / Campo",render:r=>`<strong>${r||"-"}</strong>`},{key:"valorAnterior",title:"Valor Anterior",render:r=>`<span class="text-muted" style="text-decoration: line-through;">${r||"-"}</span>`},{key:"valorNuevo",title:"Valor Nuevo",render:r=>`<strong class="text-primary">${r||"-"}</strong>`}]}),e.querySelector("#btn-export-audit").addEventListener("click",()=>{U.exportToCSV(a,"Bitacora_Auditoria",{fecha:"Fecha",hora:"Hora",usuarioNombre:"Usuario",modulo:"M\xF3dulo",accion:"Acci\xF3n",registroId:"Registro",campoModificado:"Detalle",valorAnterior:"Valor Anterior",valorNuevo:"Valor Nuevo"})})}};N();B();Q();var Le={async render(e){let t=I.getActiveTenant(),o=t?t.id:"tenant_rayopro",[a,r,s,i,n,d]=await Promise.all([f.getAll(v.SALES,o),f.getAll(v.PRODUCTS,o),f.getAll(v.EXPENSES,o),f.getAll(v.CUSTOMERS,o),f.getAll(v.RECEIVABLES_CXC,o),f.getAll(v.PURCHASES,o)]);e.innerHTML=`
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
              <div class="card-subtitle">${a.length} facturas registradas</div>
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
              <div class="card-subtitle">${r.length} productos e insumos</div>
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
              <div class="card-subtitle">${n.filter(l=>l.saldo>0).length} cuentas pendientes</div>
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
              <div class="card-subtitle">${s.length} egresos</div>
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
              <div class="card-subtitle">${i.length} terceros activos</div>
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
    `,e.querySelector("#btn-export-sales-csv").addEventListener("click",()=>{U.exportToCSV(a,"Ventas_Facturacion",{consecutivo:"Consecutivo",fecha:"Fecha",clienteNombre:"Cliente",clienteNit:"NIT",metodoPago:"Forma Pago",subtotal:"Subtotal",impuestos:"IVA",total:"Total Venta"})}),e.querySelector("#btn-export-sales-excel").addEventListener("click",()=>{U.exportToCSV(a,"Ventas_Facturacion_Excel")}),e.querySelector("#btn-export-inv-csv").addEventListener("click",()=>{U.exportToCSV(r,"Inventario_Valorizado",{sku:"SKU",nombre:"Producto",categoria:"Categor\xEDa",tipoItem:"Tipo",unidadMedida:"Unidad",stock:"Existencias",costoPromedio:"Costo Promedio",stockMinimo:"Stock M\xEDnimo"})}),e.querySelector("#btn-export-inv-excel").addEventListener("click",()=>{U.exportToCSV(r,"Inventario_Valorizado_Excel")}),e.querySelector("#btn-export-cxc-csv").addEventListener("click",()=>{U.exportToCSV(n,"Cartera_Cuentas_Cobrar",{documento:"Documento",clienteNombre:"Cliente",fechaEmision:"Emisi\xF3n",fechaVencimiento:"Vencimiento",valorTotal:"Total",abonos:"Abonos",saldo:"Saldo Pendiente",diasMora:"D\xEDas Mora",estado:"Estado"})}),e.querySelector("#btn-export-cxc-excel").addEventListener("click",()=>{U.exportToCSV(n,"Cartera_Cuentas_Cobrar_Excel")}),e.querySelector("#btn-export-exp-csv").addEventListener("click",()=>{U.exportToCSV(s,"Gastos_Operativos")}),e.querySelector("#btn-export-exp-excel").addEventListener("click",()=>{U.exportToCSV(s,"Gastos_Operativos_Excel")}),e.querySelector("#btn-export-clients-csv").addEventListener("click",()=>{U.exportToCSV(i,"Clientes_Directorio")}),e.querySelector("#btn-export-clients-excel").addEventListener("click",()=>{U.exportToCSV(i,"Clientes_Directorio_Excel")}),e.querySelector("#btn-print-executive-report").addEventListener("click",()=>{let l=a.reduce((y,E)=>y+Number(E.total||0),0),c=s.reduce((y,E)=>y+Number(E.valor||0),0),p=r.reduce((y,E)=>y+E.stock*E.costoPromedio,0),m=n.reduce((y,E)=>y+Number(E.saldo||0),0),u=Math.max(0,l*.45-c),h=`
        ${F.getHeader("INFORME EJECUTIVO DE GESTI\xD3N GERENCIAL","INF-2026-01",new Date().toISOString())}

        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #e2e8f0;">
          <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 15px;">Resumen Ejecutivo del Per\xEDodo</h3>
          <p style="margin: 0; color: #475569; font-size: 13px;">Consolidado contable de operaciones, ingresos de venta, flujo de inventario y estado financiero para <strong>${t.nombreComercial}</strong>.</p>
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
              <td class="text-right font-bold" style="color: #0284c7;">${g.currency(l)}</td>
              <td>${a.length} facturas y remisiones emitidas</td>
            </tr>
            <tr>
              <td><strong>Gastos Operativos & Administrativos</strong></td>
              <td class="text-right font-bold" style="color: #ef4444;">-${g.currency(c)}</td>
              <td>Servicios, n\xF3mina, combustible y fletes</td>
            </tr>
            <tr>
              <td><strong>Inventario F\xEDsico Valorizado</strong></td>
              <td class="text-right font-bold">${g.currency(p)}</td>
              <td>${r.length} referencias en bodegas activas</td>
            </tr>
            <tr>
              <td><strong>Cartera Comercial Pendiente (CXC)</strong></td>
              <td class="text-right font-bold" style="color: #f59e0b;">${g.currency(m)}</td>
              <td>Cr\xE9ditos comerciales vigentes</td>
            </tr>
            <tr style="background: #ecfdf5;">
              <td><strong>Utilidad Operativa Estimada</strong></td>
              <td class="text-right font-bold" style="color: #059669; font-size: 15px;">${g.currency(u)}</td>
              <td>Margen bruto estimado ~42% tras egresos</td>
            </tr>
          </tbody>
        </table>

        <div class="doc-footer" style="margin-top: 60px;">
          <p>Informe generado confidencialmente para la junta directiva y gerencia general.</p>
          <p style="margin-top: 4px; font-size: 10px;">Software Nexa ERP Multiempresa \u2022 Licenciado para ${t.razonSocial}</p>
        </div>
      `;U.printDocument(h,"Informe_Ejecutivo_Nexa")})}};N();var Ue={async render(e){let t=I.getActiveTenant(),o=await I.getAllTenants(),a=await f.getAll(v.PRICE_LISTS,t.id),r=await f.getAll(v.WAREHOUSES,t.id),s=k.isDeveloper();e.innerHTML=`
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
              ${t.nombreComercial} (NIT: ${t.nit}-${t.dv})
            </div>
          </div>
          <div class="d-flex items-center gap-2 flex-wrap">
            <label class="text-xs font-bold text-muted">CONMUTAR EMPRESA:</label>
            <select class="form-select" id="sel-switch-tenant" style="width: auto; font-size: 13px; font-weight: 600;">
              ${o.map(b=>`
                <option value="${b.id}" ${b.id===t.id?"selected":""}>
                  ${b.nombreComercial} (${b.ciudad})
                </option>
              `).join("")}
            </select>
            ${s?`
              <button type="button" class="btn btn-secondary btn-sm" id="btn-create-tenant" title="Crear nueva organizaci\xF3n">
                \u{1F3E2} + Nueva Empresa
              </button>
            `:`
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
                    <input type="text" class="form-control" name="nombreComercial" required value="${t.nombreComercial}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Raz\xF3n Social Legal</label>
                    <input type="text" class="form-control" name="razonSocial" required value="${t.razonSocial}">
                  </div>
                </div>

                <div class="form-row mb-3">
                  <div class="form-group">
                    <label class="form-label">NIT (Sin d\xEDgito de verificaci\xF3n)</label>
                    <input type="text" class="form-control" id="inp-tenant-nit" name="nit" required value="${t.nit}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">D\xEDgito de Verificaci\xF3n (DV DIAN)</label>
                    <input type="text" class="form-control" id="inp-tenant-dv" name="dv" readonly value="${t.dv}" style="background: #f1f5f9; font-weight: bold;">
                  </div>
                </div>

                <div class="form-row mb-3">
                  <div class="form-group">
                    <label class="form-label">R\xE9gimen Tributario</label>
                    <select class="form-select" name="regimen">
                      <option value="Responsable de IVA" ${t.regimen==="Responsable de IVA"?"selected":""}>Responsable de IVA (Com\xFAn)</option>
                      <option value="No Responsable de IVA" ${t.regimen==="No Responsable de IVA"?"selected":""}>No Responsable de IVA (Simplificado)</option>
                      <option value="R\xE9gimen Simple de Tributaci\xF3n (RST)" ${t.regimen==="R\xE9gimen Simple de Tributaci\xF3n (RST)"?"selected":""}>R\xE9gimen Simple de Tributaci\xF3n (RST)</option>
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
                    <input type="text" class="form-control" name="direccion" value="${t.direccion||""}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Ciudad</label>
                    <input type="text" class="form-control" name="ciudad" value="${t.ciudad||""}">
                  </div>
                </div>

                <div class="form-row mb-3">
                  <div class="form-group">
                    <label class="form-label">Departamento</label>
                    <input type="text" class="form-control" name="departamento" value="${t.departamento||"Antioquia"}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Tel\xE9fono Fijo / PBX</label>
                    <input type="text" class="form-control" name="telefono" value="${t.telefono||""}">
                  </div>
                </div>

                <div class="form-row mb-3">
                  <div class="form-group">
                    <label class="form-label">WhatsApp Comercial</label>
                    <input type="text" class="form-control" name="whatsapp" value="${t.whatsapp||""}">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Correo Electr\xF3nico Oficial</label>
                    <input type="email" class="form-control" name="email" value="${t.email||""}">
                  </div>
                </div>

                <div class="form-group mb-0">
                  <label class="form-label">Texto de Resoluci\xF3n de Facturaci\xF3n (Pie de Documento)</label>
                  <input type="text" class="form-control" name="resolucionFacturacion" value="${t.resolucionFacturacion||""}">
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
                      <span class="badge ${t.isotipoLightUrl?"badge-info":"badge-neutral"}" id="badge-status-isotipo-light">
                        ${t.isotipoLightUrl?"Personalizado":"\u2728 Autom\xE1tico"}
                      </span>
                    </div>
                    <div class="text-xs text-muted mb-2">Esquina superior izq. en Modo Claro</div>
                    <div class="d-flex items-center gap-3">
                      <div style="width: 60px; height: 60px; border-radius: 12px; background: #ffffff; border: 1px solid rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; box-shadow: var(--shadow-xs);">
                        <img id="prev-isotipo-light" src="${I.getIsotipo(t,!1)}" alt="Isotipo Claro" style="width: 100%; height: 100%; object-fit: contain;">
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
                      <span class="badge ${t.isotipoDarkUrl?"badge-info":"badge-neutral"}" id="badge-status-isotipo-dark">
                        ${t.isotipoDarkUrl?"Personalizado":"\u2728 Autom\xE1tico"}
                      </span>
                    </div>
                    <div class="text-xs text-muted mb-2">Esquina superior izq. en Modo Oscuro</div>
                    <div class="d-flex items-center gap-3">
                      <div style="width: 60px; height: 60px; border-radius: 12px; background: #000000; border: 1px solid rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; box-shadow: var(--shadow-xs);">
                        <img id="prev-isotipo-dark" src="${I.getIsotipo(t,!0)}" alt="Isotipo Oscuro" style="width: 100%; height: 100%; object-fit: contain;">
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
                      <span class="badge ${t.logoHorizontalLightUrl?"badge-info":"badge-neutral"}" id="badge-status-logo-horizontal">
                        ${t.logoHorizontalLightUrl?"Personalizado":"\u2728 Autom\xE1tico"}
                      </span>
                    </div>
                    <div class="text-xs text-muted mb-2">Facturas, Cotizaciones y R\xF3tulos</div>
                    <div class="d-flex items-center gap-3">
                      <div style="width: 110px; height: 60px; border-radius: 8px; background: #ffffff; border: 1px solid rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; padding: 4px;">
                        <img id="prev-logo-horizontal" src="${I.getHorizontalLogo(t,!1)}" alt="Logo Horizontal" style="max-width: 100%; max-height: 100%; object-fit: contain;">
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
                      <span class="badge ${t.membreteUrl?"badge-info":"badge-neutral"}" id="badge-status-membrete">
                        ${t.membreteUrl?"Personalizado":"\u2728 Autom\xE1tico"}
                      </span>
                    </div>
                    <div class="text-xs text-muted mb-2">Banner superior oficial (opcional)</div>
                    <div class="d-flex items-center gap-3">
                      <div style="width: 110px; height: 60px; border-radius: 8px; background: #ffffff; border: 1px solid rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0; padding: 2px;">
                        <img id="prev-membrete" src="${t.membreteUrl||I.generateAutoMembrete(t)}" alt="Membrete" style="max-width: 100%; max-height: 100%; object-fit: contain;">
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
                  ${a.map((b,h)=>`
                    <div class="form-row" style="align-items: center;">
                      <div style="font-weight: 700; font-size: 12px; color: var(--brand-primary); width: 80px;">Lista ${h+1}:</div>
                      <input type="text" class="form-control" name="plist_name_${b.id}" value="${b.nombre}" required style="flex: 1;">
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
                    <input type="color" class="form-control" id="inp-color-primary" name="colorPrimary" value="${t.colores?.primary||"#0284c7"}" style="width: 50px; height: 38px; padding: 2px;">
                    <input type="text" class="form-control text-xs font-bold" id="inp-color-primary-text" value="${t.colores?.primary||"#0284c7"}" readonly>
                  </div>
                </div>

                <div class="form-group mb-3">
                  <label class="form-label">Color Secundario / Acento</label>
                  <div class="d-flex items-center gap-2">
                    <input type="color" class="form-control" id="inp-color-secondary" name="colorSecondary" value="${t.colores?.secondary||"#f59e0b"}" style="width: 50px; height: 38px; padding: 2px;">
                    <input type="text" class="form-control text-xs font-bold" id="inp-color-secondary-text" value="${t.colores?.secondary||"#f59e0b"}" readonly>
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
                  ${r.map(b=>`
                    <div class="d-flex justify-between items-center text-xs" style="padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
                      <div>
                        <strong>${b.nombre}</strong>
                        <div class="text-muted">${b.codigo}</div>
                      </div>
                      <span class="badge ${b.esPrincipal?"badge-info":"badge-neutral"}">${b.esPrincipal?"Principal":"Secundaria"}</span>
                    </div>
                  `).join("")}
                </div>
              </div>
            </div>

          </div>

        </div>
      </form>
    `,e.querySelector("#sel-switch-tenant").addEventListener("change",async b=>{await I.switchTenant(b.target.value),C.success("Empresa conmutada con \xE9xito. Tema e identidad actualizados."),this.render(e)});let i=e.querySelector("#btn-create-tenant");i&&i.addEventListener("click",()=>{if(!k.isDeveloper()){C.error("La creaci\xF3n de empresas est\xE1 reservada al Desarrollador del software.");return}this.openCreateTenantModal(()=>this.render(e))});let n=e.querySelector("#inp-tenant-nit"),d=e.querySelector("#inp-tenant-dv");n.addEventListener("input",b=>{let h=b.target.value.replace(/\D/g,""),y=z.calculate(h);d.value=y!==null?y:"-"});let l=e.querySelector("#inp-color-primary"),c=e.querySelector("#inp-color-primary-text");l.addEventListener("input",b=>{c.value=b.target.value,document.documentElement.style.setProperty("--brand-primary",b.target.value)});let p=e.querySelector("#inp-color-secondary"),m=e.querySelector("#inp-color-secondary-text");p.addEventListener("input",b=>{m.value=b.target.value,document.documentElement.style.setProperty("--brand-secondary",b.target.value)});let u=(b,h,y,E,P,A,R)=>{let w=e.querySelector(b),D=e.querySelector(h),j=e.querySelector(y),M=e.querySelector(E),W=e.querySelector(P);!w||!D||!j||!M||!W||(D.addEventListener("click",()=>w.click()),w.addEventListener("change",ee=>{let te=ee.target.files[0];if(!te)return;if(!te.type.startsWith("image/")){C.error("Por favor seleccione un archivo de imagen v\xE1lido (PNG, JPG, SVG, WEBP).");return}let Y=new FileReader;Y.onload=async T=>{let O=T.target.result;t[A]=O,A==="logoHorizontalLightUrl"&&(t.logoUrl=O),M.src=O,W.className="badge badge-info",W.textContent="Personalizado",await I.updateTenant(t),C.success("Imagen adjuntada y aplicada exitosamente.")},Y.readAsDataURL(te)}),j.addEventListener("click",async()=>{t[A]="",A==="logoHorizontalLightUrl"&&(t.logoUrl=""),M.src=R(),W.className="badge badge-neutral",W.textContent="\u2728 Autom\xE1tico",await I.updateTenant(t),C.info("Se activ\xF3 el dise\xF1o autom\xE1tico con identidad corporativa.")}))};u("#file-isotipo-light","#btn-upload-isotipo-light","#btn-auto-isotipo-light","#prev-isotipo-light","#badge-status-isotipo-light","isotipoLightUrl",()=>I.generateAutoIsotipo(t,!1)),u("#file-isotipo-dark","#btn-upload-isotipo-dark","#btn-auto-isotipo-dark","#prev-isotipo-dark","#badge-status-isotipo-dark","isotipoDarkUrl",()=>I.generateAutoIsotipo(t,!0)),u("#file-logo-horizontal","#btn-upload-logo-horizontal","#btn-auto-logo-horizontal","#prev-logo-horizontal","#badge-status-logo-horizontal","logoHorizontalLightUrl",()=>I.generateAutoHorizontalLogo(t,!1)),u("#file-membrete","#btn-upload-membrete","#btn-auto-membrete","#prev-membrete","#badge-status-membrete","membreteUrl",()=>I.generateAutoMembrete(t)),e.querySelector("#btn-save-settings").addEventListener("click",async()=>{let b=e.querySelector("#settings-form"),h=new FormData(b),y=h.get("nit").replace(/\D/g,""),E=z.calculate(y),P={...t,nombreComercial:h.get("nombreComercial"),razonSocial:h.get("razonSocial"),nit:y,dv:E!==null?E:0,regimen:h.get("regimen"),direccion:h.get("direccion"),ciudad:h.get("ciudad"),departamento:h.get("departamento"),telefono:h.get("telefono"),whatsapp:h.get("whatsapp"),email:h.get("email"),resolucionFacturacion:h.get("resolucionFacturacion"),colores:{primary:h.get("colorPrimary"),primaryHover:h.get("colorPrimary"),secondary:h.get("colorSecondary"),accent:h.get("colorPrimary")},isotipoLightUrl:t.isotipoLightUrl||"",isotipoDarkUrl:t.isotipoDarkUrl||"",logoHorizontalLightUrl:t.logoHorizontalLightUrl||"",logoHorizontalDarkUrl:t.logoHorizontalDarkUrl||"",membreteUrl:t.membreteUrl||"",logoUrl:t.logoHorizontalLightUrl||t.logoUrl||""};await I.updateTenant(P);for(let A of a){let R=h.get(`plist_name_${A.id}`);R&&R!==A.nombre&&(A.nombre=R,await f.update(v.PRICE_LISTS,A))}C.success("Configuraci\xF3n empresarial y listas de precios guardadas exitosamente."),this.render(e)})},openCreateTenantModal(e){let o=x.show({title:"\u{1F3E2} Crear Nueva Organizaci\xF3n Multiempresa",content:`
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
    `,size:"md",footerButtons:[{label:"Cancelar",class:"btn-secondary",onClick:()=>x.close()},{label:"Crear Organizaci\xF3n",class:"btn-primary",onClick:async()=>{let a=o.querySelector("#new-tenant-form");if(!a.checkValidity()){a.reportValidity();return}let r=new FormData(a),s=r.get("nit").replace(/\D/g,""),i=z.calculate(s),n=r.get("colorPrimary")||"#0071e3",d={nombreComercial:r.get("nombreComercial"),razonSocial:r.get("razonSocial"),nit:s,dv:i!==null?i:0,regimen:"Responsable de IVA",direccion:r.get("direccion"),ciudad:r.get("ciudad"),departamento:r.get("departamento"),telefono:r.get("telefono"),whatsapp:r.get("telefono"),email:`contacto@${r.get("nombreComercial").toLowerCase().replace(/\s+/g,"")}.com`,colores:{primary:n,primaryHover:n,secondary:"#f59e0b",accent:n},resolucionFacturacion:"Resoluci\xF3n DIAN No. Pendiente por asignar",moneda:"COP",esDemo:!1},l=await I.createTenant(d);await I.switchTenant(l.id),C.success(`\xA1Empresa "${l.nombreComercial}" creada con \xE9xito! Se ha activado la nueva organizaci\xF3n.`),x.close(),e&&e()}}]});if(o){let a=o.querySelector("#modal-tenant-nit"),r=o.querySelector("#modal-tenant-dv");a&&r&&a.addEventListener("input",s=>{let i=s.target.value.replace(/\D/g,""),n=z.calculate(i);r.value=n!==null?n:"-"})}}};N();var _e={async render(e){e.innerHTML=`
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
    `,e.querySelector("#btn-export-backup").addEventListener("click",async()=>{try{C.info("Generando copia de respaldo \xEDntegra...");let a=await f.exportBackup(),r=JSON.stringify(a,null,2),s=new Blob([r],{type:"application/json"}),i=URL.createObjectURL(s),n=k.getCurrentUser()?.nombre.replace(/\\s+/g,"")||"Usuario",d=document.createElement("a");d.href=i,d.download=`NexaERP_Sync_${n}_${new Date().toISOString().replace(/[:.]/g,"-")}.json`,document.body.appendChild(d),d.click(),document.body.removeChild(d),URL.revokeObjectURL(i),C.success("Copia de respaldo descargada con \xE9xito.")}catch(a){C.error("Error al generar respaldo: "+a.message)}});let t=e.querySelector("#inp-restore-file"),o=e.querySelector("#btn-restore-backup");t.addEventListener("change",()=>{o.disabled=!t.files||t.files.length===0}),o.addEventListener("click",()=>{let a=t.files[0];if(!a)return;let r=new FileReader;r.onload=async s=>{try{let i=JSON.parse(s.target.result);if(!i||!i.stores)throw new Error("El archivo seleccionado no corresponde a un formato de respaldo v\xE1lido de Nexa ERP.");x.confirm({title:"Confirmaci\xF3n de Restauraci\xF3n",message:`Est\xE1 a punto de cargar un respaldo generado el <strong>${i.timestamp||"Fecha desconocida"}</strong> con <strong>${Object.keys(i.stores).length}</strong> tablas de informaci\xF3n. \xBFDesea proceder?`,confirmText:"S\xED, Restaurar Informaci\xF3n",cancelText:"Cancelar",onConfirm:async()=>{try{await f.restoreBackup(i),C.success("Informaci\xF3n restaurada con \xE9xito. Recargando par\xE1metros..."),setTimeout(()=>window.location.reload(),1200)}catch(n){C.error("Error al restaurar: "+n.message)}}})}catch(i){C.error("Archivo corrupto o inv\xE1lido: "+i.message)}},r.readAsText(a)})}};N();var je={async render(e){let t=I.getActiveTenant(),o=t?t.id:"tenant_rayopro";e.innerHTML=`
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
    `;let a=null,r=[],s=(d,l,c)=>{let p="\uFEFF"+l.join(";")+`\r
`+c.join(";")+`\r
`,m=new Blob([p],{type:"text/csv;charset=utf-8;"}),u=URL.createObjectURL(m),b=document.createElement("a");b.href=u,b.download=`${d}.csv`,document.body.appendChild(b),b.click(),document.body.removeChild(b),URL.revokeObjectURL(u)};e.querySelector("#btn-dl-template-clients").addEventListener("click",()=>{s("Plantilla_Clientes_Nexa",["Codigo","Nombre","NIT_CC","TipoCliente","Telefono","Ciudad","Direccion","CupoCredito","DiasCredito"],["CLI-101","AutoLavado El Diamante","901234567","Taller / Detailing","3001234567","Medell\xEDn","Carrera 50 # 30-20","3000000","30"])}),e.querySelector("#btn-dl-template-products").addEventListener("click",()=>{s("Plantilla_Productos_Nexa",["SKU","Nombre","TipoItem","Categoria","UnidadMedida","CostoPromedio","Precio1","StockInicial","StockMinimo"],["RAYO-LIMP-500","Limpiador Cristales Antiempa\xF1ante 500ml","PRODUCTO_TERMINADO","Visibilidad","Unidad","6500","18000","40","10"])}),e.querySelector("#btn-dl-template-suppliers").addEventListener("click",()=>{s("Plantilla_Proveedores_Nexa",["Codigo","RazonSocial","NIT","Contacto","Telefono","Ciudad","Categoria","DiasCredito"],["PROV-050","Envases Qu\xEDmicos de Antioquia SAS","900444555","Pedro Restrepo","4441234","Itag\xFC\xED","Material de Empaque","30"])});let i=(d,l,c)=>{let p=e.querySelector(d),m=e.querySelector(l);p.addEventListener("change",()=>{m.disabled=!p.files||p.files.length===0}),m.addEventListener("click",()=>{let u=p.files[0];if(!u)return;let b=new FileReader;b.onload=h=>{let E=h.target.result.split(/\r\n|\n/).filter(R=>R.trim().length>0);if(E.length<2){C.warning("El archivo seleccionado no contiene filas de datos.");return}let P=E[0].split(";").map(R=>R.replace(/"/g,"").trim()),A=[];for(let R=1;R<E.length;R++){let w=E[R].split(";").map(D=>D.replace(/"/g,"").trim());if(w.length>=P.length){let D={};P.forEach((j,M)=>{D[j]=w[M]}),A.push(D)}}a=c,r=A,n(P,A,c)},b.readAsText(u)})};i("#inp-csv-clients","#btn-process-clients","CUSTOMERS"),i("#inp-csv-products","#btn-process-products","PRODUCTS"),i("#inp-csv-suppliers","#btn-process-suppliers","SUPPLIERS");let n=(d,l,c)=>{let p=e.querySelector("#importer-preview-card"),m=e.querySelector("#importer-preview-table thead"),u=e.querySelector("#importer-preview-table tbody"),b=e.querySelector("#importer-preview-title");b.textContent=`Previsualizaci\xF3n de Importaci\xF3n: ${l.length} registros listos (${c})`,m.innerHTML=`<tr>${d.map(h=>`<th>${h}</th>`).join("")}</tr>`,u.innerHTML=l.slice(0,10).map(h=>`
        <tr>${d.map(y=>`<td>${h[y]||"-"}</td>`).join("")}</tr>
      `).join(""),p.style.display="block",p.scrollIntoView({behavior:"smooth"})};e.querySelector("#btn-confirm-import").addEventListener("click",async()=>{if(!(!a||r.length===0))try{let d=0;if(a==="CUSTOMERS")for(let l of r){let c=(l.NIT_CC||"").replace(/\D/g,"");await f.add(v.CUSTOMERS,{tenantId:o,codigo:l.Codigo||`CLI-${Math.floor(100+Math.random()*900)}`,nombre:l.Nombre||"Cliente Importado",nitCc:c,dv:z.calculate(c)||0,tipoCliente:l.TipoCliente||"Taller / Detailing",telefono:l.Telefono||"",ciudad:l.Ciudad||"Medell\xEDn",direccion:l.Direccion||"",cupoCredito:Number(l.CupoCredito||0),diasCredito:Number(l.DiasCredito||0),saldoPendiente:0,estado:"ACTIVO"}),d++}else if(a==="PRODUCTS")for(let l of r)await f.add(v.PRODUCTS,{tenantId:o,sku:l.SKU||`SKU-${Date.now()}`,codigoInterno:l.SKU||"",nombre:l.Nombre||"Producto Importado",tipoItem:l.TipoItem||"PRODUCTO_TERMINADO",categoria:l.Categoria||"General",unidadMedida:l.UnidadMedida||"Unidad",costoPromedio:Number(l.CostoPromedio||0),stock:Number(l.StockInicial||0),stockMinimo:Number(l.StockMinimo||10),precios:{plist_1:Number(l.Precio1||0)},estado:"ACTIVO"}),d++;else if(a==="SUPPLIERS")for(let l of r){let c=(l.NIT||"").replace(/\D/g,"");await f.add(v.SUPPLIERS,{tenantId:o,codigo:l.Codigo||`PROV-${Math.floor(100+Math.random()*900)}`,razonSocial:l.RazonSocial||"Proveedor Importado",nitCc:c,dv:z.calculate(c)||0,contacto:l.Contacto||"",telefono:l.Telefono||"",ciudad:l.Ciudad||"Medell\xEDn",categoria:l.Categoria||"Materias Primas",diasCredito:Number(l.DiasCredito||30),estado:"ACTIVO"}),d++}C.success(`\xA1Se importaron ${d} registros con \xE9xito!`),e.querySelector("#importer-preview-card").style.display="none",r=[]}catch(d){C.error("Error durante la importaci\xF3n: "+d.message)}})}};var Ve={render(e){e.innerHTML=`
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
    `,e.querySelector("#btn-config-dian").addEventListener("click",()=>{alert("M\xF3dulo DIAN: Listo para incorporar credenciales cuando se disponga de Proveedor Tecnol\xF3gico habilitado en la DIAN.")})}};N();Q();var Be={async render(e){let t=I.getActiveTenant(),o=t?t.id:"tenant_rayopro",[a,r,s]=await Promise.all([f.getAll(v.SALES,o),f.getAll(v.PRODUCTION_ORDERS,o),f.getAll(v.ORDERS_SHIPPING,o)]),i=a[0]||{consecutivo:"RP-10026",fecha:new Date().toISOString(),clienteNombre:"Jhon Jairo Chalarca Acevedo (Cano)",clienteNit:"1096037405-1",vendedorNombre:"Juan Pablo (Gerente)",metodoPago:"Transferencia Bancaria",subtotal:18e5,descuentos:0,impuestos:342e3,total:2142e3,items:[{sku:"DESENG-1L",nombre:"Desengrasante Automotriz 1L (Caja x 12)",cantidad:10,precioUnitario:114e3,total:114e4},{sku:"SHAMP-1L",nombre:"Shampoo Desincrustante 1L (Caja x 12)",cantidad:7,precioUnitario:143e3,total:1002e3}]},n=r[0]||{numeroLote:"LOT-2026-0912",productoNombre:"Desengrasante Automotriz 1 Litro (Cajas x 12)",cantidadPlanificada:120,unidadMedida:"Botellas (10 Cajas x 12)",fechaPlanificada:new Date().toISOString().split("T")[0],responsable:"Juan Pablo (Gerente Operativo)",estado:"EN_PROCESO",insumos:[{materiaPrimaNombre:"Base Alcalina Concentrada",cantidadRequerida:36,unidadMedida:"Kg",costoUnitario:9200,costoTotal:331200},{materiaPrimaNombre:"Botella PEAD 1 Litro Blanca",cantidadRequerida:120,unidadMedida:"Unidad",costoUnitario:1100,costoTotal:132e3},{materiaPrimaNombre:"Caja Corrugada Rayo Pro x 12",cantidadRequerida:10,unidadMedida:"Unidad",costoUnitario:2200,costoTotal:22e3}]},d=s[0]||{numeroGuia:"77092184531",transportadora:"Coordinadora Mercantil Carga",clienteNombre:"Jhon Jairo Chalarca Acevedo (Cano Trucks)",nitCc:"1096037405-1",telefono:"3017100508",whatsapp:"+57 301 710 0508",email:"jhon.chalarca@canotrucks.co",direccion:"Manzana A Casa 17",barrio:"La Estaci\xF3n",ciudad:"La Tebaida",departamento:"Quind\xEDo",contenidoDescripcion:"17 CAJAS X 12 (Productos de mantenimiento y embellecimiento automotriz)",cajasTotal:17,observaciones:"Entregar en porter\xEDa principal talleres Cano Trucks. Manejar con cuidado."},l="INVOICE",c=p=>p==="INVOICE"?F.saleInvoice({...i,tipoDoc:"POS"},i.items):p==="QUOTE"?F.commercialQuote({...i,consecutivo:"COT-2026-088"},i.items):p==="SHIPPING_NOTE"?F.saleInvoice({...i,tipoDoc:"REMISION",consecutivo:"REM-2026-015"},i.items):p==="PRODUCTION"?F.productionOrder(n):p==="SHIPPING_LABEL"?F.shippingBoxLabel(d):"";e.innerHTML=`
      <div class="view-header">
        <div class="view-title-wrap">
          <h1>Visor de Documentos & Plantillas Membretadas</h1>
          <p>Plantillas din\xE1micas que adoptan autom\xE1ticamente la identidad corporativa de <strong>${t.nombreComercial}</strong></p>
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
          <button class="ios-segment-btn doc-tab-btn" data-doc="SHIPPING_LABEL">\u{1F3F7}\uFE0F R\xF3tulo Env\xEDo (Cajas)</button>
          <button class="ios-segment-btn doc-tab-btn" data-doc="SHIPPING_NOTE">\u{1F69A} Remisi\xF3n de Entrega</button>
          <button class="ios-segment-btn doc-tab-btn" data-doc="PRODUCTION">\u2699\uFE0F Orden con Firma</button>
        </div>
      </div>

      <!-- VISTA PREVIA DEL DOCUMENTO EN HOJA TIPO CARTA -->
      <div class="card" style="background: rgba(0, 0, 0, 0.06); padding: 14px; display: flex; justify-content: center; overflow-x: auto; border: 1px solid var(--border-color);">
        <div id="doc-sheet-preview" style="background: #ffffff; color: #000000; width: 100%; max-width: 800px; min-height: 700px; padding: 24px; box-shadow: var(--shadow-md); border-radius: 6px; font-size: 13px;">
          ${c("INVOICE")}
        </div>
      </div>
    `,e.querySelectorAll(".doc-tab-btn").forEach(p=>{p.addEventListener("click",()=>{e.querySelectorAll(".doc-tab-btn").forEach(m=>m.classList.remove("active")),p.classList.add("active"),l=p.getAttribute("data-doc"),e.querySelector("#doc-sheet-preview").innerHTML=c(l)})}),e.querySelector("#btn-print-active-doc").addEventListener("click",()=>{let p=c(l);U.printDocument(p,`Documento_${l}_${t.nombreComercial}`)})}};window.addEventListener("error",e=>{console.error("Nexa Global Error:",e.error||e.message);let t=document.getElementById("view-container");t&&(!t.children.length||t.innerHTML.includes("Cargando"))&&(t.innerHTML=`
      <div style="margin: 20px; padding: 20px; background: #fef2f2; border: 1px solid #f87171; border-radius: 12px; color: #991b1b;">
        <h3 style="margin-top:0; font-size: 16px;">\u26A0\uFE0F Excepci\xF3n JavaScript Detectada</h3>
        <p style="font-size: 13px;">${e.message} en <strong>${e.filename}:${e.lineno}</strong></p>
      </div>
    `)});window.addEventListener("unhandledrejection",e=>{console.error("Nexa Unhandled Promise Rejection:",e.reason);let t=document.getElementById("view-container");t&&(!t.children.length||t.innerHTML.includes("Cargando"))&&(t.innerHTML=`
      <div style="margin: 20px; padding: 20px; background: #fef2f2; border: 1px solid #f87171; border-radius: 12px; color: #991b1b;">
        <h3 style="margin-top:0; font-size: 16px;">\u26A0\uFE0F Error de Promesa As\xEDncrona</h3>
        <p style="font-size: 13px;">${e.reason&&(e.reason.message||e.reason)}</p>
      </div>
    `)});var Ze={dashboard:ge,clients:ie,products:Ae,inventory:Se,production:Te,purchases:Pe,"sales-pos":Re,shipping:we,cash:$e,expenses:De,cxc:Oe,cxp:Me,users:Ne,audit:ke,reports:Le,settings:Ue,backup:_e,importer:je,integrations:Ve,documents:Be},xe=class{constructor(){this.contentContainer=null,this.currentRoute="dashboard"}async init(){this.contentContainer=document.getElementById("view-container");try{let t=await I.init();await k.init(t.id),this.initShellUI(t),this.setupRouter(),Z.on("tenant:changed",o=>{this.updateBrandUI(o),this.loadCurrentRoute()}),Z.on("auth:userChanged",o=>{this.updateUserUI(o)}),this.loadCurrentRoute(),console.log("\u26A1 Nexa ERP inicializado correctamente para:",t.nombreComercial)}catch(t){console.error("Error al inicializar Nexa ERP:",t),this.contentContainer&&(this.contentContainer.innerHTML=`
          <div class="alert alert-danger">
            <strong>Error al inicializar el sistema:</strong> ${t.message}
          </div>
        `)}}setupRouter(){window.addEventListener("hashchange",()=>{this.loadCurrentRoute()}),document.addEventListener("click",t=>{let o=t.target.closest('a[href^="#"]');if(o){let a=o.getAttribute("href");if(a&&a.startsWith("#")){t.preventDefault();let r=a.replace("#","")||"dashboard";window.location.hash===`#${r}`?this.loadCurrentRoute():window.location.hash=`#${r}`}}}),window.addEventListener("keydown",t=>{(t.ctrlKey||t.metaKey)&&t.key==="k"&&(t.preventDefault(),this.openGlobalSearch())})}async loadCurrentRoute(){let t=window.location.hash.replace("#","")||"dashboard";if(!k.canAccessRoute(t)){let s=k.getDefaultRoute();C.warning(`El m\xF3dulo #${t} no est\xE1 habilitado para su rol actual. Redirigiendo a #${s}`),window.location.hash=`#${s}`;return}this.currentRoute=t,document.querySelectorAll(".nav-item").forEach(s=>{s.getAttribute("data-route")===t?s.classList.add("active"):s.classList.remove("active")});let o=document.getElementById("app-sidebar"),a=document.getElementById("sidebar-overlay");o&&o.classList.remove("open"),a&&a.classList.remove("active");let r=Ze[t]||ge;if(this.contentContainer)try{this.contentContainer.innerHTML='<div class="text-center text-muted" style="padding: 40px;">Cargando m\xF3dulo...</div>',await r.render(this.contentContainer)}catch(s){console.error(`Error renderizando m\xF3dulo ${t}:`,s),this.contentContainer.innerHTML=`
          <div class="alert alert-danger m-4">
            <h4 style="margin: 0 0 8px 0; font-size: 16px;">\u26A0\uFE0F Error al cargar el m\xF3dulo "${t}"</h4>
            <p style="margin: 0; font-size: 13px;">${s.message||s}</p>
            <pre style="margin-top: 10px; font-size: 11px; background: rgba(0,0,0,0.05); padding: 8px; border-radius: 6px;">${s.stack||""}</pre>
          </div>
        `}}initShellUI(t){this.updateBrandUI(t),this.initTheme();let o=k.getCurrentUser();this.updateUserUI(o);let a=document.getElementById("btn-toggle-sidebar"),r=document.getElementById("app-sidebar"),s=document.getElementById("sidebar-overlay");a&&r&&s&&(a.addEventListener("click",()=>{r.classList.toggle("open"),s.classList.toggle("active")}),s.addEventListener("click",()=>{r.classList.remove("open"),s.classList.remove("active")}));let i=document.getElementById("topbar-tenant-selector");i&&i.addEventListener("click",async()=>{let p=await I.getAllTenants(),m=I.getActiveTenant();x.show({title:"Seleccionar Empresa Multi-tenant",content:`
            <p class="text-xs text-muted mb-3">Conmute entre organizaciones en tiempo real sin recargar c\xF3digo ni reiniciar sesi\xF3n:</p>
            <div class="d-flex flex-col gap-2">
              ${p.map(u=>`
                <div class="card p-3 tenant-pick-card" data-id="${u.id}" style="cursor: pointer; margin-bottom: 0; border: 1px solid ${u.id===m.id?"var(--brand-primary)":"var(--border-color)"}; background: ${u.id===m.id?"var(--brand-primary-light)":"#fff"};">
                  <div class="d-flex justify-between items-center">
                    <div>
                      <strong style="font-size: 14px; color: ${u.id===m.id?"var(--brand-primary)":"var(--text-main)"};">${u.nombreComercial}</strong>
                      <div class="text-xs text-muted">NIT: ${u.nit}-${u.dv} \u2022 ${u.ciudad}</div>
                    </div>
                    ${u.id===m.id?'<span class="badge badge-success">Activa</span>':""}
                  </div>
                </div>
              `).join("")}
            </div>
          `,footerButtons:[{label:"Cerrar",class:"btn-secondary",onClick:()=>x.close()}]}),document.querySelectorAll(".tenant-pick-card").forEach(u=>{u.addEventListener("click",async()=>{let b=u.getAttribute("data-id");await I.switchTenant(b),x.close(),C.success("Empresa cambiada exitosamente.")})})});let n=document.getElementById("btn-topbar-quick-sale");n&&n.addEventListener("click",()=>{window.location.hash="#sales-pos"});let d=document.getElementById("topbar-global-search");d&&d.addEventListener("click",()=>{this.openGlobalSearch()});let l=document.getElementById("topbar-user-menu-btn");l&&l.addEventListener("click",()=>{this.openUserRoleModal()});let c=document.getElementById("btn-theme-toggle");c&&c.addEventListener("click",()=>{this.toggleTheme()}),this.updateCashIndicator(),Z.on("cash:shiftChanged",()=>this.updateCashIndicator())}initTheme(){let t=localStorage.getItem("nexa_theme")||"light",o=document.getElementById("theme-toggle-icon");t==="dark"?(document.body.classList.add("dark-mode"),o&&(o.textContent="\u2600\uFE0F")):(document.body.classList.remove("dark-mode"),o&&(o.textContent="\u{1F319}")),this.updateBrandUI(I.getActiveTenant())}toggleTheme(){let t=document.body.classList.toggle("dark-mode"),o=document.getElementById("theme-toggle-icon");t?(localStorage.setItem("nexa_theme","dark"),o&&(o.textContent="\u2600\uFE0F"),C.info("Modo Oscuro activado")):(localStorage.setItem("nexa_theme","light"),o&&(o.textContent="\u{1F319}"),C.info("Modo Claro activado")),this.updateBrandUI(I.getActiveTenant())}async updateCashIndicator(){let t=I.getActiveTenant();if(!t)return;let o=await H.getCurrentShift(t.id),a=document.getElementById("topbar-cash-badge");a&&(o?(a.className="badge badge-success",a.textContent="\u25CF Caja Abierta",a.title=`Turno abierto con base: $ ${o.montoApertura}`):(a.className="badge badge-warning",a.textContent="\u25CB Caja Cerrada",a.title="Sin turno de caja activo"))}updateBrandUI(t){if(!t)return;let o=document.body.classList.contains("dark-mode"),a=I.getIsotipo(t,o),r=document.getElementById("sidebar-brand-name"),s=document.getElementById("sidebar-brand-nit"),i=document.getElementById("topbar-brand-name"),n=document.getElementById("sidebar-brand-icon"),d=document.getElementById("topbar-brand-icon");r&&(r.textContent=t.nombreComercial),s&&(s.textContent=`NIT: ${t.nit}-${t.dv}`),i&&(i.textContent=t.nombreComercial),n&&(n.innerHTML=`<img src="${a}" alt="${t.nombreComercial}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px; display: block;">`,n.style.background=o?"#000000":"#ffffff",n.style.borderColor=o?"rgba(255, 255, 255, 0.18)":"rgba(0, 0, 0, 0.08)"),d&&(d.innerHTML=`<img src="${a}" alt="${t.nombreComercial}" style="width: 18px; height: 18px; object-fit: contain; border-radius: 4px; display: block;">`)}updateUserUI(t){if(!t)return;let o=document.getElementById("topbar-user-name"),a=document.getElementById("topbar-user-role"),r=document.getElementById("topbar-user-avatar");o&&(o.textContent=t.nombre),a&&(a.textContent=`${t.rol} \u25BE`),r&&(r.textContent=t.nombre.charAt(0).toUpperCase()),this.filterSidebarForUser()}filterSidebarForUser(){let t=k.getAllowedModules(),o=k.isDeveloper();document.querySelectorAll(".nav-item").forEach(i=>{let n=i.getAttribute("data-route");o||n&&t.includes(n)?i.style.display="flex":i.style.display="none"});let a=document.querySelector(".sidebar-nav");if(!a)return;let r=null,s=!1;Array.from(a.children).forEach(i=>{i.classList.contains("nav-section-title")?(r&&!s&&(r.style.display="none"),r=i,s=!1,i.style.display=""):i.classList.contains("nav-item")&&i.style.display!=="none"&&(s=!0)}),r&&!s&&(r.style.display="none")}async openUserRoleModal(){let t=I.getActiveTenant(),o=t?t.id:"tenant_rayopro",a=await k.init(o).then(async()=>{let{DB:s,STORES:i}=await Promise.resolve().then(()=>(N(),Ee));return await s.getAll(i.USERS,o)}),r=k.getCurrentUser();x.show({title:"Perfiles Operativos & Permisos (RBAC)",content:`
        <p class="text-xs text-muted mb-3">
          Seleccione un perfil para conmutar la sesi\xF3n o comprobar la interfaz anti-saturaci\xF3n personalizada por rol:
        </p>
        <div class="d-flex flex-col gap-2">
          ${a.map(s=>`
            <div class="card p-3 user-switch-card" data-id="${s.id}" style="cursor: pointer; margin-bottom: 0; border: 1px solid ${s.id===r.id?"var(--brand-primary)":"var(--border-color)"}; background: ${s.id===r.id?"var(--brand-primary-light)":"var(--bg-surface)"};">
              <div class="d-flex justify-between items-center">
                <div class="d-flex items-center gap-3">
                  <div class="user-avatar" style="width: 36px; height: 36px; font-size: 14px;">${s.nombre.charAt(0).toUpperCase()}</div>
                  <div>
                    <strong style="font-size: 14px; color: ${s.id===r.id?"var(--brand-primary)":"var(--text-main)"};">${s.nombre}</strong>
                    <div class="text-xs text-muted">${s.usuario} \u2022 Rol: <span class="badge ${s.rol==="Desarrollador"?"badge-primary":"badge-info"}" style="font-size: 10px;">${s.rol}</span></div>
                  </div>
                </div>
                ${s.id===r.id?'<span class="badge badge-success">Activo</span>':'<button class="btn btn-secondary btn-sm" style="pointer-events: none;">Cambiar</button>'}
              </div>
            </div>
          `).join("")}
        </div>
      `,footerButtons:[{label:"Ir a Gesti\xF3n de Usuarios",class:"btn-secondary",onClick:()=>{x.close(),window.location.hash="#users"}},{label:"Cerrar",class:"btn-secondary",onClick:()=>x.close()}]}),document.querySelectorAll(".user-switch-card").forEach(s=>{s.addEventListener("click",async()=>{let i=s.getAttribute("data-id"),n=a.find(d=>d.id===i);if(n){if(n.rol==="Desarrollador"){let d=prompt("\u{1F510} Ingrese la contrase\xF1a de DESARROLLADOR para autenticar el perfil maestro:");if(!d){C.warning("Acceso de desarrollador cancelado.");return}try{await k.switchUser(i,d),x.close(),C.success("Sesi\xF3n cambiada a Desarrollador"),this.filterSidebarForUser(),this.loadCurrentRoute()}catch(l){C.error(l.message||"Contrase\xF1a incorrecta.")}return}try{await k.switchUser(i),x.close(),C.success(`Perfil cambiado a ${n.nombre}`),this.filterSidebarForUser();let d=window.location.hash.replace("#","")||"dashboard";k.canAccessRoute(d)?this.loadCurrentRoute():window.location.hash=`#${k.getDefaultRoute()}`}catch(d){C.error(d.message)}}})})}openGlobalSearch(){x.show({title:"B\xFAsqueda Global en Nexa ERP (Ctrl + K)",content:`
        <div class="form-group mb-3">
          <input type="text" id="inp-modal-global-search" class="form-control" placeholder="Escriba cliente, SKU, producto, orden..." autofocus>
        </div>
        <div class="d-flex flex-col gap-2" id="global-search-results" style="max-height: 250px; overflow-y: auto;">
          <div class="text-xs text-muted text-center" style="padding: 20px;">
            Escriba para buscar en clientes, productos, \xF3rdenes o ventas...
          </div>
        </div>
      `,footerButtons:[{label:"Cerrar (Esc)",class:"btn-secondary",onClick:()=>x.close()}]});let t=document.getElementById("inp-modal-global-search"),o=document.getElementById("global-search-results");t.addEventListener("input",async a=>{let r=a.target.value.toLowerCase().trim();if(!r){o.innerHTML='<div class="text-xs text-muted text-center" style="padding: 20px;">Escriba para buscar...</div>';return}let s=I.getActiveTenant(),[i,n]=await Promise.all([DB.getAll("products",s.id),DB.getAll("customers",s.id)]),d=i.filter(p=>p.nombre.toLowerCase().includes(r)||p.sku.toLowerCase().includes(r)),l=n.filter(p=>p.nombre.toLowerCase().includes(r)||p.nitCc&&p.nitCc.includes(r)),c="";d.forEach(p=>{c+=`
          <div class="card p-2 mb-1" style="cursor: pointer;" onclick="window.location.hash='#products'; Modal.close();">
            <div class="d-flex justify-between items-center text-xs">
              <strong>\u{1F4E6} ${p.nombre}</strong>
              <span class="text-muted">${p.sku}</span>
            </div>
          </div>
        `}),l.forEach(p=>{c+=`
          <div class="card p-2 mb-1" style="cursor: pointer;" onclick="window.location.hash='#clients'; Modal.close();">
            <div class="d-flex justify-between items-center text-xs">
              <strong>\u{1F464} ${p.nombre}</strong>
              <span class="text-muted">NIT/CC: ${p.nitCc}</span>
            </div>
          </div>
        `}),d.length===0&&l.length===0&&(c='<div class="text-xs text-muted text-center" style="padding: 20px;">Sin coincidencias encontradas.</div>'),o.innerHTML=c})}};function ze(){new xe().init()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",ze):ze();})();
