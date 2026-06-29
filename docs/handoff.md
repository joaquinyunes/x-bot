# x-bot — Handoff Document

## Resumen ejecutivo

Aplicación web para automatizar interacciones en X (Twitter) usando Playwright. El sistema permite crear cuentas de X automáticamente (con emails temporales de Mail.tm), calentarlas, y ejecutar campañas de likes/comentarios/retweets/reproducciones de video en paralelo usando múltiples navegadores y cuentas.

## Requisitos funcionales

### RF-01: Registro de cuentas X autónomo
- Generar datos aleatorios (nombre, username, fecha nacimiento, contraseña)
- Crear email temporal vía Mail.tm API
- Completar registro en X (incluyendo verificación por email)
- Guardar sesión (storageState) y credenciales en DB

### RF-02: Calentamiento automático de cuentas
- Navegar timeline, dar likes a posts aleatorios
- Seguir cuentas aleatorias
- Scroll por 30-60 segundos
- Estado pasa de `WARMING` → `READY`

### RF-03: Campañas multi-cuenta / multi-navegador
- Seleccionar 1-3 cuentas
- Elegir 1 o más URLs de posts
- Ingresar lista de comentarios
- Seleccionar nº de navegadores en paralelo (slider 1-3 o 1-5)
- Ejecutar ciclo de 3 rondas:
  - Ronda 1: Like + Retweet + Comment + Video 10s + Reload
  - Ronda 2: Comment + Video 10s + Reload
  - Ronda 3: Comment + Video 10s + Reload

### RF-04: Multi-tenant (Admin + Clientes)
- Admin único crea clientes
- Cada cliente ve solo sus recursos
- Sin registro público

### RF-05: Feedback en tiempo real
- SSE (Server-Sent Events) para cada paso del proceso
- Logs visibles en el frontend

## Decisiones técnicas

| Decisión | Opción elegida | Razón |
|----------|---------------|-------|
| Framework | Next.js 14 App Router | Monorepo frontend + backend |
| DB | SQLite + Prisma | Simple, sin servidor, ideal para este alcance |
| Browser automation | Playwright | Más rápido y moderno que Puppeteer |
| Anti-detección | playwright-extra + stealth plugin | Evita detección básica de bots |
| Email temporal | Mail.tm API | Gratis, simple, sin registro |
| Tiempo real | SSE (no Socket.io) | Más simple, sin dependencias extra |
| Autenticación | Firebase Auth | Manejo de sesión + roles |

## Riesgos conocidos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| X bloquea registro por IP | Alto | Usar proxies rotativos si es necesario |
| Mail.tm dominio bloqueado | Alto | Mail.tm tiene múltiples dominios, rotar automáticamente |
| X pide verificación SMS | Alto | La cuenta se descarta si pide SMS |
| Selectores de X cambian | Medio | Usar data-testid, monitorear cambios regularmente |
| Cuenta suspendida durante warmup | Medio | Aumentar delays, reducir velocidad de acciones |
| Playwright en Windows (dev) | Bajo | Chromium funciona bien en Windows, en producción usar Linux |

## Variables de entorno necesarias

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Mail.tm (opcional, tiene rate limits generosos)
MAILTM_API_URL=https://api.mail.tm

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=file:./dev.db
```

## Próximos pasos recomendados

1. Configurar Firebase project y obtener credenciales
2. Ejecutar `npm install` y `npx playwright install chromium`
3. Ejecutar migración de Prisma
4. Probar creación de cuenta manualmente
5. Probar calentamiento
6. Probar campaña con 1 cuenta
7. Probar campaña con 3 cuentas en paralelo

## Contacto / Mantenimiento

- Desarrollador: [Por definir]
- Repositorio: [Por definir]
- Documentación completa en `/docs/`
