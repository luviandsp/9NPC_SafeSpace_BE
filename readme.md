# 9NPC SafeSpace Backend

Backend untuk aplikasi SafeSpace yang berfungsi sebagai platform pelaporan kekerasan berbasis digital.

## Struktur Proyek

```
src/
├── config/
│   └── supabase.ts ← konfigurasi Supabase
├── controllers/
│   ├── auth.controller.ts ← logic autentikasi
│   ├── report.controller.ts ← logic laporan
│   └── admin.controller.ts ← logic admin
├── db/
│   ├── index.ts ← koneksi database
│   └── schema.ts ← skema database dengan Drizzle ORM
├── middlewares/
│   └── auth.middleware.ts ← middleware autentikasi
├── routes/
│   ├── index.ts ← rute utama
│   ├── auth.route.ts ← endpoint /auth
│   ├── report.route.ts ← endpoint /report
│   └── admin.route.ts ← endpoint /admin
├── services/
├── utils/
│   └── validators/
│       ├── auth.validator.ts ← validasi input auth
│       └── report.validator.ts ← validasi input report
└── index.ts ← entry point
```

## API Documentation

### Base URL
```
http://localhost:3000/api (Development)
https://safespacebackend.vercel.app/api (Production)
```

### Authentication Endpoints

#### 1. Sign Up (Register)
**Endpoint:** `POST /auth/sign-up`

**Deskripsi:** Mendaftarkan pengguna baru

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201 Created):**
```json
{
  "message": "Registrasi berhasil. Profil dasar telah dibuat. Silakan cek email Anda untuk verifikasi.",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

#### 2. Sign In (Login)
**Endpoint:** `POST /auth/sign-in`

**Deskripsi:** Login pengguna dan mendapatkan access token

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login berhasil",
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  },
  "token": "access_token_jwt"
}
```

---

#### 3. Sign Out (Logout)
**Endpoint:** `POST /auth/sign-out`

**Deskripsi:** Logout pengguna (membatalkan sesi)

**Authentication:** ✅ Required

**Response (200 OK):**
```json
{
  "message": "Logout berhasil"
}
```

---

#### 4. Get Current User
**Endpoint:** `GET /auth/get-user`

**Deskripsi:** Mendapatkan informasi pengguna yang sedang login

**Authentication:** ✅ Required

**Response (200 OK):**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

#### 5. Get Current Session
**Endpoint:** `GET /auth/get-session`

**Deskripsi:** Mendapatkan informasi sesi yang sedang aktif

**Authentication:** ✅ Required

**Response (200 OK):**
```json
{
  "session": {
    "access_token": "token_jwt",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": {
      "id": "user-id",
      "email": "user@example.com"
    }
  }
}
```

---

#### 6. Update Password
**Endpoint:** `POST /auth/update-password`

**Deskripsi:** Memperbarui password pengguna

**Authentication:** ✅ Required

**Request Body:**
```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword456",
  "confirmPassword": "newpassword456"
}
```

**Response (200 OK):**
```json
{
  "message": "Password berhasil diperbarui",
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  }
}
```

---

### Report Endpoints

#### 1. Create Report
**Endpoint:** `POST /report/create`

**Deskripsi:** Membuat laporan baru

**Authentication:** ✅ Required

**Request Body:**
```json
{
  "incident": "kekerasan fisik",
  "date": "2024-01-15",
  "location": "Jakarta Pusat",
  "incidentDesc": "Deskripsi detail kejadian...",
  "perpetratorDesc": "Deskripsi pelaku...",
  "evidencePaths": [
    "temp/user-id/abc123-foto.jpg",
    "temp/user-id/xyz789-video.mp4"
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Laporan berhasil dibuat",
  "data": {
    "id": "report-id",
    "userId": "user-id",
    "reportCode": "RPT-abc123xyz",
    "incident": "kekerasan fisik",
    "date": "2024-01-15",
    "location": "Jakarta Pusat",
    "incidentDesc": "Deskripsi detail kejadian...",
    "perpetratorDesc": "Deskripsi pelaku...",
    "status": "submitted",
    "createdAt": "2024-01-01T10:00:00Z"
  }
}
```

---

#### 2. Generate Upload Signed URL
**Endpoint:** `POST /report/upload-signed-url`

**Deskripsi:** Membuat presigned URL untuk upload file bukti ke Supabase Storage

**Authentication:** ✅ Required

**Request Body:**
```json
{
  "fileName": "foto-bukti.jpg",
  "fileType": "image/jpeg",
  "fileSize": 2048576
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Presigned URL berhasil dibuat",
  "data": {
    "uploadUrl": "https://supabase-signed-url...",
    "path": "temp/user-id/abc123-foto-bukti.jpg",
    "token": "token-for-upload"
  }
}
```

**Cara Penggunaan:**
1. Panggil endpoint ini untuk mendapatkan `uploadUrl` dan `path`
2. Upload file menggunakan fungsi:
```
const { data, error } = await supabase
  .storage
  .from('avatars')
  .uploadToSignedUrl('folder/cat.jpg', 'token-from-createSignedUploadUrl', file)
```
3. Simpan `path` untuk digunakan saat membuat laporan di endpoint `POST /report/create`

---

#### 3. Get All Reports (User)
**Endpoint:** `GET /report`

**Deskripsi:** Mendapatkan semua laporan milik pengguna yang login dengan pagination

**Authentication:** ✅ Required

**Query Parameters:**
- `page` (number, default: 1) - Nomor halaman
- `limit` (number, default: 10) - Jumlah data per halaman

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Laporan berhasil diambil",
  "data": [
    {
      "id": "report-id",
      "userId": "user-id",
      "reportCode": "RPT-abc123xyz",
      "incident": "kekerasan fisik",
      "date": "2024-01-15",
      "location": "Jakarta Pusat",
      "status": "submitted",
      "createdAt": "2024-01-01T10:00:00Z",
      "evidenceAssets": [
        {
          "id": "asset-id",
          "reportId": "report-id",
          "evidencePath": "permanent/report-id/abc123-foto.jpg"
        }
      ]
    }
  ],
  "pagination": {
    "size": 10,
    "page": 1,
    "total": 25,
    "totalPages": 3
  }
}
```

---

#### 4. Get Report by ID (User)
**Endpoint:** `GET /report/:id`

**Deskripsi:** Mendapatkan detail laporan spesifik (hanya milik pengguna yang login)

**Authentication:** ✅ Required

**Path Parameters:**
- `id` (string) - ID laporan

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Laporan berhasil diambil",
  "data": {
    "id": "report-id",
    "userId": "user-id",
    "reportCode": "RPT-abc123xyz",
    "incident": "kekerasan fisik",
    "date": "2024-01-15",
    "location": "Jakarta Pusat",
    "incidentDesc": "Deskripsi detail kejadian...",
    "perpetratorDesc": "Deskripsi pelaku...",
    "status": "submitted",
    "createdAt": "2024-01-01T10:00:00Z",
    "evidenceAssets": [
      {
        "id": "asset-id",
        "reportId": "report-id",
        "evidencePath": "permanent/report-id/abc123-foto.jpg",
        "signedUrl": "https://supabase-signed-url-with-expiry..." // URL valid 60 menit
      }
    ]
  }
}
```

---

#### 5. Cancel Report
**Endpoint:** `POST /report/:id`

**Deskripsi:** Membatalkan laporan (Ubah status menjadi CANCELLED)

**Authentication:** ✅ Required

**Path Parameters:**
- `id` (string) - ID laporan

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Laporan berhasil dibatalkan"
}
```

---

### Admin Endpoints

**Note:** Semua endpoint admin memerlukan user yang berasal dari tabel admin.

#### 1. Get All Reports (Admin)
**Endpoint:** `GET /admin/report`

**Deskripsi:** Admin dapat melihat semua laporan dengan pagination

**Authentication:** ✅ Required (Admin only)

**Query Parameters:**
- `page` (number, default: 1) - Nomor halaman
- `limit` (number, default: 10) - Jumlah data per halaman

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Laporan berhasil diambil",
  "data": [
    {
      "id": "report-id",
      "userId": "user-id",
      "reportCode": "RPT-abc123xyz",
      "incident": "kekerasan fisik",
      "date": "2024-01-15",
      "location": "Jakarta Pusat",
      "status": "submitted",
      "createdAt": "2024-01-01T10:00:00Z",
      "evidenceAssets": []
    }
  ],
  "pagination": {
    "size": 10,
    "page": 1,
    "total": 150,
    "totalPages": 15
  }
}
```

---

#### 2. Get Report by ID (Admin)
**Endpoint:** `GET /admin/report/:id`

**Deskripsi:** Admin dapat melihat detail laporan apapun

**Authentication:** ✅ Required (Admin only)

**Path Parameters:**
- `id` (string) - ID laporan

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Laporan berhasil diambil",
  "data": {
    "id": "report-id",
    "userId": "user-id",
    "reportCode": "RPT-abc123xyz",
    "incident": "kekerasan fisik",
    "date": "2024-01-15",
    "location": "Jakarta Pusat",
    "incidentDesc": "Deskripsi detail kejadian...",
    "perpetratorDesc": "Deskripsi pelaku...",
    "status": "submitted",
    "createdAt": "2024-01-01T10:00:00Z",
    "evidenceAssets": [
      {
        "id": "asset-id",
        "reportId": "report-id",
        "evidencePath": "permanent/report-id/abc123-foto.jpg",
        "signedUrl": "https://supabase-signed-url-with-expiry..."
      }
    ]
  }
}
```

---

#### 3. Update Report Status
**Endpoint:** `PATCH /admin/report/:id/status`

**Deskripsi:** Mengubah status laporan (contoh: submitted → investigating → resolved)

**Authentication:** ✅ Required (Admin only)

**Path Parameters:**
- `id` (string) - ID laporan

**Request Body:**
```json
{
  "status": "PROCESS"
}
```

**Status yang valid:**
- `RECEIVED` - Laporan diterima
- `PROCESS` - Sedang diproses
- `REVIEW` - Sedang direview
- `ASSISTANCE` - Pendampingan
- `REJECTED` - Ditolak
- `DONE` - Selesai
- `CANCELLED` - Dibatalkan


**Response (200 OK):**
```json
{
  "success": true,
  "message": "Status laporan berhasil diperbarui"
}
```

---

## Error Responses

Semua endpoint dapat mengembalikan error response dengan format berikut:

**Response (400 Bad Request):**
```json
{
  "error": "Validasi input gagal",
  "details": ["email harus format email yang valid"]
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Token tidak valid atau sudah expired"
}
```

**Response (403 Forbidden):**
```json
{
  "error": "Anda tidak memiliki akses ke resource ini"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Resource tidak ditemukan"
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Terjadi kesalahan pada server"
}
```

---

## Authentication

### Token Management
- Access token didapatkan dari endpoint `/auth/sign-in`
- Gunakan token di header: `Authorization: Bearer <access_token>`
- Token akan expired setelah beberapa waktu
- Gunakan endpoint `/auth/get-session` untuk refresh token jika diperlukan

### Middleware
- `requireAuth`: Memastikan user sudah login (ada valid token)
- `requireAdmin`: Memastikan user merupakan admin

---
