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
