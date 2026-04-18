---
name: alto-report-schema
description: Source of truth del JSON schema entre Claude (Worker prompts) y front-end (validators). Invocar al editar js/schemas.js, src/worker/prompts.js, o cuando el usuario quiera añadir/cambiar campos del reporte/minuta/slides/contraste. Previene drift Worker↔front.
---

# ALTO — Report JSON Schema (Source of Truth)

El JSON que devuelve Claude tiene 4 "kinds": `report`, `minuta`, `slides`, `contraste`. La forma se valida en `js/schemas.js::validateByKind` y se genera vía prompts en `src/worker/prompts.js`. Cambios en uno **deben replicarse** en el otro o se rompe la app.

## kind: `report`

Validado por `validateReportShape` en `js/schemas.js`.

```ts
{
  title: string                          // requerido
  subtitle?: string
  executive_summary: string              // requerido
  key_messages: string[]                 // requerido (array, puede ser vacío)
  context?: string
  findings: Array<{                      // requerido (array)
    finding: string
    evidence: string
    business_implication: string
  }>
  analysis_blocks: Array<{               // requerido (array)
    heading: string
    governing_thought?: string
    content?: string
    bullets?: string[]
    so_what?: string
  }>
  risks?: Array<{ risk: string, implication: string }>
  opportunities?: string[]
  recommendations: {                     // requerido (object)
    short_term?:  Array<{ action, rationale, impact }>
    medium_term?: Array<{ action, rationale, impact }>
    long_term?:   Array<{ action, rationale, impact }>
  }
  conclusion?: string
  kpis?: any
  timeline?: any
}
```

## kind: `minuta`

Validado por `validateMinutaShape`.

```ts
{
  title: string                          // requerido
  decisions: any[]                       // requerido (array)
  commitments: any[]                     // requerido (array)
  key_topics: any[]                      // requerido (array)
  summary: string                        // requerido
}
```

## kind: `slides`

Validado por `validateSlidesShape`.

```ts
{
  slides: Array<any>                     // requerido, length ≥ 3
}
```

## kind: `contraste`

Validado por `validateContrasteShape`. Acepta `summary` o `executive_summary`. Rechaza payloads con frases tipo "insumo insuficiente", "marcador de posicion", "no puede ser completado" — esos vienen de `CONTRASTE_INSUFFICIENT_PHRASES`.

```ts
{
  title: string                          // requerido
  executive_summary | summary: string    // requerido
  // ...resto opcional
}
```

## Reglas de cambio

### Si añades un campo nuevo

1. **Worker (`src/worker/prompts.js`):** documéntalo en el SYSTEM_PROMPT correspondiente con tipo y ejemplo. Claude no lo va a producir si no lo pides.
2. **Validator (`js/schemas.js`):** decide si es required u opcional. Required → `assertString`/`assertArray`. Opcional → no añadir validación.
3. **Renderer:** front-end (`js/preview.js`, `js/pdf-export.js`, `js/pptx-gen.js`, `js/exports.js`) — añadir lectura defensiva (`?.`) y fallback si está ausente.
4. **Markdown export (`js/pdf-export.js::copyMarkdown`):** añadir línea para el campo nuevo.

### Si renombras un campo

- Es breaking. **Avisa al usuario** que reportes guardados (en `localStorage` via `js/history.js`) van a fallar.
- Considera mantener compatibilidad: leer ambos (`payload.new || payload.old`) por 1–2 versiones.

### Si cambias requirement (opcional → required)

- Romperá payloads existentes en historial. Discutir con usuario primero.

## Anti-drift checklist

Al editar prompts o validators:

- [ ] Schema en SYSTEM_PROMPT (Worker) y en `validateXxxShape` (front) coinciden.
- [ ] Renderers leen el campo defensivamente.
- [ ] Si es array: validator usa `assertArray`, no `assertString`.
- [ ] Si es nested object: documentado en el prompt con shape completo (Claude alucina si no le das estructura).
- [ ] Markdown export incluye el campo (si es output visible).

## Parser tolerante

`parseModelJSON` ya maneja: bloques ```json```, comas trailing, strings sin cerrar, brackets desbalanceados. **No** añadas más reparaciones ad-hoc — extiende `repairLikelyJson` con un caso testeado.

## Lang names (para prompts multilingues)

Worker tiene `LANG_NAMES = { es: 'español', en: 'English', pt: 'português', fr: 'français', de: 'Deutsch' }`. Si soportas un nuevo idioma, agrégalo aquí **y** en `pptxI18n` (`js/pptx-gen.js`) **y** en `js/i18n.js`.
