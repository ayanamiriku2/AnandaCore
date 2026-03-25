# Deploy AnandaCore ke Railway

Panduan deploy AnandaCore (Backend + Frontend + PostgreSQL + MinIO) ke [Railway](https://railway.com).

---

## Arsitektur di Railway

```
┌─────────────────────────┐
│     Railway Project      │
│                         │
│  ┌─────────┐ ┌────────┐ │
│  │PostgreSQL│ │ MinIO  │ │
│  │ (Plugin) │ │(Docker)│ │
│  └────┬────┘ └───┬────┘ │
│       │          │       │
│  ┌────┴──────────┴────┐ │
│  │    Backend (Rust)   │ │
│  │    Port: 8080       │ │
│  └─────────┬──────────┘ │
│            │             │
│  ┌─────────┴──────────┐ │
│  │  Frontend (Next.js) │ │
│  │    Port: 3000       │ │
│  └────────────────────┘ │
└─────────────────────────┘
```

## Langkah Deploy

### 1. Buat Project Baru di Railway

1. Login ke [railway.com](https://railway.com)
2. Klik **New Project**

### 2. Tambahkan PostgreSQL

1. Di dalam project, klik **+ New** → **Database** → **Add PostgreSQL**
2. Railway otomatis membuat database dan menyediakan `DATABASE_URL`

### 3. Deploy MinIO (Object Storage)

1. Klik **+ New** → **Docker Image**
2. Masukkan image: `minio/minio:latest`
3. Setelah service dibuat, tambahkan konfigurasi:

**Settings:**
- Custom Start Command: `server /data --console-address :9001`

**Variables (tambahkan manual):**
```
MINIO_ROOT_USER=anandacore
MINIO_ROOT_PASSWORD=anandacore_secret
PORT=9000
```

**Networking:**
- MinIO sudah bisa diakses internal via `minio.railway.internal:9000`

### 4. Deploy Backend

1. Klik **+ New** → **GitHub Repo** → pilih repo **AnandaCore**
2. Setelah terdeteksi, klik service → **Settings**:
   - **Root Directory**: `backend`
   - **Builder**: Dockerfile
3. Tambahkan **Variables**:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=AnandaCoreProductionJWTSecretKey2026RandomString!!
JWT_EXPIRY_HOURS=24
REFRESH_TOKEN_EXPIRY_DAYS=30
S3_ENDPOINT=http://minio.railway.internal:9000
S3_ACCESS_KEY=anandacore
S3_SECRET_KEY=anandacore_secret
S3_BUCKET=anandacore-files
S3_REGION=us-east-1
APP_HOST=0.0.0.0
APP_PORT=8080
RUST_LOG=info
ALLOWED_ORIGINS=https://<FRONTEND_URL_DARI_RAILWAY>
```

> **Catatan**: 
> - `${{Postgres.DATABASE_URL}}` adalah referensi variabel Railway ke service PostgreSQL
> - Ganti `<FRONTEND_URL_DARI_RAILWAY>` dengan URL publik frontend setelah di-deploy
> - Gunakan JWT_SECRET yang kuat (minimal 32 karakter)

**Networking:**
- Klik **Settings** → **Networking** → **Generate Domain** (untuk public URL backend jika diperlukan)

### 5. Deploy Frontend

1. Klik **+ New** → **GitHub Repo** → pilih repo **AnandaCore** (lagi)
2. Klik service → **Settings**:
   - **Root Directory**: `frontend`
   - **Builder**: Dockerfile
3. Tambahkan **Variables**:

```
NEXT_PUBLIC_API_URL=http://backend.railway.internal:8080
PORT=3000
```

> **Catatan**: `backend` di URL adalah nama service backend. Jika service Anda bernama lain, sesuaikan.

**Networking:**
- Klik **Settings** → **Networking** → **Generate Domain** (ini akan jadi URL publik aplikasi)

### 6. Update ALLOWED_ORIGINS di Backend

Setelah frontend mendapat URL publik (mis. `https://anandacore-web.up.railway.app`):

1. Buka service **Backend** → **Variables**
2. Update `ALLOWED_ORIGINS` = `https://anandacore-web.up.railway.app`
3. Redeploy backend

---

## Login Pertama Kali

Setelah semua service berjalan:

| Field    | Value                              |
|----------|------------------------------------|
| URL      | URL publik frontend dari Railway   |
| Email    | `muktimochamadpratama23@gmail.com` |
| Password | `Anonymous263`                     |

---

## Variabel Environment (Ringkasan)

### Backend
| Variable | Wajib | Default | Keterangan |
|----------|-------|---------|------------|
| `DATABASE_URL` | ✅ | - | URL PostgreSQL |
| `JWT_SECRET` | ✅ | - | Secret key JWT (min 32 char) |
| `JWT_EXPIRY_HOURS` | ❌ | `24` | Masa berlaku token (jam) |
| `REFRESH_TOKEN_EXPIRY_DAYS` | ❌ | `30` | Masa berlaku refresh token |
| `S3_ENDPOINT` | ❌ | `http://localhost:9000` | Endpoint MinIO/S3 |
| `S3_ACCESS_KEY` | ❌ | `anandacore` | S3 access key |
| `S3_SECRET_KEY` | ❌ | `anandacore_secret` | S3 secret key |
| `S3_BUCKET` | ❌ | `anandacore-files` | Nama bucket |
| `S3_REGION` | ❌ | `us-east-1` | Region S3 |
| `APP_HOST` | ❌ | `0.0.0.0` | Host listen |
| `APP_PORT` | ❌ | `8080` | Port listen |
| `ALLOWED_ORIGINS` | ❌ | `http://localhost:3000` | CORS origins |

### Frontend
| Variable | Wajib | Default | Keterangan |
|----------|-------|---------|------------|
| `NEXT_PUBLIC_API_URL` | ❌ | `http://localhost:8080` | URL backend (internal Railway) |
| `PORT` | ❌ | `3000` | Port listen |

---

## Troubleshooting

### Backend gagal start
- Pastikan `DATABASE_URL` sudah benar (gunakan referensi `${{Postgres.DATABASE_URL}}`)
- Cek log: backend akan menjalankan migrasi database otomatis saat startup

### Upload file gagal
- Pastikan MinIO sudah berjalan dan `S3_ENDPOINT` mengarah ke `http://minio.railway.internal:9000`
- Backend otomatis membuat bucket `anandacore-files` jika belum ada

### CORS error
- Pastikan `ALLOWED_ORIGINS` di backend sesuai dengan URL publik frontend
- Format: `https://your-frontend.up.railway.app` (tanpa trailing slash)

### Frontend tidak bisa koneksi ke backend
- Pastikan `NEXT_PUBLIC_API_URL` mengarah ke backend internal: `http://backend.railway.internal:8080`
- Nama service harus sesuai (cek di Railway dashboard)
