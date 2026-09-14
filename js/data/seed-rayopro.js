/**
 * Nexa ERP - Semillero de Datos Oficial de Rayo Pro
 * Basado en la información real extraída de: datos/Cliente cano trucks.xlsx
 * Incluye catálogo real de productos, empaques (Cajas x 12 / Garrafas 23L) y cartera real
 */

export const RAYO_PRO_TENANT_ID = 'tenant_rayopro';
export const ALT_DEMO_TENANT_ID = 'tenant_autobrillo';

export const SeedData = {
  tenants: [
    {
      id: RAYO_PRO_TENANT_ID,
      nombreComercial: 'Rayo Pro',
      razonSocial: 'Rayo Pro Colombia S.A.S.',
      nit: '901458321',
      dv: 4,
      tipoPersona: 'JURIDICA',
      regimen: 'Responsable de IVA',
      direccion: 'Carrera 42 # 54A - 77, Zona Industrial',
      ciudad: 'Itagüí',
      departamento: 'Antioquia',
      telefono: '(604) 444 8920',
      whatsapp: '+573124567890',
      email: 'contacto@rayopro.com.co',
      sitioWeb: 'https://rayopro.com.co',
      isotipoLightUrl: 'datos/isotipo fondo blanco.jpg',
      isotipoDarkUrl: 'datos/isotipo fondo negro.jpg',
      logoHorizontalLightUrl: 'datos/logo+isotipo.jpg',
      logoHorizontalDarkUrl: 'datos/isotipo + logo fondo negro.jpg',
      membreteUrl: '',
      logoUrl: 'datos/logo+isotipo.jpg',
      faviconUrl: 'datos/isotipo fondo blanco.jpg',
      firmaUrl: 'datos/firma juan.jpg',
      colores: {
        primary: '#0071e3', // Azul Apple / Rayo Pro moderno
        primaryHover: '#0077ed',
        secondary: '#f59e0b',
        accent: '#0071e3'
      },
      resolucionFacturacion: 'Resolución DIAN No. 18764000123456 de 2026-01-15 (Prefijo RP del 1 al 10000)',
      moneda: 'COP',
      esDemo: false
    },
    {
      id: ALT_DEMO_TENANT_ID,
      nombreComercial: 'AutoBrillo Colombia',
      razonSocial: 'AutoBrillo Car Care S.A.S.',
      nit: '900874125',
      dv: 8,
      tipoPersona: 'JURIDICA',
      regimen: 'Responsable de IVA',
      direccion: 'Calle 13 # 68D - 12',
      ciudad: 'Bogotá D.C.',
      departamento: 'Cundinamarca',
      telefono: '(601) 745 2200',
      whatsapp: '+573108889900',
      email: 'administracion@autobrillo.co',
      sitioWeb: 'https://autobrillo.co',
      logoUrl: '',
      faviconUrl: '',
      colores: {
        primary: '#34c759', // Verde iOS
        primaryHover: '#2db84d',
        secondary: '#ff9500',
        accent: '#34c759'
      },
      resolucionFacturacion: 'Resolución DIAN No. 18764000987654 (Prefijo AB)',
      moneda: 'COP',
      esDemo: true
    }
  ],

  price_lists: [
    { id: 'plist_1', tenantId: RAYO_PRO_TENANT_ID, nombre: 'P1 - Precio Público / Final', descripcion: 'Mostrador y consumidor particular', esDefecto: true, orden: 1 },
    { id: 'plist_2', tenantId: RAYO_PRO_TENANT_ID, nombre: 'P2 - Precio Lavaderos / Taller', descripcion: 'Autolavados y centros de detailing', esDefecto: false, orden: 2 },
    { id: 'plist_3', tenantId: RAYO_PRO_TENANT_ID, nombre: 'P3 - Precio Mayorista (Docenas)', descripcion: 'Compras por cajas completas x 12 unidades', esDefecto: false, orden: 3 },
    { id: 'plist_4', tenantId: RAYO_PRO_TENANT_ID, nombre: 'P4 - Precio Distribuidor Autorizado', descripcion: 'Almacenes y distribuidores regionales', esDefecto: false, orden: 4 },
    { id: 'plist_5', tenantId: RAYO_PRO_TENANT_ID, nombre: 'P5 - Precio Especial Cano Trucks', descripcion: 'Tarifa preferencial convenio Jhon Chalarca (Cano)', esDefecto: false, orden: 5 }
  ],

  warehouses: [
    { id: 'wh_1', tenantId: RAYO_PRO_TENANT_ID, codigo: 'BOD-01', nombre: 'Bodega Principal & Despachos', direccion: 'Carrera 42 # 54A - 77 Itagüí', esPrincipal: true, estado: 'ACTIVO' },
    { id: 'wh_2', tenantId: RAYO_PRO_TENANT_ID, codigo: 'BOD-02', nombre: 'Planta de Producción & Reactores', direccion: 'Área de Envasado Nave B', esPrincipal: false, estado: 'ACTIVO' },
    { id: 'wh_3', tenantId: RAYO_PRO_TENANT_ID, codigo: 'BOD-03', nombre: 'Punto de Venta / Mostrador', direccion: 'Mostrador de atención y retail', esPrincipal: false, estado: 'ACTIVO' }
  ],

  users: [
    {
      id: 'usr_dev',
      tenantId: RAYO_PRO_TENANT_ID,
      nombre: 'Desarrollador Master (Autor de Software)',
      usuario: 'desarrollador',
      clave: 'Admin.2026',
      email: 'desarrollador@nexa.software',
      rol: 'Desarrollador',
      estado: 'ACTIVO',
      permisos: ['VER', 'CREAR', 'EDITAR', 'ELIMINAR', 'AUTORIZAR', 'EXPORTAR', 'FINANCIERO', 'DEVELOPER']
    },
    {
      id: 'usr_juan',
      tenantId: RAYO_PRO_TENANT_ID,
      nombre: 'Juan Pablo (Gerente General)',
      usuario: 'juan.gerencia',
      clave: 'gerente.2026',
      email: 'juan@rayopro.com.co',
      rol: 'Gerente',
      estado: 'ACTIVO',
      firmaUrl: 'datos/firma juan.jpg',
      permisos: ['VER', 'CREAR', 'EDITAR', 'AUTORIZAR', 'EXPORTAR', 'FINANCIERO']
    },
    {
      id: 'usr_admin',
      tenantId: RAYO_PRO_TENANT_ID,
      nombre: 'Carlos Mario Arango',
      usuario: 'carlos.admin',
      clave: 'carlos.2026',
      email: 'carlos@rayopro.com.co',
      rol: 'Gerente',
      estado: 'ACTIVO',
      permisos: ['VER', 'CREAR', 'EDITAR', 'AUTORIZAR', 'EXPORTAR', 'FINANCIERO']
    },
    {
      id: 'usr_ventas',
      tenantId: RAYO_PRO_TENANT_ID,
      nombre: 'Valentina Restrepo',
      usuario: 'valentina.ventas',
      email: 'ventas@rayopro.com.co',
      rol: 'Vendedor',
      estado: 'ACTIVO',
      permisos: ['VER', 'CREAR', 'EDITAR']
    },
    {
      id: 'usr_bodega',
      tenantId: RAYO_PRO_TENANT_ID,
      nombre: 'Mateo Osorio (Bodega & Despachos)',
      usuario: 'mateo.logistica',
      email: 'bodega@rayopro.com.co',
      rol: 'Bodega',
      estado: 'ACTIVO',
      permisos: ['VER', 'CREAR', 'EDITAR']
    },
    {
      id: 'usr_produccion',
      tenantId: RAYO_PRO_TENANT_ID,
      nombre: 'Ing. David Gómez (Jefe de Planta)',
      usuario: 'david.planta',
      email: 'produccion@rayopro.com.co',
      rol: 'Producción',
      estado: 'ACTIVO',
      permisos: ['VER', 'CREAR', 'EDITAR', 'AUTORIZAR']
    },
    {
      id: 'usr_caja',
      tenantId: RAYO_PRO_TENANT_ID,
      nombre: 'Camila Henao (Caja Mostrador)',
      usuario: 'camila.caja',
      email: 'caja@rayopro.com.co',
      rol: 'Caja',
      estado: 'ACTIVO',
      permisos: ['VER', 'CREAR', 'EDITAR']
    }
  ],

  // CATÁLOGO REAL EXTRAÍDO DEL EXCEL RAYO PRO
  products: [
    // 1. Desengrasante 1 Litro
    {
      id: 'prod_deseng_1l',
      tenantId: RAYO_PRO_TENANT_ID,
      codigoInterno: 'RAYO-001',
      sku: 'DESENG-1L',
      codigoBarras: '7707123450011',
      nombre: 'Desengrasante Automotriz 1 Litro',
      descripcion: 'Desengrasante concentrado de alta eficacia para motor, rines y chasis. Empaque estándar Caja x 12.',
      categoria: 'Desengrasantes',
      subcategoria: 'Línea Concentrada',
      marca: 'Rayo Pro',
      presentacion: 'Botella 1 Litro (Caja x 12)',
      unidadMedida: 'Litro',
      tipoItem: 'PRODUCTO_TERMINADO',
      costoPromedio: 8500,
      ultimoCosto: 8700,
      margenEsperado: 60,
      precios: {
        plist_1: 21000, // Público
        plist_2: 18000, // Taller
        plist_3: 15500, // Mayorista
        plist_4: 13500, // Distribuidor
        plist_5: 11130  // Cano Trucks (47% Dcto)
      },
      stock: 144, // 12 cajas x 12
      stockMinimo: 24,
      stockMaximo: 500,
      bodegaId: 'wh_1',
      estado: 'ACTIVO'
    },
    // 2. Shampoo Desincrustante 1 Litro
    {
      id: 'prod_shamp_desinc_1l',
      tenantId: RAYO_PRO_TENANT_ID,
      codigoInterno: 'RAYO-002',
      sku: 'SHAMP-DESINC-1L',
      codigoBarras: '7707123450028',
      nombre: 'Shampoo Desincrustante 1 Litro',
      descripcion: 'Fórmula ácida controlada para remover sarro, lluvia ácida y marcas minerales de pintura y rines. Caja x 12.',
      categoria: 'Lavado Exterior',
      subcategoria: 'Desincrustantes',
      marca: 'Rayo Pro',
      presentacion: 'Botella 1 Litro (Caja x 12)',
      unidadMedida: 'Litro',
      tipoItem: 'PRODUCTO_TERMINADO',
      costoPromedio: 11500,
      ultimoCosto: 11800,
      margenEsperado: 64,
      precios: {
        plist_1: 32000,
        plist_2: 26000,
        plist_3: 22500,
        plist_4: 19500,
        plist_5: 15712  // Cano Trucks (50.9% Dcto)
      },
      stock: 96,
      stockMinimo: 24,
      stockMaximo: 300,
      bodegaId: 'wh_1',
      estado: 'ACTIVO'
    },
    // 3. Metal Polish 500 ml
    {
      id: 'prod_metal_polish',
      tenantId: RAYO_PRO_TENANT_ID,
      codigoInterno: 'RAYO-003',
      sku: 'METAL-POLISH-500',
      codigoBarras: '7707123450035',
      nombre: 'Metal Polish Restaurador Metales 500 ml',
      descripcion: 'Pasta pulidora abrillantadora para rines de aluminio, escapes cromados y tanques de tractomulas. Caja x 12.',
      categoria: 'Brillo y Pulido',
      subcategoria: 'Metales & Cromados',
      marca: 'Rayo Pro',
      presentacion: 'Envase 500 ml (Caja x 12)',
      unidadMedida: 'Unidad',
      tipoItem: 'PRODUCTO_TERMINADO',
      costoPromedio: 9200,
      ultimoCosto: 9400,
      margenEsperado: 67,
      precios: {
        plist_1: 28000,
        plist_2: 23000,
        plist_3: 19500,
        plist_4: 16500,
        plist_5: 12040  // Cano Trucks (57% Dcto)
      },
      stock: 120,
      stockMinimo: 24,
      stockMaximo: 300,
      bodegaId: 'wh_1',
      estado: 'ACTIVO'
    },
    // 4. Desengrasante Multiusos 1 Litro
    {
      id: 'prod_deseng_multi_1l',
      tenantId: RAYO_PRO_TENANT_ID,
      codigoInterno: 'RAYO-004',
      sku: 'DESENG-MULTI-1L',
      codigoBarras: '7707123450042',
      nombre: 'Desengrasante Multiusos 1 Litro',
      descripcion: 'Limpiador desengrasante bioactivo para tapicería pesada, carcasas y superficies lavables.',
      categoria: 'Desengrasantes',
      subcategoria: 'Línea Multiusos',
      marca: 'Rayo Pro',
      presentacion: 'Botella 1 Litro (Caja x 12)',
      unidadMedida: 'Litro',
      tipoItem: 'PRODUCTO_TERMINADO',
      costoPromedio: 7800,
      ultimoCosto: 8000,
      margenEsperado: 65,
      precios: {
        plist_1: 22000,
        plist_2: 18500,
        plist_3: 16000,
        plist_4: 14000,
        plist_5: 12500
      },
      stock: 108,
      stockMinimo: 24,
      stockMaximo: 400,
      bodegaId: 'wh_1',
      estado: 'ACTIVO'
    },
    // 5. Desengrasante Multiusos 1 Galón
    {
      id: 'prod_deseng_multi_1g',
      tenantId: RAYO_PRO_TENANT_ID,
      codigoInterno: 'RAYO-005',
      sku: 'DESENG-MULTI-1G',
      codigoBarras: '7707123450059',
      nombre: 'Desengrasante Multiusos 1 Galón (3.78 L)',
      descripcion: 'Presentación galón económico para talleres y empresas de transporte de carga.',
      categoria: 'Desengrasantes',
      subcategoria: 'Línea Multiusos',
      marca: 'Rayo Pro',
      presentacion: 'Galón (3785 ml)',
      unidadMedida: 'Galón',
      tipoItem: 'PRODUCTO_TERMINADO',
      costoPromedio: 19500,
      ultimoCosto: 20000,
      margenEsperado: 59,
      precios: {
        plist_1: 48000,
        plist_2: 39000,
        plist_3: 34000,
        plist_4: 30000,
        plist_5: 27500
      },
      stock: 45,
      stockMinimo: 15,
      stockMaximo: 200,
      bodegaId: 'wh_1',
      estado: 'ACTIVO'
    },
    // 6. Shampoo Desincrustante Galón 4 Litros
    {
      id: 'prod_shamp_desinc_4l',
      tenantId: RAYO_PRO_TENANT_ID,
      codigoInterno: 'RAYO-006',
      sku: 'SHAMP-DESINC-4L',
      codigoBarras: '7707123450066',
      nombre: 'Shampoo Desincrustante Galón 4 Litros',
      descripcion: 'Desincrustante ácido en galón para flotas de tractomulas y buses intermunicipales.',
      categoria: 'Lavado Exterior',
      subcategoria: 'Desincrustantes',
      marca: 'Rayo Pro',
      presentacion: 'Galón 4 Litros',
      unidadMedida: 'Galón',
      tipoItem: 'PRODUCTO_TERMINADO',
      costoPromedio: 26000,
      ultimoCosto: 26500,
      margenEsperado: 60,
      precios: {
        plist_1: 65000,
        plist_2: 52000,
        plist_3: 45000,
        plist_4: 40000,
        plist_5: 37000
      },
      stock: 32,
      stockMinimo: 12,
      stockMaximo: 150,
      bodegaId: 'wh_1',
      estado: 'ACTIVO'
    },
    // 7. Garrafa x 23 Litros Shampoo Desincrustante
    {
      id: 'prod_garrafa_shamp_23l',
      tenantId: RAYO_PRO_TENANT_ID,
      codigoInterno: 'RAYO-007',
      sku: 'GARRAFA-SHAMP-23L',
      codigoBarras: '7707123450073',
      nombre: 'Garrafa Industrial x 23 Litros Shampoo Desincrustante',
      descripcion: 'Presentación mayorista en garrafa plástica azul de 23 litros para alto consumo en lavaderos de carga pesada.',
      categoria: 'Industrial Gran Formato',
      subcategoria: 'Desincrustantes',
      marca: 'Rayo Pro',
      presentacion: 'Garrafa 23 Litros',
      unidadMedida: 'Garrafa',
      tipoItem: 'PRODUCTO_TERMINADO',
      costoPromedio: 118000,
      ultimoCosto: 120000,
      margenEsperado: 58,
      precios: {
        plist_1: 280000,
        plist_2: 225000,
        plist_3: 195000,
        plist_4: 175000,
        plist_5: 160000
      },
      stock: 14,
      stockMinimo: 5,
      stockMaximo: 50,
      bodegaId: 'wh_1',
      estado: 'ACTIVO'
    },
    // 8. Galón Desengrasante Todero
    {
      id: 'prod_deseng_todero_1g',
      tenantId: RAYO_PRO_TENANT_ID,
      codigoInterno: 'RAYO-008',
      sku: 'DESENG-TODERO-1G',
      codigoBarras: '7707123450080',
      nombre: 'Galón Desengrasante Todero Automotriz',
      descripcion: 'Fórmula versátil de media concentración para lavado rápido de carrocerías y chasis.',
      categoria: 'Desengrasantes',
      subcategoria: 'Línea Todero',
      marca: 'Rayo Pro',
      presentacion: 'Galón (3785 ml)',
      unidadMedida: 'Galón',
      tipoItem: 'PRODUCTO_TERMINADO',
      costoPromedio: 18000,
      ultimoCosto: 18500,
      margenEsperado: 61,
      precios: {
        plist_1: 46000,
        plist_2: 37000,
        plist_3: 32000,
        plist_4: 28500,
        plist_5: 26000
      },
      stock: 28,
      stockMinimo: 10,
      stockMaximo: 120,
      bodegaId: 'wh_1',
      estado: 'ACTIVO'
    },
    // 9. Desengrasante Todero 1 Litro
    {
      id: 'prod_deseng_todero_1l',
      tenantId: RAYO_PRO_TENANT_ID,
      codigoInterno: 'RAYO-009',
      sku: 'DESENG-TODERO-1L',
      codigoBarras: '7707123450097',
      nombre: 'Desengrasante Todero 1 Litro',
      descripcion: 'Presentación 1 litro para mantenimiento diario de vehículos livianos y motos.',
      categoria: 'Desengrasantes',
      subcategoria: 'Línea Todero',
      marca: 'Rayo Pro',
      presentacion: 'Botella 1 Litro (Caja x 12)',
      unidadMedida: 'Litro',
      tipoItem: 'PRODUCTO_TERMINADO',
      costoPromedio: 6800,
      ultimoCosto: 7000,
      margenEsperado: 64,
      precios: {
        plist_1: 19000,
        plist_2: 15000,
        plist_3: 13000,
        plist_4: 11500,
        plist_5: 10200
      },
      stock: 72,
      stockMinimo: 24,
      stockMaximo: 300,
      bodegaId: 'wh_1',
      estado: 'ACTIVO'
    },
    // 10. Garrafa x 23 Litros Desengrasante Industrial
    {
      id: 'prod_garrafa_deseng_23l',
      tenantId: RAYO_PRO_TENANT_ID,
      codigoInterno: 'RAYO-010',
      sku: 'GARRAFA-DESENG-23L',
      codigoBarras: '7707123450103',
      nombre: 'Garrafa Industrial x 23 Litros Desengrasante',
      descripcion: 'Desengrasante alcalino industrial de choque en garrafa de 23 litros para desengrase severo de quintas ruedas.',
      categoria: 'Industrial Gran Formato',
      subcategoria: 'Desengrasantes',
      marca: 'Rayo Pro',
      presentacion: 'Garrafa 23 Litros',
      unidadMedida: 'Garrafa',
      tipoItem: 'PRODUCTO_TERMINADO',
      costoPromedio: 105000,
      ultimoCosto: 108000,
      margenEsperado: 60,
      precios: {
        plist_1: 260000,
        plist_2: 210000,
        plist_3: 180000,
        plist_4: 160000,
        plist_5: 145000
      },
      stock: 18,
      stockMinimo: 6,
      stockMaximo: 60,
      bodegaId: 'wh_1',
      estado: 'ACTIVO'
    },
    // 11. RayoBlack Partes Negras 500 ml
    {
      id: 'prod_rayoblack_500',
      tenantId: RAYO_PRO_TENANT_ID,
      codigoInterno: 'RAYO-011',
      sku: 'RAYOBLACK-500',
      codigoBarras: '7707123450110',
      nombre: 'RayoBlack Restaurador de Partes Negras 500 ml',
      descripcion: 'Acondicionador cerámico polimérico negro para molduras, llantas y defensas plásticas. Terminado seco.',
      categoria: 'Acondicionadores',
      subcategoria: 'Plásticos y Llantas',
      marca: 'Rayo Pro',
      presentacion: 'Botella dosificadora 500 ml',
      unidadMedida: 'Unidad',
      tipoItem: 'PRODUCTO_TERMINADO',
      costoPromedio: 12500,
      ultimoCosto: 12800,
      margenEsperado: 64,
      precios: {
        plist_1: 35000,
        plist_2: 28000,
        plist_3: 24000,
        plist_4: 21000,
        plist_5: 18500
      },
      stock: 85,
      stockMinimo: 20,
      stockMaximo: 250,
      bodegaId: 'wh_1',
      estado: 'ACTIVO'
    },

    // MATERIAS PRIMAS QUÍMICAS Y EMPAQUES
    {
      id: 'prod_mp_base_alcalina',
      tenantId: RAYO_PRO_TENANT_ID,
      codigoInterno: 'MP-010',
      sku: 'MP-BASE-ALCAL',
      nombre: 'Base Desengrasante Alcalina Concentrada',
      categoria: 'Materias Primas Químicas',
      unidadMedida: 'Kg',
      tipoItem: 'MATERIA_PRIMA',
      costoPromedio: 9200,
      stock: 850,
      stockMinimo: 200,
      bodegaId: 'wh_2',
      estado: 'ACTIVO'
    },
    {
      id: 'prod_mp_acido_fluorhidrico',
      tenantId: RAYO_PRO_TENANT_ID,
      codigoInterno: 'MP-011',
      sku: 'MP-ACIDO-DESINC',
      nombre: 'Compuesto Activo Ácido Desincrustante Grado Auto',
      categoria: 'Materias Primas Químicas',
      unidadMedida: 'Kg',
      tipoItem: 'MATERIA_PRIMA',
      costoPromedio: 16800,
      stock: 420,
      stockMinimo: 100,
      bodegaId: 'wh_2',
      estado: 'ACTIVO'
    },
    {
      id: 'prod_mp_envase_1l',
      tenantId: RAYO_PRO_TENANT_ID,
      codigoInterno: 'EMP-010',
      sku: 'EMP-BOTELLA-1L',
      nombre: 'Botella PEAD 1 Litro Boca 28mm Blanca',
      categoria: 'Material de Empaque',
      unidadMedida: 'Unidad',
      tipoItem: 'MATERIA_PRIMA',
      costoPromedio: 1100,
      stock: 1200,
      stockMinimo: 300,
      bodegaId: 'wh_2',
      estado: 'ACTIVO'
    },
    {
      id: 'prod_mp_caja_12',
      tenantId: RAYO_PRO_TENANT_ID,
      codigoInterno: 'EMP-012',
      sku: 'EMP-CAJA-12',
      nombre: 'Caja Cartón Corrugado Rayo Pro x 12 Unidades',
      categoria: 'Material de Empaque',
      unidadMedida: 'Unidad',
      tipoItem: 'MATERIA_PRIMA',
      costoPromedio: 2200,
      stock: 350,
      stockMinimo: 80,
      bodegaId: 'wh_2',
      estado: 'ACTIVO'
    },
    {
      id: 'prod_mp_garrafa_23l',
      tenantId: RAYO_PRO_TENANT_ID,
      codigoInterno: 'EMP-023',
      sku: 'EMP-GARRAFA-23L',
      nombre: 'Garrafa Industrial PEAD 23 Litros Azul c/Tapa 60mm',
      categoria: 'Material de Empaque',
      unidadMedida: 'Unidad',
      tipoItem: 'MATERIA_PRIMA',
      costoPromedio: 18500,
      stock: 65,
      stockMinimo: 20,
      bodegaId: 'wh_2',
      estado: 'ACTIVO'
    }
  ],

  // CLIENTES CON DATOS REALES EXTRAÍDOS DEL EXCEL
  customers: [
    {
      id: 'cli_cano_trucks',
      tenantId: RAYO_PRO_TENANT_ID,
      codigo: 'CLI-CANO',
      tipoCliente: 'Flotas de Tractomulas / Carga Pesada',
      tipoPersona: 'NATURAL',
      nombre: 'Jhon Jairo Chalarca Acevedo (Cano)',
      razonSocial: 'Jhon Jairo Chalarca Acevedo / Cano Trucks',
      nitCc: '1096037405',
      dv: 1,
      facturaElectronica: false, // Cliente con acuerdo especial de remisión directa
      aplicaIva: false,          // Precios preferenciales netos sin IVA (etapa inicial)
      telefono: '3017100508',
      whatsapp: '+573017100508',
      email: 'jhon.chalarca@canotrucks.co',
      direccion: 'Manzana A Casa 17',
      barrio: 'La Estación',
      ciudad: 'La Tebaida',
      departamento: 'Quindío',
      vendedorId: 'usr_juan',
      vendedorNombre: 'Juan Pablo (Gerente)',
      listaPreciosId: 'plist_5', // Tarifa Especial Cano Trucks
      cupoCredito: 30000000,
      diasCredito: 30,
      saldoPendiente: 19756000, // $26.000.000 original - $4.244.000 (03 Sep) - $2.000.000 (09 Sep)
      totalComprado: 48500000,
      numeroCompras: 12,
      ultimaCompra: '2026-09-09',
      estado: 'ACTIVO',
      observaciones: 'Cliente VIP flotas del Quindío. Pedidos en Cajas x 12. Facturación por remisiones internas netas sin IVA.'
    },
    {
      id: 'cli_autospa',
      tenantId: RAYO_PRO_TENANT_ID,
      codigo: 'CLI-002',
      tipoCliente: 'Taller / Detailing',
      tipoPersona: 'JURIDICA',
      nombre: 'AutoSpa Premium Medellín',
      razonSocial: 'AutoSpa Detailing SAS',
      nitCc: '901223445',
      dv: 1,
      facturaElectronica: true,  // Factura Electrónica formal DIAN
      aplicaIva: true,           // Responsable de IVA 19%
      telefono: '(604) 321 4455',
      whatsapp: '+573004561234',
      email: 'gerencia@autospamedellin.co',
      direccion: 'Calle 10 # 43E - 28 El Poblado',
      ciudad: 'Medellín',
      departamento: 'Antioquia',
      barrio: 'El Poblado',
      vendedorId: 'usr_ventas',
      vendedorNombre: 'Valentina Restrepo',
      listaPreciosId: 'plist_2',
      cupoCredito: 5000000,
      diasCredito: 30,
      saldoPendiente: 1250000,
      totalComprado: 14850000,
      numeroCompras: 14,
      ultimaCompra: '2026-09-08',
      estado: 'ACTIVO',
      observaciones: 'Cliente frecuente VIP detailing. Requiere factura electrónica en cada compra.'
    },
    {
      id: 'cli_lavadero_bello',
      tenantId: RAYO_PRO_TENANT_ID,
      codigo: 'CLI-003',
      tipoCliente: 'Consumidor Final / Negocio Inicial',
      tipoPersona: 'NATURAL',
      nombre: 'Lavadero El Oasis Bello (Emprendimiento)',
      razonSocial: 'Carlos Andrés Muñoz',
      nitCc: '71239844',
      dv: 3,
      facturaElectronica: false, // En etapa inicial, sin facturación electrónica
      aplicaIva: false,          // No cobra IVA
      telefono: '3128901234',
      whatsapp: '+573128901234',
      email: 'eloasis.bello@gmail.com',
      direccion: 'Calle 50 # 48 - 19',
      ciudad: 'Bello',
      departamento: 'Antioquia',
      barrio: 'Prado',
      vendedorId: 'usr_ventas',
      vendedorNombre: 'Valentina Restrepo',
      listaPreciosId: 'plist_1',
      cupoCredito: 1000000,
      diasCredito: 15,
      saldoPendiente: 0,
      totalComprado: 1850000,
      numeroCompras: 3,
      ultimaCompra: '2026-09-11',
      estado: 'ACTIVO',
      observaciones: 'Negocio en etapa inicial. Se le expide cuenta de cobro / remisión sin IVA.'
    }
  ],

  // RECETAS BOM REALES DE RAYO PRO
  recipes_bom: [
    {
      id: 'bom_deseng_1l',
      tenantId: RAYO_PRO_TENANT_ID,
      productoTerminadoId: 'prod_deseng_1l',
      nombreReceta: 'Fórmula Maestra Desengrasante 1L (Lote 120 Botellas / 10 Cajas x 12)',
      rendimientoLote: 120,
      unidadMedidaLote: 'Botellas',
      tiempoProduccionMinutos: 90,
      costosIndirectosEstimados: 45000,
      insumos: [
        { materiaPrimaId: 'prod_mp_base_alcalina', cantidad: 36, unidadMedida: 'Kg', mermaEsperada: 1 },
        { materiaPrimaId: 'prod_mp_envase_1l', cantidad: 120, unidadMedida: 'Unidad', mermaEsperada: 0 },
        { materiaPrimaId: 'prod_mp_caja_12', cantidad: 10, unidadMedida: 'Unidad', mermaEsperada: 0 }
      ],
      estado: 'ACTIVO',
      observaciones: 'Agitación constante a 500 RPM. Control de pH alcalino en 11.5.'
    },
    {
      id: 'bom_shamp_desinc_1l',
      tenantId: RAYO_PRO_TENANT_ID,
      productoTerminadoId: 'prod_shamp_desinc_1l',
      nombreReceta: 'Fórmula Maestra Shampoo Desincrustante 1L (Lote 120 Botellas / 10 Cajas x 12)',
      rendimientoLote: 120,
      unidadMedidaLote: 'Botellas',
      tiempoProduccionMinutos: 110,
      costosIndirectosEstimados: 55000,
      insumos: [
        { materiaPrimaId: 'prod_mp_acido_fluorhidrico', cantidad: 28, unidadMedida: 'Kg', mermaEsperada: 1.5 },
        { materiaPrimaId: 'prod_mp_envase_1l', cantidad: 120, unidadMedida: 'Unidad', mermaEsperada: 0 },
        { materiaPrimaId: 'prod_mp_caja_12', cantidad: 10, unidadMedida: 'Unidad', mermaEsperada: 0 }
      ],
      estado: 'ACTIVO',
      observaciones: 'Manipulación con EPP de seguridad industrial ácido. pH final calibrado en 2.8.'
    }
  ],

  // ÓRDENES DE PRODUCCIÓN
  production_orders: [
    {
      id: 'ord_prod_001',
      tenantId: RAYO_PRO_TENANT_ID,
      numeroOrden: 'OP-2026-0042',
      recetaId: 'bom_deseng_1l',
      productoTerminadoId: 'prod_deseng_1l',
      productoTerminadoNombre: 'Desengrasante Automotriz 1 Litro (10 Cajas x 12)',
      loteCodigo: 'LOTE-DES2609-01',
      fechaProgramada: '2026-09-10',
      fechaInicio: '2026-09-10T08:00:00Z',
      fechaFin: '2026-09-10T11:30:00Z',
      cantidadPlanificada: 120,
      cantidadProducida: 120,
      costoEstimadoTotal: 1020000,
      costoRealTotal: 1018500,
      costoUnitarioReal: 8487,
      costosIndirectosReales: 45000,
      estado: 'COMPLETADA',
      responsableId: 'usr_juan',
      responsableNombre: 'Juan Pablo (Gerente)',
      firmaUrl: 'datos/firma juan.jpg',
      insumosConsumidos: [
        { materiaPrimaId: 'prod_mp_base_alcalina', sku: 'MP-BASE-ALCAL', nombre: 'Base Desengrasante Alcalina Concentrada', cantidad: 36, unidadMedida: 'Kg', costoUnitario: 9200, costoTotal: 331200 },
        { materiaPrimaId: 'prod_mp_envase_1l', sku: 'EMP-BOTELLA-1L', nombre: 'Botella PEAD 1 Litro Boca 28mm Blanca', cantidad: 120, unidadMedida: 'Unidad', costoUnitario: 1100, costoTotal: 132000 },
        { materiaPrimaId: 'prod_mp_caja_12', sku: 'EMP-CAJA-12', nombre: 'Caja Cartón Corrugado Rayo Pro x 12 Und', cantidad: 10, unidadMedida: 'Unidad', costoUnitario: 2200, costoTotal: 22000 }
      ],
      observaciones: 'Lote empacado en 10 cajas rotuladas con logo Rayo Pro para despacho.'
    }
  ],

  // ENVÍOS Y DESPACHOS CON DATOS REALES DE CANO TRUCKS
  orders_shipping: [
    {
      id: 'ship_cano_01',
      tenantId: RAYO_PRO_TENANT_ID,
      ventaId: 'sale_cano_01',
      clienteId: 'cli_cano_trucks',
      clienteNombre: 'Jhon Jairo Chalarca Acevedo (Cano Trucks)',
      nitCc: '1096037405-1',
      telefono: '3017100508',
      whatsapp: '+57 301 710 0508',
      email: 'jhon.chalarca@canotrucks.co',
      direccion: 'Manzana A Casa 17',
      barrio: 'La Estación',
      ciudad: 'La Tebaida',
      departamento: 'Quindío',
      transportadora: 'Coordinadora Mercantil Carga',
      numeroGuia: '77092184531',
      costoEnvio: 165000,
      estadoCiclo: 'ENVIADO',
      fechaDespacho: '2026-09-11',
      fechaEntregaEstimada: '2026-09-14',
      cajasTotal: 17,
      contenidoDescripcion: '17 CAJAS X 12 (Productos de mantenimiento y embellecimiento automotriz)',
      responsable: 'Juan Pablo (Gerente)',
      observaciones: 'Manejar con cuidado. Cajas con sellos de seguridad Rayo Pro. Productos de mantenimiento y embellecimiento automotriz.'
    },
    {
      id: 'ship_cano_02',
      tenantId: RAYO_PRO_TENANT_ID,
      ventaId: 'sale_cano_02',
      clienteId: 'cli_cano_trucks',
      clienteNombre: 'Jhon Jairo Chalarca Acevedo (Cano Trucks)',
      nitCc: '1096037405-1',
      telefono: '3017100508',
      whatsapp: '+57 301 710 0508',
      email: 'jhon.chalarca@canotrucks.co',
      direccion: 'Manzana A Casa 17',
      barrio: 'La Estación',
      ciudad: 'La Tebaida',
      departamento: 'Quindío',
      transportadora: 'Envia Colvanes',
      numeroGuia: '04128994711',
      costoEnvio: 95000,
      estadoCiclo: 'LISTO_DESPACHO',
      fechaDespacho: '2026-09-12',
      fechaEntregaEstimada: '2026-09-15',
      cajasTotal: 8,
      contenidoDescripcion: '8 CAJAS X 12 (Productos de mantenimiento y embellecimiento automotriz)',
      responsable: 'Valentina Restrepo',
      observaciones: 'Despacho prioritario programado para recolección hoy en la tarde. Productos de embellecimiento automotriz.'
    }
  ],

  // CUENTAS POR COBRAR (CARTERA REAL DE JHON CHALARCA CANO)
  receivables_cxc: [
    {
      id: 'cxc_cano_01',
      tenantId: RAYO_PRO_TENANT_ID,
      ventaId: 'sale_cano_prev',
      documento: 'RP-CANO-088',
      clienteId: 'cli_cano_trucks',
      clienteNombre: 'Jhon Jairo Chalarca Acevedo (Cano)',
      fechaEmision: '2026-08-15',
      fechaVencimiento: '2026-09-15',
      valorTotal: 26000000, // Deuda original registrada en Excel
      abonos: 6244000,      // $4.244.000 (03-Sep) + $2.000.000 (09-Sep)
      saldo: 19756000,      // Saldo actual adeudado
      diasMora: 0,
      estado: 'POR_VENCER',
      observaciones: 'Abonos conciliados: $4.244.000 el 03-Sep-2026 y $2.000.000 el 09-Sep-2026.'
    }
  ],

  // VENTAS REALES
  sales: [
    {
      id: 'sale_cano_01',
      tenantId: RAYO_PRO_TENANT_ID,
      consecutivo: 'RP-10026',
      tipoDoc: 'VENTA_CREDITO',
      clienteId: 'cli_cano_trucks',
      clienteNombre: 'Jhon Jairo Chalarca Acevedo (Cano)',
      clienteNit: '1096.037.405-1',
      vendedorId: 'usr_juan',
      vendedorNombre: 'Juan Pablo (Gerente)',
      listaPreciosId: 'plist_5',
      fecha: '2026-09-11T14:20:00Z',
      estado: 'CREDITO_PENDIENTE',
      subtotal: 6964706,
      descuentos: 0,
      impuestos: 1323294, // IVA 19%
      total: 8288000,     // Total exacto registrado en el Excel
      metodoPago: 'Crédito',
      pagoRecibido: 0,
      cambio: 0,
      saldoCredito: 8288000,
      items: [
        { productoId: 'prod_deseng_1l', sku: 'DESENG-1L', nombre: 'Desengrasante Automotriz 1 Litro (17 Cajas x 12 = 204 Und)', cantidad: 204, precioUnitario: 11130, total: 2270520 },
        { productoId: 'prod_shamp_desinc_1l', sku: 'SHAMP-DESINC-1L', nombre: 'Shampoo Desincrustante 1 Litro (17 Cajas x 12 = 204 Und)', cantidad: 204, precioUnitario: 15712, total: 3205248 },
        { productoId: 'prod_metal_polish', sku: 'METAL-POLISH-500', nombre: 'Metal Polish Restaurador 500 ml (192 Und)', cantidad: 192, precioUnitario: 12040, total: 2311680 }
      ]
    }
  ],

  cash_shifts: [
    {
      id: 'cshift_actual',
      tenantId: RAYO_PRO_TENANT_ID,
      usuarioId: 'usr_juan',
      usuarioNombre: 'Juan Pablo (Gerente)',
      fechaApertura: '2026-09-12T07:30:00Z',
      fechaCierre: null,
      montoApertura: 300000,
      totalVentasEfectivo: 850000,
      totalVentasTransferencia: 2000000, // Abono transferido por Cano
      totalVentasNequiDaviplata: 450000,
      totalVentasTarjeta: 250000,
      totalVentasCredito: 8288000,
      totalIngresos: 50000,
      totalEgresos: 40000,
      totalGastos: 35000,
      totalRetiros: 0,
      saldoEsperado: 1125000,
      saldoContado: 0,
      diferencia: 0,
      estado: 'ABIERTA',
      observaciones: 'Turno activo principal Rayo Pro'
    }
  ],

  expenses: [
    {
      id: 'exp_001',
      tenantId: RAYO_PRO_TENANT_ID,
      fecha: '2026-09-12T09:20:00Z',
      categoria: 'Mensajería y Envíos',
      concepto: 'Flete despacho Coordinadora a La Tebaida Quindío (Cano Trucks)',
      proveedor: 'Coordinadora Mercantil S.A.',
      valor: 165000,
      formaPago: 'Transferencia Bancolombia',
      responsableId: 'usr_juan',
      responsableNombre: 'Juan Pablo',
      observacion: 'Guía 77092184531'
    }
  ],

  payables_cxp: [
    {
      id: 'cxp_001',
      tenantId: RAYO_PRO_TENANT_ID,
      compraId: 'comp_042',
      documento: 'FAC-QUIM-8841',
      proveedorId: 'prov_01',
      proveedorNombre: 'Químicos Industriales de Colombia S.A.S.',
      fechaEmision: '2026-09-01',
      fechaVencimiento: '2026-10-15',
      valorTotal: 4500000,
      abonos: 0,
      saldo: 4500000,
      diasMora: 0,
      estado: 'AL_DIA'
    }
  ],

  suppliers: [
    {
      id: 'prov_01',
      tenantId: RAYO_PRO_TENANT_ID,
      codigo: 'PROV-001',
      razonSocial: 'Químicos Industriales de Colombia S.A.S.',
      nitCc: '890900123',
      dv: 5,
      contacto: 'Ing. Fernando Gómez',
      telefono: '(604) 448 3030',
      ciudad: 'Sabaneta',
      departamento: 'Antioquia',
      diasCredito: 45,
      categoria: 'Materias Primas Químicas',
      estado: 'ACTIVO'
    },
    {
      id: 'prov_02',
      tenantId: RAYO_PRO_TENANT_ID,
      codigo: 'PROV-002',
      razonSocial: 'Plásticos & Envases del Valle S.A.',
      nitCc: '805011456',
      dv: 2,
      contacto: 'Carolina Morales',
      telefono: '(602) 441 5500',
      ciudad: 'Palmira',
      departamento: 'Valle del Cauca',
      diasCredito: 30,
      categoria: 'Envases & Tapas',
      estado: 'ACTIVO'
    }
  ],

  kardex: [
    {
      id: 'kdx_001',
      tenantId: RAYO_PRO_TENANT_ID,
      fecha: '2026-09-10T11:30:00Z',
      productoId: 'prod_deseng_1l',
      productoNombre: 'Desengrasante Automotriz 1 Litro',
      sku: 'DESENG-1L',
      bodegaId: 'wh_1',
      bodegaNombre: 'Bodega Principal & Despachos',
      documentoTipo: 'PRODUCCION_ENTRADA',
      documentoNumero: 'OP-2026-0042',
      cantidadEntrada: 120,
      cantidadSalida: 0,
      saldoCantidad: 144,
      costoUnitario: 8487,
      costoTotal: 1018500,
      usuarioId: 'usr_juan',
      usuarioNombre: 'Juan Pablo (Gerente)',
      observacion: 'Entrada por lote fabricado LOTE-DES2609-01 (10 cajas x 12)'
    }
  ],

  audit_logs: [
    {
      id: 'aud_001',
      tenantId: RAYO_PRO_TENANT_ID,
      fecha: '2026-09-12',
      hora: '10:15:00',
      usuarioId: 'usr_juan',
      usuarioNombre: 'Juan Pablo (Gerente)',
      modulo: 'Ventas POS',
      accion: 'CREAR',
      registroId: 'RP-10026',
      campoModificado: 'Factura Despacho Cano Trucks',
      valorAnterior: '-',
      valorNuevo: '$ 8.288.000 (Crédito a 30 días)',
      ipUserAgent: 'Nexa iOS Desktop App'
    }
  ]
};
