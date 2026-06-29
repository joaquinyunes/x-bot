# x-bot — Plan de implementación

## Fase 0: Inicialización del proyecto

- [ ] `npx create-next-app@latest x-bot --typescript --tailwind --eslint`
- [ ] Instalar dependencias:
  ```bash
  npm install @prisma/client playwright playwright-extra puppeteer-extra-plugin-stealth @faker-js/faker firebase zod uuid
  npm install -D prisma @types/node @types/uuid
  npx playwright install chromium
  ```
- [ ] Inicializar Prisma: `npx prisma init --provider sqlite`

## Fase 1: Base de datos

- [ ] Crear schema Prisma completo (ver `database.md`)
- [ ] Ejecutar migración: `npx prisma migrate dev --name init`
- [ ] Crear Prisma singleton (`src/lib/db.ts`)

## Fase 2: Autenticación (Firebase)

- [ ] Configurar Firebase Admin SDK
- [ ] `src/lib/firebase/admin.ts` — inicializar Firebase Admin
- [ ] `src/lib/firebase/client.ts` — inicializar Firebase Client
- [ ] `src/middleware.ts` — proteger rutas según rol (admin / client)
- [ ] Seed de admin inicial (primer login crea al admin si no existe)

## Fase 3: Mail.tm API

- [ ] `src/lib/mailtm/client.ts`
  - `createAccount()` → crea email temporal
  - `getMessages(accountId)` → obtiene mensajes del inbox
  - `getMessageContent(messageId)` → obtiene contenido del email
  - `extractVerificationCode(emailContent)` → extrae código de 6 dígitos

## Fase 4: Playwright Engine

- [ ] `src/lib/playwright/browser.ts`
  - Pool de navegadores reutilizables
  - Config anti-detección (stealth, viewport, UA)
- [ ] `src/lib/playwright/createAccount.ts`
  - Registro completo en X (datos aleatorios → Mail.tm → X signup → código)
- [ ] `src/lib/playwright/warmUp.ts`
  - Calentamiento: trending topics, likes random, follows, scroll
- [ ] `src/lib/playwright/actions.ts`
  - `like(page, url)`
  - `retweet(page, url)`
  - `comment(page, url, text)`
  - `playVideo(page, seconds)`
  - `reloadPage(page)`
- [ ] `src/lib/playwright/campaign.ts`
  - Orquestar ciclo completo de campaña

## Fase 5: API Routes

- [ ] `POST /api/auth/login` — login con Firebase
- [ ] `POST /api/accounts/create` — crear cuenta X
- [ ] `GET  /api/accounts` — listar cuentas (filtradas por cliente)
- [ ] `GET  /api/accounts/:id` — detalle de cuenta
- [ ] `DELETE /api/accounts/:id` — eliminar cuenta
- [ ] `POST /api/accounts/:id/actions` — ejecutar acción en cuenta
- [ ] `POST /api/campaigns` — crear campaña multi-cuenta
- [ ] `GET  /api/campaigns` — listar campañas
- [ ] `GET  /api/campaigns/:id` — detalle de campaña
- [ ] `GET  /api/stream` — SSE para estado en tiempo real
- [ ] `POST /api/admin/clients` — crear cliente (solo admin)
- [ ] `GET  /api/admin/clients` — listar clientes (solo admin)

## Fase 6: Frontend — Admin Panel

- [ ] `/admin/dashboard` — resumen general
- [ ] `/admin/clients` — CRUD de clientes
- [ ] `/admin/clients/:id` — detalle de cliente + sus cuentas

## Fase 7: Frontend — Client Panel

- [ ] `/dashboard` — resumen del cliente
- [ ] `/accounts` — listar cuentas X del cliente
- [ ] `/accounts/new` — crear nueva cuenta X
- [ ] `/campaigns` — listar campañas
- [ ] `/campaigns/new` — crear campaña
  - Slider para elegir nº de navegadores (1-3 o 1-5)
  - Input de URLs
  - Input de comentarios (lista)
  - Selección de cuentas
- [ ] `/campaigns/:id` — detalle con estado en tiempo real (SSE)

## Fase 8: UI / UX

- [ ] Layout base con sidebar + navbar
- [ ] Componentes reutilizables (botones, inputs, tablas, tarjetas)
- [ ] Logging en tiempo real via SSE
- [ ] Estados de carga, error, vacío

## Fase 9: Pruebas y ajustes

- [ ] Probar creación de cuenta con Mail.tm real
- [ ] Probar calentamiento
- [ ] Probar campaña con 3 navegadores paralelos
- [ ] Ajustar delays y selectores según cambios de X

## Fase 10: Documentación final

- [ ] README.md con instrucciones de instalación
- [ ] Variables de entorno documentadas
