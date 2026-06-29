# x-bot — Arquitectura

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14+ (App Router) |
| Lenguaje | TypeScript |
| Base de datos | SQLite via Prisma ORM |
| Browser Automation | Playwright + Chromium |
| Email temporal | Mail.tm API (`https://api.mail.tm`) |
| Autenticación | Firebase Auth |
| UI | Tailwind CSS + Shadcn/ui |
| Estado en tiempo real | SSE (Server-Sent Events) |
| Datos aleatorios | @faker-js/faker |

## Visión general

```
┌─────────────────────────────────────────────────────┐
│                     Internet                         │
└──────────┬──────────────────────────────┬───────────┘
           │                              │
           ▼                              ▼
┌─────────────────────┐    ┌──────────────────────────┐
│   Next.js App       │    │      X (Twitter)          │
│   (Frontend + API)  │    │   ┌──────────────────┐   │
│                     │◄───►│   │ Login / Signup   │   │
│   /dashboard        │    │   │ Like             │   │
│   /admin            │    │   │ Retweet          │   │
│   /clients/:id      │    │   │ Comment          │   │
│                     │    │   │ Reproducir video │   │
└──────────┬──────────┘    │   └──────────────────┘   │
           │               └──────────────────────────┘
           │
           ▼
┌─────────────────────┐
│   Playwright Engine  │
│   ┌───────────────┐  │
│   │ Chromium Pool │  │
│   │ (1-3 browsers)│  │
│   └───────────────┘  │
│   ┌───────────────┐  │
│   │ Sesiones X    │  │
│   │ (storageState)│  │
│   └───────────────┘  │
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│   Mail.tm API        │
│   (emails temporales)│
└─────────────────────┘
```

## Flujo de datos

### 1. Creación de cuenta X

```
Usuario (Frontend)
  │ POST /api/accounts/create
  ▼
API Route
  │ 1. Genera datos aleatorios (faker)
  │ 2. Crea email en Mail.tm
  ├────────────────────────────► Mail.tm API
  │ 3. Lanza Playwright + Chromium
  ├────────────────────────────► X (signup)
  │ 4. Rellena formulario
  │ 5. Espera código (polling Mail.tm)
  ├────────────────────────────► Mail.tm API
  │ 6. Ingresa código
  │ 7. Completa registro
  │ 8. Guarda storageState + DB
  │ 9. Inicia calentamiento
  │ 10. SSE events en tiempo real
  ◄────────────────────────────
  └─ Response: { success, accountId }
```

### 2. Calentamiento de cuenta

```
Playwright (chromium)
  │ Carga sesión guardada
  ├────────────────────────────► X (home)
  │ Click en trending topics
  │ Like a posts aleatorios
  │ Follow a usuarios aleatorios
  │ Scroll por timeline (30-60s)
  │ Guarda nuevo storageState
  │ Actualiza DB: status = READY
  └─ SSE events en cada paso
```

### 3. Campaña (acciones en post)

```
Usuario (Frontend)
  │ POST /api/campaigns
  │ { urls, comments, browsers: 1-3, accountIds[] }
  ▼
API Route
  │ Por cada cuenta:
  │   Lanzar Playwright worker (hasta N paralelo)
  │   Por cada URL en la campaña:
  │     Ciclo 1: Like + Retweet + Comment + Video 10s + Reload
  │     Ciclo 2: Comment + Video 10s + Reload
  │     Ciclo 3: Comment + Video 10s + Reload
  │   SSE events en cada paso
  └─ Response: { success, results[] }
```

## Modelo multi-tenant

```
Admin (Firebase)
  │
  ├── Crea Cliente A ──► Cuentas X de A ──► Campañas de A
  │
  └── Crea Cliente B ──► Cuentas X de B ──► Campañas de B

Reglas:
  - Solo el admin puede crear clientes
  - Admin ve todo
  - Cliente ve solo sus recursos
  - No hay registro público
```

## Anti-detección

| Técnica | Implementación |
|---------|---------------|
| Stealth mode | playwright-extra + puppeteer-extra-plugin-stealth |
| User-Agent real | Rotación de UAs de Chrome real |
| Viewport aleatorio | 1280-1440 x 720-900 |
| Geolocalización | Spoof de zona horaria e idioma |
| Delays humanos | random(1500, 4000) ms entre acciones |
| Movimientos mouse | page.mouse.move() con curvas naturales |
| Persistencia | storageState mantiene sesión real |
| Deshabilitar detección | navigator.webdriver = false |
