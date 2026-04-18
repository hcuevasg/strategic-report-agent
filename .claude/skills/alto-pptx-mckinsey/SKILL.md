---
name: alto-pptx-mckinsey
description: Reglas no-tranzables para generar PPTX estilo McKinsey en ALTO. Invocar SIEMPRE antes de editar js/pptx-gen.js o cuando el usuario pida cambios a slides, exhibits, action titles, governing thoughts, o layout PPTX. También al añadir nuevos tipos de slide.
---

# ALTO PPTX — McKinsey Pure (no-tranzable)

Aplica al editar `js/pptx-gen.js` (≈97KB, v4 "ALTO Corporate Style"). El usuario considera el estilo McKinsey **no-tranzable** y mostró el SmartArt de PowerPoint como referencia del nivel visual deseado.

## Paleta corporativa ALTO (versión actual del archivo, NO la antigua)

| Token | Hex | Uso |
|---|---|---|
| Navy primario | `#041627` | títulos, headers, footers |
| Rojo corporativo | `#E74243` | acentos, líneas críticas |
| Azul terciario | `#4174B9` | datos secundarios, exhibits |
| Gris ALTO | `#B0B6B8` | divisores, fuente |

⚠️ **No usar** `#BB0014` (rojo viejo), `#1B7A4A` (verde), ni `#CC3333`. Fueron reemplazados — verificar contra `js/pptx-gen.js` antes de añadir colores.

## Tipografía

- Una sola familia: **Calibri** en todo el deck.
- Action title: 18–22pt bold.
- Governing thought: 12–14pt bold cursiva.
- Cuerpo / bullets: 10–12pt regular.
- Footer / fuente: 8–9pt gris `#B0B6B8`.

## Estructura McKinsey obligatoria

Cada slide debe tener:

1. **Action title** (frase completa con conclusión, no etiqueta tipo "Riesgos") — arriba.
2. **Governing thought** opcional pero preferida — debajo del title.
3. **Exhibit** o cuerpo — visual primero, texto después.
4. **Source line** abajo — `tp('source')` + breve atribución.

## Visual exhibits — el objetivo de upgrade

El proyecto está migrando de "bullets + texto" a exhibits visuales. Cada vez que toques un layout, evalúa si puedes reemplazar bullets por:

- **Color blocks** para findings (uno por hallazgo, color por severidad).
- **2×2 matrix** para riesgos (impacto × probabilidad) o priorización.
- **Process arrows / timeline horizontal** para recomendaciones por plazo.
- **Bar / waterfall** para KPIs (usar `pptx.addChart` nativo, no imágenes).
- **Pyramid / hierarchy** para mensajes clave (Minto).

Reglas:
- Usar **shapes nativas de PptxGenJS** (`addShape`, `addChart`). No SmartArt, no archivos plantilla externos.
- Cada exhibit lleva un **caption** corto que cierre el argumento (so-what).

## i18n

Labels via `tp(key)` con tabla `pptxI18n` (`es`, `en`, `pt`). Si añades un label fijo, agrégalo a las 3 idiomas o se romperá la coherencia visual del deck en EN/PT.

## Layouts existentes a respetar

Cover, TOC, Executive Summary, Context, Findings (split layout para contenido largo), Analysis Blocks, Charts, Timeline, Risks & Opportunities, Recommendations (corto/mediano/largo), Closing. **No removas** estos layouts sin avisar — son parte del contrato visual del producto.

## Espacio y aire

El usuario es sensible al texto apretado. Si dudas entre 2 columnas o 3, elige 2. Padding interno mínimo en cards: 0.15"–0.2". Si una card desborda, usa el split layout en vez de reducir font-size.

## Antes de commitear

1. Genera un PPTX de prueba con un `result` real (no fixture genérico).
2. Abre en PowerPoint o Keynote, no solo el thumbnail interno.
3. Verifica: colores correctos, tipografía Calibri, action titles completos, exhibits visuales (no solo bullets), labels traducidos.

## Rollback

Si la salida queda peor que el baseline, commit estable es `52dab81`. Avisa al usuario antes de revertir.
