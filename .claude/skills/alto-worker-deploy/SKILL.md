---
name: alto-worker-deploy
description: Checklist pre-deploy para Cloudflare Worker de ALTO. Invocar antes de hacer wrangler deploy, cuando el usuario edite cualquier archivo en src/worker/, o cuando pida desplegar/publicar el Worker.
---

# ALTO Worker — Deploy checklist

Aplica a cambios en `src/worker/` (Cloudflare Worker que proxea Claude API y maneja WhatsApp via Twilio). Deploy: `npm run deploy` (= `wrangler deploy`).

## Topología actual

```
src/worker/
  index.js            # routing (entry point en wrangler.toml)
  prompts.js          # SYSTEM_PROMPT + variantes (REPORT, MINUTA, MULTISOURCE, PPTX)
  security.js         # CORS, headers, sanitize, session tokens, Twilio sig
  validation.js       # validateRequestBody
  analytics.js        # trackEvent, logAbuse → KV
  whatsapp.js         # handleWhatsApp, twimlResponse
  document-parser.js  # parseo de archivos
```

Bindings KV (en `wrangler.toml`): `WA_KV`, `RATE_LIMIT_KV`.

## Secrets requeridos (no van en wrangler.toml)

Verificar con `npx wrangler secret list` antes de deploy si tocaste prompts/auth:

- `ANTHROPIC_API_KEY` — Claude
- `OPENAI_API_KEY` — fallback / específico
- `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` — WhatsApp
- `SESSION_TOKEN_SECRET` — firma de tokens de sesión
- `STATS_TOKEN` — opcional, default = primeros 20 chars de `ANTHROPIC_API_KEY`

Si añades un nuevo secret en código, **avisa explícitamente al usuario** que debe correr `npx wrangler secret put <NAME>` antes del deploy o el Worker romperá en runtime.

## Vars (públicos, en wrangler.toml)

- `CLAUDE_MODEL` — actualmente `claude-sonnet-4-6`
- `WA_MODEL` — actualmente `claude-haiku-4-5-20251001`
- `ALLOWED_ORIGIN` — CSV de orígenes CORS permitidos
- `APP_URL` — `https://strategic-report-agent.pages.dev`
- `RATE_LIMIT_PER_HOUR` — 30
- `WA_RATE_LIMIT_PER_HOUR` — 20

Si cambias modelos: verifica que existen y que el Worker pasa el modelo correcto a la API. Documenta el motivo del cambio en el commit.

## Pre-deploy (orden estricto)

```bash
npm run lint          # eslint sobre src/worker + js
npm test              # node --test tests/**/*.test.mjs
npm run format:check  # prettier
```

Si lint falla por warning: **arregla**, no uses `--no-verify` ni `// eslint-disable` salvo que el usuario lo apruebe.

## Smoke test post-deploy

Después de `wrangler deploy`:

1. Confirma URL del Worker en output (`https://strategic-report-proxy.<account>.workers.dev`).
2. POST de prueba con payload mínimo desde la app en producción (`strategic-report-agent.pages.dev`).
3. Verifica `/stats` con `Authorization: Bearer <STATS_TOKEN>` — debe responder 200.
4. Si tocaste WhatsApp: revisa Twilio webhook logs.

## CORS — error frecuente

Si añades un nuevo origen frontend, actualiza `ALLOWED_ORIGIN` en `wrangler.toml` (CSV) **antes** del deploy. Síntoma: el browser bloquea con "No 'Access-Control-Allow-Origin' header".

## Rate limits

`RATE_LIMIT_PER_HOUR` se aplica por IP via `RATE_LIMIT_KV`. Si subes el límite, considera el costo de Anthropic — un report cuesta ~$0.10–$0.30 según tokens.

## Rollback

```bash
npx wrangler deployments list
npx wrangler rollback [deployment-id]
```

No usar `git revert` para "rollback" del Worker — el deploy actual no cambia hasta correr deploy de nuevo.

## Antes de avisar "deployado"

- [ ] Lint OK
- [ ] Tests OK
- [ ] Secrets nuevos comunicados al usuario (si los hay)
- [ ] Smoke test en prod respondió correctamente
- [ ] `git push` a main hecho (recordar: este repo va directo a main, sin PRs)
