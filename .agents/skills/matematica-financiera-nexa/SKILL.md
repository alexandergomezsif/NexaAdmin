---
name: matematica-financiera-nexa
description: Guía de pensamiento profundo en matemática financiera, costeo industrial, unit economics y fijación estratégica de precios para NexaAdmin ERP.
---

# 🧠 Matemática Financiera y Contabilidad de Costos Industriales para NexaAdmin

Esta habilidad condensa los principios matemáticos, financieros y contables indispensables para la administración estratégica de manufactura, costeo por absorción, fijación de precios y análisis de rentabilidad en empresas de producción y comercialización (como Rayo Pro / productos químicos automotrices).

---

## 1. Estructura del Costo Unitario de Producción (COGS)

En una empresa manufacturera, el costo de un producto terminado ($CP$) no se limita a los químicos. Consta de tres componentes fundamentales:

$$CP = MPD + ME + CC$$

Donde:
1. **$MPD$ (Materia Prima Directa):** Insumos químicos activos (solventes, tensoactivos, quelantes, colorantes, fragancias). Se calcula según la concentración de la fórmula porcentual (%) y el costo promedio ponderado de compra por kg o litro.
2. **$ME$ (Material de Empaque):** Envase primario (botella, garrafa), tapa o gatillo atomizador, etiqueta autoadhesiva frontal y trasera, y caja de embalaje master prorrateada entre las unidades que contiene (ej. Caja de cartón para 12 unidades = $\text{Costo Caja} / 12$).
3. **$CC$ (Costos de Conversión):**
   - **$MOD$ (Mano de Obra Directa):** Tiempo del operario dedicado a la preparación y envasado del lote:
     $$MOD_{\text{unitario}} = \frac{\text{Horas Lote} \times \text{Costo Hora Hombre con Prestaciones}}{\text{Unidades Totales del Lote}}$$
   - **$CIF$ (Costos Indirectos de Fabricación):** Electricidad de agitadores, agua desmineralizada, depreciación de maquinaria y merma técnica (desperdicio inevitable por evaporación o adherencia en tanques, típicamente 1% a 3%):
     $$CIF_{\text{unitario}} = (MPD + ME) \times \%_{\text{merma}} + \text{CIF Fijo Prorrateado}$$

---

## 2. La Distinción Vital: Margen de Utilidad vs. Markup

El error financiero más costoso en las PYMEs es confundir el **Markup** (sobre el costo) con el **Margen** (sobre el precio de venta).

### A. Cálculo Directo: Margen sobre Precio de Venta ($M_b$)
El margen representa qué porcentaje del dinero que paga el cliente queda como ganancia bruta antes de gastos administrativos e impuestos:

$$\text{Precio Base} = \frac{CP}{1 - M_b}$$

$$\text{Utilidad Bruta (\$)} = \text{Precio Base} - CP = \text{Precio Base} \times M_b$$

*Ejemplo:*
- Costo Total ($CP$): \$10.000 COP
- Margen deseado: $35\%$ ($0.35$)
- Precio Base: $\frac{\$10.000}{1 - 0.35} = \frac{\$10.000}{0.65} = \$15.385 \text{ COP}$
- Utilidad en dinero (\$): $\$15.385 - \$10.000 = \$5.385 \text{ COP}$ ($35\%$ del precio final).

*(Nota: Si erróneamente se hubiera sumado el $35\%$ al costo: $\$10.000 \times 1.35 = \$13.500$, la utilidad real sería de apenas $25.9\%$, perdiendo casi $10$ puntos de rentabilidad).*

### B. Cálculo Inverso: A partir de un Precio Objetivo ($P$)
Cuando el mercado o la competencia imponen un precio de venta ($P$), el sistema debe calcular de manera inversa tanto el margen como el markup y la utilidad en dinero:

$$\text{Utilidad Bruta (\$)} = P - CP$$

$$\text{Margen Real (\%)} = \left(\frac{P - CP}{P}\right) \times 100\%$$

$$\text{Markup Real (\%)} = \left(\frac{P - CP}{CP}\right) \times 100\%$$

*Regla de visualización en NexaAdmin:* **Todo porcentaje (%) debe estar acompañado simultáneamente por su valor monetario equivalente en COP (\$).**
- Ejemplo: `Margen: 35.0% ($5.385 COP)` | `Markup: 53.8% ($5.385 COP)` | `Costo: 65.0% ($10.000 COP)`.

---

## 3. Escalamiento de Precios Comerciales (Pricing Tiers)

Para una empresa como Rayo Pro, un mismo producto tiene diferentes precios según el volumen y tipo de cliente:

| Lista de Precios | Canal Objetivo | Margen Bruto Típico | Fórmula Sugerida |
| :--- | :--- | :--- | :--- |
| **P1 - Mostrador / Público** | Consumidor final / Detal | $45\% - 55\%$ | $\frac{CP}{1 - 0.50}$ |
| **P2 - Talleres & Lavaderos** | Clientes profesionales recurrentes | $35\% - 42\%$ | $\frac{CP}{1 - 0.38}$ |
| **P3 - Mayorista (Cajas)** | Compras por cajas completas x12 | $25\% - 32\%$ | $\frac{CP}{1 - 0.28}$ |
| **P4 - Distribuidor Regional** | Grandes volúmenes / Reventa | $18\% - 24\%$ | $\frac{CP}{1 - 0.20}$ |
| **P5 - Convenio Especial** | Contratos corporativos / Flotas | Variable ($15\% - 20\%$) | Negociado |

---

## 4. Tratamiento del Impuesto sobre las Ventas (IVA 19%)

En Colombia:
$$\text{IVA (\$)} = \text{Precio Base} \times 0.19$$
$$\text{Precio Final al Consumidor} = \text{Precio Base} + \text{IVA} = \text{Precio Base} \times 1.19$$

El IVA **NUNCA** forma parte del ingreso ni del margen de la empresa; es un pasivo a favor de la DIAN. Todos los cálculos de rentabilidad deben realizarse estrictamente sobre el **Precio Base antes de IVA**.

---

## 5. Punto de Equilibrio (Break-Even Point)

Determina cuántas unidades se deben vender para cubrir la totalidad de costos fijos mensuales ($CF$):

$$\text{Margen de Contribución Unitario (\$)} = P_{\text{base}} - CP$$

$$\text{Punto de Equilibrio (Unidades)} = \frac{CF_{\text{mensual}}}{\text{Margen de Contribución Unitario (\$)}}$$

$$\text{Punto de Equilibrio (Ventas \$)} = \frac{CF_{\text{mensual}}}{\text{Margen de Contribución \%}}$$

---

## 6. Principio de Claridad Pedagógica y Lenguaje Cotidiano (Sin Tecnicismos)
Para que un dueño de taller, fábrica o comercio sin formación administrativa entienda el sistema al instante, la interfaz debe traducir los términos técnicos a lenguaje del día a día:

| Término Contable / Universitario | Nombre en NexaAdmin (Lenguaje Intuitivo) |
| :--- | :--- |
| **Materia Prima Directa (MPD)** | **Lo que va por dentro (Líquidos / Químicos)** |
| **Material de Empaque (ME)** | **El Empaque (Tarro, Tapa, Etiqueta y Caja)** |
| **Costos de Conversión (MOD + CIF)** | **Trabajo, Servicios y Máquinas (Luz, agua y envasado)** |
| **Merma Técnica** | **Lo que se riega o evapora (Desperdicio)** |
| **Costo Primo + CIF (COGS)** | **Lo que te cuesta fabricar 1 unidad terminada** |
| **Margen Bruto sobre Precio** | **Tu ganancia limpia en el bolsillo por cada botella** |
| **Fórmula BOM** | **Receta de Fabricación Maestra** |
| **Batch Size** | **Tamaño de la preparación (Litros por tanda)** |

### Elementos Visuales Obligatorios:
1. **Barra multicolor de distribución:** Muestra visualmente qué parte del costo se va en químicos, empaque y trabajo.
2. **Semáforo de salud de ganancia:** Verde (🟢 Excelente >30%), Amarillo (🟡 Aceptable para mayoristas 15-30%), Rojo (🔴 Peligro <15%).
3. **Representación Dual Inquebrantable:** Todo porcentaje (%) debe tener al lado su valor en pesos (ej. `35% (+$4.200 COP)`).
