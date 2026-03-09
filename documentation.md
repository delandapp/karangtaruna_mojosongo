# API Documentation

## Base URL
`/api`

## Standard Response Format
Semua API response mengikuti format standar berikut:

### Success Response
```json
{
  "success": true,
  "data": { ... } // Payload data dari API
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Deskripsi error",
    "details": { ... } // Optional: detail error spesifik (misal target constraint P2002)
  }
}
```

### Validation Error (400 Bad Request - ZodError)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validasi data gagal",
    "details": [
      {
        "field": "username",
        "message": "Username minimal 4 karakter"
      }
    ]
  }
}
```

---

## 1. Authentication

### 1.1 Login

**Endpoint:** `POST /api/auth/login`

**Description:** Autentikasi user dan mendapatkan JWT token.

**Request Body (JSON):**

| Field | Type | Required | Validations |
|-------|------|----------|-------------|
| `username` | string | Yes | Minimal 1 karakter |
| `password` | string | Yes | Minimal 1 karakter |

**Contoh Request:**
```json
{
  "username": "johndoe",
  "password": "Password123"
}
```

**Responses:**

*   **200 OK (Success)**
    ```json
    {
      "success": true,
      "data": {
        "user": {
          "id": 1,
          "username": "johndoe",
          "nama_lengkap": "John Doe",
          "no_handphone": "081234567890",
          "rt": "01",
          "rw": "02",
          "alamat": "Jl. Mawar No 1",
          "jenis_kelamin": "L",
          "m_jabatan_id": 1,
          "m_level_id": 2,
          "createdAt": "2023-10-25T10:00:00.000Z",
          "updatedAt": "2023-10-25T10:00:00.000Z",
          "level": {
            "nama_level": "Admin"
          },
          "jabatan": {
            "nama_jabatan": "Ketua"
          }
        },
        "token": "eyJhbGciOiJIUzI1NiIsIn..."
      }
    }
    ```

*   **401 Unauthorized (Invalid Credentials)**
    ```json
    {
      "success": false,
      "error": {
        "code": "UNAUTHORIZED",
        "message": "Username atau password salah"
      }
    }
    ```

### 1.2 Register

**Endpoint:** `POST /api/auth/register`

**Description:** Mendaftarkan user baru ke sistem.

**Request Body (JSON):**

| Field | Type | Required | Validations |
|-------|------|----------|-------------|
| `nama_lengkap` | string | Yes | Min 3, Max 100 karakter |
| `username` | string | Yes | Min 4, Max 50 karakter (alphanumeric & underscore) |
| `password` | string | Yes | Min 8 karakter, minimal 1 huruf besar, 1 kecil, 1 angka |
| `no_handphone` | string | Yes | Min 10, Max 15 digit (angka saja) |
| `rt` | string | Yes | Min 1, Max 5 karakter |
| `rw` | string | Yes | Min 1, Max 5 karakter |
| `alamat` | string | No | Optional, detail spesifik alamat rumah |
| `jenis_kelamin` | string | No | Enum: 'L' atau 'P' |
| `m_jabatan_id` | number | No | Integer positif |
| `m_level_id` | number | No | Integer positif |

**Contoh Request:**
```json
{
  "nama_lengkap": "Budi Santoso",
  "username": "budisantoso",
  "password": "Password123",
  "no_handphone": "08123456789",
  "rt": "01",
  "rw": "05",
  "alamat": "Jl. Kenangan Indah",
  "jenis_kelamin": "L",
  "m_jabatan_id": 2,
  "m_level_id": 3
}
```

**Responses:**

*   **201 Created (Success)**
    ```json
    {
      "success": true,
      "data": {
        "id": 2,
        "nama_lengkap": "Budi Santoso",
        "username": "budisantoso",
        "no_handphone": "08123456789",
        "createdAt": "2023-10-26T14:30:00.000Z",
        "level": {
          "nama_level": "User"
        },
        "jabatan": {
          "nama_jabatan": "Anggota"
        }
      }
    }
    ```

*   **409 Conflict (Username/Nomor Handphone sudah terdaftar)**
    ```json
    {
      "success": false,
      "error": {
        "code": "CONFLICT",
        "message": "Username sudah terdaftar"
      }
    }
    ```

*   **400 Bad Request (Validation Error Zod)**
    ```json
    {
      "success": false,
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "Validasi data gagal",
        "details": [
          {
            "field": "password",
            "message": "Password harus mengandung setidaknya satu huruf besar, satu huruf kecil, dan satu angka"
          }
        ]
      }
    }
    ```

---

## 2. Master Data - Level

Endpoint ini mengelola data `m_level` dengan optimasi Redis Cache otomatis (sinkronisasi optimistic update & bulk expiration). 

### 2.1 Get All Levels (List & Pagination)

**Endpoint:** `GET /api/levels`

**Description:** Mengambil daftar level dengan pagination. Request ini di-cache oleh Redis.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | `1` | Nomor halaman |
| `limit` | number | `10` | Jumlah data per halaman |
| `search` | string | | Pencarian berdasarkan `nama_level`. (Otomatis mem-bypass cache) |

**Contoh Response Sukses (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nama_level": "Superuser",
      "createdAt": "2023-11-01T10:00:00.000Z",
      "updatedAt": "2023-11-01T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

### 2.2 Get Level by ID

**Endpoint:** `GET /api/levels/:id`

**Description:** Mengambil detail satu data level berdasarkan ID. Secara cerdas mengambil dari cache individual `REDIS_KEYS.LEVELS.SINGLE(id)` jika tersedia.

**Contoh Response Sukses (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nama_level": "Superuser",
    "createdAt": "2023-11-01T10:00:00.000Z",
    "updatedAt": "2023-11-01T10:00:00.000Z"
  }
}
```

### 2.3 Create Level

**Endpoint:** `POST /api/levels`

**Description:** Membuat level baru. Secara otomatis akan me-refresh semua cache list level.

**Request Body (JSON):**
| Field | Type | Required | Validations |
|-------|------|----------|-------------|
| `nama_level` | string | Yes | Min 3, Max 50 karakter |

**Contoh Response Sukses (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 6,
    "nama_level": "Anggota Biasa"
  }
}
```

### 2.4 Update Level

**Endpoint:** `PUT /api/levels/:id`

**Description:** Memperbarui data level. Otomatis me-refresh bulk cache dan me-replace cache individu di Redis.

**Request Body (JSON):**
Sama seperti `Create Level`. Semua field wajib dilempar sesuai validasi schema.

**Contoh Response Sukses (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 6,
    "nama_level": "Anggota Ekstra",
    "updatedAt": "2023-11-01T14:30:00.000Z"
  }
}
```

### 2.5 Delete Level

**Endpoint:** `DELETE /api/levels/:id`

**Description:** Menghapus data level secara permanen serta membersihkan cachenya dari Redis.

**Contoh Response Sukses (200 OK):**
```json
{
  "success": true,
  "data": null
}
```

---

## 3. Master Data - Jabatan

Sama seperti entitas Level, manajemen cache di Jabatan menggunakan integrasi Redis yang presisi (Clean Architecture).

### 3.1 Get All Jabatans

**Endpoint:** `GET /api/jabatans`

**Query Parameters:** (Sama persis dengan `GET /api/levels`)

**Contoh Response Sukses (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nama_jabatan": "Ketua",
      "deskripsi_jabatan": "Ketua Karang Taruna",
      "createdAt": "2023-11-01T10:00:00.000Z",
      "updatedAt": "2023-11-01T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1
  }
}
```

### 3.2 Get Jabatan by ID

**Endpoint:** `GET /api/jabatans/:id`

### 3.3 Create Jabatan

**Endpoint:** `POST /api/jabatans`

**Request Body (JSON):**
| Field | Type | Required | Validations |
|-------|------|----------|-------------|
| `nama_jabatan` | string | Yes | Min 3, Max 50 karakter |
| `deskripsi_jabatan`| string | No | Optional notes |

**Contoh Response Sukses (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 4,
    "nama_jabatan": "Bendahara",
    "deskripsi_jabatan": "Mengatur kas"
  }
}
```

### 3.4 Update Jabatan

**Endpoint:** `PUT /api/jabatans/:id`

**Description:** Schema Update bisa menimpa beberapa properti saja secara `optional()`.

### 3.5 Delete Jabatan

**Endpoint:** `DELETE /api/jabatans/:id`

---

## 4. Master Data - User (Anggota)

Endpoint untuk mengelola user/anggota. Dilengkapi dengan Role-Based Access Control (RBAC) ketat dan validasi Zod.

### Role-Based Access Control (RBAC)
- **Full CRUD** (Bisa melakukan semua aksi GET, POST, PUT, DELETE): `superuser`, `ketua`, `wakil ketua`, `seketaris`, `bendahara`.
- **Read-Only** (Hanya bisa GET): `admin`.
- **Restricted CRUD** (Bisa CRUD namun TERBATAS pada anggota yang memiliki `m_jabatan_id` yang SAMA dengan dirinya): `koordinator`.

### 4.1 Get All Users (List, Pagination & Filter)

**Endpoint:** `GET /api/users`

**Description:** Mengambil daftar user dengan opsi filter spesifik.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | `1` | Nomor halaman |
| `limit` | number | `10` | Jumlah data per halaman |
| `m_jabatan_id` | number | | Filter berdasarkan ID Jabatan. *Catatan: Jika user login sebagai Koordinator, nilai ini akan dioverride paksa ke ID jabatannya sendiri.* |
| `m_level_id` | number | | Filter berdasarkan ID Level |
| `search` | string | | Pencarian berdasarkan `nama_lengkap` atau `username` (Insensitive) |

**Contoh Response Sukses (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nama_lengkap": "Karang Taruna Kelurahan Mojosongo",
      "username": "kti_mojosongo",
      "no_handphone": "08979341242",
      "rt": "00", "rw": "00",
      "alamat": "Jl. Brigjend Katamso...",
      "jenis_kelamin": null,
      "m_jabatan_id": 1,
      "m_level_id": 1,
      "createdAt": "2023-11-01T10:00:00.000Z",
      "jabatan": { "nama_jabatan": "Penanggung Jawab" },
      "level": { "nama_level": "superuser" }
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### 4.2 Create User

**Endpoint:** `POST /api/users`

**Request Body (JSON):**
Mirip dengan endpoint Register (`POST /api/auth/register`), namun dengan restriksi keamanan bahwa hanya user berwenang yang dapat membuat user baru. Koordinator **wajib** mengisi `m_jabatan_id` sesuai dengan jabatannya (jika berbeda akan ditolak dengan `403 Forbidden`).

**Contoh Error (403 Forbidden - Koordinator menambah di luar jabatannya):**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Koordinator hanya dapat menambahkan anggota ke dalam jabatannya sendiri."
  }
}
```

### 4.3 Update User

**Endpoint:** `PUT /api/users/:id`

**Description:** Memperbarui data anggota. Admin (Read-Only) akan selalu mendapat error 403 Forbidden.

**Request Body (JSON):**
Semua properti bersifat `optional`. Jika `password` diisi string kosong `""`, data tersebut akan diabaikan (tidak diubah). Parameter validasi sama persis dengan tabel form register.

### 4.4 Delete User

**Endpoint:** `DELETE /api/users/:id`

**Description:** Menghapus data user berdasarkan ID.
_Catatan: User tidak dapat menghapus akunnya sendiri (akan dicegah via HTTP 403)._

---

## 5. Master Data - Sponsorship

Endpoint untuk mengelola modul Sponsorship. Filter terintegrasi memakai sistem caching cerdas berdasarkan kombinasi parameter.

### 5.1 Reusable Array Filter System (Baru)

Sistem filter GET yang baru mendukung **comma-separated parameter** untuk men-support nilai array (e.g., dari `MultipleComboBox`). Backend akan merubahnya menjadi query `in:` menggunakan Prisma secara otomatis.

**Contoh Format URI Valid:**
`/api/sponsorship/brands?m_bidang_brand_id=1,2,3&search=Tech`

Setiap kombinasi unik ini akan menghasilkan deterministic Redis **Cache Key** (`bid:1,2,3:kat:all`).

### 5.2 Get All Brands

**Endpoint:** `GET /api/sponsorship/brands`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | `1` | Nomor halaman |
| `limit` | number | `10` | Jumlah data per halaman |
| `m_bidang_brand_id` | string | | Comma separated ID (cth: `1,2,3`) untuk mem-filter bidang Brand. |
| `m_kategori_brand_id` | string | | Comma separated ID (cth: `4,5`) untuk mem-filter kategori Brand. |
| `search` | string | | Pencarian nama_brand atau perusahaan_induk (Insensitive) |
| `dropdown` | string | | `true` jika ingin me-return data id dan nama_brand ringan tanpa paginasi |

**Contoh Response Sukses (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nama_brand": "TechInAsia",
      "perusahaan_induk": "TIA SG",
      "whatsapp_brand": "0812...",
      "bidang": { "nama_bidang": "Teknologi" },
      "kategori": { "nama_kategori": "Media Partner" }
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### 5.3 Create Brand

**Endpoint:** `POST /api/sponsorship/brands`

**Request Body (JSON):**
| Field | Type | Required | Validations |
|-------|------|----------|-------------|
| `nama_brand` | string | Yes | Min 2 karakter |
| `m_bidang_brand_id` | number | No | Integer |
| `m_kategori_brand_id` | number | No | Integer |
| `perusahaan_induk` | string | No | Optional string |
| `whatsapp_brand` | string | No | Optional string |
| `email_brand` | string | No | Format email valid atau kosong |
| `instagram_brand` | string | No | Optional string |
| `linkend_brand` | string | No | Optional string |

*(Endpoint Update dan Delete menyesuaikan dengan ID)*

---

## 6. Master Data - Organisasi

Endpoint untuk mengelola profil organisasi Karang Taruna (`m_organisasi`). Karena profil organisasi bersifat **singleton** (biasanya hanya 1 baris), endpoint ini dilindungi dengan RBAC ketat dan mencakup validasi format email, nomor handphone, serta URL.

### Hak Akses RBAC

| Method | Izin Minimal |
|--------|-------------|
| `GET` | superuser, admin, ketua |
| `POST` | superuser, admin, ketua |
| `PUT` | superuser, admin, ketua |
| `DELETE` | superuser, admin, ketua |

### 6.1 Get All Organisasi

**Endpoint:** `GET /api/organisasi`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | `1` | Nomor halaman |
| `limit` | number | `10` | Jumlah data per halaman |
| `search` | string | | Pencarian berdasarkan `nama_org`, `kelurahan`, `kecamatan`, atau `kota` (case-insensitive) |

**Contoh Response Sukses (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nama_org": "Karang Taruna Mojosongo",
      "kelurahan": "Mojosongo",
      "kecamatan": "Jebres",
      "kota": "Surakarta",
      "provinsi": "Jawa Tengah",
      "no_handphone": "081234567890",
      "email": "karangtaruna@mojosongo.id",
      "alamat": "Jl. Brigjend Katamso No. 1",
      "logo_url": null,
      "visi": "Menjadi organisasi pemuda terdepan...",
      "misi": "1. Memberdayakan pemuda...",
      "media_sosial": {
        "instagram": "@kt_mojosongo",
        "facebook": "KarangTarunaMojosongo",
        "tiktok": null,
        "youtube": null,
        "whatsapp": "081234567890"
      },
      "dibuat_pada": "2025-01-01T00:00:00.000Z",
      "diperbarui_pada": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### 6.2 Get Organisasi by ID

**Endpoint:** `GET /api/organisasi/:id`

**Contoh Response Sukses (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nama_org": "Karang Taruna Mojosongo",
    ...
  }
}
```

**Contoh Error (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Data organisasi tidak ditemukan"
  }
}
```

### 6.3 Create Organisasi

**Endpoint:** `POST /api/organisasi`

**Request Body (JSON):**
| Field | Type | Required | Validations |
|-------|------|----------|-------------|
| `nama_org` | string | **Yes** | Min 3, Max 200 karakter |
| `kelurahan` | string | **Yes** | Min 2, Max 100 karakter |
| `kecamatan` | string | **Yes** | Min 2, Max 100 karakter |
| `kota` | string | **Yes** | Min 2, Max 100 karakter |
| `provinsi` | string | **Yes** | Min 2, Max 100 karakter |
| `no_handphone` | string | No | Diawali `08`, 10–15 digit. Input `+62xxx` diterima dan dinormalisasi otomatis ke `08xxx` |
| `email` | string | No | Format email valid, otomatis di-lowercase |
| `alamat` | string | No | Max 500 karakter |
| `logo_url` | string | No | Format URL valid, Max 255 karakter |
| `visi` | string | No | Max 2000 karakter |
| `misi` | string | No | Max 2000 karakter |
| `media_sosial` | object | No | Object: `{ instagram, facebook, tiktok, youtube, whatsapp }` |
| `media_sosial.whatsapp` | string | No | Validasi sama dengan `no_handphone` |

**Contoh Request:**
```json
{
  "nama_org": "Karang Taruna Mojosongo",
  "kelurahan": "Mojosongo",
  "kecamatan": "Jebres",
  "kota": "Surakarta",
  "provinsi": "Jawa Tengah",
  "no_handphone": "+6281234567890",
  "email": "KarangTaruna@Mojosongo.ID",
  "media_sosial": {
    "instagram": "@kt_mojosongo"
  }
}
```

> **Catatan:** `no_handphone` di atas akan otomatis dinormalisasi menjadi `08123456789` dan `email` akan di-lowercase menjadi `karangtaruna@mojosongo.id`.

**Contoh Response Sukses (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nama_org": "Karang Taruna Mojosongo",
    "no_handphone": "08123456789",
    "email": "karangtaruna@mojosongo.id"
  }
}
```

### 6.4 Update Organisasi

**Endpoint:** `PUT /api/organisasi/:id`

**Description:** Semua field bersifat `optional`. Hanya field yang dikirimkan yang akan diperbarui. Sebelum update, sistem melakukan pengecekan `404` jika ID tidak ditemukan.

**Request Body:** Sama dengan Create, namun semua field `optional`.

**Contoh Response Sukses (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nama_org": "Karang Taruna Mojosongo (Updated)",
    "diperbarui_pada": "2025-08-01T10:00:00.000Z"
  }
}
```

### 6.5 Delete Organisasi

**Endpoint:** `DELETE /api/organisasi/:id`

**Description:** Menghapus data organisasi secara permanen dan membersihkan cache Redis.

**Contoh Response Sukses (200 OK):**
```json
{
  "success": true,
  "data": null
}
```

---

## 7. Event

Endpoint untuk mengelola master data event (`event`). Kode event (`kode_event`) di-generate **otomatis oleh server** dalam format `EVT-MMYY-NNN` dan tidak dapat diisi atau diubah oleh user.

### Hak Akses RBAC

| Method | Jabatan yang diizinkan |
|--------|------------------------|
| `GET` | superuser, admin, ketua, wakil ketua |
| `POST` | superuser, admin, ketua, wakil ketua |
| `PUT` | superuser, admin, ketua, wakil ketua |
| `DELETE` | superuser, admin, ketua, wakil ketua |

### Format Kode Event

| Contoh | Keterangan |
|--------|-----------|
| `EVT-0325-001` | Event pertama di bulan Maret 2025 |
| `EVT-0325-002` | Event kedua di bulan Maret 2025 |
| `EVT-1225-001` | Event pertama di bulan Desember 2025 |

> Increment di-reset setiap bulan baru. Kode unik dijamin di level database (`@unique`).

### 7.1 Get All Events

**Endpoint:** `GET /api/events`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | `1` | Nomor halaman |
| `limit` | number | `10` | Jumlah data per halaman |
| `search` | string | | Pencarian `nama_event`, `kode_event`, atau `lokasi` (case-insensitive) |
| `status_event` | string | | Filter: `perencanaan` \| `persiapan` \| `siap` \| `berlangsung` \| `selesai` \| `dibatalkan` |
| `jenis_event` | string | | Filter: `festival` \| `lomba` \| `seminar` \| `bakti_sosial` \| `olahraga` \| `seni_budaya` \| `pelatihan` \| `lainnya` |
| `m_organisasi_id` | number | | Filter berdasarkan ID Organisasi |

> Cache Redis **hanya aktif** untuk request tanpa filter sama sekali. Request dengan filter selalu query langsung ke database.

**Contoh Response Sukses (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "kode_event": "EVT-0325-001",
      "nama_event": "Festival Pemuda Mojosongo 2025",
      "jenis_event": "festival",
      "status_event": "perencanaan",
      "tanggal_mulai": "2025-04-01T00:00:00.000Z",
      "tanggal_selesai": "2025-04-03T00:00:00.000Z",
      "lokasi": "Lapangan Mojosongo",
      "target_peserta": 500,
      "organisasi": { "id": 1, "nama_org": "Karang Taruna Mojosongo" },
      "dibuat_oleh": { "id": 2, "nama_lengkap": "Budi Santoso", "username": "budisantoso" }
    }
  ],
  "meta": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

### 7.2 Get Event by ID

**Endpoint:** `GET /api/events/:id`

**Contoh Error (404):**
```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Event tidak ditemukan" }
}
```

### 7.3 Create Event

**Endpoint:** `POST /api/events`

> `kode_event` **tidak boleh** disertakan dalam request body. Server akan meng-generate secara otomatis.

**Request Body (JSON):**
| Field | Type | Required | Validations |
|-------|------|----------|-------------|
| `m_organisasi_id` | number | **Yes** | Integer positif, harus ada di database |
| `nama_event` | string | **Yes** | Min 3, Max 200 karakter |
| `jenis_event` | string | **Yes** | Enum: `festival`, `lomba`, `seminar`, `bakti_sosial`, `olahraga`, `seni_budaya`, `pelatihan`, `lainnya` |
| `tanggal_mulai` | string (ISO date) | **Yes** | Format datetime ISO 8601 |
| `tanggal_selesai` | string (ISO date) | **Yes** | Harus ≥ `tanggal_mulai` |
| `tema_event` | string | No | Max 200 karakter |
| `deskripsi` | string | No | Max 5000 karakter |
| `status_event` | string | No | Default: `perencanaan`. Enum: `perencanaan` \| `persiapan` \| `siap` \| `berlangsung` \| `selesai` \| `dibatalkan` |
| `lokasi` | string | No | Max 255 karakter |
| `target_peserta` | number | No | Integer ≥ 1 |
| `realisasi_peserta` | number | No | Integer ≥ 0 |
| `banner_url` | string | No | Format URL valid |
| `tujuan` | string[] | No | Array of string (tujuan SMART) |

**Contoh Request:**
```json
{
  "m_organisasi_id": 1,
  "nama_event": "Festival Pemuda Mojosongo 2025",
  "jenis_event": "festival",
  "tanggal_mulai": "2025-04-01",
  "tanggal_selesai": "2025-04-03",
  "lokasi": "Lapangan Mojosongo",
  "target_peserta": 500,
  "tujuan": ["Meningkatkan kreativitas pemuda", "Mempererat silaturahmi warga"]
}
```

**Contoh Response Sukses (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "kode_event": "EVT-0325-001",
    "nama_event": "Festival Pemuda Mojosongo 2025",
    "status_event": "perencanaan"
  }
}
```

**Contoh Error — tanggal selesai sebelum mulai (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validasi data gagal",
    "details": [{ "field": "tanggal_selesai", "message": "Tanggal selesai tidak boleh sebelum tanggal mulai" }]
  }
}
```

### 7.4 Update Event

**Endpoint:** `PUT /api/events/:id`

**Batasan:**
- `kode_event` tidak dapat diubah meskipun dikirim dalam body
- Event dengan `status_event = "selesai"` atau `"dibatalkan"` tidak dapat diubah (422)

**Request Body:** Sama dengan Create, namun semua field `optional`.

### 7.5 Delete Event

**Endpoint:** `DELETE /api/events/:id`

**Batasan:**
- Event dengan `status_event = "berlangsung"` atau `"selesai"` tidak dapat dihapus (422)
- Penghapusan bersifat **CASCADE** — seluruh data turunan (panitia, rundown, tugas, tiket, dst.) ikut terhapus

**Contoh Error — event sedang berlangsung (422):**
```json
{
  "success": false,
  "error": {
    "code": "UNPROCESSABLE_ENTITY",
    "message": "Event dengan status \"berlangsung\" tidak dapat dihapus."
  }
}
```
