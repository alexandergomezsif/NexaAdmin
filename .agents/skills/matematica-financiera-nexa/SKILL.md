---
name: matematica-financiera-nexa
description: Guía maestra de matemática financiera, ingeniería de costos industriales, fijación estratégica de precios y unit economics aplicada a NexaAdmin.
---

# 📐 MATEMÁTICA FINANCIERA & COSTEO ESTRATÉGICO (NEXA ERP)

## 1. IDENTIDAD Y ALCANCE
Esta skill actúa como el **Director Financiero y Analista de Costos Industriales Senior** para NexaAdmin. Modela la estructura de costos y precios con rigor matemático, garantizando que el gerente o administrador comprenda exactamente el origen de cada peso ($) y porcentaje (%) en el negocio.

---

## 2. EL ERROR MATEMÁTICO #1 EN LAS PYMES: MARGEN VS. MARKUP

La confusión entre **Margen de Utilidad** y **Markup (Margen sobre el Costo)** es la causa más común de quiebras silenciosas en manufactura y retail.

### A. Definiciones Rigurosas
- **Costo Total Unitario ($CP$):** Lo que cuesta producir o adquirir una unidad terminada.
- **Precio de Venta ($PV$):** Lo que el cliente paga (antes de impuestos indirectos como IVA).
- **Ganancia Bruta o Utilidad en Pesos ($U_{\$}$):**
  $$U_{\$} = PV - CP$$
- **Margen de Rentabilidad ($M_{\%}$):** Qué porcentaje del **PRECIO DE VENTA** es ganancia neta.
  $$M_{\%} = \frac{PV - CP}{PV} = \frac{U_{\$}}{PV}$$
- **Markup ($Mu_{\%}$):** Qué porcentaje se le suma **AL COSTO** para llegar al precio.
  $$Mu_{\%} = \frac{PV - CP}{CP} = \frac{U_{\$}}{CP}$$

---

### B. Cálculo Directo (Fijar Precio a partir del Margen Deseado)
Si el producto cuesta $\$10.000$ y el gerente desea un **Margen del 30%**, la tentación novata es calcular $\$10.000 \times 1.30 = \$13.000$. **¡ESTO ES UN GRAVE ERROR!**

1. Si vende a $\$13.000$, la ganancia es $\$3.000$.
2. El margen real obtenido es:
   $$M_{\%} = \frac{3.000}{13.000} = 23.07\% \quad \text{(¡Perdió 7 puntos de margen!)}$$

**Fórmula Correcta de Fijación de Precio por Margen:**
$$PV = \frac{CP}{1 - M_{\%}}$$

*Aplicación:*
$$PV = \frac{10.000}{1 - 0.30} = \frac{10.000}{0.70} = \$14.285,71 \approx \$14.290$$
*Comprobación:*
- Utilidad en $\$ = \$14.286 - \$10.000 = \$4.286$
- Margen real $= \frac{\$4.286}{\$14.286} = 30.00\%$
- Markup equivalente $= \frac{\$4.286}{\$10.000} = 42.86\%$

---

### C. Cálculo Inverso (Analizar Margen a partir de un Precio Objetivo)
Si el mercado o la competencia impone que el producto debe venderse a un precio fijo $PV$ (ej. $\$25.000$), y el costo de producción es $CP$ (ej. $\$16.500$):

1. **Utilidad Bruta en Pesos ($U_{\$}$):**
   $$U_{\$} = PV - CP = 25.000 - 16.500 = \$8.500$$
2. **Margen Real sobre Ventas ($M_{\%}$):**
   $$M_{\%} = \frac{U_{\$}}{PV} \times 100 = \frac{8.500}{25.000} \times 100 = 34.00\%$$
3. **Markup sobre el Costo ($Mu_{\%}$):**
   $$Mu_{\%} = \frac{U_{\$}}{CP} \times 100 = \frac{8.500}{16.500} \times 100 = 51.52\%$$

> **Regla de Oro en NexaAdmin:** TODO porcentaje calculado en el sistema debe mostrar obligatoriamente su traducción en dinero real ($ COP):
> *Ejemplo:* `Margen: 34.0% ($8.500 COP por unidad) | Markup: 51.5%`

---

## 3. INGENIERÍA DE COSTOS EN 3 PILARES

El costo unitario $CP$ de un producto químico o manufacturado en NexaAdmin se compone de:

$$CP = MPD + ME + CC$$

### 1. Materia Prima Directa ($MPD$)
Insumos químicos de la receta o fórmula. Se calcula ponderando la cantidad de cada ingrediente por su costo de adquisición promedio del Kardex:
$$MPD = \sum_{i=1}^{n} (\text{Cantidad}_i \times \text{Costo Unitario}_i) \times (1 + \text{Merma}_i)$$

### 2. Material de Empaque ($ME$)
En productos de consumo masivo o automotriz, el empaque suele representar entre el 25% y 50% del costo total:
$$ME = \text{Envase/Frasco} + \text{Tapa/Gatillo} + \text{Etiqueta (Frontal/Dorsal)} + \frac{\text{Caja Master x12}}{12} + \text{Cinta/Precinto}$$

### 3. Costos de Conversión ($CC = MOD + CIF$)
- **Mano de Obra Directa ($MOD$):** Tiempo de operario invertido en envasado y etiquetado por unidad.
- **Costos Indirectos de Fabricación ($CIF$):** Energía de reactores, agua desmineralizada, amortización de maquinaria y merma operativa de llenado.

---

## 4. ESTRUCTURA DE ESCALAFONES COMERCIALES (PRICING TIERS)

NexaAdmin utiliza una matriz de 5 listas de precios para cubrir todos los canales sin canibalizar ganancias:

| Lista | Canal / Segmento | Margen Objetivo | Markup Típico | Comportamiento |
| :--- | :--- | :---: | :---: | :--- |
| **P1** | **Público / Mostrador** | **45% - 55%** | ~80% - 120% | Precio sugerido al consumidor final (PVP). |
| **P2** | **Talleres / Lavaderos** | **35% - 42%** | ~55% - 72% | Cliente comercial frecuente por volumen medio. |
| **P3** | **Mayoristas (Cajas x 12)** | **25% - 30%** | ~33% - 43% | Compra por cajas completas o bultos cerrados. |
| **P4** | **Distribuidores Regionales**| **18% - 22%** | ~22% - 28% | Mueven grandes volúmenes; ganancia por rotación rápida. |
| **P5** | **Especial / Convenios** | **Negociable** | Variable | Acuerdos corporativos a la medida (ej. Cano Trucks). |

---

## 5. PUNTO DE EQUILIBRIO (BREAK-EVEN POINT)

Para determinar cuántas unidades se deben vender al mes para no perder dinero:

$$PE_{\text{unidades}} = \frac{Costos\ Fijos\ Mensuales\ (\$)}{Precio\ de\ Venta\ Unitario - Costo\ Variable\ Unitario}$$

Donde $(PV - CV)$ es el **Margen de Contribución Unitario ($MC_{\$}$)**.
El **Índice de Margen de Contribución ($IMC$)** es:
$$IMC = \frac{MC_{\$}}{PV}$$

Y el Punto de Equilibrio en Facturación es:
$$PE_{\$} = \frac{Costos\ Fijos}{IMC}$$

---

## 6. INGENIERÍA TRIBUTARIA (IVA EN COLOMBIA)

- **Base Gravable:** El precio de venta antes de impuestos ($PV$).
- **Tarifa General IVA:** $19\%$.
- **Precio Final al Consumidor:**
  $$PV_{\text{con IVA}} = PV \times 1.19$$
- **Desglose desde precio con IVA incluido:**
  $$PV_{\text{base}} = \frac{PV_{\text{con IVA}}}{1.19}, \quad IVA_{\$} = PV_{\text{con IVA}} - PV_{\text{base}}$$
