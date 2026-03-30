# 📰 Arsitektur Fitur Berita — Portal Karang Taruna

> Referensi desain: BBC, CNN, Al Jazeera, Kompas
> Dibuat oleh: Senior Software Architect & Fullstack Developer
> Versi: 1.0.0

---

## Daftar Isi

1. [Gambaran Umum Arsitektur](#gambaran-umum-arsitektur)
2. [TASK 1 — Arsitektur Schema Prisma Modular](#task-1--arsitektur-schema-prisma-modular)
3. [TASK 2 — Alur Sistem & Infrastruktur](#task-2--alur-sistem--infrastruktur)
4. [TASK 3 — Seeder Master Data](#task-3--seeder-master-data)
5. [TASK 4 — Checklist API & Frontend](#task-4--checklist-api--frontend)

---

## Gambaran Umum Arsitektur

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
│   Next.js / React App  │  Mobile Web  │  Bot / Crawler (SSR/SSG)    │
└────────────────┬────────────────────────────────────────────────────┘
                 │ HTTPS
┌────────────────▼────────────────────────────────────────────────────┐
│                       API GATEWAY / BFF                              │
│        (Next.js API Routes / NestJS / Express)                       │
│   Auth Middleware  │  Rate Limiter  │  View-Certificate Validator    │
└──────┬───────────────────┬──────────────────┬───────────────────────┘
       │                   │                  │
┌──────▼──────┐   ┌────────▼──────┐  ┌───────▼───────┐
│  PostgreSQL  │   │     Redis     │  │ Elasticsearch  │
│  (Prisma)   │   │  (Cache/Lock) │  │  (Full-text)  │
└──────┬──────┘   └───────────────┘  └───────────────┘
       │
┌──────▼──────┐   ┌───────────────┐  ┌───────────────┐
│    Kafka    │◄──│  Producers    │  │    S3 / R2    │
│  (Broker)  │──►│  Consumers    │  │  (Media CDN)  │
└─────────────┘   └───────────────┘  └───────────────┘
```

### Stack Teknologi

| Layer              | Teknologi                  |
| ------------------ | -------------------------- |
| Backend Framework  | NestJS (TypeScript)        |
| ORM                | Prisma (modular schema)    |
| Database Utama     | PostgreSQL 15+             |
| Cache              | Redis 7+                   |
| Search Engine      | Elasticsearch 8+           |
| Message Broker     | Apache Kafka               |
| Object Storage     | AWS S3 / Cloudflare R2     |
| Text Editor Engine | Tiptap (ProseMirror-based) |
| Frontend Framework | Next.js 14+ (App Router)   |
| CDN                | Cloudflare / CloudFront    |

---

## TASK 1 — Arsitektur Schema Prisma Modular

### Struktur File Schema

```
prisma/
├── schema.prisma              ← root (hanya datasource & generator)
├── schema/
│   ├── user.prisma            ← m_user (existing)
│   ├── news_master.prisma     ← m_kategori_berita, m_tag
│   ├── news_content.prisma    ← c_berita, c_berita_image, c_berita_cover
│   ├── news_comment.prisma    ← c_komentar_berita
│   └── news_relation.prisma   ← r_berita_tag, r_user_interaksi_berita
```

> **Catatan:** Prisma mendukung multi-file schema (fitur `prismaSchemaFolder` di Prisma 5.15+).
> Aktifkan di `schema.prisma`:
> ```prisma
> generator client {
>   provider        = "prisma-client-js"
>   previewFeatures = ["prismaSchemaFolder"]
> }
> ```

---

### `schema.prisma` (Root)

```prisma
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["prismaSchemaFolder"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

### `schema/news_master.prisma`

```prisma
// Tabel Master: Kategori Berita
model m_kategori_berita {
  id          Int      @id @default(autoincrement())
  nama        String   @unique @db.VarChar(100)
  slug        String   @unique @db.VarChar(120)
  deskripsi   String?  @db.Text
  warna_hex   String?  @db.VarChar(7)   // Untuk badge warna, contoh: #FF5733
  icon_url    String?  @db.VarChar(500) // S3 URL
  is_aktif    Boolean  @default(true)
  urutan      Int      @default(0)      // Untuk ordering di nav

  dibuat_pada     DateTime  @default(now())
  diperbarui_pada DateTime  @updatedAt
  dihapus_pada    DateTime?             // Soft delete

  // Relations
  c_berita    c_berita[]

  @@index([slug])
  @@index([is_aktif, urutan])
  @@map("m_kategori_berita")
}

// Tabel Master: Tag
model m_tag {
  id          Int      @id @default(autoincrement())
  nama        String   @unique @db.VarChar(80)
  slug        String   @unique @db.VarChar(100)
  deskripsi   String?  @db.Text
  total_berita Int     @default(0)      // Denormalized counter

  dibuat_pada     DateTime  @default(now())
  diperbarui_pada DateTime  @updatedAt
  dihapus_pada    DateTime?

  // Relations
  r_berita_tag r_berita_tag[]

  @@index([slug])
  @@index([total_berita(sort: Desc)])
  @@map("m_tag")
}
```

---

### `schema/news_content.prisma`

```prisma
// Enum Status Publikasi
enum StatusBerita {
  DRAFT
  REVIEW
  SCHEDULED
  PUBLISHED
  ARCHIVED
  REJECTED
}

// Enum Tipe Cover
enum TipeCover {
  LANDSCAPE_16_9   // 1920x1080 — Hero/Banner utama
  LANDSCAPE_4_3    // 800x600  — List card
  SQUARE_1_1       // 400x400  — Thumbnail sosmed
  PORTRAIT_9_16    // 1080x1920 — Story/Reels
}

// Tabel Child: Berita (Konten Utama)
model c_berita {
  id                    Int           @id @default(autoincrement())
  judul                 String        @db.VarChar(300)
  sub_judul             String?       @db.VarChar(500)
  penulis               String        @db.VarChar(150)
  editor                String?       @db.VarChar(150)

  // Konten (disimpan sebagai JSON — kompatibel Tiptap/Editor.js)
  // Format: { "type": "doc", "content": [...nodes] }
  konten_json           Json

  // Konten HTML hasil render (untuk SSR/SEO/search indexing)
  konten_html           String        @db.Text

  // Plain text (untuk snippet, Elasticsearch indexing)
  konten_plaintext      String        @db.Text

  status                StatusBerita  @default(DRAFT)
  is_featured           Boolean       @default(false)
  is_breaking_news      Boolean       @default(false)
  scheduled_at          DateTime?
  published_at          DateTime?
  
  // --- Kolom SEO ---
  seo_title             String?       @db.VarChar(70)   // Max 70 char (Google standard)
  seo_description       String?       @db.VarChar(160)  // Max 160 char
  seo_slug              String        @unique @db.VarChar(300)
  seo_canonical_url     String?       @db.VarChar(500)
  seo_og_title          String?       @db.VarChar(200)
  seo_og_description    String?       @db.VarChar(300)
  seo_og_image_url      String?       @db.VarChar(500)  // S3 URL
  seo_twitter_card      String?       @db.VarChar(20)   // "summary_large_image"
  seo_keywords          String[]                         // Array of keywords
  seo_robots            String?       @db.VarChar(100)  // "index,follow" / "noindex"
  seo_schema_json       Json?                            // JSON-LD structured data

  // --- Counter Agregasi (Denormalized untuk performa) ---
  total_views           BigInt        @default(0)
  total_likes           Int           @default(0)
  total_dislikes        Int           @default(0)
  total_komentar        Int           @default(0)
  total_share           Int           @default(0)

  // --- Skor Trending (dihitung oleh worker) ---
  // Formula: (total_views * 0.3) + (total_likes * 0.5) + (share * 0.2) * decay_factor
  trending_score        Float         @default(0)
  trending_updated_at   DateTime?

  // --- Foreign Keys ---
  m_kategori_berita_id  Int
  m_user_id             Int?          // ID penulis (dari tabel m_user existing)

  dibuat_pada     DateTime  @default(now())
  diperbarui_pada DateTime  @updatedAt
  dihapus_pada    DateTime?

  // --- Relations ---
  m_kategori_berita     m_kategori_berita      @relation(fields: [m_kategori_berita_id], references: [id])
  c_berita_image        c_berita_image[]
  c_berita_cover        c_berita_cover[]
  c_komentar_berita     c_komentar_berita[]
  r_berita_tag          r_berita_tag[]
  r_user_interaksi_berita r_user_interaksi_berita[]

  // --- Index ---
  @@index([status, published_at(sort: Desc)])
  @@index([m_kategori_berita_id, status, published_at(sort: Desc)])
  @@index([trending_score(sort: Desc)])
  @@index([total_views(sort: Desc)])
  @@index([seo_slug])
  @@index([is_featured, status])
  @@index([is_breaking_news, status])
  @@index([dihapus_pada])
  @@map("c_berita")
}

// Tabel Child: Gambar di dalam konten berita (inline images)
model c_berita_image {
  id              Int      @id @default(autoincrement())
  c_berita_id     Int
  s3_key          String   @db.VarChar(500)  // Key di S3
  s3_url          String   @db.VarChar(500)  // Public URL / CDN URL
  alt_text        String?  @db.VarChar(300)
  caption         String?  @db.Text
  mime_type       String   @db.VarChar(50)   // image/jpeg, image/webp, dll
  width           Int?
  height          Int?
  ukuran_byte     BigInt?
  urutan          Int      @default(0)

  dibuat_pada     DateTime @default(now())

  // Relations
  c_berita        c_berita @relation(fields: [c_berita_id], references: [id], onDelete: Cascade)

  @@index([c_berita_id])
  @@map("c_berita_image")
}

// Tabel Child: Cover / Thumbnail berita (berbagai rasio)
model c_berita_cover {
  id              Int        @id @default(autoincrement())
  c_berita_id     Int
  tipe            TipeCover
  s3_key          String     @db.VarChar(500)
  s3_url          String     @db.VarChar(500)
  alt_text        String?    @db.VarChar(300)
  mime_type       String     @db.VarChar(50)
  width           Int
  height          Int
  ukuran_byte     BigInt?
  is_primary      Boolean    @default(false)   // Cover utama untuk SEO og:image

  dibuat_pada     DateTime   @default(now())

  // Relations
  c_berita        c_berita   @relation(fields: [c_berita_id], references: [id], onDelete: Cascade)

  @@unique([c_berita_id, tipe])             // 1 berita = max 1 cover per tipe rasio
  @@index([c_berita_id])
  @@map("c_berita_cover")
}
```

---

### `schema/news_comment.prisma`

```prisma
// Enum Status Moderasi Komentar
enum StatusKomentar {
  PENDING     // Menunggu moderasi
  APPROVED    // Disetujui, tampil publik
  REJECTED    // Ditolak moderator
  SPAM        // Ditandai spam
  DELETED     // Dihapus pemilik
}

// Tabel Child: Komentar Berita
model c_komentar_berita {
  id                Int             @id @default(autoincrement())
  c_berita_id       Int
  parent_id         Int?            // Untuk nested reply (1 level)

  // Jika user login
  m_user_id         Int?

  // Jika guest (tidak login) — diisi manual
  guest_nama        String?         @db.VarChar(100)
  guest_email       String?         @db.VarChar(200)

  // Identitas teknis anti-spam
  guest_fingerprint String?         @db.VarChar(200) // Device fingerprint hash
  ip_address        String?         @db.VarChar(45)  // IPv4/IPv6
  user_agent        String?         @db.Text

  isi               String          @db.Text
  status            StatusKomentar  @default(PENDING)
  alasan_penolakan  String?         @db.Text

  total_likes       Int             @default(0)

  dibuat_pada     DateTime  @default(now())
  diperbarui_pada DateTime  @updatedAt
  dihapus_pada    DateTime?

  // Relations
  c_berita          c_berita        @relation(fields: [c_berita_id], references: [id], onDelete: Cascade)
  parent            c_komentar_berita?   @relation("KomentarReplies", fields: [parent_id], references: [id])
  replies           c_komentar_berita[]  @relation("KomentarReplies")

  @@index([c_berita_id, status, dibuat_pada(sort: Desc)])
  @@index([m_user_id])
  @@index([parent_id])
  @@index([status])
  @@map("c_komentar_berita")
}
```

---

### `schema/news_relation.prisma`

```prisma
// Enum Tipe Interaksi
enum TipeInteraksi {
  LIKE
  DISLIKE
}

// Tabel Pivot: Berita ↔ Tag (Many-to-Many)
model r_berita_tag {
  id          Int      @id @default(autoincrement())
  c_berita_id Int
  m_tag_id    Int

  dibuat_pada DateTime @default(now())

  // Relations
  c_berita    c_berita @relation(fields: [c_berita_id], references: [id], onDelete: Cascade)
  m_tag       m_tag    @relation(fields: [m_tag_id], references: [id], onDelete: Cascade)

  @@unique([c_berita_id, m_tag_id])
  @@index([c_berita_id])
  @@index([m_tag_id])
  @@map("r_berita_tag")
}

// Tabel Relasi: Log Interaksi User terhadap Berita (Like/Dislike)
model r_user_interaksi_berita {
  id                Int            @id @default(autoincrement())
  c_berita_id       Int

  // Salah satu harus terisi (user login ATAU guest)
  m_user_id         Int?           // Jika user login
  guest_identifier  String?        @db.VarChar(200) // Hash dari fingerprint+IP untuk guest

  tipe              TipeInteraksi

  dibuat_pada     DateTime  @default(now())
  diperbarui_pada DateTime  @updatedAt

  // Relations
  c_berita          c_berita       @relation(fields: [c_berita_id], references: [id], onDelete: Cascade)

  // Constraint: 1 user/guest hanya boleh 1 interaksi per berita
  @@unique([c_berita_id, m_user_id])
  @@unique([c_berita_id, guest_identifier])
  @@index([c_berita_id])
  @@index([m_user_id])
  @@map("r_user_interaksi_berita")
}
```
---

## TASK 2 — Alur Sistem & Infrastruktur

### 2.1 Sinkronisasi Data: PostgreSQL → Kafka → Elasticsearch

Alur ini dijalankan setiap kali status berita berubah menjadi `PUBLISHED` atau kontennya diupdate.

```
┌──────────────┐    publish/update    ┌──────────────────┐
│  Admin CMS   │ ──────────────────►  │  API Server       │
└──────────────┘                      │  (NestJS)         │
                                      └────────┬─────────┘
                                               │ 1. Simpan ke PostgreSQL
                                               ▼
                                      ┌──────────────────┐
                                      │   PostgreSQL      │
                                      │   (c_berita)      │
                                      └────────┬─────────┘
                                               │ 2. Produce event
                                               ▼
                                      ┌──────────────────┐
                                      │      Kafka        │
                                      │  Topic:           │
                                      │  news.published   │
                                      └────────┬─────────┘
                                               │ 3. Consume event
                                               ▼
                                      ┌──────────────────┐
                                      │  ES Indexer       │
                                      │  Worker/Consumer  │
                                      └────────┬─────────┘
                                               │ 4. Index dokumen
                                               ▼
                                      ┌──────────────────┐
                                      │  Elasticsearch    │
                                      │  Index: news      │
                                      └──────────────────┘
```

**Langkah detail:**

**Step 1 — Admin mempublish berita:**

```typescript
// news.service.ts
async publishBerita(id: string): Promise<void> {
  const berita = await this.prisma.c_berita.update({
    where: { id },
    data: {
      status: 'PUBLISHED',
      published_at: new Date(),
    },
    include: {
      m_kategori_berita: true,
      r_berita_tag: { include: { m_tag: true } },
      c_berita_cover: { where: { is_primary: true } },
    },
  });

  // Step 2: Produce event ke Kafka
  await this.kafkaProducer.send({
    topic: 'news.published',
    messages: [{
      key: berita.id,
      value: JSON.stringify({
        event: 'NEWS_PUBLISHED',
        timestamp: new Date().toISOString(),
        payload: {
          id: berita.id,
          judul: berita.judul,
          konten_plaintext: berita.konten_plaintext,
          seo_slug: berita.seo_slug,
          seo_description: berita.seo_description,
          seo_keywords: berita.seo_keywords,
          kategori: berita.m_kategori_berita.nama,
          kategori_slug: berita.m_kategori_berita.slug,
          tags: berita.r_berita_tag.map(rt => rt.m_tag.nama),
          published_at: berita.published_at,
          total_views: berita.total_views,
          total_likes: berita.total_likes,
          trending_score: berita.trending_score,
          cover_url: berita.c_berita_cover[0]?.s3_url ?? null,
        }
      }),
    }],
  });
}
```

**Step 3 — Elasticsearch Indexer Consumer:**

```typescript
// es-indexer.consumer.ts
@EventPattern('news.published')
async handleNewsPublished(payload: NewsPublishedEvent): Promise<void> {
  await this.elasticsearchService.index({
    index: 'news',
    id: payload.id,
    document: {
      id: payload.id,
      judul: payload.judul,
      konten: payload.konten_plaintext,
      seo_description: payload.seo_description,
      keywords: payload.seo_keywords,
      kategori: payload.kategori,
      kategori_slug: payload.kategori_slug,
      tags: payload.tags,
      published_at: payload.published_at,
      total_views: payload.total_views,
      total_likes: payload.total_likes,
      trending_score: payload.trending_score,
      cover_url: payload.cover_url,
    },
  });

  // Invalidate Redis cache yang relevan
  await this.redis.del(`news:latest`);
  await this.redis.del(`news:kategori:${payload.kategori_slug}`);
}
```

**Elasticsearch Index Mapping:**

```json
{
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "judul": { "type": "text", "analyzer": "indonesian" },
      "konten": { "type": "text", "analyzer": "indonesian" },
      "seo_description": { "type": "text" },
      "keywords": { "type": "keyword" },
      "kategori": { "type": "keyword" },
      "kategori_slug": { "type": "keyword" },
      "tags": { "type": "keyword" },
      "published_at": { "type": "date" },
      "total_views": { "type": "long" },
      "total_likes": { "type": "integer" },
      "trending_score": { "type": "float" },
      "cover_url": { "type": "keyword", "index": false }
    }
  }
}
```

---

### 2.2 View Counting Flow — Anti-Spam dengan "Sertifikat Khusus"

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MEKANISME SERTIFIKAT VIEW                                                   │
│                                                                               │
│  "View Certificate" = Signed JWT (tanpa auth) berisi:                        │
│  - device_fingerprint (hash dari: userAgent + screen + canvas + audio)       │
│  - issued_at (timestamp)                                                      │
│  - jti (unique ID per sertifikat, disimpan di Redis untuk revoke)            │
│  - Ditandatangani dengan HMAC-SHA256 secret (bukan RSA, lebih cepat)         │
│  - Disimpan sebagai HttpOnly Signed Cookie (TTL: 30 hari)                    │
└─────────────────────────────────────────────────────────────────────────────┘

ALUR LENGKAP:

Browser (Client)                API Server              Redis         Kafka        PostgreSQL + ES
     │                              │                     │              │                │
     │ 1. Kunjungi halaman berita   │                     │              │                │
     │ ─────────────────────────►  │                     │              │                │
     │                              │                     │              │                │
     │ 2. Cek: Ada "view_cert" cookie?                    │              │                │
     │    TIDAK → Minta sertifikat baru                   │              │                │
     │ ─────────────────────────►  │                     │              │                │
     │                              │ Buat View Certificate│              │                │
     │                              │ (device fingerprint  │              │                │
     │                              │ + HMAC JWT)          │              │                │
     │ ◄─────────────────────────  │                     │              │                │
     │   Set-Cookie: view_cert=JWT  │                     │              │                │
     │   (HttpOnly, Secure, 30d)    │                     │              │                │
     │                              │                     │              │                │
     │ 3. Kirim View Request        │                     │              │                │
     │    POST /api/news/:id/view   │                     │              │                │
     │    Headers: Cookie: view_cert│                     │              │                │
     │ ─────────────────────────►  │                     │              │                │
     │                              │                     │              │                │
     │                              │ 4. Validasi JWT      │              │                │
     │                              │    - Verify HMAC sig │              │                │
     │                              │    - Cek jti belum   │              │                │
     │                              │      di-revoke       │              │                │
     │                              │                     │              │                │
     │                              │ 5. Cek Redis debounce│              │                │
     │                              │ ─────────────────►  │              │                │
     │                              │                     │ Cek key:     │                │
     │                              │                     │ view:{cert_id}│              │
     │                              │                     │ :{berita_id} │              │
     │                              │ ◄─────────────────  │              │                │
     │                              │                     │              │                │
     │                         [Key ADA? → Sudah dihitung, skip]         │                │
     │                              │                     │              │                │
     │                         [Key TIDAK ADA?]           │              │                │
     │                              │ 6. SET Redis key     │              │                │
     │                              │    TTL: 4 jam        │              │                │
     │                              │ ─────────────────►  │              │                │
     │                              │                     │              │                │
     │                              │ 7. Produce ke Kafka  │              │                │
     │                              │ ─────────────────────────────────►  │                │
     │                              │                     │  Topic:      │                │
     │                              │                     │  news.viewed │                │
     │ ◄─────────────────────────  │                     │              │                │
     │   Response: 200 OK           │                     │              │                │
     │   { counted: true }          │                     │              │                │
     │                              │                     │              │                │
     │                              │           8. Consumer menerima event              │
     │                              │           ─────────────────────────────────────►  │
     │                              │                     │              │  UPDATE counter │
     │                              │                     │              │  (batch INCR)   │
```

**Implementasi View Certificate (Server-side):**

```typescript
// view-cert.service.ts
import * as jose from "jose";

export class ViewCertService {
  private readonly secret: Uint8Array;
  private readonly TTL_HOURS = 4; // Debounce window per berita

  constructor(private readonly redis: Redis) {
    this.secret = new TextEncoder().encode(process.env.VIEW_CERT_SECRET);
  }

  // Buat sertifikat baru (dipanggil saat tidak ada cookie)
  async createCertificate(deviceFingerprint: string): Promise<string> {
    const jti = crypto.randomUUID();
    const jwt = await new jose.SignJWT({
      fingerprint: deviceFingerprint,
      jti,
      type: "view_cert",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(this.secret);
    return jwt;
  }

  // Cek apakah view sudah dihitung (debounce)
  async checkAndMarkView(certJwt: string, beritaId: string): Promise<boolean> {
    // Verifikasi JWT
    let payload: jose.JWTPayload;
    try {
      const { payload: p } = await jose.jwtVerify(certJwt, this.secret);
      payload = p;
    } catch {
      return false; // JWT invalid/expired → jangan hitung
    }

    const jti = payload["jti"] as string;
    const redisKey = `view:${jti}:${beritaId}`;

    // SET NX = hanya set jika belum ada (atomic)
    const isNew = await this.redis.set(redisKey, "1", {
      EX: this.TTL_HOURS * 3600,
      NX: true, // Only set if Not eXists
    });

    return isNew === "OK"; // true = view baru, false = sudah dihitung
  }
}
```

**View Controller:**

```typescript
// news-view.controller.ts
@Post(':id/view')
async recordView(
  @Param('id') beritaId: string,
  @Req() req: Request,
  @Res({ passthrough: true }) res: Response,
): Promise<{ counted: boolean }> {
  let certJwt = req.cookies['view_cert'];

  // Jika belum ada sertifikat → buat baru
  if (!certJwt) {
    const fingerprint = req.headers['x-device-fingerprint'] as string ?? 'unknown';
    certJwt = await this.viewCertService.createCertificate(fingerprint);
    res.cookie('view_cert', certJwt, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 hari
      signed: true, // Express signed cookie
    });
  }

  const isCounted = await this.viewCertService.checkAndMarkView(certJwt, beritaId);

  if (isCounted) {
    // Produce ke Kafka — jangan langsung ke DB (eventual consistency)
    await this.kafkaProducer.send({
      topic: 'news.viewed',
      messages: [{
        key: beritaId,
        value: JSON.stringify({ berita_id: beritaId, timestamp: Date.now() }),
      }],
    });
  }

  return { counted: isCounted };
}
```

**Kafka Consumer — Batch View Updater:**

```typescript
// view-counter.consumer.ts
// Menggunakan consumer group dengan batching agar tidak overload DB

@Injectable()
export class ViewCounterConsumer {
  private viewBuffer = new Map<string, number>();
  private flushInterval: NodeJS.Timer;

  onModuleInit() {
    // Flush ke DB setiap 10 detik (batching)
    this.flushInterval = setInterval(() => this.flushToDatabase(), 10_000);
  }

  @EventPattern("news.viewed")
  handleNewsViewed(data: { berita_id: string }) {
    const current = this.viewBuffer.get(data.berita_id) ?? 0;
    this.viewBuffer.set(data.berita_id, current + 1);
  }

  private async flushToDatabase() {
    if (this.viewBuffer.size === 0) return;

    const updates = Array.from(this.viewBuffer.entries());
    this.viewBuffer.clear();

    // Batch UPDATE ke PostgreSQL
    for (const [beritaId, count] of updates) {
      await this.prisma.$executeRaw`
        UPDATE c_berita
        SET total_views = total_views + ${count},
            updated_at = NOW()
        WHERE id = ${beritaId}
      `;
    }

    // Update Elasticsearch (bulk API)
    const body = updates.flatMap(([id, count]) => [
      { update: { _index: "news", _id: id } },
      { script: { source: `ctx._source.total_views += ${count}` } },
    ]);
    await this.elasticsearchService.bulk({ body });
  }
}
```

---

### 2.3 Query Agregasi: Trending, Top, Terbaru

```
Query Masuk
    │
    ▼
Cek Redis Cache
    │
    ├── Cache HIT ──────────────────────────────► Return Response (< 5ms)
    │
    └── Cache MISS
          │
          ▼
    Query ke Elasticsearch
          │
          ├── Trending: sort by trending_score DESC + filter 7 hari terakhir
          ├── Top: sort by total_views DESC + filter 30 hari terakhir
          └── Terbaru: sort by published_at DESC
          │
          ▼
    Simpan ke Redis (TTL sesuai tipe)
          │
          ▼
    Return Response
```

**Definisi Algoritma Trending Score:**

```
trending_score = (V * w_v) + (L * w_l) + (S * w_s)
                 ─────────────────────────────────── × decay
                         age_in_hours + 2

Keterangan:
  V  = total_views (dalam 24 jam terakhir, dari Redis sorted set)
  L  = total_likes (dalam 24 jam terakhir)
  S  = total_share (dalam 24 jam terakhir)
  w_v = 0.3  (bobot views)
  w_l = 0.5  (bobot likes — lebih bermakna dari views)
  w_s = 0.2  (bobot share)
  decay = e^(-λ * age_in_hours), λ = 0.05 (half-life ~14 jam)
  +2 = konstanta agar konten baru tidak langsung 0
```

**Worker Kalkulasi Trending (Dijadwalkan setiap 15 menit):**

```typescript
// trending-score.worker.ts
@Cron('*/15 * * * *')
async recalculateTrendingScores() {
  const recentBerita = await this.prisma.c_berita.findMany({
    where: {
      status: 'PUBLISHED',
      published_at: { gte: subDays(new Date(), 7) },
    },
    select: {
      id: true,
      published_at: true,
      total_views: true,
      total_likes: true,
      total_share: true,
    },
  });

  for (const berita of recentBerita) {
    const ageHours = differenceInHours(new Date(), berita.published_at!);
    const decay = Math.exp(-0.05 * ageHours);

    const score =
      ((Number(berita.total_views) * 0.3) +
       (berita.total_likes * 0.5) +
       (berita.total_share * 0.2)) /
      (ageHours + 2) * decay;

    await this.prisma.c_berita.update({
      where: { id: berita.id },
      data: { trending_score: score, trending_updated_at: new Date() },
    });
  }

  // Invalidate cache trending
  await this.redis.del('news:trending');
}
```

**Query Service dengan Caching:**

```typescript
// news-query.service.ts
async getBeritaTrending(limit = 10): Promise<BeritaCard[]> {
  const cacheKey = `news:trending`;
  const cached = await this.redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const result = await this.elasticsearchService.search({
    index: 'news',
    body: {
      query: {
        bool: {
          filter: [
            { range: { published_at: { gte: 'now-7d/d' } } },
          ],
        },
      },
      sort: [{ trending_score: { order: 'desc' } }],
      size: limit,
      _source: ['id', 'judul', 'cover_url', 'kategori', 'published_at', 'total_views'],
    },
  });

  const data = result.hits.hits.map(h => h._source);
  await this.redis.set(cacheKey, JSON.stringify(data), { EX: 900 }); // TTL 15 menit
  return data as BeritaCard[];
}

async getBeritaTop(limit = 10): Promise<BeritaCard[]> {
  const cacheKey = `news:top`;
  const cached = await this.redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const result = await this.elasticsearchService.search({
    index: 'news',
    body: {
      query: { range: { published_at: { gte: 'now-30d/d' } } },
      sort: [{ total_views: { order: 'desc' } }],
      size: limit,
    },
  });

  const data = result.hits.hits.map(h => h._source);
  await this.redis.set(cacheKey, JSON.stringify(data), { EX: 3600 }); // TTL 1 jam
  return data as BeritaCard[];
}

async getBeritaTerbaru(page = 1, limit = 20): Promise<BeritaCard[]> {
  const cacheKey = `news:latest:page:${page}`;
  const cached = await this.redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const result = await this.elasticsearchService.search({
    index: 'news',
    body: {
      sort: [{ published_at: { order: 'desc' } }],
      from: (page - 1) * limit,
      size: limit,
    },
  });

  const data = result.hits.hits.map(h => h._source);
  await this.redis.set(cacheKey, JSON.stringify(data), { EX: 120 }); // TTL 2 menit (sering berubah)
  return data as BeritaCard[];
}
```

**Redis TTL Strategy per Tipe Query:**

| Query                    | Redis TTL | Alasan                          |
| ------------------------ | --------- | ------------------------------- |
| Berita Terbaru (hal. 1)  | 2 menit   | Konten sering berubah           |
| Berita Terbaru (hal. 2+) | 5 menit   | Jarang berubah                  |
| Berita Trending          | 15 menit  | Diupdate worker 15 menit sekali |
| Berita Top (bulan ini)   | 1 jam     | Berubah perlahan                |
| Detail berita (by slug)  | 10 menit  | Stale setelah diedit            |
| Berita per Kategori      | 5 menit   | Medium frequency                |

---

## TASK 3 — Seeder Master Data

```typescript
// prisma/seeders/news.seeder.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────
// DATA MASTER: KATEGORI BERITA
// ─────────────────────────────────────────────────────
const KATEGORI_DATA = [
  {
    nama: "Kabar Warga",
    slug: "kabar-warga",
    deskripsi:
      "Berita dan informasi seputar kehidupan warga di lingkungan sekitar.",
    warna_hex: "#3B82F6",
    urutan: 1,
  },
  {
    nama: "Kegiatan Organisasi",
    slug: "kegiatan-organisasi",
    deskripsi: "Liputan kegiatan, program, dan agenda Karang Taruna.",
    warna_hex: "#10B981",
    urutan: 2,
  },
  {
    nama: "Pemberdayaan Ekonomi",
    slug: "pemberdayaan-ekonomi",
    deskripsi: "Informasi UMKM, pelatihan wirausaha, dan peluang usaha warga.",
    warna_hex: "#F59E0B",
    urutan: 3,
  },
  {
    nama: "Sosial & Budaya",
    slug: "sosial-budaya",
    deskripsi:
      "Tradisi lokal, seni budaya, dan kegiatan sosial kemasyarakatan.",
    warna_hex: "#8B5CF6",
    urutan: 4,
  },
  {
    nama: "Kepemudaan",
    slug: "kepemudaan",
    deskripsi:
      "Berita seputar pemuda: pendidikan, karir, olahraga, dan prestasi.",
    warna_hex: "#EF4444",
    urutan: 5,
  },
  {
    nama: "Lingkungan Hidup",
    slug: "lingkungan-hidup",
    deskripsi:
      "Isu lingkungan, kebersihan, dan program hijau di lingkungan warga.",
    warna_hex: "#22C55E",
    urutan: 6,
  },
  {
    nama: "Pengumuman & Informasi",
    slug: "pengumuman-informasi",
    deskripsi: "Pengumuman resmi, jadwal, dan informasi penting dari pengurus.",
    warna_hex: "#64748B",
    urutan: 7,
  },
];

// ─────────────────────────────────────────────────────
// DATA MASTER: TAG POPULER
// ─────────────────────────────────────────────────────
const TAG_DATA = [
  { nama: "UMKM", slug: "umkm" },
  { nama: "Gotong Royong", slug: "gotong-royong" },
  { nama: "Pemuda", slug: "pemuda" },
  { nama: "Pelatihan", slug: "pelatihan" },
  { nama: "Bantuan Sosial", slug: "bantuan-sosial" },
  { nama: "Lingkungan", slug: "lingkungan" },
  { nama: "Prestasi", slug: "prestasi" },
  { nama: "Olahraga", slug: "olahraga" },
  { nama: "Budaya Lokal", slug: "budaya-lokal" },
  { nama: "Digitalisasi", slug: "digitalisasi" },
  { nama: "Kesehatan", slug: "kesehatan" },
  { nama: "Pendidikan", slug: "pendidikan" },
];

// ─────────────────────────────────────────────────────
// HELPER: Generate konten Tiptap JSON (dummy)
// ─────────────────────────────────────────────────────
function generateTiptapContent(paragraphs: string[]): object {
  return {
    type: "doc",
    content: paragraphs.map((text) => ({
      type: "paragraph",
      content: [{ type: "text", text }],
    })),
  };
}

// ─────────────────────────────────────────────────────
// DUMMY BERITA (untuk testing algoritma trending)
// ─────────────────────────────────────────────────────
function generateDummyBerita(
  kategoriId: string,
  tagIds: string[],
  overrides: Partial<{
    judul: string;
    seoSlug: string;
    totalViews: number;
    totalLikes: number;
    publishedAt: Date;
    isFeatured: boolean;
  }> = {},
) {
  const judul = overrides.judul ?? "Berita Dummy Karang Taruna";
  const seoSlug = overrides.seoSlug ?? `berita-dummy-${Date.now()}`;
  const paragraphs = [
    "Karang Taruna terus berinovasi dalam menghadirkan program-program yang bermanfaat bagi masyarakat setempat.",
    "Dengan semangat gotong royong, seluruh anggota aktif berpartisipasi dalam setiap kegiatan yang diselenggarakan.",
    "Program ini diharapkan dapat memberikan dampak positif yang berkelanjutan bagi seluruh lapisan masyarakat.",
  ];
  const kontenJson = generateTiptapContent(paragraphs);
  const kontenHtml = paragraphs.map((p) => `<p>${p}</p>`).join("");
  const kontenPlaintext = paragraphs.join(" ");

  return {
    judul,
    sub_judul: `Sub judul dari: ${judul}`,
    penulis: "Admin Karang Taruna",
    konten_json: kontenJson,
    konten_html: kontenHtml,
    konten_plaintext: kontenPlaintext,
    status: "PUBLISHED" as const,
    published_at: overrides.publishedAt ?? new Date(),
    is_featured: overrides.isFeatured ?? false,
    seo_title: judul.substring(0, 70),
    seo_description: paragraphs[0].substring(0, 160),
    seo_slug: seoSlug,
    seo_keywords: ["karang taruna", "kegiatan"],
    seo_robots: "index,follow",
    total_views: BigInt(overrides.totalViews ?? 0),
    total_likes: overrides.totalLikes ?? 0,
    m_kategori_berita_id: kategoriId,
    r_berita_tag: {
      create: tagIds.map((tagId) => ({ m_tag_id: tagId })),
    },
    c_berita_cover: {
      create: [
        {
          tipe: "LANDSCAPE_16_9" as const,
          s3_key: `covers/${seoSlug}/16x9.jpg`,
          s3_url: `https://picsum.photos/seed/${seoSlug}/1920/1080`,
          mime_type: "image/jpeg",
          width: 1920,
          height: 1080,
          is_primary: true,
        },
        {
          tipe: "SQUARE_1_1" as const,
          s3_key: `covers/${seoSlug}/1x1.jpg`,
          s3_url: `https://picsum.photos/seed/${seoSlug}s/400/400`,
          mime_type: "image/jpeg",
          width: 400,
          height: 400,
          is_primary: false,
        },
      ],
    },
  };
}

// ─────────────────────────────────────────────────────
// MAIN SEEDER FUNCTION
// ─────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Mulai seeding data berita...\n");

  // 1. Seed Kategori
  console.log("📂 Seeding kategori berita...");
  const kategoriMap: Record<string, string> = {};
  for (const kat of KATEGORI_DATA) {
    const result = await prisma.m_kategori_berita.upsert({
      where: { slug: kat.slug },
      create: kat,
      update: kat,
    });
    kategoriMap[kat.slug] = result.id;
    console.log(`  ✅ Kategori: ${kat.nama} (${result.id})`);
  }

  // 2. Seed Tag
  console.log("\n🏷️  Seeding tag...");
  const tagMap: Record<string, string> = {};
  for (const tag of TAG_DATA) {
    const result = await prisma.m_tag.upsert({
      where: { slug: tag.slug },
      create: tag,
      update: tag,
    });
    tagMap[tag.slug] = result.id;
    console.log(`  ✅ Tag: ${tag.nama} (${result.id})`);
  }

  // 3. Seed Dummy Berita
  console.log("\n📰 Seeding dummy berita...");
  const now = new Date();

  const dummyBeritaList = [
    // Berita Trending (views + likes tinggi, baru)
    {
      judul:
        "Karang Taruna Raih Penghargaan Nasional Kategori Inovasi Sosial 2024",
      seoSlug: "karang-taruna-raih-penghargaan-nasional-inovasi-sosial-2024",
      kategoriSlug: "kegiatan-organisasi",
      tagSlugs: ["prestasi", "pemuda"],
      totalViews: 15420,
      totalLikes: 892,
      publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 jam lalu
      isFeatured: true,
    },
    // Berita Top (views tertinggi, agak lama)
    {
      judul: "Program Pelatihan Digital Marketing Gratis untuk UMKM Warga",
      seoSlug: "pelatihan-digital-marketing-gratis-umkm-warga",
      kategoriSlug: "pemberdayaan-ekonomi",
      tagSlugs: ["umkm", "pelatihan", "digitalisasi"],
      totalViews: 28900,
      totalLikes: 1204,
      publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 hari lalu
      isFeatured: false,
    },
    // Berita Baru (views rendah, sangat baru)
    {
      judul: "Gotong Royong Bersih Desa Menyambut Bulan Kemerdekaan",
      seoSlug: "gotong-royong-bersih-desa-sambut-kemerdekaan",
      kategoriSlug: "kabar-warga",
      tagSlugs: ["gotong-royong", "lingkungan"],
      totalViews: 312,
      totalLikes: 45,
      publishedAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 menit lalu
      isFeatured: false,
    },
    // Berita Trending Medium
    {
      judul: "Festival Budaya Tahunan: Menampilkan 20 Kesenian Lokal Daerah",
      seoSlug: "festival-budaya-tahunan-20-kesenian-lokal",
      kategoriSlug: "sosial-budaya",
      tagSlugs: ["budaya-lokal", "pemuda"],
      totalViews: 8750,
      totalLikes: 620,
      publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 hari lalu
      isFeatured: false,
    },
    // Berita Kepemudaan
    {
      judul: "Tim Bola Voli Karang Taruna Juara 1 Tingkat Kabupaten",
      seoSlug: "tim-bola-voli-karang-taruna-juara-kabupaten",
      kategoriSlug: "kepemudaan",
      tagSlugs: ["olahraga", "prestasi", "pemuda"],
      totalViews: 5200,
      totalLikes: 380,
      publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 hari lalu
      isFeatured: false,
    },
    // Berita Lingkungan
    {
      judul: "Tanam 500 Pohon: Aksi Nyata Pemuda Peduli Lingkungan Hidup",
      seoSlug: "tanam-500-pohon-aksi-pemuda-peduli-lingkungan",
      kategoriSlug: "lingkungan-hidup",
      tagSlugs: ["lingkungan", "gotong-royong"],
      totalViews: 3800,
      totalLikes: 290,
      publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 hari lalu
      isFeatured: false,
    },
    // Berita Pengumuman
    {
      judul: "Pengumuman: Rapat Pleno Karang Taruna Periode 2024-2026",
      seoSlug: "pengumuman-rapat-pleno-karang-taruna-2024",
      kategoriSlug: "pengumuman-informasi",
      tagSlugs: ["pemuda"],
      totalViews: 1100,
      totalLikes: 55,
      publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 jam lalu
      isFeatured: false,
    },
    // Berita Kesehatan (lama tapi masih relevan)
    {
      judul: "Bakti Sosial Kesehatan: 300 Warga Dapatkan Pemeriksaan Gratis",
      seoSlug: "bakti-sosial-kesehatan-300-warga-gratis",
      kategoriSlug: "sosial-budaya",
      tagSlugs: ["bantuan-sosial", "kesehatan"],
      totalViews: 12300,
      totalLikes: 750,
      publishedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 hari lalu
      isFeatured: false,
    },
  ];

  for (const dummy of dummyBeritaList) {
    const tagIds = dummy.tagSlugs.map((s) => tagMap[s]).filter(Boolean);
    const kategoriId = kategoriMap[dummy.kategoriSlug];

    const data = generateDummyBerita(kategoriId, tagIds, {
      judul: dummy.judul,
      seoSlug: dummy.seoSlug,
      totalViews: dummy.totalViews,
      totalLikes: dummy.totalLikes,
      publishedAt: dummy.publishedAt,
      isFeatured: dummy.isFeatured,
    });

    await prisma.c_berita.upsert({
      where: { seo_slug: dummy.seoSlug },
      create: data,
      update: {
        total_views: data.total_views,
        total_likes: data.total_likes,
      },
    });

    console.log(`  ✅ Berita: ${dummy.judul}`);
    console.log(
      `     📊 Views: ${dummy.totalViews.toLocaleString()} | Likes: ${dummy.totalLikes}`,
    );
  }

  console.log("\n✨ Seeding selesai!");
  console.log(`   📂 ${KATEGORI_DATA.length} kategori`);
  console.log(`   🏷️  ${TAG_DATA.length} tag`);
  console.log(`   📰 ${dummyBeritaList.length} berita dummy`);
}

main()
  .catch((e) => {
    console.error("❌ Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Cara menjalankan seeder:**

```bash
# Jalankan seeder khusus berita
npx ts-node prisma/seeders/news.seeder.ts

# Atau jika menggunakan prisma seed script di package.json:
# "prisma": { "seed": "ts-node prisma/seeders/news.seeder.ts" }
npx prisma db seed
```

---

## TASK 4 — Checklist Implementasi API & Frontend

### 4.1 Checklist API Endpoints (REST)

#### 📁 Auth / View Certificate

- [ ] `GET /api/auth/view-cert` — Issue sertifikat view baru (set HttpOnly cookie)
- [ ] `POST /api/news/:id/view` — Record view, validasi cert, debounce Redis, produce Kafka

#### 📁 Berita — Publik

- [ ] `GET /api/news` — List berita dengan filter & paginasi
  - Query params: `?page`, `?limit`, `?kategori`, `?tag`, `?q` (search), `?sort=latest|trending|top`
- [ ] `GET /api/news/trending` — Top N berita trending (dari Redis/ES cache)
- [ ] `GET /api/news/top` — Top N berita views tertinggi (dari Redis/ES cache)
- [ ] `GET /api/news/latest` — Berita terbaru (paginasi, dari Redis/ES cache)
- [ ] `GET /api/news/:slug` — Detail berita by SEO slug
- [ ] `GET /api/news/:id/related` — Berita terkait (same kategori/tag, via ES more-like-this)
- [ ] `GET /api/news/search?q=...` — Full-text search via Elasticsearch
- [ ] `GET /api/news/kategori/:slug` — Berita berdasarkan kategori
- [ ] `GET /api/news/tag/:slug` — Berita berdasarkan tag

#### 📁 Interaksi User (Publik)

- [ ] `POST /api/news/:id/like` — Toggle like (auth required)
- [ ] `POST /api/news/:id/dislike` — Toggle dislike (auth required)
- [ ] `GET /api/news/:id/interaction` — Cek status interaksi user terhadap berita (auth optional)

#### 📁 Komentar (Publik)

- [ ] `GET /api/news/:id/comments` — List komentar yang APPROVED, dengan paginasi
- [ ] `POST /api/news/:id/comments` — Submit komentar baru (user login atau guest)
  - Body: `{ isi, guest_nama?, guest_email? }` + device fingerprint header
- [ ] `POST /api/comments/:id/like` — Like komentar

#### 📁 Master Data (Publik)

- [ ] `GET /api/kategori` — Daftar semua kategori aktif
- [ ] `GET /api/tags` — Daftar tag populer (sorted by total_berita)
- [ ] `GET /api/tags/search?q=...` — Autocomplete tag

#### 📁 CMS Admin (Protected — Role: Admin/Editor)

- [ ] `POST /api/news` — Buat berita baru (status DRAFT)
- [ ] `PUT /api/news/:id` — Update berita
- [ ] `PATCH /api/news/:id/publish` — Publish berita → trigger Kafka event
- [ ] `PATCH /api/news/:id/archive` — Archive berita
- [ ] `DELETE /api/news/:id` — Soft delete berita
- [ ] `POST /api/news/:id/schedule` — Jadwalkan publish (scheduled_at)
- [ ] `POST /api/upload/image` — Upload gambar konten ke S3 → return URL
- [ ] `POST /api/upload/cover` — Upload cover ke S3 (multi-rasio auto-resize)
- [ ] `GET /api/news` — List berita semua status (CMS dashboard)
- [ ] `GET /api/comments` — Moderasi komentar (status PENDING)
- [ ] `PATCH /api/comments/:id/approve` — Approve komentar
- [ ] `PATCH /api/comments/:id/reject` — Reject komentar
- [ ] `POST /api/kategori` — Tambah kategori
- [ ] `PUT /api/kategori/:id` — Edit kategori
- [ ] `DELETE /api/kategori/:id` — Soft delete kategori
- [ ] `POST /api/tags` — Tambah tag
- [ ] `DELETE /api/tags/:id` — Hapus tag

---

### 4.2 Checklist Frontend (Next.js 14 App Router)

#### 📁 Halaman Publik

- [ ] `/` — Homepage
  - [ ] Komponen `HeroBreakingNews` — Carousel berita breaking news
  - [ ] Komponen `FeaturedGrid` — Grid utama berita featured (BBC-style)
  - [ ] Komponen `TrendingList` — Sidebar / section trending
  - [ ] Komponen `LatestNewsFeed` — Feed berita terbaru (infinite scroll)
  - [ ] Komponen `KategoriNav` — Navigasi tab kategori

- [ ] `/berita/[slug]` — Halaman Detail Berita
  - [ ] Komponen `ArticleHeader` — Judul, metadata, penulis, tanggal
  - [ ] Komponen `CoverImage` — Responsive cover (berbagai rasio)
  - [ ] Komponen `ArticleBody` — Render Tiptap JSON → HTML (dengan highlight, embed)
  - [ ] Komponen `LikeDislikeBar` — Tombol interaksi (optimistic update)
  - [ ] Komponen `ShareButtons` — Tombol share (Twitter, FB, WA, copy link)
  - [ ] Komponen `RelatedNews` — Berita terkait (4 card)
  - [ ] Komponen `CommentSection` — Section komentar + form submit
  - [ ] Logic: Auto-send view request setelah user baca 30 detik atau scroll 50%
  - [ ] Metatag SEO: `generateMetadata()` dari seo\_\* fields

- [ ] `/kategori/[slug]` — Halaman Per Kategori
  - [ ] List berita dengan filter & infinite scroll
  - [ ] Header kategori (nama, deskripsi, warna)

- [ ] `/tag/[slug]` — Halaman Per Tag
- [ ] `/cari` — Halaman Search Results
  - [ ] Komponen `SearchBar` dengan debounce 300ms
  - [ ] Tampilkan hasil dari Elasticsearch

#### 📁 Komponen Shared

- [ ] `NewsCard` — Card berita (versi horizontal & vertikal)
- [ ] `NewsCardSkeleton` — Loading skeleton
- [ ] `CategoryBadge` — Badge warna kategori
- [ ] `TagList` — Daftar tag pill
- [ ] `TimeAgo` — Relative time ("2 jam lalu")
- [ ] `InfiniteScrollWrapper` — Wrapper dengan Intersection Observer
- [ ] `Pagination` — Untuk halaman yang tidak perlu infinite scroll

#### 📁 CMS Admin Pages

- [ ] `/dashboard/berita` — Daftar & filter semua berita
- [ ] `/dashboard/berita/baru` — Form buat berita baru
- [ ] `/dashboard/berita/[id]/edit` — Form edit berita
  - [ ] Komponen `TiptapEditor` — Rich text editor (NestJS-compatible JSON)
  - [ ] Komponen `CoverUploader` — Multi-rasio cover upload dengan preview crop
  - [ ] Komponen `SeoPanel` — Form SEO fields + preview SERP snippet
  - [ ] Komponen `TagSelector` — Autocomplete tag selector
  - [ ] Komponen `PublishControls` — Status, publish, schedule, preview
- [ ] `/dashboard/berita/komentar` — Antrian moderasi komentar
- [ ] `/dashboard/berita/kategori` — CRUD kategori

---

### 4.3 Implementasi View Certificate di Client-side

```typescript
// lib/view-tracker.ts
// Dijalankan di sisi client setelah halaman detail berita mount

import FingerprintJS from "@fingerprintjs/fingerprintjs";

const MIN_READ_SECONDS = 30; // Minimal baca 30 detik
const MIN_SCROLL_PERCENT = 50; // ATAU scroll 50% artikel

export class ViewTracker {
  private beritaId: string;
  private startTime: number;
  private hasScrolled50 = false;
  private hasSentView = false;

  constructor(beritaId: string) {
    this.beritaId = beritaId;
    this.startTime = Date.now();
  }

  // Step 1: Dapatkan device fingerprint
  async getFingerprint(): Promise<string> {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
  }

  // Step 2: Pantau scroll position
  initScrollListener(articleElement: HTMLElement) {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.intersectionRatio >= 0.5) {
          this.hasScrolled50 = true;
          this.tryRecordView();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(articleElement);
  }

  // Step 3: Pantau waktu baca
  initTimeListener() {
    const interval = setInterval(() => {
      const elapsed = (Date.now() - this.startTime) / 1000;
      if (elapsed >= MIN_READ_SECONDS) {
        clearInterval(interval);
        this.tryRecordView();
      }
    }, 5000);
  }

  // Step 4: Kirim view request (hanya sekali)
  private async tryRecordView() {
    if (this.hasSentView) return;
    if (
      !this.hasScrolled50 &&
      (Date.now() - this.startTime) / 1000 < MIN_READ_SECONDS
    )
      return;

    this.hasSentView = true;

    const fingerprint = await this.getFingerprint();

    await fetch(`/api/news/${this.beritaId}/view`, {
      method: "POST",
      credentials: "include", // Sertakan cookie (view_cert)
      headers: {
        "Content-Type": "application/json",
        "X-Device-Fingerprint": fingerprint,
      },
    });
  }
}
```

**Cara penggunaan di halaman detail berita (Next.js):**

```typescript
// app/berita/[slug]/page.tsx (Client Component bagian)
'use client';
import { useEffect, useRef } from 'react';
import { ViewTracker } from '@/lib/view-tracker';

export function ArticleViewTracker({ beritaId }: { beritaId: string }) {
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tracker = new ViewTracker(beritaId);
    tracker.initTimeListener();
    if (articleRef.current) {
      tracker.initScrollListener(articleRef.current);
    }
  }, [beritaId]);

  return <div ref={articleRef} id="article-body-sentinel" />;
}
```

---

### 4.4 Checklist SEO & Performa

- [ ] Implementasi `generateMetadata()` di setiap route berita (Next.js App Router)
- [ ] Implementasi JSON-LD `NewsArticle` schema di halaman detail
- [ ] `sitemap.xml` dinamis — generate dari semua berita published via `app/sitemap.ts`
- [ ] `robots.txt` — Izinkan crawler di `/berita/*`, block `/admin/*`
- [ ] Canonical URL di setiap halaman
- [ ] Open Graph image otomatis menggunakan cover `LANDSCAPE_16_9`
- [ ] ISR (Incremental Static Regeneration) untuk halaman detail berita (revalidate: 300s)
- [ ] Image optimization: Next.js `<Image>` component dengan `sizes` responsif
- [ ] Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms

---

### 4.5 Checklist Infrastruktur Tambahan

- [ ] S3 Bucket Policy: Public read untuk `/covers/*`, private untuk raw uploads
- [ ] Lambda / Sharp: Auto-resize cover ke semua rasio saat upload (triggered by S3 event)
- [ ] Kafka Topics yang perlu dibuat:
  - `news.published` (partitions: 3, retention: 7d)
  - `news.updated` (partitions: 3, retention: 7d)
  - `news.viewed` (partitions: 6, retention: 1d) — traffic tinggi, partition lebih banyak
  - `news.liked` (partitions: 3, retention: 3d)
- [ ] Elasticsearch Analyzer: Install plugin `analysis-icu` + konfigurasi Indonesian analyzer
- [ ] Redis Cluster: Pisahkan DB index untuk: cache (DB 0), view debounce (DB 1), session (DB 2)
- [ ] Monitoring: Setup alert untuk Kafka consumer lag > 10.000 messages
- [ ] Rate limiting per IP: Max 10 request/menit untuk endpoint komentar (anti-spam)

---

_Dokumen ini merupakan panduan implementasi lengkap. Setiap task dapat dikerjakan secara paralel oleh tim yang berbeda. Direkomendasikan untuk memulai dari TASK 1 (Schema) → TASK 3 (Seeder) → TASK 2 (Infrastruktur) → TASK 4 (API & Frontend)._

---

**© Karang Taruna — Internal Architecture Document v1.0.0**
