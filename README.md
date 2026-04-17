# Strategic Report Agent

Aplicacion web estatica con Cloudflare Worker para generar informes ejecutivos, minutas y contraste multifuente.

## Stack

- Frontend estatico: `index.html`, `home.html`, `js/`, `css/`
- Worker: `src/worker/`
- Deploy: Cloudflare Pages + Worker con Wrangler
- Proyecto configurado como ESM en `package.json`

## Estructura

- `js/app.js`: flujo principal de analisis y preview
- `js/history.js`: historial de informes
- `js/minutas.js`: generacion y export de minutas
- `js/contraste.js`: contraste multifuente
- `js/storage.js`: acceso centralizado a `localStorage`
- `js/schemas.js`: validacion ligera de respuestas JSON
- `js/app-shell.js`: interacciones estaticas del shell/UI
- `src/worker/index.js`: routing HTTP del Worker
- `src/worker/security.js`: auth, CORS y hardening
- `src/worker/validation.js`: validacion de payloads del Worker
- `tailwind.config.cjs`: configuracion Tailwind en CommonJS aislada para compatibilidad CLI

## Desarrollo

Instalar dependencias:

```bash
npm install
```

Levantar Worker local:

```bash
npm run dev
```

Compilar CSS:

```bash
npm run build:css
```

## Calidad

Lint:

```bash
npm run lint
```

Tests:

```bash
npm test
```

## Variables y secretos

Config en `wrangler.toml` y secretos con `wrangler secret put`.

Claves importantes:

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `STATS_TOKEN`
- `SESSION_TOKEN_SECRET`

## Mejoras aplicadas

- Validacion explicita de payloads del Worker
- Validacion ligera de JSON generado por IA
- Secret dedicado para tokens de sesion
- Acceso centralizado a `localStorage`
- Extraccion del shell UI a archivos JS separados
- Pruebas base para seguridad y validacion
