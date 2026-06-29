# x-bot — Base de datos

## ORM: Prisma + SQLite

## Schema completo

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ─── Usuarios de la aplicación ───

enum UserRole {
  ADMIN
  CLIENT
}

model User {
  id            String   @id @default(cuid())
  firebaseUid   String   @unique
  email         String   @unique
  name          String
  role          UserRole @default(CLIENT)
  createdAt     DateTime @default(now())

  accounts      Account[]
  campaigns     Campaign[]
}

// ─── Cuentas de X ───

enum AccountStatus {
  CREATING
  WARMING
  READY
  BANNED
  EXPIRED
}

model Account {
  id            String        @id @default(cuid())
  userId        String
  email         String        @unique        // Correo Mail.tm
  passwordMail  String                       // Contraseña Mail.tm
  username      String        @unique        // Username en X
  passwordX     String                       // Contraseña en X
  storagePath   String                       // Ruta al archivo storageState
  cookiesExpire DateTime?
  status        AccountStatus @default(CREATING)
  createdAt     DateTime      @default(now())
  lastUsedAt    DateTime?
  tweetCount    Int           @default(0)

  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  campaignLogs  CampaignLog[]
}

// ─── Campañas ───

model Campaign {
  id            String   @id @default(cuid())
  userId        String
  urls          String              // JSON array de URLs
  comments      String              // JSON array de comentarios
  browsersCount Int                 // Navegadores en paralelo (1-3)
  status        CampaignStatus @default(PENDING)
  createdAt     DateTime     @default(now())
  finishedAt    DateTime?

  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  campaignLogs  CampaignLog[]
}

enum CampaignStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
}

// ─── Registro de ejecución ───

model CampaignLog {
  id              String   @id @default(cuid())
  campaignId      String
  accountId       String
  url             String
  round           Int                 // 1, 2, 3
  action          String              // "like" | "retweet" | "comment" | "video" | "reload"
  success         Boolean
  errorMessage    String?
  durationMs      Int?
  createdAt       DateTime @default(now())

  campaign        Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  account         Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
}
```

## Relaciones

```
User (1) ──< (N) Account
User (1) ──< (N) Campaign
Campaign (1) ──< (N) CampaignLog
Account (1) ──< (N) CampaignLog
```

## Notas

- `Account.storagePath` apunta a `sessions/{id}.json` (archivo exportado por Playwright)
- `Campaign.urls` guarda un JSON array: `["https://x.com/user/status/1", "https://x.com/user/status/2"]`
- `Campaign.comments` guarda un JSON array: `["Buen video!", "Excelente!", "Compartido!"]`
- Los archivos de sesión (`sessions/*.json`) se ignoran en git
- SQLite no tiene enum nativo, Prisma los maneja como strings con validación
