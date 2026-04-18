# CLAUDE.md — ALTO Strategic Report Agent

Contexto del proyecto para Claude Code. Este archivo se carga automáticamente en cada sesión.

## Qué es

App web estática + Cloudflare Worker que genera informes consultivos estilo McKinsey desde data cruda (texto pegado o archivos PDF/DOCX/TXT/CSV/MD). Branding **ALTO**. Salidas: PDF, DOCX, PPTX, Brief 1-página, Markdown.

Producción: https://strategic-report-agent.pages.dev

## Stack

- **Front:** HTML + JS modular (sin bundler) + Tailwind compilado.
  - `index.html` (~2400 líneas, app principal)
  - `home.html` (~370 líneas, landing)
  - `js/` — ~20 módulos ES (ver mapa abajo)
  - `css/` — Tailwind compilado a `tailwind.css`
- **Worker:** Cloudflare Worker en `src/worker/` (7 archivos). Proxea Claude API y maneja WhatsApp via Twilio.
- **Storage:** `localStorage` (historial, configuración) + Cloudflare KV (stats, rate limit) en el Worker.
- **Tests:** `node --test` sobre `tests/*.test.mjs`.

Sin bundler, sin SSR. Los módulos JS se cargan como `<script>` desde `index.html`.

## Comandos

```bash
npm install            # deps
npm run dev            # wrangler dev (Worker local)
npm run build:css      # compila Tailwind → css/tailwind.css
npm run watch:css      # idem en watch
npm run lint           # eslint sobre src/worker + js
npm run lint:fix
npm test               # node --test tests/**/*.test.mjs
npm run format         # prettier write
npm run deploy         # wrangler deploy (Worker a producción)
```

Front se despliega automáticamente vía Cloudflare Pages al hacer `git push origin main` (GitHub conectado). Worker requiere `npm run deploy` explícito.

## Estructura js/ (mapa por responsabilidad)

| Archivo | Propósito |
|---|---|
| `app.js` | Flujo principal de análisis y preview |
| `app-shell.js` | Interacciones estáticas del shell |
| `api.js` | Calls al Worker |
| `chat.js` | Chat de follow-up sobre el reporte |
| `state.js` | Estado global de la app (~77KB, el más grande) |
| `preview.js` | Render editable (contenteditable) |
| `pdf-export.js` | Export PDF (jsPDF + html2canvas) |
| `pptx-gen.js` | Export PPTX (PptxGenJS, ~97KB, estilo McKinsey) |
| `exports.js` | Export DOCX (docx.js) |
| `file-upload.js` | Parseo de archivos subidos (pdf.js, mammoth.js) |
| `history.js` | Historial en localStorage |
| `i18n.js` | i18n (es/en/pt/fr/de) |
| `schemas.js` | Validadores JSON de respuestas IA |
| `minutas.js` | Modo "minuta" |
| `contraste.js` | Modo "contraste multifuente" |
| `dashboard.js` | Vista dashboard |
| `home.js` | Landing |
| `lib-loader.js` | Carga lazy de libs (jsPDF, etc.) |
| `storage.js` | Wrapper localStorage centralizado |
| `ui-helpers.js` | Helpers UI |

## Estructura src/worker/

| Archivo | Propósito |
|---|---|
| `index.js` | Routing HTTP (entry point) |
| `prompts.js` | SYSTEM_PROMPT por kind + plantillas |
| `security.js` | CORS, headers, sanitize, session tokens, Twilio sig |
| `validation.js` | `validateRequestBody` |
| `analytics.js` | `trackEvent`, `logAbuse` → KV |
| `whatsapp.js` | Webhook Twilio + TwiML |
| `document-parser.js` | Parseo server-side de archivos |

## 4 kinds de salida

Cada kind tiene su SYSTEM_PROMPT en Worker (`prompts.js`) y su validator en front (`schemas.js`).

- **`report`** — informe completo: title, executive_summary, key_messages, findings, analysis_blocks (con so_what), risks, opportunities, recommendations (short/medium/long_term), conclusion.
- **`minuta`** — actas: decisions, commitments, key_topics, summary.
- **`slides`** — payload orientado a PPTX (≥3 slides).
- **`contraste`** — análisis comparativo (rechaza si insumo es insuficiente).

Schema completo y reglas anti-drift en skill `alto-report-schema`.

## Branding ALTO (paleta vigente)

| Token | Hex | Uso |
|---|---|---|
| Navy primario | `#041627` | títulos, headers |
| Rojo corporativo | `#E74243` | acentos, líneas críticas |
| Azul terciario | `#4174B9` | datos secundarios |
| Gris | `#B0B6B8` | divisores, fuente |

⚠️ El rojo viejo `#BB0014` está deprecated en PPTX (puede aún aparecer en CSS web — verificar antes de cambiar).

**Tipografía:**
- PPTX: **Calibri** única familia (decisión de diseño).
- Web: Manrope (headings) + Inter (body).
- PDF: Helvetica (default jsPDF) — ver skill `alto-pdf-spacing` para defaults.

## Worker — config y secrets

**Vars en `wrangler.toml`:**
- `CLAUDE_MODEL` = `claude-sonnet-4-6` (reportes)
- `WA_MODEL` = `claude-haiku-4-5-20251001` (WhatsApp)
- `ALLOWED_ORIGIN` — CSV de orígenes permitidos
- `RATE_LIMIT_PER_HOUR` = 30 (web), `WA_RATE_LIMIT_PER_HOUR` = 20

**Secrets (set vía `npx wrangler secret put <NAME>`):**
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
- `SESSION_TOKEN_SECRET`
- `STATS_TOKEN` (default = primeros 20 chars de ANTHROPIC_API_KEY si no se setea)

**KV bindings:** `WA_KV` (stats, abuse), `RATE_LIMIT_KV`.

## Workflow git (no-tranzable)

- **Push directo a `main`**, sin PRs.
- Sin `--no-verify` ni hooks salteados.
- Cada commit debe pasar lint + tests si tocas código.
- Mensaje: estilo conciso, español o inglés (mirar `git log` para tono).
- Stable rollback: commit `52dab81` (app 100% funcional, hardened, i18n, Pages deployado).

## Skills del proyecto (`.claude/skills/`)

Guardrails específicos que se autoinvocan según el archivo que se edite:

- **`alto-pptx-mckinsey`** → editar `js/pptx-gen.js`. Estilo McKinsey, paleta, exhibits visuales.
- **`alto-pdf-spacing`** → editar `js/pdf-export.js`. Spacing generoso (usuario muy sensible a texto apretado).
- **`alto-worker-deploy`** → editar `src/worker/`. Pre-deploy checklist + smoke test.
- **`alto-report-schema`** → editar `js/schemas.js` o `src/worker/prompts.js`. Schema source of truth, anti-drift Worker↔front.

## Convenciones / gotchas

- **Single-page, no SPA framework** — no React, no Vue. Mutación directa de DOM y `state.js` global.
- **Modelos hardcoded en `wrangler.toml`** — al actualizar Claude (e.g. Sonnet 4.6 → 4.7), cambiar `CLAUDE_MODEL` y `WA_MODEL` ahí, redeployar Worker.
- **PDF cuesta caro de iterar** — generar con `result` real, abrir en Preview/Acrobat. No alcanza con thumbnail.
- **PPTX: usar shapes nativas de PptxGenJS** — no SmartArt, no plantillas externas.
- **i18n: 5 idiomas** — al añadir un label, agregarlo a los 5 (es/en/pt/fr/de) o se rompe.
- **CORS**: nuevo origen → actualizar `ALLOWED_ORIGIN` en `wrangler.toml` antes del deploy del Worker.
- **Lib loader**: libs grandes (jsPDF, PptxGenJS, docx.js, pdf.js, mammoth.js) se cargan lazy via `js/lib-loader.js`. No importarlas eagerly.

## Dominio del usuario

ALTO es una consultora. El producto se usa para entregables a clientes — la calidad visual es no-tranzable. PDFs apretados o slides "tipo bullet" se consideran regresión, no preferencia.
