# 9NPC SafeSpace Backend

Backend untuk aplikasi SafeSpace yang berfungsi sebagai platform pelaporan kekerasan berbasis digital.

## Struktur Proyek

```
src/
├── config/
│   └── supabase.ts ← konfigurasi Supabase
├── controllers/
│   ├── upload.controller.ts ← logic pembuatan signed url dan upload gambar
│   ├── user.controller.ts ← logic user
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
│   ├── user.route.ts ← endpoint /user
│   └── admin.route.ts ← endpoint /admin
├── utils/
│   └── validators/
│       ├── auth.validator.ts ← validasi input auth
│       ├── user.validator.ts ← validasi input user
│       ├── admin.validator.ts ← validasi input admin
│       └── report.validator.ts ← validasi input report
└── index.ts ← entry point
```
