# x-bot — API Reference

Todas las rutas están bajo `/api/`. Las rutas protegidas requieren token de Firebase en el header `Authorization: Bearer <token>`.

---

## Autenticación

### `POST /api/auth/login`

Inicia sesión con Firebase. Verifica si el usuario existe en la DB y su rol.

**Request:**
```json
{
  "idToken": "firebase-id-token"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "abc123",
    "email": "cliente@mail.com",
    "name": "Cliente",
    "role": "CLIENT"
  }
}
```

**Response (401):** Usuario no autorizado (no creado por admin)

---

## Cuentas de X

### `POST /api/accounts/create`

Crea una nueva cuenta de X automáticamente (Mail.tm + Playwright + registro).

**Request:**
```json
{}
```

**Response (200):**
```json
{
  "success": true,
  "accountId": "acc_abc123",
  "email": "user123@mailto.plus",
  "username": "UserRandom123"
}
```

**Eventos SSE** (vía `/api/stream?accountId=acc_abc123`):
```
event: step
data: {"step":"generating_email","message":"Generando email temporal..."}

event: step
data: {"step":"filling_form","message":"Rellenando formulario de registro..."}

event: step
data: {"step":"waiting_code","message":"Esperando código de verificación..."}

event: step
data: {"step":"registering","message":"Completando registro..."}

event: step
data: {"step":"warming","message":"Calentando cuenta (like #1)..."}

event: complete
data: {"accountId":"acc_abc123","status":"READY"}
```

### `GET /api/accounts`

Lista las cuentas del cliente autenticado (o todas si es admin).

**Query params:** `?status=READY&page=1&limit=20`

**Response (200):**
```json
{
  "accounts": [
    {
      "id": "acc_abc123",
      "email": "user@mailto.plus",
      "username": "User123",
      "status": "READY",
      "tweetCount": 5,
      "createdAt": "2026-06-29T..."
    }
  ],
  "total": 10,
  "page": 1
}
```

### `GET /api/accounts/:id`

Detalle de una cuenta.

### `DELETE /api/accounts/:id`

Elimina cuenta (libera sesión y borra storageState).

### `POST /api/accounts/:id/actions`

Ejecuta una acción en una cuenta específica.

**Request:**
```json
{
  "url": "https://x.com/user/status/123456",
  "action": "like",
  "commentText": "Texto opcional (solo para action=comment)"
}
```

**Actions disponibles:** `like`, `retweet`, `comment`, `playVideo`, `reload`

**Response (200):**
```json
{
  "success": true,
  "durationMs": 3421,
  "screenshot": "base64..."
}
```

---

## Campañas

### `POST /api/campaigns`

Crea y ejecuta una campaña multi-cuenta.

**Request:**
```json
{
  "accountIds": ["acc_1", "acc_2", "acc_3"],
  "urls": ["https://x.com/user/status/123"],
  "comments": ["Buen video!", "Excelente!", "Compartido!"],
  "browsersCount": 3
}
```

**Response (200):**
```json
{
  "success": true,
  "campaignId": "camp_abc123"
}
```

**Eventos SSE** (vía `/api/stream?campaignId=camp_abc123`):
```
event: account_start
data: {"accountId":"acc_1","username":"User1","round":1}

event: action
data: {"accountId":"acc_1","action":"like","success":true}

event: action
data: {"accountId":"acc_1","action":"retweet","success":true}

event: action
data: {"accountId":"acc_1","action":"comment","success":true,"comment":"Buen video!"}

event: action
data: {"accountId":"acc_1","action":"video","seconds":10}

event: action
data: {"accountId":"acc_1","action":"reload","success":true}

event: round_complete
data: {"accountId":"acc_1","round":1}

event: campaign_complete
data: {"campaignId":"camp_abc123","results":{...}}
```

### `GET /api/campaigns`

Lista campañas del cliente.

### `GET /api/campaigns/:id`

Detalle de campaña con todos los logs.

---

## Admin

### `POST /api/admin/clients`

Crea un nuevo cliente (solo admin).

**Request:**
```json
{
  "email": "nuevo@cliente.com",
  "name": "Nombre Cliente"
}
```

**Response (200):**
```json
{
  "success": true,
  "clientId": "user_abc",
  "email": "nuevo@cliente.com"
}
```

### `GET /api/admin/clients`

Lista todos los clientes con sus métricas.

**Response (200):**
```json
{
  "clients": [
    {
      "id": "user_abc",
      "email": "cliente@mail.com",
      "name": "Cliente",
      "accountsCount": 5,
      "campaignsCount": 12,
      "createdAt": "2026-06-29T..."
    }
  ]
}
```

### `DELETE /api/admin/clients/:id`

Elimina un cliente y todos sus recursos.

---

## SSE Stream

### `GET /api/stream`

Conexión Server-Sent Events para recibir actualizaciones en tiempo real.

**Query params:** `?accountId=acc_123` o `?campaignId=camp_123`

**Cliente (frontend):**
```ts
const evtSource = new EventSource(`/api/stream?campaignId=${campaignId}`);

evtSource.addEventListener('action', (e) => {
  const data = JSON.parse(e.data);
  console.log(data.action, data.success);
});

evtSource.addEventListener('complete', (e) => {
  const data = JSON.parse(e.data);
  evtSource.close();
});
```
