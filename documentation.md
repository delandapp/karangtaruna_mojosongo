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
