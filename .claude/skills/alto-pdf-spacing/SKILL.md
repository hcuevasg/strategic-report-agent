---
name: alto-pdf-spacing
description: Checklist de spacing generoso para PDFs jsPDF en ALTO. Invocar SIEMPRE antes de editar js/pdf-export.js o cuando el usuario pida cambios al PDF, brief, o exportación PDF. El usuario es muy sensible a texto apretado.
---

# ALTO PDF — Spacing generoso (sensibilidad alta del usuario)

Aplica al editar `js/pdf-export.js` (≈26KB, jsPDF + html2canvas). Stack: `jsPDF('p', 'mm', 'a4')` portrait, A4.

⚠️ **El usuario es muy sensible al texto apretado.** Cualquier cambio que reduzca aire es regresión. Cuando dudes entre apretado y espacioso, elige espacioso.

## Defaults mínimos (no bajar de aquí)

| Elemento | Mínimo |
|---|---|
| Margin lateral (left/right) | 18 mm |
| Margin top | 20 mm |
| Margin bottom | 22 mm (deja espacio para footer/page #) |
| Line height (texto cuerpo) | 1.45–1.6× font-size |
| Padding entre secciones (H2 → cuerpo) | 8–10 mm |
| Padding entre párrafos | 4–5 mm |
| Padding antes de bullets list | 3–4 mm |
| Espacio entre bullets | 2–3 mm |
| Espacio antes de heading H2 | 12–14 mm |
| Espacio antes de heading H3 | 8–10 mm |

## Tipografía PDF

- **Cuerpo:** 10.5–11pt (no 9, no 12 — 10.5–11 es el sweet spot leíble).
- **H1:** 18–20pt.
- **H2:** 14–15pt.
- **H3:** 12pt.
- **Caption / fuente:** 8.5–9pt gris.
- Familia: la default de jsPDF (Helvetica) o cargada explícitamente. **No mezclar** familias en un mismo bloque.

## Salto de página

- Si una sección no entra completa, **mover entera** a página nueva en vez de partirla a 2 líneas.
- Headings (H1/H2/H3) **nunca** quedan como última línea de página — empuja a la siguiente.
- "Widow/orphan" control para bullets: si el primer/último bullet de una lista queda solo, mueve un compañero con él.
- Reservar 22mm de bottom margin = **no escribir** en los últimos 22mm.

## Componentes específicos

- **Executive summary:** caja con padding interno ≥ 6mm, fondo gris muy claro.
- **Key messages bullets:** marker custom (•, ▸ o color block), no marker default jsPDF.
- **Tables:** `cellPadding: 4`, header row con fondo navy `#041627` y texto blanco.
- **so_what callout:** italic, indent 8mm, regla vertical izquierda 2mm en rojo `#E74243`.

## Brief (1-page PDF)

El brief es el caso límite — todo en 1 página. Aún así:
- Margin lateral mínimo 14 mm (no 10).
- Font cuerpo 9.5pt mínimo.
- Si no entra: **reduce contenido**, no reduzcas spacing.

## Antes de commitear

1. Genera PDF con un `result` real, no lorem ipsum.
2. Abre en Preview/Acrobat, no solo descarga.
3. Verifica: texto respira, no hay headings sueltos al final de página, callouts y bullets tienen aire, tablas no se cortan a la mitad.
4. Compara contra el último PDF generado del baseline si dudas.

## Si el usuario reporta "se ve apretado"

- Primero sube line-height (multiplicar por 1.1).
- Si sigue: aumenta padding entre párrafos +1mm.
- Si sigue: aumenta margins +2mm.
- **No** reduzcas font-size para "ganar espacio" — es la solución contraria.
