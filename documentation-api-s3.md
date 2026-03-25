# Integrasi Upload File Menggunakan API Key dari Website Eksternal

Dokumen ini menjelaskan cara bagi website eksternal (pihak ketiga) untuk melakukan _upload_ (unggah) berkas secara langsung ke _bucket_ menggunakan API Key di S3StorageManagementApi.

Dokumen ini juga mencakup panduan pembuatan _service_ menggunakan **Redux Toolkit (RTK) Query** dan cara mengonfigurasi **Webhook** untuk mendapatkan respons aksi dari _server_.

---

## 1. Persiapan API Key

Website eksternal harus menyertakan Header \`x-api-key\` pada setiap _request_ yang membutuhkan otentikasi API Key. Pastikan API Key ini memiliki *scope* (cakupan) \`TULIS\` (atau \`ADMIN\`).

**Nilai API Key yang digunakan dalam contoh:**
\`\`\`text
c2c59982-8af2-42e8-abc8-573325e25cb0
\`\`\`

---

## 2. Endpoint Upload File

Endpoint ini digunakan untuk mengunggah file ke bucket tertentu menggunakan \`multipart/form-data\`.

**HTTP Request:**
\`\`\`http
POST /api/v1/buckets/{bucketName}/upload
\`\`\`

**Request Headers:**
- \`x-api-key\` : \`<API-KEY-ANDA>\`
- \`Content-Type\` : \`multipart/form-data\` (Biasanya otomatis ditambahkan oleh _browser_ jika Anda mengirimkan _FormData_).

**Request Body:**
- \`file\` (binary/file) : Berkas fisik yang akan diunggah.

---

## 3. Implementasi Menggunakan Redux Toolkit (RTK) Query

Berikut adalah contoh lengkap bagaimana mengonfigurasi dan memanggil endpoint _upload_ lewat website eksternal yang menggunakan React dan RTK Query.

### a. Membuat API Slice (Contoh: \`storageApi.ts\`)

\`\`\`typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// API Key Anda yang valid
const EXTERNAL_API_KEY = 'ee85bc2458dd47f24b78f019add255280ee8689455cdead0f22e1bcdf73c8b07';

export const storageApi = createApi({
  reducerPath: 'storageApi',
  baseQuery: fetchBaseQuery({
    // Ganti base URL sesuai dengan alamat server S3StorageManagementApi Anda
    baseUrl: 'https://api.domain-anda.com/api/v1/',
    prepareHeaders: (headers) => {
      // Menyisipkan API key ke setiap request mutasi upload
      headers.set('x-api-key', EXTERNAL_API_KEY);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    uploadFile: builder.mutation<
      { success: boolean; message: string; data: any },
      { bucketName: string; file: File }
    >({
      query: ({ bucketName, file }) => {
        // Karena file dikirim dalam bentuk form-data, gunakan tipe FormData
        const formData = new FormData();
        formData.append('file', file);

        return {
          url: `buckets/${bucketName}/upload`,
          method: 'POST',
          body: formData,
          // Jangan deklarasikan Content-Type secara manual; browser akan
          // mengaturnya secara otomatis bersamaan dengan boundary string
        };
      },
    }),
  }),
});

export const { useUploadFileMutation } = storageApi;
\`\`\`

### b. Contoh Penggunaan di React Component

\`\`\`tsx
import React, { useState } from 'react';
import { useUploadFileMutation } from './storageApi';

export const UploadComponent = () => {
  const [uploadFile, { isLoading, isSuccess, isError, error }] = useUploadFileMutation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const response = await uploadFile({
        bucketName: 'nama-bucket-anda',
        file: selectedFile,
      }).unwrap();
      
      console.log('Upload berhasil:', response);
      alert('Berhasil mengunggah file!');
    } catch (err) {
      console.error('Upload gagal:', err);
      alert('Gagal mengunggah file.');
    }
  };

  return (
    <div>
      <h3>Upload ke S3 Bucket</h3>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={isLoading || !selectedFile}>
        {isLoading ? 'Mengunggah...' : 'Pilih & Unggah File'}
      </button>

      {isSuccess && <p style={{ color: 'green' }}>Berhasil diunggah!</p>}
      {isError && <p style={{ color: 'red' }}>Error: {JSON.stringify(error)}</p>}
    </div>
  );
};
\`\`\`

---

## 4. Konfigurasi Webhook (Menerima Event Upload)

Website eksternal dapat didaftarkan sebagai Webhook di S3StorageManagementApi untuk menerima notifikasi _real-time_ saat berkas berhasil diunggah (\`BERKAS_DIUNGGAH\`), diproses, atau bahkan gagal (\`UNGGAHAN_GAGAL\`). 

### a. Mendaftarkan Webhook

Cara mendaftarkan webhook bisa dilakukan di **Dashboard S3StorageManagementApi** atau dengan memanggil *API Webhooks* menggunakan otorisasi \`Bearer Token\` milik akun Anda.

**HTTP Request (Contoh API):**
\`\`\`http
POST /api/v1/webhooks
Authorization: Bearer <TOKEN_JWT_DARI_LOGIN>
Content-Type: application/json
\`\`\`

**Request Body:**
\`\`\`json
{
  "url": "https://api.external-website.com/webhook/s3-events",
  "event": ["BERKAS_DIUNGGAH", "UNGGAHAN_SELESAI", "UNGGAHAN_GAGAL"],
  "maksCobaUlang": 3
}
\`\`\`

Ketika request sukses (201 Created), server akan mengembalikan objek informasi webhook beserta **rahasia** (secret) yang unik. **Rahasia** ini digunakan pada server website eksternal Anda untuk memverifikasi bahwa HTTP payload yang dikirimkan benar-benar dari S3StorageManagementApi.

### b. Menerima Webhook di Express.js (Website Eksternal)

Ketika file yang diunggah menggunakan API Key tersebut berhasil masuk ke _bucket_, S3StorageManagementApi akan "menembak" endpoint URL yang Anda pasang.

Berikut adalah contoh kerangka _controller_ untuk menangkap _event_ dari _webhook_ pada sisi server website eksternal Anda:

\`\`\`typescript
import express, { Request, Response } from 'express';
import crypto from 'crypto';

const router = express.Router();
const WEBHOOK_SECRET = 'rahasia_webhook_anda_yang_didapat_saat_pendaftaran';

router.post('/webhook/s3-events', express.json(), (req: Request, res: Response) => {
  // 1. Verifikasi Siganture (Jika S3StorageManagementApi mengirimkan header signature, misal "x-webhook-signature")
  // Pada implementasi standar, bisa menggunakan HMAC dengan rahasia webhook.
  const payloadStr = JSON.stringify(req.body);
  const signature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payloadStr)
    .digest('hex');

  // const receivedSignature = req.headers['x-webhook-signature'];
  // if (signature !== receivedSignature) {
  //   return res.status(401).send('Signature tidak valid');
  // }

  const { event, data } = req.body;

  // 2. Tangani event yang diterima
  switch (event) {
    case 'BERKAS_DIUNGGAH':
      console.log(`File diunggah: ID File = ${data.fileId}, Bucket = ${data.bucketId}`);
      // Lanjutkan proses notifikasi user atau simpan ID File di database website eksternal
      break;
    
    case 'UNGGAHAN_SELESAI':
      console.log(`Pemrosesan selesai: ${data.fileId}`);
      break;
      
    case 'UNGGAHAN_GAGAL':
      console.log(`Pemrosesan gagal: ${data.fileId}`);
      break;

    default:
      console.log(`Event tidak dikenal didapatkan: ${event}`);
  }

  // Penting: Selalu merespons 20x untuk memberitahukan server webhook bahwa request diterima
  res.status(200).json({ received: true });
});

export default router;
\`\`\`

---

## 5. Merangkum Alur Lengkap (Workflow)

1. **Pembuatan Key & Webhook**: Administrator aplikasi membuat *API Key* dengan _scope_ \`TULIS\` dan Webhook dengan event \`BERKAS_DIUNGGAH\` untuk URL server eksternal.
2. **Kirim File**: Website eksternal menggunakan RTK Query (\`useUploadFileMutation\`), memasukkan *file* ke FormData, dan memanggil S3StorageManagementApi menyertakan Header \`x-api-key\`.
3. **Upload Success**: S3StorageManagementApi menyimpan *file* dan merespons \`200 OK\` ke Website eksternal.
4. **Trigger Webhook**: Di *background process*, S3StorageManagementApi akan mengirimkan detail file (ID File, ukuran, dll) ke URL yang dikonfigurasi pada Webhook.
5. **Aksi Ekstra**: Server eksternal akan merespons event dari Webhook dan menggunakan hasil URL-nya untuk di-_bind_ atau direkam pada _database_ internal eksternalnya.
