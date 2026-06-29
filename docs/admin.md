# x-bot — Panel de Administración

## Visión general

El admin tiene un dashboard exclusivo donde gestiona clientes y puede ver el estado global del sistema. No hay registro público — solo el admin puede crear cuentas de usuario en la app.

## Seed del admin

El admin se crea automáticamente en el primer inicio de sesión con Firebase si no existe ningún `User` con rol `ADMIN` en la DB.

**Lógica en `src/app/api/auth/login/route.ts`:**
```ts
const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
if (!existingAdmin) {
  // El primer usuario que se loguea se convierte en admin
  await prisma.user.create({
    data: {
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || 'Admin',
      role: 'ADMIN'
    }
  });
}
```

## Rutas del admin

| Ruta | Descripción |
|------|-------------|
| `/admin/dashboard` | Resumen global: total clientes, cuentas, campañas |
| `/admin/clients` | Lista de clientes (CRUD) |
| `/admin/clients/new` | Formulario para crear cliente |
| `/admin/clients/:id` | Detalle del cliente + sus cuentas X + campañas |

## Funcionalidades del admin

### Dashboard
- Total de clientes registrados
- Total de cuentas X creadas (por estado: CREATING, WARMING, READY, BANNED)
- Total de campañas ejecutadas
- Gráfica de actividad reciente

### Gestión de clientes
- **Crear cliente:** solo email + nombre. El cliente recibe un link para establecer su contraseña en Firebase (o se le asigna temporalmente).
- **Ver cliente:** detalle con todas sus cuentas de X y campañas.
- **Eliminar cliente:** borra al usuario, sus cuentas, sesiones guardadas y campañas.

### Ver cuentas de X
- Desde el detalle de un cliente, el admin puede ver el estado de cada cuenta.
- Opción de forzar recal entamiento si una cuenta está `READY` pero lleva mucho tiempo sin usarse.
- Opción de marcar cuenta como `BANNED` manualmente.

## Seguridad

- Solo usuarios con `role: ADMIN` pueden acceder a rutas `/admin/*`
- El middleware (`src/middleware.ts`) valida el rol antes de renderizar
- Si un `CLIENT` intenta acceder a `/admin/*`, redirige a `/dashboard` con error 403

## Vista previa del admin panel

```
┌─────────────────────────────────────────────────────┐
│  x-bot Admin                              [Logout]  │
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │  Dashboard                               │
│          │                                          │
│ 📊 Dash  │  Clientes: 12     Cuentas X: 45          │
│ 👥 Clien  │  Campañas: 89    READY: 32  BANNED: 3   │
│          │                                          │
│          │  ┌────────────────────────────────────┐   │
│          │  │ Últimas campañas                   │   │
│          │  │ Cliente A — 3 cuentas — ✅ Éxito  │   │
│          │  │ Cliente B — 1 cuenta  — ✅ Éxito  │   │
│          │  └────────────────────────────────────┘   │
└──────────┴──────────────────────────────────────────┘
```
